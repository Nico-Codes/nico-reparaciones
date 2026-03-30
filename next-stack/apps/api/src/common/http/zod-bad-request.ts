import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export function zodErrorBody(parsed: z.SafeParseError<unknown>, message = 'Validacion invalida') {
  return {
    message,
    errors: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
  };
}

export function zodBadRequest(parsed: z.SafeParseError<unknown>, message = 'Validacion invalida') {
  return new BadRequestException(zodErrorBody(parsed, message));
}
