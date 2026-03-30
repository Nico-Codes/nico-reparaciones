import { describe, expect, it } from 'vitest';
import { AdminCommunicationsService } from './admin-communications.service.js';

function createService() {
  return new AdminCommunicationsService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
}

describe('AdminCommunicationsService', () => {
  it('normalizes broken whatsapp text without mojibake leftovers', () => {
    const service = createService();
    const value = 'Direcci�n: Mitre 123. Tel�fono: +54911. Tu pedido est� listo. �tems: 2.';

    const normalized = (service as any).repairMojibakeText(value);

    expect(normalized).toContain('Dirección');
    expect(normalized).toContain('Teléfono');
    expect(normalized).toContain('está');
    expect(normalized).toContain('Ítems');
    expect(normalized).not.toMatch(/[ÃƒÃ‚Ã¢ï¿½�]/u);
  });

  it('builds default order whatsapp templates with clean spanish text', () => {
    const service = createService();
    const body = (service as any).defaultWhatsappTemplateBody('orders', 'listo_retirar');

    expect(body).toContain('está');
    expect(body).toContain('Ítems');
    expect(body).toContain('Dirección');
    expect(body).toContain('Teléfono');
    expect(body).not.toMatch(/[ÃƒÃ‚Ã¢ï¿½�]/u);
  });
});
