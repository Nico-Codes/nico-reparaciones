import type { WhatsappLogItem, WhatsappTemplateItem } from './whatsappApi';
import { cleanWhatsappDisplayText, sanitizeWhatsappLog } from './whatsapp-ui';

export type OrderWhatsappVariableInfo = {
  key: string;
  description: string;
};

export type OrderWhatsappTemplateDef = {
  title: string;
  key: string;
};

export const ORDER_WHATSAPP_VARIABLES: OrderWhatsappVariableInfo[] = [
  { key: '{customer_name}', description: 'Nombre del cliente' },
  { key: '{order_id}', description: 'ID del pedido' },
  { key: '{status}', description: 'Clave del estado (ej: preparando)' },
  { key: '{status_label}', description: 'Nombre del estado para mostrar' },
  { key: '{total}', description: 'Total del pedido formateado' },
  { key: '{total_raw}', description: 'Total numerico sin formato' },
  { key: '{items_count}', description: 'Cantidad de items' },
  { key: '{items_summary}', description: 'Listado simple de items en varias lineas' },
  { key: '{pickup_name}', description: 'Nombre de retiro' },
  { key: '{pickup_phone}', description: 'Telefono de retiro' },
  { key: '{phone}', description: 'Alias de pickup_phone' },
  { key: '{notes}', description: 'Notas del cliente' },
  { key: '{my_orders_url}', description: 'Link a /mis-pedidos' },
  { key: '{store_url}', description: 'Link a /tienda' },
  { key: '{shop_address}', description: 'Direccion del local' },
  { key: '{shop_hours}', description: 'Horarios del local' },
  { key: '{shop_phone}', description: 'Telefono del local' },
  { key: '{shop_name}', description: 'Nombre del negocio' },
];

export const ORDER_WHATSAPP_TEMPLATE_ORDER: OrderWhatsappTemplateDef[] = [
  { title: 'Pendiente', key: 'pendiente' },
  { title: 'Confirmado', key: 'confirmado' },
  { title: 'Preparando', key: 'preparando' },
  { title: 'Listo para retirar', key: 'listo_retirar' },
  { title: 'Entregado', key: 'entregado' },
  { title: 'Cancelado', key: 'cancelado' },
];

export function defaultOrderWhatsappTemplateBody(templateKey: string) {
  const lines = [
    'Hola {customer_name}',
    'Tu pedido *#{order_id}* esta en estado: *{status_label}*.',
    'Total: {total}',
    'Items: {items_count}',
    '',
    '{items_summary}',
    '',
    'Ver tus pedidos: {my_orders_url}',
    'Tienda: {store_url}',
  ];

  if (templateKey === 'listo_retirar') {
    lines.push('', 'Direccion: {shop_address}', 'Horarios: {shop_hours}', 'Telefono: {shop_phone}');
  }

  if (templateKey === 'entregado') {
    lines.push('', 'Gracias por tu compra.');
  }

  if (templateKey === 'cancelado') {
    lines.push('', 'Si queres, lo revisamos por WhatsApp.');
  }

  return lines.join('\n');
}

export function createDefaultOrderWhatsappTemplates() {
  return Object.fromEntries(
    ORDER_WHATSAPP_TEMPLATE_ORDER.map((template) => [
      template.key,
      defaultOrderWhatsappTemplateBody(template.key),
    ]),
  ) as Record<string, string>;
}

export function buildOrderWhatsappTemplatesState(items: WhatsappTemplateItem[]) {
  const byTemplateKey = new Map(
    items.map((item) => [item.templateKey, cleanWhatsappDisplayText(item.body)]),
  );

  return Object.fromEntries(
    ORDER_WHATSAPP_TEMPLATE_ORDER.map((template) => [
      template.key,
      byTemplateKey.get(template.key) ?? defaultOrderWhatsappTemplateBody(template.key),
    ]),
  ) as Record<string, string>;
}

export function buildOrderWhatsappTemplatesSaveInput(templates: Record<string, string>) {
  return ORDER_WHATSAPP_TEMPLATE_ORDER.map((template) => ({
    templateKey: template.key,
    body: templates[template.key] ?? '',
    enabled: true,
  }));
}

export function buildRecentOrderWhatsappLogs(items: WhatsappLogItem[], limit = 12) {
  return items.slice(0, limit).map(sanitizeWhatsappLog);
}

export function getOrderWhatsappTemplateRows(templateKey: string) {
  if (templateKey === 'listo_retirar') return 10;
  return 8;
}
