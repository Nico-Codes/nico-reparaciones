import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser, RequestWithUser } from './auth.types.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | null => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    return req.user ?? null;
  },
);
