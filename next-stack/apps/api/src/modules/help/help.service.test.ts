import { describe, expect, it, vi } from 'vitest';
import { HelpService } from './help.service.js';

describe('HelpService', () => {
  it('returns only public FAQ fields ordered by the service query', async () => {
    const prisma = {
      helpFaqItem: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'faq-1',
            question: 'Como compro?',
            answer: 'Desde tienda.',
            category: '',
            active: true,
            sortOrder: 10,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
          },
          {
            id: 'faq-2',
            question: 'Como retiro?',
            answer: 'Por el local.',
            category: 'pedidos',
            active: true,
            sortOrder: 20,
            createdAt: new Date('2026-01-02T00:00:00.000Z'),
          },
        ]),
      },
    };
    const service = new HelpService(prisma as never);

    await expect(service.publicList()).resolves.toEqual({
      items: [
        { id: 'faq-1', question: 'Como compro?', answer: 'Desde tienda.', category: 'general' },
        { id: 'faq-2', question: 'Como retiro?', answer: 'Por el local.', category: 'pedidos' },
      ],
    });
    expect(prisma.helpFaqItem.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: 300,
    });
  });
});
