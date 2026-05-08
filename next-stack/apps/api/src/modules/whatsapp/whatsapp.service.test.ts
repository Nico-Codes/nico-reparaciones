import { NotFoundException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WhatsappService } from './whatsapp.service.js';

function whatsappLog(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-01-01T10:00:00.000Z');
  return {
    id: 'log-1',
    channel: 'orders',
    templateKey: 'confirmado',
    targetType: 'order',
    targetId: 'order-1',
    phone: '+5491111111111',
    recipient: 'Cliente',
    provider: 'manual_whatsapp',
    remoteMessageId: null,
    providerStatus: 'manual_opened',
    errorMessage: null,
    status: 'MANUAL',
    message: 'Mensaje',
    metaJson: '{"deliveryMode":"manual"}',
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: now,
    sentAt: null,
    failedAt: null,
    ...overrides,
  };
}

function createPrismaMock() {
  return {
    whatsAppLog: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe('WhatsappService', () => {
  const originalEnv = {
    WHATSAPP_CLOUD_ENABLED: process.env.WHATSAPP_CLOUD_ENABLED,
    WHATSAPP_CLOUD_ACCESS_TOKEN: process.env.WHATSAPP_CLOUD_ACCESS_TOKEN,
    WHATSAPP_CLOUD_PHONE_NUMBER_ID: process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID,
    WHATSAPP_CLOUD_VERIFY_TOKEN: process.env.WHATSAPP_CLOUD_VERIFY_TOKEN,
    WHATSAPP_CLOUD_API_VERSION: process.env.WHATSAPP_CLOUD_API_VERSION,
    WHATSAPP_CLOUD_BASE_URL: process.env.WHATSAPP_CLOUD_BASE_URL,
  };

  afterEach(() => {
    vi.restoreAllMocks();
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('verifies webhook tokens only when configured and request is valid', () => {
    process.env.WHATSAPP_CLOUD_VERIFY_TOKEN = 'verify-123';
    const service = new WhatsappService(createPrismaMock() as never);

    expect(service.verifyWebhook('subscribe', 'verify-123', 'challenge')).toEqual({ ok: true, challenge: 'challenge' });
    expect(service.verifyWebhook('subscribe', 'bad', 'challenge')).toEqual({ ok: false, error: 'forbidden' });
    expect(service.verifyWebhook('wrong', 'verify-123', 'challenge')).toEqual({ ok: false, error: 'invalid_request' });
  });

  it('creates manual logs with stable defaults and serialized metadata', async () => {
    const prisma = createPrismaMock();
    prisma.whatsAppLog.create.mockResolvedValue(whatsappLog({ metaJson: '{"source":"test"}' }));
    const service = new WhatsappService(prisma as never);

    await expect(
      service.createManualLog({
        channel: ' ',
        phone: ' +54 9 1111 ',
        recipient: ' Cliente ',
        message: ' Mensaje ',
        meta: { source: 'test' },
      }),
    ).resolves.toMatchObject({
      item: {
        id: 'log-1',
        provider: 'manual_whatsapp',
        status: 'MANUAL',
        providerStatus: 'manual_opened',
        meta: { source: 'test' },
      },
    });

    expect(prisma.whatsAppLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        channel: 'general',
        phone: '+54 9 1111',
        recipient: 'Cliente',
        provider: 'manual_whatsapp',
        status: 'MANUAL',
        providerStatus: 'manual_opened',
        message: 'Mensaje',
        metaJson: JSON.stringify({ source: 'test' }),
      }),
    });
  });

  it('marks dispatch as failed when Cloud API is not configured', async () => {
    process.env.WHATSAPP_CLOUD_ENABLED = '0';
    const prisma = createPrismaMock();
    prisma.whatsAppLog.findUnique
      .mockResolvedValueOnce(whatsappLog({ provider: 'meta_cloud', status: 'PENDING' }))
      .mockResolvedValueOnce(whatsappLog({ provider: 'meta_cloud', status: 'PENDING' }));
    prisma.whatsAppLog.update
      .mockResolvedValueOnce(whatsappLog({ provider: 'meta_cloud', status: 'PENDING' }))
      .mockResolvedValueOnce(whatsappLog({
        provider: 'meta_cloud',
        status: 'FAILED',
        providerStatus: 'failed',
        errorMessage: 'WhatsApp Cloud API no configurada.',
        failedAt: new Date('2026-01-01T10:01:00.000Z'),
        metaJson: '{"provider":"meta_cloud","reason":"cloud_api_not_configured"}',
      }));
    const service = new WhatsappService(prisma as never);

    await expect(service.dispatchLog('log-1')).resolves.toMatchObject({
      status: 'FAILED',
      providerStatus: 'failed',
      errorMessage: 'WhatsApp Cloud API no configurada.',
      meta: {
        provider: 'meta_cloud',
        reason: 'cloud_api_not_configured',
      },
    });
  });

  it('updates matching logs from webhook status events', async () => {
    const prisma = createPrismaMock();
    prisma.whatsAppLog.findUnique.mockResolvedValue(whatsappLog({
      id: 'log-1',
      remoteMessageId: 'wamid-1',
      status: 'PENDING',
      metaJson: null,
      sentAt: null,
    }));
    prisma.whatsAppLog.update.mockResolvedValue(whatsappLog({
      id: 'log-1',
      remoteMessageId: 'wamid-1',
      status: 'SENT',
      providerStatus: 'delivered',
      sentAt: new Date('2026-01-01T10:02:00.000Z'),
      metaJson: '{"provider":"meta_cloud","webhookStatus":{"status":"delivered"}}',
    }));
    const service = new WhatsappService(prisma as never);

    await expect(
      service.handleWebhook({
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [{ id: 'wamid-1', status: 'delivered', timestamp: '1767261720' }],
                },
              },
            ],
          },
        ],
      }),
    ).resolves.toEqual({ ok: true, processed: 1 });

    expect(prisma.whatsAppLog.update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: expect.objectContaining({
        status: 'SENT',
        providerStatus: 'delivered',
        errorMessage: null,
      }),
    });
  });

  it('throws not found when dispatching an unknown log', async () => {
    const prisma = createPrismaMock();
    prisma.whatsAppLog.findUnique.mockResolvedValue(null);
    const service = new WhatsappService(prisma as never);

    await expect(service.dispatchLog('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
