import { describe, expect, it } from 'vitest';
import {
  buildOrderWhatsappTemplatesSaveInput,
  buildOrderWhatsappTemplatesState,
  buildRecentOrderWhatsappLogs,
  createDefaultOrderWhatsappTemplates,
  defaultOrderWhatsappTemplateBody,
  getOrderWhatsappTemplateRows,
} from './admin-whatsapp-orders.helpers';
import type { WhatsappLogItem, WhatsappTemplateItem } from './whatsappApi';

describe('admin-whatsapp-orders.helpers', () => {
  it('creates default templates for each order status', () => {
    const templates = createDefaultOrderWhatsappTemplates();

    expect(templates.pendiente).toContain('{order_id}');
    expect(templates.preparando).toContain('{items_summary}');
    expect(templates.listo_retirar).toContain('{shop_address}');
    expect(templates.entregado).toContain('Gracias por tu compra.');
    expect(defaultOrderWhatsappTemplateBody('cancelado')).toContain('Si queres');
  });

  it('hydrates template state and build save input in canonical order', () => {
    const apiItems: WhatsappTemplateItem[] = [
      {
        channel: 'orders',
        templateKey: 'preparando',
        label: 'Preparando',
        description: '',
        body: 'Tu pedido esta en preparacion',
        enabled: true,
        placeholders: [],
      },
    ];

    const state = buildOrderWhatsappTemplatesState(apiItems);
    const saveInput = buildOrderWhatsappTemplatesSaveInput(state);

    expect(state.preparando).toBe('Tu pedido esta en preparacion');
    expect(saveInput[0]?.templateKey).toBe('pendiente');
    expect(saveInput.find((item) => item.templateKey === 'preparando')?.body).toBe('Tu pedido esta en preparacion');
  });

  it('limits recent logs and expose row sizes by template type', () => {
    const logs = Array.from({ length: 15 }, (_, index) => ({
      id: `log-${index}`,
      channel: 'orders',
      templateKey: 'pendiente',
      targetType: 'order',
      targetId: `order-${index}`,
      phone: null,
      recipient: null,
      provider: null,
      remoteMessageId: null,
      providerStatus: null,
      errorMessage: null,
      status: 'PENDING',
      message: null,
      meta: null,
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-01T10:00:00.000Z',
      lastAttemptAt: null,
      sentAt: null,
      failedAt: null,
    })) satisfies WhatsappLogItem[];

    expect(buildRecentOrderWhatsappLogs(logs)).toHaveLength(12);
    expect(getOrderWhatsappTemplateRows('listo_retirar')).toBe(10);
    expect(getOrderWhatsappTemplateRows('pendiente')).toBe(8);
  });
});
