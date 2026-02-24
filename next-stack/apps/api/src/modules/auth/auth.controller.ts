import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type {
  BootstrapAdminInput,
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@nico/contracts';
import {
  bootstrapAdminSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@nico/contracts';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import type { AuthenticatedUser } from './auth.types.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() input: RegisterInput) {
    return this.authService.register(input);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() input: LoginInput) {
    return this.authService.login(input);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refresh(@Body() input: RefreshTokenInput) {
    return this.authService.refresh(input);
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
  async bootstrapAdmin(@Body() input: BootstrapAdminInput) {
    return this.authService.bootstrapAdmin(input);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async meProtected(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) throw new UnauthorizedException('Usuario no autenticado');
    return this.authService.meByUserId(user.id);
  }

  private extractBearerToken(header?: string): string | null {
    if (!header) return null;
    const [type, token] = header.split(' ');
    if (!type || !token) return null;
    if (type.toLowerCase() !== 'bearer') return null;
    return token.trim() || null;
  }
}
