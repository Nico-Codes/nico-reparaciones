import { describe, expect, it } from 'vitest';
import {
  buildCheckoutSettingsForm,
  buildCheckoutSettingsPayload,
  countConfiguredTransferFields,
  DEFAULT_CHECKOUT_SETTINGS_FORM,
  hasCheckoutSettingsChanges,
} from './admin-checkout-settings.helpers';
import type { AdminSettingItem } from './settingsApi';

function makeSetting(
  input: Partial<AdminSettingItem> &
    Pick<AdminSettingItem, 'key' | 'value' | 'group' | 'type'>,
): AdminSettingItem {
  return {
    id: null,
    label: null,
    createdAt: null,
    updatedAt: null,
    ...input,
  };
}

describe('admin-checkout-settings.helpers', () => {
  it('hydrates checkout transfer form with defaults and stored values', () => {
    const form = buildCheckoutSettingsForm(
      new Map([
        [
          'checkout_transfer_alias_value',
          makeSetting({
            key: 'checkout_transfer_alias_value',
            value: 'NICO.REPARACIONES',
            group: 'checkout',
            type: 'text',
          }),
        ],
      ]),
    );

    expect(form.aliasValue).toBe('NICO.REPARACIONES');
    expect(form.transferTitle).toBe(DEFAULT_CHECKOUT_SETTINGS_FORM.transferTitle);
  });

  it('builds payload and counts configured transfer values', () => {
    const form = {
      ...DEFAULT_CHECKOUT_SETTINGS_FORM,
      aliasValue: 'NICO.REPARACIONES',
      cvuValue: '0000000000000000000000',
    };

    const payload = buildCheckoutSettingsPayload(form);

    expect(payload.find((item) => item.key === 'checkout_transfer_alias_value')?.value).toBe(
      'NICO.REPARACIONES',
    );
    expect(payload.map((item) => item.key)).toEqual([
      'checkout_transfer_title',
      'checkout_transfer_description',
      'checkout_transfer_holder_label',
      'checkout_transfer_holder_value',
      'checkout_transfer_bank_label',
      'checkout_transfer_bank_value',
      'checkout_transfer_alias_label',
      'checkout_transfer_alias_value',
      'checkout_transfer_cvu_label',
      'checkout_transfer_cvu_value',
      'checkout_transfer_tax_id_label',
      'checkout_transfer_tax_id_value',
      'checkout_transfer_extra_label',
      'checkout_transfer_extra_value',
      'checkout_transfer_note',
    ]);
    expect(countConfiguredTransferFields(form)).toBe(2);
    expect(hasCheckoutSettingsChanges(form, DEFAULT_CHECKOUT_SETTINGS_FORM)).toBe(true);
  });
});
