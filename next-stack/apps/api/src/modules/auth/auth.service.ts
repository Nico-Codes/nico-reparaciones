import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AccountPasswordUpdateInput,
  AccountUpdateInput,
  AppleAuthCompleteInput,
  BootstrapAdminInput,
  ForgotPasswordInput,
  GoogleAuthCompleteInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
  SocialAuthProvidersResponse,
  VerifyEmailInput,
} from '@nico/contracts';
import * as bcrypt from 'bcryptjs';
import {
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  sign,
  timingSafeEqual,
  verify,
} from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';
import { MailService } from '../mail/mail.service.js';

export type JwtPayload = {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

type GoogleOauthStatePayload = {
  purpose: 'google-oauth-state';
  returnTo: string;
};

type GoogleOauthResultPayload = {
  purpose: 'google-login-result';
  sub: string;
  returnTo: string;
};

type GoogleUserinfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

type AppleOauthStatePayload = {
  purpose: 'apple-oauth-state';
  returnTo: string;
};

type AppleOauthResultPayload = {
  purpose: 'apple-login-result';
  sub: string;
  returnTo: string;
};

type AppleTokenResponse = {
  id_token?: string;
  error?: string;
};

type AppleIdTokenHeader = {
  alg?: string;
  kid?: string;
};

type AppleIdTokenClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
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
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
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

  getAvailableSocialProviders(): SocialAuthProvidersResponse {
    return {
      google: this.isGoogleOauthAvailable(),
      apple: this.isAppleSignInAvailable(),
    };
  }

  async createGoogleAuthorizationUrl(returnTo?: string) {
    const config = this.getGoogleOauthConfig();
    const stateToken = await this.buildGoogleStateToken(returnTo);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', stateToken);
    url.searchParams.set('prompt', 'select_account');
    return url.toString();
  }

  async handleGoogleCallback(params: { code?: string; state?: string; error?: string }) {
    const config = this.getGoogleOauthConfig();
    const returnTo = await this.verifyGoogleStateToken(params.state ?? '');

    if (params.error?.trim()) {
      throw new BadRequestException(this.resolveGoogleCallbackError(params.error));
    }

    const code = (params.code ?? '').trim();
    if (!code) {
      throw new BadRequestException('No recibimos un codigo valido de Google');
    }

    const accessToken = await this.exchangeGoogleCode(code, config);
    const profile = await this.fetchGoogleUserinfo(accessToken);
    const user = await this.resolveGoogleUser(profile);
    const resultToken = await this.buildGoogleResultToken(user.id, returnTo);
    return this.buildGoogleFrontendCallbackUrl({ resultToken });
  }

  async completeGoogleLogin(input: GoogleAuthCompleteInput) {
    this.getGoogleOauthConfig();
    const payload = await this.verifyGoogleResultToken(input.resultToken);
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.role !== 'USER') {
      throw new UnauthorizedException('Resultado de login Google invalido');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: this.usersService.toPublicUser(user),
      tokens,
    };
  }

  async buildGoogleFrontendErrorRedirect(message: string) {
    return this.buildGoogleFrontendCallbackUrl({ error: message });
  }

  async createAppleAuthorizationUrl(returnTo?: string) {
    const config = this.getAppleSignInConfig();
    const stateToken = await this.buildAppleStateToken(returnTo);
    const url = new URL('https://appleid.apple.com/auth/authorize');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('response_mode', 'form_post');
    url.searchParams.set('scope', 'name email');
    url.searchParams.set('state', stateToken);
    return url.toString();
  }

  async handleAppleCallback(params: { code?: string; state?: string; error?: string; user?: unknown }) {
    const config = this.getAppleSignInConfig();
    const returnTo = await this.verifyAppleStateToken(params.state ?? '');

    if (params.error?.trim()) {
      throw new BadRequestException(this.resolveAppleCallbackError(params.error));
    }

    const code = (params.code ?? '').trim();
    if (!code) {
      throw new BadRequestException('No recibimos un codigo valido de Apple');
    }

    const idToken = await this.exchangeAppleCode(code, config);
    const callbackUser = this.parseAppleCallbackUser(params.user);
    const profile = await this.verifyAppleIdToken(idToken, config.clientId);
    const user = await this.resolveAppleUser({
      sub: profile.sub,
      email: profile.email,
      name: callbackUser.name ?? this.normalizeSocialDisplayName('', profile.email),
    });
    const resultToken = await this.buildAppleResultToken(user.id, returnTo);
    return this.buildAppleFrontendCallbackUrl({ resultToken });
  }

  async completeAppleLogin(input: AppleAuthCompleteInput) {
    this.getAppleSignInConfig();
    const payload = await this.verifyAppleResultToken(input.resultToken);
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.role !== 'USER') {
      throw new UnauthorizedException('Resultado de login Apple invalido');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: this.usersService.toPublicUser(user),
      tokens,
    };
  }

  async buildAppleFrontendErrorRedirect(message: string) {
    return this.buildAppleFrontendCallbackUrl({ error: message });
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

  async updateAccountByUserId(userId: string, input: AccountUpdateInput) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const normalizedName = input.name.trim();
    const normalizedEmail = input.email.trim().toLowerCase();
    const emailChanged = normalizedEmail !== user.email;

    if (emailChanged) {
      const existing = await this.usersService.findByEmail(normalizedEmail);
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Ya existe una cuenta con ese email');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: normalizedName,
        email: normalizedEmail,
        ...(emailChanged ? { emailVerified: false, emailVerifiedAt: null } : {}),
      },
    });

    if (emailChanged) {
      const verification = await this.createEmailVerificationToken(updated.id);
      if (verification.rawToken) {
        void this.mailService.sendTemplate({
          templateKey: 'verify_email',
          to: updated.email,
          vars: {
            user_name: updated.name,
            verify_url: `${this.getWebBaseUrl()}/auth/verify-email?token=${verification.rawToken}`,
          },
        });
      }
      return {
        user: this.usersService.toPublicUser(updated),
        emailVerification: {
          required: true,
          status: 'pending',
          ...(verification.previewToken ? { previewToken: verification.previewToken } : {}),
        },
      };
    }

    return {
      user: this.usersService.toPublicUser(updated),
    };
  }

  async updateAccountPasswordByUserId(userId: string, input: AccountPasswordUpdateInput) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    if (!user.passwordHash) {
      throw new BadRequestException('Este usuario no tiene contraseña local configurada');
    }

    const currentOk = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!currentOk) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException('La nueva contraseña no puede ser igual a la actual');
    }

    const nextHash = await bcrypt.hash(input.newPassword, 10);
    await this.usersService.updatePassword(userId, nextHash);

    return {
      ok: true,
      message: 'Contraseña actualizada correctamente',
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
      throw new BadRequestException('Token de verificación inválido o expirado');
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
        message: 'Si el email existe, se envió un enlace de recuperación',
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
      message: 'Si el email existe, se envió un enlace de recuperación',
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
      throw new BadRequestException('Token de recuperación inválido o expirado');
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
      message: 'Contraseña actualizada correctamente',
    };
  }

  async bootstrapAdmin(input: BootstrapAdminInput) {
    if (!this.isBootstrapAllowed()) {
      throw new UnauthorizedException('Bootstrap admin deshabilitado fuera de entorno local');
    }

    const expectedKey = process.env.ADMIN_BOOTSTRAP_KEY ?? 'nico-dev-admin';
    if (input.setupKey !== expectedKey) {
      throw new UnauthorizedException('Setup key inválida');
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

  private isGoogleOauthAvailable() {
    const enabled = this.isTruthy(process.env.GOOGLE_OAUTH_ENABLED ?? '');
    const clientId = (process.env.GOOGLE_CLIENT_ID ?? '').trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim();
    return enabled && Boolean(clientId) && Boolean(clientSecret);
  }

  private getGoogleOauthConfig() {
    if (!this.isGoogleOauthAvailable()) {
      throw new BadRequestException('El acceso con Google no esta disponible');
    }

    const clientId = (process.env.GOOGLE_CLIENT_ID ?? '').trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim();
    const redirectUri = ((process.env.GOOGLE_OAUTH_REDIRECT_URI ?? '').trim() || `${this.getApiBaseUrl()}/api/auth/google/callback`).replace(/\/$/, '');

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Falta configurar Google OAuth en el servidor');
    }

    return {
      clientId,
      clientSecret,
      redirectUri,
    };
  }

  private isAppleSignInAvailable() {
    const enabled = this.isTruthy(process.env.APPLE_SIGNIN_ENABLED ?? '');
    const clientId = (process.env.APPLE_CLIENT_ID ?? '').trim();
    const teamId = (process.env.APPLE_TEAM_ID ?? '').trim();
    const keyId = (process.env.APPLE_KEY_ID ?? '').trim();
    const privateKey = this.normalizeApplePrivateKey(process.env.APPLE_PRIVATE_KEY ?? '');
    return enabled && Boolean(clientId) && Boolean(teamId) && Boolean(keyId) && Boolean(privateKey);
  }

  private getAppleSignInConfig() {
    if (!this.isAppleSignInAvailable()) {
      throw new BadRequestException('El acceso con Apple no esta disponible');
    }

    const clientId = (process.env.APPLE_CLIENT_ID ?? '').trim();
    const teamId = (process.env.APPLE_TEAM_ID ?? '').trim();
    const keyId = (process.env.APPLE_KEY_ID ?? '').trim();
    const privateKey = this.normalizeApplePrivateKey(process.env.APPLE_PRIVATE_KEY ?? '');
    const redirectUri = ((process.env.APPLE_SIGNIN_REDIRECT_URI ?? '').trim() || `${this.getApiBaseUrl()}/api/auth/apple/callback`).replace(/\/$/, '');

    if (!clientId || !teamId || !keyId || !privateKey) {
      throw new BadRequestException('Falta configurar Sign in with Apple en el servidor');
    }

    return {
      clientId,
      teamId,
      keyId,
      privateKey,
      redirectUri,
    };
  }

  private async buildGoogleStateToken(returnTo?: string) {
    const payload: GoogleOauthStatePayload = {
      purpose: 'google-oauth-state',
      returnTo: this.resolveSafeReturnTo(returnTo),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.getGoogleFlowSecret(),
      expiresIn: '10m',
    });
  }

  private async verifyGoogleStateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<GoogleOauthStatePayload>(token, {
        secret: this.getGoogleFlowSecret(),
      });
      if (payload.purpose !== 'google-oauth-state') {
        throw new Error('unexpected-purpose');
      }
      return this.resolveSafeReturnTo(payload.returnTo);
    } catch {
      throw new BadRequestException('El estado del acceso con Google es invalido o expiro');
    }
  }

  private async buildGoogleResultToken(userId: string, returnTo: string) {
    const payload: GoogleOauthResultPayload = {
      purpose: 'google-login-result',
      sub: userId,
      returnTo: this.resolveSafeReturnTo(returnTo),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.getGoogleFlowSecret(),
      expiresIn: '5m',
    });
  }

  private async verifyGoogleResultToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<GoogleOauthResultPayload>(token, {
        secret: this.getGoogleFlowSecret(),
      });
      if (payload.purpose !== 'google-login-result' || !payload.sub) {
        throw new Error('unexpected-purpose');
      }
      return {
        ...payload,
        returnTo: this.resolveSafeReturnTo(payload.returnTo),
      };
    } catch {
      throw new UnauthorizedException('El resultado del acceso con Google es invalido o expiro');
    }
  }

  private async buildAppleStateToken(returnTo?: string) {
    const payload: AppleOauthStatePayload = {
      purpose: 'apple-oauth-state',
      returnTo: this.resolveSafeReturnTo(returnTo),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.getAppleFlowSecret(),
      expiresIn: '10m',
    });
  }

  private async verifyAppleStateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<AppleOauthStatePayload>(token, {
        secret: this.getAppleFlowSecret(),
      });
      if (payload.purpose !== 'apple-oauth-state') {
        throw new Error('unexpected-purpose');
      }
      return this.resolveSafeReturnTo(payload.returnTo);
    } catch {
      throw new BadRequestException('El estado del acceso con Apple es invalido o expiro');
    }
  }

  private async buildAppleResultToken(userId: string, returnTo: string) {
    const payload: AppleOauthResultPayload = {
      purpose: 'apple-login-result',
      sub: userId,
      returnTo: this.resolveSafeReturnTo(returnTo),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.getAppleFlowSecret(),
      expiresIn: '5m',
    });
  }

  private async verifyAppleResultToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<AppleOauthResultPayload>(token, {
        secret: this.getAppleFlowSecret(),
      });
      if (payload.purpose !== 'apple-login-result' || !payload.sub) {
        throw new Error('unexpected-purpose');
      }
      return {
        ...payload,
        returnTo: this.resolveSafeReturnTo(payload.returnTo),
      };
    } catch {
      throw new UnauthorizedException('El resultado del acceso con Apple es invalido o expiro');
    }
  }

  private async exchangeGoogleCode(code: string, config: ReturnType<AuthService['getGoogleOauthConfig']>) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { access_token?: string; error?: string };
    if (!response.ok || !data.access_token) {
      throw new BadRequestException('No pudimos validar el acceso con Google');
    }

    return data.access_token;
  }

  private async fetchGoogleUserinfo(accessToken: string) {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await response.json().catch(() => ({}))) as GoogleUserinfo;
    if (!response.ok) {
      throw new BadRequestException('No pudimos obtener los datos del usuario desde Google');
    }

    if (!data.sub || !data.email || !data.email_verified) {
      throw new BadRequestException('Google no devolvio un email verificado para esta cuenta');
    }

    return {
      sub: data.sub.trim(),
      email: data.email.trim().toLowerCase(),
      name: this.normalizeGoogleDisplayName(data.name, data.email),
    };
  }

  private async resolveGoogleUser(profile: { sub: string; email: string; name: string }) {
    const byGoogleSubject = await this.usersService.findByGoogleSubject(profile.sub);
    if (byGoogleSubject) {
      if (byGoogleSubject.role !== 'USER') {
        throw new UnauthorizedException('Las cuentas admin deben ingresar con el acceso local');
      }

      if (!byGoogleSubject.emailVerified) {
        return this.prisma.user.update({
          where: { id: byGoogleSubject.id },
          data: {
            emailVerified: true,
            emailVerifiedAt: byGoogleSubject.emailVerifiedAt ?? new Date(),
          },
        });
      }

      return byGoogleSubject;
    }

    const existingByEmail = await this.usersService.findByEmail(profile.email);
    if (existingByEmail) {
      if (existingByEmail.role !== 'USER') {
        throw new UnauthorizedException('Las cuentas admin deben ingresar con el acceso local');
      }
      if (existingByEmail.googleSubject && existingByEmail.googleSubject !== profile.sub) {
        throw new UnauthorizedException('La cuenta ya esta vinculada a otro acceso de Google');
      }

      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleSubject: profile.sub,
          emailVerified: true,
          emailVerifiedAt: existingByEmail.emailVerifiedAt ?? new Date(),
        },
      });
    }

    return this.usersService.create({
      name: profile.name,
      email: profile.email,
      role: 'USER',
      passwordHash: null,
      googleSubject: profile.sub,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }

  private async exchangeAppleCode(code: string, config: ReturnType<AuthService['getAppleSignInConfig']>) {
    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: this.buildAppleClientSecret(config),
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as AppleTokenResponse;
    if (!response.ok || !data.id_token) {
      throw new BadRequestException('No pudimos validar el acceso con Apple');
    }

    return data.id_token;
  }

  private async verifyAppleIdToken(idToken: string, clientId: string) {
    const [headerPart, payloadPart, signaturePart] = idToken.split('.');
    if (!headerPart || !payloadPart || !signaturePart) {
      throw new BadRequestException('Apple devolvio un token invalido');
    }

    const header = this.decodeJwtJson<AppleIdTokenHeader>(headerPart);
    const claims = this.decodeJwtJson<AppleIdTokenClaims>(payloadPart);
    if (header.alg !== 'RS256' || !header.kid) {
      throw new BadRequestException('Apple devolvio un token con firma invalida');
    }

    const jwksResponse = await fetch('https://appleid.apple.com/auth/keys');
    const jwksData = (await jwksResponse.json().catch(() => ({}))) as {
      keys?: Array<Record<string, string>>;
    };
    if (!jwksResponse.ok || !Array.isArray(jwksData.keys)) {
      throw new BadRequestException('No pudimos validar la identidad devuelta por Apple');
    }

    const matchingKey = jwksData.keys.find((item) => item.kid === header.kid && item.kty === 'RSA');
    if (!matchingKey) {
      throw new BadRequestException('No encontramos una clave valida para verificar Apple');
    }

    const publicKey = createPublicKey({
      key: {
        kty: 'RSA',
        kid: matchingKey.kid,
        use: matchingKey.use,
        alg: matchingKey.alg,
        n: matchingKey.n,
        e: matchingKey.e,
      },
      format: 'jwk',
    });

    const verified = verify(
      'RSA-SHA256',
      Buffer.from(`${headerPart}.${payloadPart}`),
      publicKey,
      this.decodeBase64Url(signaturePart),
    );

    if (!verified) {
      throw new BadRequestException('La firma del token de Apple no es valida');
    }

    if (claims.iss !== 'https://appleid.apple.com') {
      throw new BadRequestException('Apple devolvio un emisor invalido');
    }

    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud ?? ''];
    if (!audiences.includes(clientId)) {
      throw new BadRequestException('Apple devolvio un token para otra aplicacion');
    }

    if (!claims.sub?.trim()) {
      throw new BadRequestException('Apple no devolvio un identificador valido para la cuenta');
    }

    if (typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now()) {
      throw new BadRequestException('El token de Apple ya expiro');
    }

    const normalizedEmail = typeof claims.email === 'string' && claims.email.trim()
      ? claims.email.trim().toLowerCase()
      : '';
    if (normalizedEmail && !this.isVerifiedSocialEmail(claims.email_verified)) {
      throw new BadRequestException('Apple no devolvio un email verificado para esta cuenta');
    }

    return {
      sub: claims.sub.trim(),
      email: normalizedEmail,
    };
  }

  private parseAppleCallbackUser(raw: unknown) {
    if (typeof raw !== 'string' || !raw.trim()) {
      return { name: '' };
    }

    try {
      const parsed = JSON.parse(raw) as {
        name?: { firstName?: string; lastName?: string };
      };
      const firstName = typeof parsed.name?.firstName === 'string' ? parsed.name.firstName.trim() : '';
      const lastName = typeof parsed.name?.lastName === 'string' ? parsed.name.lastName.trim() : '';
      return {
        name: [firstName, lastName].filter(Boolean).join(' ').trim(),
      };
    } catch {
      return { name: '' };
    }
  }

  private async resolveAppleUser(profile: { sub: string; email: string; name: string }) {
    const byAppleSubject = await this.usersService.findByAppleSubject(profile.sub);
    if (byAppleSubject) {
      if (byAppleSubject.role !== 'USER') {
        throw new UnauthorizedException('Las cuentas admin deben ingresar con el acceso local');
      }

      if (!byAppleSubject.emailVerified) {
        return this.prisma.user.update({
          where: { id: byAppleSubject.id },
          data: {
            emailVerified: true,
            emailVerifiedAt: byAppleSubject.emailVerifiedAt ?? new Date(),
          },
        });
      }

      return byAppleSubject;
    }

    if (!profile.email) {
      throw new BadRequestException('Apple no devolvio un email para vincular esta cuenta');
    }

    const existingByEmail = await this.usersService.findByEmail(profile.email);
    if (existingByEmail) {
      if (existingByEmail.role !== 'USER') {
        throw new UnauthorizedException('Las cuentas admin deben ingresar con el acceso local');
      }
      if (existingByEmail.appleSubject && existingByEmail.appleSubject !== profile.sub) {
        throw new UnauthorizedException('La cuenta ya esta vinculada a otro acceso de Apple');
      }

      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          appleSubject: profile.sub,
          emailVerified: true,
          emailVerifiedAt: existingByEmail.emailVerifiedAt ?? new Date(),
        },
      });
    }

    return this.usersService.create({
      name: profile.name,
      email: profile.email,
      role: 'USER',
      passwordHash: null,
      appleSubject: profile.sub,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }

  private buildGoogleFrontendCallbackUrl(params: { resultToken?: string; error?: string }) {
    const url = new URL('/auth/google/callback', this.getWebBaseUrl());
    const fragment = new URLSearchParams();
    if (params.resultToken) fragment.set('result', params.resultToken);
    if (params.error) fragment.set('error', params.error);
    const hash = fragment.toString();
    return hash ? `${url.toString()}#${hash}` : url.toString();
  }

  private resolveGoogleCallbackError(errorCode: string) {
    if (errorCode === 'access_denied') {
      return 'Cancelaste el acceso con Google antes de completarlo';
    }
    return 'No pudimos completar el acceso con Google';
  }

  private normalizeGoogleDisplayName(nameRaw: string | undefined, email: string) {
    return this.normalizeSocialDisplayName(nameRaw, email);
  }

  private buildAppleFrontendCallbackUrl(params: { resultToken?: string; error?: string }) {
    const url = new URL('/auth/apple/callback', this.getWebBaseUrl());
    const fragment = new URLSearchParams();
    if (params.resultToken) fragment.set('result', params.resultToken);
    if (params.error) fragment.set('error', params.error);
    const hash = fragment.toString();
    return hash ? `${url.toString()}#${hash}` : url.toString();
  }

  private resolveAppleCallbackError(errorCode: string) {
    if (errorCode === 'access_denied') {
      return 'Cancelaste el acceso con Apple antes de completarlo';
    }
    return 'No pudimos completar el acceso con Apple';
  }

  private normalizeSocialDisplayName(nameRaw: string | undefined, email: string) {
    const name = (nameRaw ?? '').trim();
    if (name) return name;
    const localPart = email.split('@')[0] ?? 'Usuario';
    const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
    return cleaned ? cleaned.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Usuario';
  }

  private resolveSafeReturnTo(raw: string | null | undefined) {
    const value = (raw ?? '').trim();
    if (!value.startsWith('/')) return '/store';
    if (value.startsWith('/auth/') || value.startsWith('/api/')) return '/store';
    return value || '/store';
  }

  private getApiBaseUrl() {
    return (
      (process.env.API_URL ?? '').trim() ||
      'http://localhost:3001'
    ).replace(/\/$/, '');
  }

  private getGoogleFlowSecret() {
    const baseSecret = (process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me').trim();
    return `${baseSecret}:google-oauth`;
  }

  private getAppleFlowSecret() {
    const baseSecret = (process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me').trim();
    return `${baseSecret}:apple-oauth`;
  }

  private buildAppleClientSecret(config: ReturnType<AuthService['getAppleSignInConfig']>) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + 60 * 10;
    const header = this.encodeJwtPart({
      alg: 'ES256',
      kid: config.keyId,
      typ: 'JWT',
    });
    const payload = this.encodeJwtPart({
      iss: config.teamId,
      iat: issuedAt,
      exp: expiresAt,
      aud: 'https://appleid.apple.com',
      sub: config.clientId,
    });
    const signingInput = `${header}.${payload}`;
    const privateKey = createPrivateKey(config.privateKey);
    const signature = sign('sha256', Buffer.from(signingInput), {
      key: privateKey,
      dsaEncoding: 'ieee-p1363',
    });
    return `${signingInput}.${this.encodeBase64Url(signature)}`;
  }

  private normalizeApplePrivateKey(raw: string) {
    return raw.trim().replace(/\\n/g, '\n');
  }

  private decodeJwtJson<T>(part: string) {
    try {
      const json = this.decodeBase64Url(part).toString('utf8');
      return JSON.parse(json) as T;
    } catch {
      throw new BadRequestException('No pudimos leer la respuesta firmada del proveedor');
    }
  }

  private encodeJwtPart(value: Record<string, unknown>) {
    return this.encodeBase64Url(Buffer.from(JSON.stringify(value)));
  }

  private encodeBase64Url(value: Buffer) {
    return value
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private decodeBase64Url(value: string) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return Buffer.from(padded, 'base64');
  }

  private isVerifiedSocialEmail(value: string | boolean | undefined) {
    if (typeof value === 'boolean') return value;
    const normalized = (value ?? '').trim().toLowerCase();
    return normalized === 'true';
  }

  private isTruthy(value: string) {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
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
