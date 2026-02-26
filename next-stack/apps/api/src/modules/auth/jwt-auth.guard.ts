import {
  CanActivate,
  Injectable,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import type { RequestWithUser } from './auth.types.js';
import type { JwtPayload } from './auth.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = this.getHeader(req);
    const token = this.extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedException('Token faltante');
    }

    const payload = await this.verifyAccessToken(token);
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

  private async verifyAccessToken(accessToken: string) {
    try {
      const secret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me';
      return jwt.verify(accessToken, secret) as JwtPayload;
    } catch (error) {
      console.warn('[auth] jwt verify failed in guard', error instanceof Error ? error.message : error);
      throw new UnauthorizedException('Token invalido o expirado');
    }
  }
}
