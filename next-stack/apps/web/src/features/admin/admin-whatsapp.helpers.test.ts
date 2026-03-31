import { describe, expect, it } from 'vitest';
import {
  buildRecentWhatsappLogs,
  buildWhatsappTemplatesSaveInput,
  buildWhatsappTemplatesState,
  createDefaultWhatsappTemplates,
  defaultWhatsappTemplateBody,
  getWhatsappTemplateRows,
} from './admin-whatsapp.helpers';

describe('admin-whatsapp.helpers', () => {
  it('builds default templates with special waiting approval copy', () => {
    const templates = createDefaultWhatsappTemplates();

    expect(templates.waiting_approval).toContain('{approval_url}');
    expect(defaultWhatsappTemplateBody('ready_pickup')).toContain('{shop_address}');
    expect(defaultWhatsappTemplateBody('delivered')).toContain('Gracias por tu visita');
  });

  it('hydrates template state from API items with fallback defaults', () => {
    const templates = buildWhatsappTemplatesState([
      {
        channel: 'repairs',
        templateKey: 'received',
        label: 'Recibido',
        description: '',
        body: 'Hola custom',
        enabled: true,
        placeholders: [],
      },
    ]);

    expect(templates.received).toBe('Hola custom');
    expect(templates.repairing).toContain('{lookup_url}');
  });

  it('builds save payload in canonical template order', () => {
    const payload = buildWhatsappTemplatesSaveInput({
      received: 'uno',
      diagnosing: 'dos',
      waiting_approval: 'tres',
      repairing: 'cuatro',
      ready_pickup: 'cinco',
      delivered: 'seis',
      cancelled: 'siete',
    });

    expect(payload.map((item) => item.templateKey)).toEqual([
      'received',
      'diagnosing',
      'waiting_approval',
      'repairing',
      'ready_pickup',
      'delivered',
      'cancelled',
    ]);
    expect(payload.every((item) => item.enabled)).toBe(true);
  });

  it('limits recent logs and exposes textarea rows', () => {
    const logs = buildRecentWhatsappLogs([
      {
        id: '1',
        channel: 'repairs',
        templateKey: 'received',
        targetType: 'repair',
        targetId: 'r-1',
        phone: null,
        recipient: null,
        provider: null,
        remoteMessageId: null,
        providerStatus: null,
        errorMessage: null,
        status: 'SENT',
        message: 'PodÃƒÂ©s seguir el caso',
        meta: null,
        createdAt: '2026-03-31T10:00:00.000Z',
        updatedAt: '2026-03-31T10:00:00.000Z',
        lastAttemptAt: null,
        sentAt: null,
        failedAt: null,
      },
      {
        id: '2',
        channel: 'repairs',
        templateKey: 'diagnosing',
        targetType: 'repair',
        targetId: 'r-2',
        phone: null,
        recipient: null,
        provider: null,
        remoteMessageId: null,
        providerStatus: null,
        errorMessage: null,
        status: 'PENDING',
        message: 'Segundo',
        meta: null,
        createdAt: '2026-03-31T11:00:00.000Z',
        updatedAt: '2026-03-31T11:00:00.000Z',
        lastAttemptAt: null,
        sentAt: null,
        failedAt: null,
      },
    ], 1);

    expect(logs).toHaveLength(1);
    expect(logs[0]?.id).toBe('1');
    expect(getWhatsappTemplateRows('waiting_approval')).toBe(8);
    expect(getWhatsappTemplateRows('received')).toBe(6);
  });
});
