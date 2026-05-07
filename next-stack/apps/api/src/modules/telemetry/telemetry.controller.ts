import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { appLog } from '../../common/logging.js';

type TelemetryRequest = {
  requestId?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ClientErrorPayload = {
  message?: unknown;
  name?: unknown;
  stack?: unknown;
  componentStack?: unknown;
  path?: unknown;
  source?: unknown;
  userAgent?: unknown;
};

const MAX_FIELD_LENGTH = 1500;

function sanitizeText(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

@Controller('telemetry')
export class TelemetryController {
  @Post('client-error')
  @HttpCode(204)
  reportClientError(@Body() body: ClientErrorPayload, @Req() req: TelemetryRequest) {
    const message = sanitizeText(body?.message, 500) ?? 'Client error';
    const path = sanitizeText(body?.path, 300);
    const source = sanitizeText(body?.source, 80) ?? 'frontend';
    const userAgent = sanitizeText(body?.userAgent, 300) ?? sanitizeText(req.headers?.['user-agent'], 300);

    appLog('warn', '[client] error', {
      message,
      name: sanitizeText(body?.name, 120),
      source,
      path,
      stack: sanitizeText(body?.stack),
      componentStack: sanitizeText(body?.componentStack),
      userAgent,
      requestId: req.requestId ?? null,
    });
  }
}
