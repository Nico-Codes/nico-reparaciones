import type { AdminSettingItem } from './settingsApi';

export type CheckoutSettingsForm = {
  transferTitle: string;
  transferDescription: string;
  holderLabel: string;
  holderValue: string;
  bankLabel: string;
  bankValue: string;
  aliasLabel: string;
  aliasValue: string;
  cvuLabel: string;
  cvuValue: string;
  taxIdLabel: string;
  taxIdValue: string;
  extraLabel: string;
  extraValue: string;
  transferNote: string;
};

export const DEFAULT_CHECKOUT_SETTINGS_FORM: CheckoutSettingsForm = {
  transferTitle: 'Datos para transferencia',
  transferDescription:
    'Si eliges transferencia, usa estos datos y conserva el comprobante para presentarlo al retirar.',
  holderLabel: 'Titular',
  holderValue: '',
  bankLabel: 'Banco',
  bankValue: '',
  aliasLabel: 'Alias',
  aliasValue: '',
  cvuLabel: 'CVU / CBU',
  cvuValue: '',
  taxIdLabel: 'CUIT / CUIL',
  taxIdValue: '',
  extraLabel: 'Referencia',
  extraValue: '',
  transferNote: 'Si tienes dudas, contactanos antes de confirmar el pago.',
};

type CheckoutSettingKey = keyof CheckoutSettingsForm;

const CHECKOUT_SETTING_META: Record<
  CheckoutSettingKey,
  { key: string; label: string; type: 'text' | 'textarea' }
> = {
  transferTitle: {
    key: 'checkout_transfer_title',
    label: 'Titulo bloque transferencia',
    type: 'text',
  },
  transferDescription: {
    key: 'checkout_transfer_description',
    label: 'Descripcion bloque transferencia',
    type: 'textarea',
  },
  holderLabel: {
    key: 'checkout_transfer_holder_label',
    label: 'Label titular',
    type: 'text',
  },
  holderValue: {
    key: 'checkout_transfer_holder_value',
    label: 'Dato titular',
    type: 'text',
  },
  bankLabel: {
    key: 'checkout_transfer_bank_label',
    label: 'Label banco',
    type: 'text',
  },
  bankValue: {
    key: 'checkout_transfer_bank_value',
    label: 'Dato banco',
    type: 'text',
  },
  aliasLabel: {
    key: 'checkout_transfer_alias_label',
    label: 'Label alias',
    type: 'text',
  },
  aliasValue: {
    key: 'checkout_transfer_alias_value',
    label: 'Dato alias',
    type: 'text',
  },
  cvuLabel: {
    key: 'checkout_transfer_cvu_label',
    label: 'Label CVU',
    type: 'text',
  },
  cvuValue: {
    key: 'checkout_transfer_cvu_value',
    label: 'Dato CVU',
    type: 'text',
  },
  taxIdLabel: {
    key: 'checkout_transfer_tax_id_label',
    label: 'Label CUIT',
    type: 'text',
  },
  taxIdValue: {
    key: 'checkout_transfer_tax_id_value',
    label: 'Dato CUIT',
    type: 'text',
  },
  extraLabel: {
    key: 'checkout_transfer_extra_label',
    label: 'Label extra',
    type: 'text',
  },
  extraValue: {
    key: 'checkout_transfer_extra_value',
    label: 'Dato extra',
    type: 'text',
  },
  transferNote: {
    key: 'checkout_transfer_note',
    label: 'Nota al pie transferencia',
    type: 'textarea',
  },
};

function getCheckoutSetting(
  map: Map<string, AdminSettingItem>,
  key: string,
  fallback = '',
) {
  return map.get(key)?.value ?? fallback;
}

export function buildCheckoutSettingsForm(
  map: Map<string, AdminSettingItem>,
): CheckoutSettingsForm {
  return {
    transferTitle: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.transferTitle.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.transferTitle,
    ),
    transferDescription: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.transferDescription.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.transferDescription,
    ),
    holderLabel: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.holderLabel.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.holderLabel,
    ),
    holderValue: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.holderValue.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.holderValue,
    ),
    bankLabel: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.bankLabel.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.bankLabel,
    ),
    bankValue: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.bankValue.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.bankValue,
    ),
    aliasLabel: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.aliasLabel.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.aliasLabel,
    ),
    aliasValue: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.aliasValue.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.aliasValue,
    ),
    cvuLabel: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.cvuLabel.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.cvuLabel,
    ),
    cvuValue: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.cvuValue.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.cvuValue,
    ),
    taxIdLabel: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.taxIdLabel.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.taxIdLabel,
    ),
    taxIdValue: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.taxIdValue.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.taxIdValue,
    ),
    extraLabel: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.extraLabel.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.extraLabel,
    ),
    extraValue: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.extraValue.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.extraValue,
    ),
    transferNote: getCheckoutSetting(
      map,
      CHECKOUT_SETTING_META.transferNote.key,
      DEFAULT_CHECKOUT_SETTINGS_FORM.transferNote,
    ),
  };
}

export function buildCheckoutSettingsPayload(form: CheckoutSettingsForm) {
  return (Object.entries(CHECKOUT_SETTING_META) as Array<
    [CheckoutSettingKey, (typeof CHECKOUT_SETTING_META)[CheckoutSettingKey]]
  >).map(([field, meta]) => ({
    key: meta.key,
    value: form[field],
    group: 'checkout',
    label: meta.label,
    type: meta.type,
  }));
}

export function hasCheckoutSettingsChanges(
  current: CheckoutSettingsForm,
  initial: CheckoutSettingsForm,
) {
  return JSON.stringify(current) !== JSON.stringify(initial);
}

export function countConfiguredTransferFields(form: CheckoutSettingsForm) {
  return [
    form.holderValue,
    form.bankValue,
    form.aliasValue,
    form.cvuValue,
    form.taxIdValue,
    form.extraValue,
  ].filter((value) => value.trim().length > 0).length;
}
