import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AppSetting } from '@prisma/client';
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
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';
import { MailService } from '../mail/mail.service.js';

export type JwtPayload = {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MailService) private readonly mailService: MailService,
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
    if (verification.rawToken) {
      void this.mailService.sendTemplate({
        templateKey: 'verify_email',
        to: user.email,
        vars: {
          user_name: user.name,
          verify_url: `${this.getWebBaseUrl()}/auth/verify-email?token=${verification.rawToken}`,
        },
      });
    }

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

    if (user.role === 'ADMIN') {
      const twoFa = await this.getAdminTwoFactorStatus(user.id);
      if (twoFa.enabled) {
        const code = (input as LoginInput & { twoFactorCode?: string }).twoFactorCode?.trim() ?? '';
        if (!code) {
          throw new UnauthorizedException('Código 2FA requerido');
        }
        const valid = await this.verifyAdminTwoFactorCode(user.id, code);
        if (!valid) {
          throw new UnauthorizedException('Código 2FA inválido');
        }
      }
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
      throw new UnauthorizedException('Token inválido o expirado');
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
    if (verification.rawToken) {
      void this.mailService.sendTemplate({
        templateKey: 'verify_email',
        to: user.email,
        vars: {
          user_name: user.name,
          verify_url: `${this.getWebBaseUrl()}/auth/verify-email?token=${verification.rawToken}`,
        },
      });
    }
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
      throw new BadRequestException('Token de verificacion inválido o expirado');
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
    if (reset.rawToken) {
      void this.mailService.sendTemplate({
        templateKey: 'reset_password',
        to: user.email,
        vars: {
          user_name: user.name,
          reset_url: `${this.getWebBaseUrl()}/auth/reset-password?token=${reset.rawToken}`,
        },
      });
    }
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
      throw new UnauthorizedException('Refresh token inválido o expirado');
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
      throw new BadRequestException('Token de recuperacion inválido o expirado');
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

  async getAdminTwoFactorStatus(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: this.twoFactorKeys(userId) } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value ?? '']));
    const enabled = (map.get(this.twoFactorSettingKey(userId, 'enabled')) ?? '0') === '1';
    const secret = (map.get(this.twoFactorSettingKey(userId, 'secret')) ?? '').trim();
    const pendingSecret = (map.get(this.twoFactorSettingKey(userId, 'pending_secret')) ?? '').trim();
    return {
      enabled,
      hasSecret: Boolean(secret),
      hasPendingSecret: Boolean(pendingSecret),
      accountEmail: user.email,
      otpauthUrl: pendingSecret ? this.buildOtpAuthUrl(user.email, pendingSecret) : null,
      pendingSecretMasked: pendingSecret ? this.maskSecret(pendingSecret) : null,
    };
  }

  async generateAdminTwoFactorSecret(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const secret = this.generateTotpSecret();
    await this.upsertAppSetting(this.twoFactorSettingKey(userId, 'pending_secret'), secret, 'security_2fa', 'Admin 2FA pending secret', 'text');
    await this.upsertAppSetting(this.twoFactorSettingKey(userId, 'enabled'), '0', 'security_2fa', 'Admin 2FA enabled', 'boolean');
    return {
      ok: true,
      secret,
      secretMasked: this.maskSecret(secret),
      otpauthUrl: this.buildOtpAuthUrl(user.email, secret),
      accountEmail: user.email,
    };
  }

  async enableAdminTwoFactor(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const pending = await this.getAppSetting(this.twoFactorSettingKey(userId, 'pending_secret'));
    const secret = (pending ?? '').trim();
    if (!secret) throw new BadRequestException('Primero genera un secreto 2FA');
    if (!this.verifyTotpCode(secret, code)) throw new BadRequestException('Código 2FA inválido');

    await this.upsertAppSetting(this.twoFactorSettingKey(userId, 'secret'), secret, 'security_2fa', 'Admin 2FA secret', 'text');
    await this.upsertAppSetting(this.twoFactorSettingKey(userId, 'enabled'), '1', 'security_2fa', 'Admin 2FA enabled', 'boolean');
    await this.upsertAppSetting(this.twoFactorSettingKey(userId, 'enabled_at'), new Date().toISOString(), 'security_2fa', 'Admin 2FA enabled at', 'text');
    await this.upsertAppSetting(this.twoFactorSettingKey(userId, 'pending_secret'), '', 'security_2fa', 'Admin 2FA pending secret', 'text');
    return { ok: true, enabled: true };
  }

  async disableAdminTwoFactor(userId: string, code?: string | null) {
    const secret = ((await this.getAppSetting(this.twoFactorSettingKey(userId, 'secret'))) ?? '').trim();
    const enabled = (((await this.getAppSetting(this.twoFactorSettingKey(userId, 'enabled'))) ?? '0') === '1');
    if (enabled && secret) {
      const normalized = (code ?? '').trim();
      if (!normalized) throw new BadRequestException('Código 2FA requerido para desactivar');
      if (!this.verifyTotpCode(secret, normalized)) throw new BadRequestException('Código 2FA inválido');
    }
    await this.upsertAppSetting(this.twoFactorSettingKey(userId, 'enabled'), '0', 'security_2fa', 'Admin 2FA enabled', 'boolean');
    await this.upsertAppSetting(this.twoFactorSettingKey(userId, 'secret'), '', 'security_2fa', 'Admin 2FA secret', 'text');
    await this.upsertAppSetting(this.twoFactorSettingKey(userId, 'pending_secret'), '', 'security_2fa', 'Admin 2FA pending secret', 'text');
    return { ok: true, enabled: false };
  }

  async verifyAdminTwoFactorCode(userId: string, code: string) {
    const enabled = (((await this.getAppSetting(this.twoFactorSettingKey(userId, 'enabled'))) ?? '0') === '1');
    if (!enabled) return true;
    const secret = ((await this.getAppSetting(this.twoFactorSettingKey(userId, 'secret'))) ?? '').trim();
    if (!secret) return false;
    return this.verifyTotpCode(secret, code);
  }

  private async issueTokens(userId: string, email: string, role: 'USER' | 'ADMIN') {
    const payload: JwtPayload = { sub: userId, email, role };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = this.generateRawToken();
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 días

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
      throw new UnauthorizedException('Token inválido o expirado');
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
    const explicit = (process.env.MAIL_PREVIEW_TOKENS ?? '').trim();
    if (explicit === '1' || explicit.toLowerCase() === 'true') return true;
    if (explicit === '0' || explicit.toLowerCase() === 'false') return false;
    return env !== 'production';
  }

  private isBootstrapAllowed() {
    const env = (process.env.NODE_ENV ?? '').toLowerCase();
    const explicit = (process.env.ALLOW_ADMIN_BOOTSTRAP ?? '').trim();
    if (explicit === '1' || explicit.toLowerCase() === 'true') return true;
    if (explicit === '0' || explicit.toLowerCase() === 'false') return false;
    return env !== 'production';
  }

  private getWebBaseUrl() {
    return (
      (process.env.WEB_URL ?? '').trim() ||
      (process.env.APP_URL ?? '').trim() ||
      'http://localhost:5174'
    ).replace(/\/$/, '');
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
      rawToken,
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
      rawToken,
      previewToken: this.isPreviewEnabled() ? rawToken : null,
    };
  }

  private twoFactorKeys(userId: string) {
    return [
      this.twoFactorSettingKey(userId, 'enabled'),
      this.twoFactorSettingKey(userId, 'secret'),
      this.twoFactorSettingKey(userId, 'pending_secret'),
      this.twoFactorSettingKey(userId, 'enabled_at'),
    ];
  }

  private twoFactorSettingKey(userId: string, suffix: 'enabled' | 'secret' | 'pending_secret' | 'enabled_at') {
    return `admin_2fa.${userId}.${suffix}`;
  }

  private async getAppSetting(key: string) {
    const row = await this.prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  private async upsertAppSetting(key: string, value: string, group: string, label: string, type: string) {
    await this.prisma.appSetting.upsert({
      where: { key },
      create: { key, value, group, label, type },
      update: { value, group, label, type },
    });
  }

  private generateTotpSecret() {
    return this.base32Encode(randomBytes(20));
  }

  private verifyTotpCode(secretBase32: string, codeRaw: string) {
    const code = codeRaw.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(code)) return false;
    const now = Math.floor(Date.now() / 1000);
    for (const drift of [-30, 0, 30]) {
      const expected = this.generateTotpCode(secretBase32, now + drift);
      if (timingSafeEqual(Buffer.from(code), Buffer.from(expected))) return true;
    }
    return false;
  }

  private generateTotpCode(secretBase32: string, unixTimeSeconds: number) {
    const key = this.base32Decode(secretBase32);
    const step = 30;
    const counter = Math.floor(unixTimeSeconds / step);
    const buf = Buffer.alloc(8);
    buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buf.writeUInt32BE(counter >>> 0, 4);
    const hmac = createHmac('sha1', key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binCode =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    return String(binCode % 1_000_000).padStart(6, '0');
  }

  private buildOtpAuthUrl(email: string, secretBase32: string) {
    const issuer = encodeURIComponent('NicoReparaciones');
    const label = encodeURIComponent(`NicoReparaciones:${email}`);
    return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  }

  private maskSecret(secret: string) {
    if (secret.length <= 8) return secret;
    return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
  }

  private base32Encode(buf: Buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';
    for (const byte of buf) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
    return output;
  }

  private base32Decode(input: string) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const clean = input.toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
    let bits = 0;
    let value = 0;
    const out: number[] = [];
    for (const ch of clean) {
      const idx = alphabet.indexOf(ch);
      if (idx < 0) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        out.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return Buffer.from(out);
  }
}
