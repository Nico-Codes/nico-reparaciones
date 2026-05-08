import { afterEach, describe, expect, it, vi } from 'vitest';
import { TelemetryController } from './telemetry.controller.js';

describe('TelemetryController', () => {
  const originalLogFormat = process.env.LOG_FORMAT;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalLogFormat === undefined) delete process.env.LOG_FORMAT;
    else process.env.LOG_FORMAT = originalLogFormat;
  });

  it('logs sanitized client errors without throwing', () => {
    process.env.LOG_FORMAT = 'plain';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const controller = new TelemetryController();

    controller.reportClientError(
      {
        message: '  Broken component  ',
        name: 'Error',
        path: '/store',
        source: 'frontend',
        userAgent: '',
      },
      {
        requestId: 'req-1',
        headers: {
          'user-agent': 'vitest-agent',
        },
      },
    );

    expect(warn).toHaveBeenCalledWith(
      '[client] error',
      expect.objectContaining({
        message: 'Broken component',
        name: 'Error',
        path: '/store',
        source: 'frontend',
        userAgent: 'vitest-agent',
        requestId: 'req-1',
      }),
    );
  });

  it('falls back to safe defaults for malformed payloads', () => {
    process.env.LOG_FORMAT = 'plain';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const controller = new TelemetryController();

    controller.reportClientError({ message: 123, source: '' }, { headers: {} });

    expect(warn).toHaveBeenCalledWith(
      '[client] error',
      expect.objectContaining({
        message: 'Client error',
        source: 'frontend',
        requestId: null,
      }),
    );
  });
});
