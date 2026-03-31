import { describe, expect, it } from 'vitest';
import {
  buildBusinessForm,
  buildBusinessSettingsPayload,
  DEFAULT_BUSINESS_FORM,
  getBusinessSetting,
  hasBusinessSettingsChanges,
} from './admin-business-settings.helpers';
import type { AdminSettingItem } from './settingsApi';

function makeSetting(input: Partial<AdminSettingItem> & Pick<AdminSettingItem, 'key' | 'value' | 'group' | 'type'>): AdminSettingItem {
  return {
    id: null,
    label: null,
    createdAt: null,
    updatedAt: null,
    ...input,
  };
}

describe('admin-business-settings.helpers', () => {
  it('builds the business form from settings with defaults', () => {
    const settings = new Map<string, AdminSettingItem>([
      ['shop_phone', makeSetting({ key: 'shop_phone', value: '+54 341 5550000', group: 'business', type: 'text' })],
      ['ticket_paper_default', makeSetting({ key: 'ticket_paper_default', value: '58', group: 'business', type: 'text' })],
      ['store_hero_title', makeSetting({ key: 'store_hero_title', value: 'Novedades', group: 'branding', type: 'text' })],
    ]);

    expect(buildBusinessForm(settings)).toEqual({
      ...DEFAULT_BUSINESS_FORM,
      shopWhatsapp: '+54 341 5550000',
      ticketPaper: '58',
      storeHeroTitle: 'Novedades',
    });
  });

  it('reads fallback values and builds settings payload', () => {
    expect(getBusinessSetting(new Map(), 'missing', 'fallback')).toBe('fallback');

    const payload = buildBusinessSettingsPayload({
      shopWhatsapp: '+54 1',
      shopAddress: 'Calle 123',
      shopHours: '9 a 18',
      ticketPaper: 'a4',
      orderDelayHours: '12',
      repairDelayDays: '4',
      storeHeroTitle: 'Promo',
      storeHeroText: 'Texto',
    });

    expect(payload).toHaveLength(8);
    expect(payload.find((item) => item.key === 'ticket_paper_default')).toEqual({
      key: 'ticket_paper_default',
      value: 'a4',
      group: 'business',
      label: 'Papel ticket por defecto',
      type: 'text',
    });
  });

  it('detects dirty state only when values changed', () => {
    expect(hasBusinessSettingsChanges(DEFAULT_BUSINESS_FORM, DEFAULT_BUSINESS_FORM)).toBe(false);
    expect(
      hasBusinessSettingsChanges(
        { ...DEFAULT_BUSINESS_FORM, shopHours: 'Lun a Vie' },
        DEFAULT_BUSINESS_FORM,
      ),
    ).toBe(true);
  });
});
