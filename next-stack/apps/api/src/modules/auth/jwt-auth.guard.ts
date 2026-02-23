import {
  CanActivate,
  Injectable,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { RequestWithUser } from './auth.types.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = this.getHeader(req);
    const token = this.extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedException('Token faltante');
    }

    const payload = await this.authService.verifyAccessTokenPublic(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    return true;
  }

  private getHeader(req: RequestWithUser) {
    const headers = (req as unknown as { headers?: Record<string, unknown> }).headers;
    const value = headers?.authorization;
    return typeof value === 'string' ? value : undefined;
  }

  private extractBearerToken(header?: string): string | null {
    if (!header) return null;
    const [type, token] = header.split(' ');
    if (!type || !token) return null;
    return type.toLowerCase() === 'bearer' ? token.trim() : null;
  }
}
