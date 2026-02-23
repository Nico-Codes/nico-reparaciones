import {
  BadRequestException,
  Injectable,
  PipeTransform,
  type ArgumentMetadata,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    throw new BadRequestException({
      message: 'Validacion invalida',
      errors,
    });
  }
}
