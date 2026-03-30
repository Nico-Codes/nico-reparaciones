import { Inject, Injectable } from '@nestjs/common';
import { Prisma, type AppSetting } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  getAppSettingDefinition,
  mergeDefinedAndStoredAppSettings,
  type AppSettingListItem,
} from './app-settings.registry.js';

export type AdminSettingUpsertInput = {
  key: string;
  value?: string | null;
  group?: string;
  label?: string | null;
  type?: string | null;
};

@Injectable()
export class AdminSettingsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async settings() {
    const existing = await this.prisma.appSetting.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
    return { items: mergeDefinedAndStoredAppSettings(existing) };
  }

  async upsertSettings(input: AdminSettingUpsertInput[]) {
    const cleaned = input
      .map((item) => this.normalizeInput(item))
      .filter((item) => item.key.length > 0);

    const results: AppSettingListItem[] = [];
    for (const item of cleaned) {
      const saved = await this.prisma.appSetting.upsert({
        where: { key: item.key },
        create: {
          key: item.key,
          value: item.value,
          group: item.group,
          label: item.label,
          type: item.type,
        } satisfies Prisma.AppSettingCreateInput,
        update: {
          value: item.value,
          group: item.group,
          label: item.label,
          type: item.type,
        } satisfies Prisma.AppSettingUpdateInput,
      });
      results.push(this.serialize(saved));
    }
    return { items: results };
  }

  async getAppSettingValue(key: string, fallback = '') {
    const row = await this.prisma.appSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    return row?.value ?? fallback;
  }

  async upsertSingleSetting(key: string, value: string, group: string, label: string, type: string) {
    return this.prisma.appSetting.upsert({
      where: { key },
      create: { key, value, group, label, type },
      update: { value, group, label, type },
    });
  }

  private normalizeInput(input: AdminSettingUpsertInput) {
    const key = (input.key ?? '').trim();
    const definition = getAppSettingDefinition(key);
    const fallbackGroup = (input.group ?? 'general').trim() || 'general';
    const fallbackLabel = input.label == null ? null : String(input.label).trim() || null;
    const fallbackType = input.type == null ? 'text' : String(input.type).trim() || 'text';
    return {
      key,
      value: input.value == null ? null : String(input.value),
      group: definition?.group ?? fallbackGroup,
      label: fallbackLabel ?? definition?.label ?? null,
      type: definition?.type ?? fallbackType,
    };
  }

  private serialize(row: AppSetting): AppSettingListItem {
    return {
      id: row.id,
      key: row.key,
      value: row.value ?? '',
      group: row.group,
      label: row.label ?? row.key,
      type: row.type ?? 'text',
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
