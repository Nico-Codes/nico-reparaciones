import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  it('connects when the Nest module initializes', async () => {
    const service = new PrismaService();
    const connect = vi.spyOn(service, '$connect').mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
    await service.$disconnect().catch(() => undefined);
  });

  it('registers a beforeExit shutdown hook for Nest app cleanup', async () => {
    const service = new PrismaService();
    const on = vi.spyOn(process, 'on').mockReturnValue(process);
    const app = { close: vi.fn().mockResolvedValue(undefined) };

    await service.enableShutdownHooks(app as never);

    expect(on).toHaveBeenCalledWith('beforeExit', expect.any(Function));
    const handler = on.mock.calls.find(([event]) => event === 'beforeExit')?.[1] as (() => Promise<void>) | undefined;
    await handler?.();
    expect(app.close).toHaveBeenCalledTimes(1);
    on.mockRestore();
    await service.$disconnect().catch(() => undefined);
  });
});
