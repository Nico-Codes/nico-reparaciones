import type { WhatsappLogItem } from './whatsappApi';

export function cleanWhatsappDisplayText(value?: string | null) {
  const text = (value ?? '').trim();
  if (!text) return '';
  return text
    .replace(/ConfiguraciÃ³n/g, 'Configuración')
    .replace(/aprobaciÃ³n/g, 'aprobación')
    .replace(/reparaciÃ³n/g, 'reparación')
    .replace(/PodÃ©s/g, 'Podés')
    .replace(/AprobÃ¡/g, 'Aprobá')
    .replace(/rechazÃ¡/g, 'rechazá')
    .replace(/acÃ¡/g, 'acá')
    .replace(/estÃ¡/g, 'está')
    .replace(/CÃ³digo/g, 'Código')
    .replace(/Ãtems/g, 'Ítems')
    .replace(/DirecciÃ³n/g, 'Dirección')
    .replace(/TelÃ©fono/g, 'Teléfono')
    .replace(/querÃ©s/g, 'querés')
    .replace(/Ya estÃ¡/g, 'Ya está')
    .replace(/Â¡/g, '¡')
    .replace(/Â·/g, '·');
}

export function sanitizeWhatsappLog(log: WhatsappLogItem): WhatsappLogItem {
  return {
    ...log,
    templateKey: cleanWhatsappDisplayText(log.templateKey) || log.templateKey,
    recipient: cleanWhatsappDisplayText(log.recipient) || log.recipient,
    providerStatus: cleanWhatsappDisplayText(log.providerStatus) || log.providerStatus,
    errorMessage: cleanWhatsappDisplayText(log.errorMessage) || log.errorMessage,
    message: cleanWhatsappDisplayText(log.message) || log.message,
  };
}

export function whatsappStatusLabel(status: string) {
  const normalized = status.trim().toUpperCase();
  if (normalized === 'SENT') return 'Enviado';
  if (normalized === 'FAILED') return 'Fallido';
  if (normalized === 'PENDING') return 'Pendiente';
  return normalized || 'Pendiente';
}

export function whatsappStatusClassName(status: string) {
  const normalized = status.trim().toUpperCase();
  if (normalized === 'SENT') {
    return 'rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700';
  }
  if (normalized === 'FAILED') {
    return 'rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700';
  }
  return 'rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700';
}

export function whatsappProviderStatusLabel(log: WhatsappLogItem) {
  const provider = (log.provider ?? '').trim();
  const providerStatus = (log.providerStatus ?? '').trim();
  if (!provider && !providerStatus) return null;

  const providerLabel = provider === 'meta_cloud' ? 'Meta Cloud API' : provider || 'Proveedor';
  const normalizedStatus = providerStatus.toLowerCase();
  if (!normalizedStatus) return providerLabel;
  if (normalizedStatus === 'accepted') return `${providerLabel}: aceptado`;
  if (normalizedStatus === 'accepted_without_id') return `${providerLabel}: aceptado sin id remoto`;
  if (normalizedStatus === 'pending') return `${providerLabel}: pendiente`;
  if (normalizedStatus === 'sent') return `${providerLabel}: enviado`;
  if (normalizedStatus === 'delivered') return `${providerLabel}: entregado`;
  if (normalizedStatus === 'read') return `${providerLabel}: leído`;
  if (normalizedStatus === 'failed') return `${providerLabel}: fallido`;
  return cleanWhatsappDisplayText(`${providerLabel}: ${providerStatus}`);
}

export function whatsappAttemptLabel(log: WhatsappLogItem) {
  if (log.sentAt) return `Enviado ${formatDateTime(log.sentAt)}`;
  if (log.failedAt) return `Fallido ${formatDateTime(log.failedAt)}`;
  if (log.lastAttemptAt) return `Último intento ${formatDateTime(log.lastAttemptAt)}`;
  return `Creado ${formatDateTime(log.createdAt)}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-AR');
}
