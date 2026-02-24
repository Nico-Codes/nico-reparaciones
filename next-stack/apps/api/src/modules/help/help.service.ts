import { Injectable } from '@nestjs/common';
import type { HelpFaqItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HelpService {
  constructor(private readonly prisma: PrismaService) {}

  async publicList() {
    const rows = await this.prisma.helpFaqItem.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: 300,
    });

    return {
      items: rows.map((r: HelpFaqItem) => ({
        id: r.id,
        question: r.question,
        answer: r.answer,
        category: r.category || 'general',
      })),
    };
  }
}
