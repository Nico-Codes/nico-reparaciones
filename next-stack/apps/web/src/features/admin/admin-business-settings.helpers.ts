import type { AdminSettingItem } from './settingsApi';

export type BusinessForm = {
  shopWhatsapp: string;
  shopAddress: string;
  shopHours: string;
  ticketPaper: string;
  orderDelayHours: string;
  repairDelayDays: string;
  storeHeroTitle: string;
  storeHeroText: string;
};

export const DEFAULT_BUSINESS_FORM: BusinessForm = {
  shopWhatsapp: '',
  shopAddress: '',
  shopHours: '',
  ticketPaper: '80',
  orderDelayHours: '24',
  repairDelayDays: '3',
  storeHeroTitle: '',
  storeHeroText: '',
};

export const TICKET_PAPER_OPTIONS = [
  { value: '80', label: '80 mm' },
  { value: '58', label: '58 mm' },
  { value: 'a4', label: 'A4' },
];

export function getBusinessSetting(map: Map<string, AdminSettingItem>, key: string, fallback = '') {
  return map.get(key)?.value ?? fallback;
}

export function buildBusinessForm(map: Map<string, AdminSettingItem>): BusinessForm {
  return {
    shopWhatsapp: getBusinessSetting(map, 'shop_phone', DEFAULT_BUSINESS_FORM.shopWhatsapp),
    shopAddress: getBusinessSetting(map, 'shop_address', DEFAULT_BUSINESS_FORM.shopAddress),
    shopHours: getBusinessSetting(map, 'shop_hours', DEFAULT_BUSINESS_FORM.shopHours),
    ticketPaper: getBusinessSetting(map, 'ticket_paper_default', DEFAULT_BUSINESS_FORM.ticketPaper),
    orderDelayHours: getBusinessSetting(map, 'ops_alert_order_stale_hours', DEFAULT_BUSINESS_FORM.orderDelayHours),
    repairDelayDays: getBusinessSetting(map, 'ops_alert_repair_stale_days', DEFAULT_BUSINESS_FORM.repairDelayDays),
    storeHeroTitle: getBusinessSetting(map, 'store_hero_title', DEFAULT_BUSINESS_FORM.storeHeroTitle),
    storeHeroText: getBusinessSetting(map, 'store_hero_subtitle', DEFAULT_BUSINESS_FORM.storeHeroText),
  };
}

export function buildBusinessSettingsPayload(form: BusinessForm) {
  return [
    { key: 'shop_phone', value: form.shopWhatsapp, group: 'business', label: 'Telefono WhatsApp', type: 'text' },
    { key: 'shop_address', value: form.shopAddress, group: 'business', label: 'Direccion del local', type: 'textarea' },
    { key: 'shop_hours', value: form.shopHours, group: 'business', label: 'Horarios del local', type: 'textarea' },
    { key: 'ticket_paper_default', value: form.ticketPaper, group: 'business', label: 'Papel ticket por defecto', type: 'text' },
    { key: 'ops_alert_order_stale_hours', value: form.orderDelayHours, group: 'ops_reports', label: 'Pedido demorado (horas)', type: 'number' },
    { key: 'ops_alert_repair_stale_days', value: form.repairDelayDays, group: 'ops_reports', label: 'Reparacion demorada (dias)', type: 'number' },
    { key: 'store_hero_title', value: form.storeHeroTitle, group: 'branding', label: 'Titulo portada tienda', type: 'text' },
    { key: 'store_hero_subtitle', value: form.storeHeroText, group: 'branding', label: 'Texto portada tienda', type: 'textarea' },
  ];
}

export function hasBusinessSettingsChanges(current: BusinessForm, initial: BusinessForm) {
  return JSON.stringify(current) !== JSON.stringify(initial);
}
