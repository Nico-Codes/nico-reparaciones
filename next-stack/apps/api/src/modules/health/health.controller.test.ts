import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns liveness and info payloads without touching the database', () => {
    const prisma = { $queryRaw: vi.fn() };
    const controller = new HealthController(prisma as never);

    expect(controller.getHealth()).toMatchObject({ ok: true, service: 'nico-api' });
    expect(controller.getLiveness()).toMatchObject({ ok: true, status: 'live', service: 'nico-api' });
    expect(controller.getInfo()).toMatchObject({ ok: true, status: 'info', service: 'nico-api' });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('returns readiness when the database responds', async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) };
    const controller = new HealthController(prisma as never);

    await expect(controller.getReadiness()).resolves.toMatchObject({
      ok: true,
      status: 'ready',
      checks: { db: 'ok' },
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('throws service unavailable when readiness cannot reach the database', async () => {
    const prisma = { $queryRaw: vi.fn().mockRejectedValue(new Error('db down')) };
    const controller = new HealthController(prisma as never);

    await expect(controller.getReadiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
