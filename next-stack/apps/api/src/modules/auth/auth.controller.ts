import {
  Patch,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
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
  VerifyEmailInput,
} from '@nico/contracts';
import {
  accountPasswordUpdateSchema,
  accountUpdateSchema,
  appleAuthCompleteSchema,
  bootstrapAdminSchema,
  forgotPasswordSchema,
  googleAuthCompleteSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@nico/contracts';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import {
  clearRefreshCookie,
  extractCookie,
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
  type RefreshCookieResponse,
} from './auth-refresh-cookie.js';
import { CurrentUser } from './current-user.decorator.js';
import type { AuthenticatedUser } from './auth.types.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

type RedirectResponse = {
  redirect: (url: string) => unknown;
};

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() input: RegisterInput, @Res({ passthrough: true }) res: RefreshCookieResponse) {
    const response = await this.authService.register(input);
    setRefreshCookie(res, response.tokens.refreshToken);
    return response;
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() input: LoginInput, @Res({ passthrough: true }) res: RefreshCookieResponse) {
    const response = await this.authService.login(input);
    setRefreshCookie(res, response.tokens.refreshToken);
    return response;
  }

  @Get('social/providers')
  async socialProviders() {
    return this.authService.getAvailableSocialProviders();
  }

  @Get('google/start')
  async googleStart(@Query('returnTo') returnTo: string | undefined, @Res() res: RedirectResponse) {
    try {
      const redirectUrl = await this.authService.createGoogleAuthorizationUrl(returnTo);
      return res.redirect(redirectUrl);
    } catch (error) {
      const message = (error as { message?: string })?.message ?? 'No pudimos iniciar el acceso con Google';
      const fallbackUrl = await this.authService.buildGoogleFrontendErrorRedirect(message);
      return res.redirect(fallbackUrl);
    }
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: RedirectResponse,
  ) {
    try {
      const redirectUrl = await this.authService.handleGoogleCallback({ code, state, error });
      return res.redirect(redirectUrl);
    } catch (callbackError) {
      const message = (callbackError as { message?: string })?.message ?? 'No pudimos completar el acceso con Google';
      const fallbackUrl = await this.authService.buildGoogleFrontendErrorRedirect(message);
      return res.redirect(fallbackUrl);
    }
  }

  @Post('google/complete')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(googleAuthCompleteSchema))
  async googleComplete(@Body() input: GoogleAuthCompleteInput, @Res({ passthrough: true }) res: RefreshCookieResponse) {
    const response = await this.authService.completeGoogleLogin(input);
    setRefreshCookie(res, response.tokens.refreshToken);
    return response;
  }

  @Get('apple/start')
  async appleStart(@Query('returnTo') returnTo: string | undefined, @Res() res: RedirectResponse) {
    try {
      const redirectUrl = await this.authService.createAppleAuthorizationUrl(returnTo);
      return res.redirect(redirectUrl);
    } catch (error) {
      const message = (error as { message?: string })?.message ?? 'No pudimos iniciar el acceso con Apple';
      const fallbackUrl = await this.authService.buildAppleFrontendErrorRedirect(message);
      return res.redirect(fallbackUrl);
    }
  }

  @Get('apple/callback')
  async appleCallbackGet(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: RedirectResponse,
  ) {
    try {
      const redirectUrl = await this.authService.handleAppleCallback({ code, state, error });
      return res.redirect(redirectUrl);
    } catch (callbackError) {
      const message = (callbackError as { message?: string })?.message ?? 'No pudimos completar el acceso con Apple';
      const fallbackUrl = await this.authService.buildAppleFrontendErrorRedirect(message);
      return res.redirect(fallbackUrl);
    }
  }

  @Post('apple/callback')
  async appleCallbackPost(
    @Body('code') code: string | undefined,
    @Body('state') state: string | undefined,
    @Body('error') error: string | undefined,
    @Body('user') user: unknown,
    @Res() res: RedirectResponse,
  ) {
    try {
      const redirectUrl = await this.authService.handleAppleCallback({ code, state, error, user });
      return res.redirect(redirectUrl);
    } catch (callbackError) {
      const message = (callbackError as { message?: string })?.message ?? 'No pudimos completar el acceso con Apple';
      const fallbackUrl = await this.authService.buildAppleFrontendErrorRedirect(message);
      return res.redirect(fallbackUrl);
    }
  }

  @Post('apple/complete')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(appleAuthCompleteSchema))
  async appleComplete(@Body() input: AppleAuthCompleteInput, @Res({ passthrough: true }) res: RefreshCookieResponse) {
    const response = await this.authService.completeAppleLogin(input);
    setRefreshCookie(res, response.tokens.refreshToken);
    return response;
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refresh(
    @Body() input: RefreshTokenInput,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) res: RefreshCookieResponse,
  ) {
    const response = await this.authService.refresh({
      refreshToken: input.refreshToken ?? extractCookie(cookieHeader, REFRESH_COOKIE_NAME) ?? undefined,
    });
    setRefreshCookie(res, response.tokens.refreshToken);
    return response;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() input: Partial<RefreshTokenInput> | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) res: RefreshCookieResponse,
  ) {
    await this.authService.logout({
      refreshToken: input?.refreshToken ?? extractCookie(cookieHeader, REFRESH_COOKIE_NAME) ?? null,
    });
    clearRefreshCookie(res);
    return { ok: true };
  }

  @Post('verify-email/request')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async requestEmailVerification(@Headers('authorization') authorization?: string) {
    const token = this.extractBearerToken(authorization);
    if (!token) throw new UnauthorizedException('Token faltante');
    return this.authService.requestEmailVerification(token);
  }

  @Post('verify-email/confirm')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(verifyEmailSchema))
  async confirmEmailVerification(@Body() input: VerifyEmailInput) {
    return this.authService.confirmEmailVerification(input);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() input: ForgotPasswordInput) {
    return this.authService.forgotPassword(input);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() input: ResetPasswordInput) {
    return this.authService.resetPassword(input);
  }

  @Post('bootstrap-admin')
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @UsePipes(new ZodValidationPipe(bootstrapAdminSchema))
  async bootstrapAdmin(@Body() input: BootstrapAdminInput, @Res({ passthrough: true }) res: RefreshCookieResponse) {
    const response = await this.authService.bootstrapAdmin(input);
    setRefreshCookie(res, response.tokens.refreshToken);
    return response;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async meProtected(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) throw new UnauthorizedException('Usuario no autenticado');
    return this.authService.meByUserId(user.id);
  }

  @Get('account')
  @UseGuards(JwtAuthGuard)
  async account(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) throw new UnauthorizedException('Usuario no autenticado');
    return this.authService.meByUserId(user.id);
  }

  @Patch('account')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(accountUpdateSchema))
  async updateAccount(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() input: AccountUpdateInput,
  ) {
    if (!user) throw new UnauthorizedException('Usuario no autenticado');
    return this.authService.updateAccountByUserId(user.id, input);
  }

  @Patch('account/password')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(accountPasswordUpdateSchema))
  async updateAccountPassword(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() input: AccountPasswordUpdateInput,
  ) {
    if (!user) throw new UnauthorizedException('Usuario no autenticado');
    return this.authService.updateAccountPasswordByUserId(user.id, input);
  }

  private extractBearerToken(header?: string): string | null {
    if (!header) return null;
    const [type, token] = header.split(' ');
    if (!type || !token) return null;
    if (type.toLowerCase() !== 'bearer') return null;
    return token.trim() || null;
  }
}
