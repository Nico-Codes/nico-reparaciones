import type { WhatsappLogItem, WhatsappTemplateItem } from './whatsappApi';
import { cleanWhatsappDisplayText, sanitizeWhatsappLog } from './whatsapp-ui';

export type WhatsappVariableInfo = {
  key: string;
  description: string;
};

export type RepairTemplateDef = {
  title: string;
  key: string;
};

export const WHATSAPP_VARIABLES: WhatsappVariableInfo[] = [
  { key: '{customer_name}', description: 'Nombre del cliente' },
  { key: '{code}', description: 'Código de reparación' },
  { key: '{status}', description: 'Clave del estado (ej: ready_pickup)' },
  { key: '{status_label}', description: 'Nombre lindo del estado (ej: Listo para retirar)' },
  { key: '{lookup_url}', description: 'Link a la página /reparacion' },
  { key: '{phone}', description: 'Teléfono del cliente' },
  { key: '{device_brand}', description: 'Marca del equipo' },
  { key: '{device_model}', description: 'Modelo del equipo' },
  { key: '{device}', description: 'Marca + Modelo' },
  { key: '{final_price}', description: 'Precio final (si existe)' },
  { key: '{warranty_days}', description: 'Garantía en días' },
  { key: '{approval_url}', description: 'Link firmado para que el cliente apruebe/rechace presupuesto' },
  { key: '{shop_address}', description: 'Dirección del local (Admin > Configuración)' },
  { key: '{shop_hours}', description: 'Horarios (Admin > Configuración)' },
];

export const REPAIR_TEMPLATE_ORDER: RepairTemplateDef[] = [
  { key: 'received', title: 'Recibido' },
  { key: 'diagnosing', title: 'Diagnosticando' },
  { key: 'waiting_approval', title: 'Esperando aprobación' },
  { key: 'repairing', title: 'En reparación' },
  { key: 'ready_pickup', title: 'Listo para retirar' },
  { key: 'delivered', title: 'Entregado' },
  { key: 'cancelled', title: 'Cancelado' },
];

export function defaultWhatsappTemplateBody(templateKey: string) {
  if (templateKey === 'waiting_approval') {
    return [
      'Hola {customer_name} 👋',
      'Tu reparación ({code}) está en estado: *{status_label}*.',
      'Necesitamos tu aprobación para continuar.',
      'Aprobá o rechazá acá: {approval_url}',
      '',
      'Podés consultar el estado en: {lookup_url}',
      'Código: {code}',
      'Equipo: {device}',
      'NicoReparaciones',
    ].join('\n');
  }

  if (templateKey === 'ready_pickup') {
    return [
      'Hola {customer_name} 👋',
      'Tu reparación ({code}) está en estado: *{status_label}*.',
      '¡Ya está lista para retirar! ✅',
      '',
      '📍 Dirección: {shop_address}',
      '🕒 Horarios: {shop_hours}',
      '',
      'Podés consultar el estado en: {lookup_url}',
      'Código: {code}',
      'Equipo: {device}',
      'NicoReparaciones',
    ].join('\n');
  }

  if (templateKey === 'delivered') {
    return [
      'Hola {customer_name} 👋',
      'Tu reparación ({code}) está en estado: *{status_label}*.',
      '¡Gracias por tu visita! 🙌',
      '',
      'Podés consultar el estado en: {lookup_url}',
      'Código: {code}',
      'Equipo: {device}',
      'NicoReparaciones',
    ].join('\n');
  }

  return [
    'Hola {customer_name} 👋',
    'Tu reparación ({code}) está en estado: *{status_label}*.',
    '',
    'Podés consultar el estado en: {lookup_url}',
    'Código: {code}',
    'Equipo: {device}',
    'NicoReparaciones',
  ].join('\n');
}

export function createDefaultWhatsappTemplates() {
  return Object.fromEntries(
    REPAIR_TEMPLATE_ORDER.map((template) => [template.key, defaultWhatsappTemplateBody(template.key)]),
  ) as Record<string, string>;
}

export function buildWhatsappTemplatesState(items: WhatsappTemplateItem[]) {
  const byTemplateKey = new Map(
    items.map((item) => [item.templateKey, cleanWhatsappDisplayText(item.body)]),
  );

  return Object.fromEntries(
    REPAIR_TEMPLATE_ORDER.map((template) => [
      template.key,
      byTemplateKey.get(template.key) ?? defaultWhatsappTemplateBody(template.key),
    ]),
  ) as Record<string, string>;
}

export function buildWhatsappTemplatesSaveInput(templates: Record<string, string>) {
  return REPAIR_TEMPLATE_ORDER.map((template) => ({
    templateKey: template.key,
    body: templates[template.key] ?? '',
    enabled: true,
  }));
}

export function buildRecentWhatsappLogs(items: WhatsappLogItem[], limit = 12) {
  return items.slice(0, limit).map(sanitizeWhatsappLog);
}

export function getWhatsappTemplateRows(templateKey: string) {
  return templateKey === 'waiting_approval' || templateKey === 'ready_pickup' ? 8 : 6;
}
