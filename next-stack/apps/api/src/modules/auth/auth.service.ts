import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  BootstrapAdminInput,
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@nico/contracts';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

export type JwtPayload = {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.usersService.findByEmail(input.email);
    if (existing) {
      throw new BadRequestException('Ya existe una cuenta con ese email');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.usersService.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash,
      role: 'USER',
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    const verification = await this.createEmailVerificationToken(user.id);

    return {
      user: this.usersService.toPublicUser(user),
      tokens,
      emailVerification: {
        required: true,
        status: 'pending',
        ...(verification.previewToken ? { previewToken: verification.previewToken } : {}),
      },
    };
  }

  async login(input: LoginInput) {
    const user = await this.usersService.findByEmail(input.email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    return {
      user: this.usersService.toPublicUser(user),
      tokens,
    };
  }

  async me(accessToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(accessToken);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
      return {
        user: this.usersService.toPublicUser(user),
      };
    } catch {
      throw new UnauthorizedException('Token invalido o expirado');
    }
  }

  async meByUserId(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return {
      user: this.usersService.toPublicUser(user),
    };
  }

  async requestEmailVerification(accessToken: string) {
    const payload = await this.verifyAccessToken(accessToken);
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    if (user.emailVerified) {
      return {
        ok: true,
        status: 'already_verified',
      };
    }

    const verification = await this.createEmailVerificationToken(user.id);
    return {
      ok: true,
      status: 'pending',
      ...(verification.previewToken ? { previewToken: verification.previewToken } : {}),
    };
  }

  async confirmEmailVerification(input: VerifyEmailInput) {
    const tokenHash = this.hashToken(input.token);
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Token de verificacion invalido o expirado');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
    ]);

    return {
      ok: true,
      message: 'Correo verificado correctamente',
    };
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) {
      return {
        ok: true,
        message: 'Si el email existe, se envio un enlace de recuperacion',
      };
    }

    const reset = await this.createPasswordResetToken(user.id);
    return {
      ok: true,
      message: 'Si el email existe, se envio un enlace de recuperacion',
      ...(reset.previewToken ? { previewToken: reset.previewToken } : {}),
    };
  }

  async refresh(input: RefreshTokenInput) {
    const tokenHash = this.hashToken(input.refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const tokens = await this.issueTokens(record.user.id, record.user.email, record.user.role);
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      user: this.usersService.toPublicUser(record.user),
      tokens,
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    const tokenHash = this.hashToken(input.token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Token de recuperacion invalido o expirado');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: record.userId,
          id: { not: record.id },
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
    ]);

    return {
      ok: true,
      message: 'Contrasena actualizada correctamente',
    };
  }

  async bootstrapAdmin(input: BootstrapAdminInput) {
    if (!this.isBootstrapAllowed()) {
      throw new UnauthorizedException('Bootstrap admin deshabilitado fuera de entorno local');
    }

    const expectedKey = process.env.ADMIN_BOOTSTRAP_KEY ?? 'nico-dev-admin';
    if (input.setupKey !== expectedKey) {
      throw new UnauthorizedException('Setup key invalida');
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(normalizedEmail);
    const passwordHash = await bcrypt.hash(input.password, 10);

    let user;
    if (existing) {
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          name: input.name.trim(),
          role: 'ADMIN',
          passwordHash,
        },
      });
    } else {
      user = await this.usersService.create({
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'ADMIN',
      });
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    return {
      ok: true,
      message: 'Admin bootstrap listo',
      user: this.usersService.toPublicUser(user),
      tokens,
    };
  }

  private async issueTokens(userId: string, email: string, role: 'USER' | 'ADMIN') {
    const payload: JwtPayload = { sub: userId, email, role };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = this.generateRawToken();
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 dias

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshExpiresAt: refreshExpiresAt.toISOString(),
    };
  }

  private async verifyAccessToken(accessToken: string) {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(accessToken);
    } catch {
      throw new UnauthorizedException('Token invalido o expirado');
    }
  }

  async verifyAccessTokenPublic(accessToken: string) {
    return this.verifyAccessToken(accessToken);
  }

  private hashToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private generateRawToken() {
    return randomBytes(32).toString('hex');
  }

  private isPreviewEnabled() {
    const env = (process.env.NODE_ENV ?? '').toLowerCase();
    return env !== 'production';
  }

  private isBootstrapAllowed() {
    const env = (process.env.NODE_ENV ?? '').toLowerCase();
    return env !== 'production';
  }

  private async createEmailVerificationToken(userId: string) {
    const rawToken = this.generateRawToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      expiresAt,
      previewToken: this.isPreviewEnabled() ? rawToken : null,
    };
  }

  private async createPasswordResetToken(userId: string) {
    const rawToken = this.generateRawToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      expiresAt,
      previewToken: this.isPreviewEnabled() ? rawToken : null,
    };
  }
}
