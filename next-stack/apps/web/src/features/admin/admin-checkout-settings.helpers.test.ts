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
    expect(form.debitEnabled).toBe(false);
    expect(form.creditEnabled).toBe(false);
  });

  it('builds payload and counts configured transfer values', () => {
    const form = {
      ...DEFAULT_CHECKOUT_SETTINGS_FORM,
      debitEnabled: true,
      aliasValue: 'NICO.REPARACIONES',
      cvuValue: '0000000000000000000000',
    };

    const payload = buildCheckoutSettingsPayload(form);

    expect(payload.find((item) => item.key === 'checkout_transfer_alias_value')?.value).toBe(
      'NICO.REPARACIONES',
    );
    expect(payload.find((item) => item.key === 'checkout_payment_debit_enabled')?.value).toBe(
      '1',
    );
    expect(payload.find((item) => item.key === 'checkout_payment_credit_enabled')?.value).toBe(
      '0',
    );
    expect(countConfiguredTransferFields(form)).toBe(2);
    expect(hasCheckoutSettingsChanges(form, DEFAULT_CHECKOUT_SETTINGS_FORM)).toBe(true);
  });
});
