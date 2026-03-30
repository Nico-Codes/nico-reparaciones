import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RepairsTimelineService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createEvent(repairId: string, eventType: string, message?: string | null, meta?: unknown) {
    await this.prisma.repairEventLog.create({
      data: {
        repairId,
        eventType,
        message: message ?? null,
        metaJson: meta == null ? null : JSON.stringify(meta),
      },
    });
  }

  async listTimeline(repairId: string, take = 50) {
    const events = await this.prisma.repairEventLog.findMany({
      where: { repairId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return events.map((event) => this.serializeEvent(event));
  }

  private serializeEvent(event: { id: string; eventType: string; message: string | null; metaJson: string | null; createdAt: Date }) {
    let meta: unknown = null;
    if (event.metaJson) {
      try {
        meta = JSON.parse(event.metaJson);
      } catch {
        meta = event.metaJson;
      }
    }

    return {
      id: event.id,
      eventType: event.eventType,
      message: event.message,
      meta,
      createdAt: event.createdAt.toISOString(),
    };
  }
}
