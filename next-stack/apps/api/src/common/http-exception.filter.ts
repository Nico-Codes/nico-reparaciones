import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { appLog } from './logging.js';

type HttpRequestLike = {
  method?: string;
  url?: string;
  originalUrl?: string;
  requestId?: string;
};

type HttpResponseLike = {
  status: (code: number) => { json: (body: unknown) => void };
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponseLike>();
    const request = ctx.getRequest<HttpRequestLike>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = isHttp ? exception.getResponse() : null;

    let message: unknown = 'Internal server error';
    let details: unknown = undefined;

    if (typeof raw === 'string') {
      message = raw;
    } else if (raw && typeof raw === 'object') {
      const body = raw as Record<string, unknown>;
      message = body.message ?? message;
      details = body;
    } else if (exception instanceof Error && exception.message) {
      message = exception.message;
    }

    const payload = {
      ok: false,
      error: {
        statusCode: status,
        message,
        ...(details && typeof details === 'object' ? { details } : {}),
      },
      requestId: request.requestId ?? null,
      path: request.originalUrl ?? request.url ?? '',
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      const err = exception instanceof Error ? exception.stack ?? exception.message : String(exception);
      appLog('error', '[http] exception', {
        method: request.method ?? 'UNKNOWN',
        path: payload.path,
        statusCode: status,
        requestId: payload.requestId,
        error: err,
      });
    } else {
      appLog('warn', '[http] exception', {
        method: request.method ?? 'UNKNOWN',
        path: payload.path,
        statusCode: status,
        requestId: payload.requestId,
        message: Array.isArray(message) ? message.join('; ') : String(message),
      });
    }

    response.status(status).json(payload);
  }
}
