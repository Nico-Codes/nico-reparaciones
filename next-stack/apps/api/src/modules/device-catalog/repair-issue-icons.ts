export const REPAIR_ISSUE_ICON_FALLBACK_SLOT = 'repair_issue_generic';

const ISSUE_ICON_RULES: Array<{ slot: string; tokens: string[] }> = [
  { slot: 'repair_issue_screen', tokens: ['modulo', 'pantalla', 'display', 'lcd', 'touch', 'vidrio'] },
  { slot: 'repair_issue_battery', tokens: ['bateria', 'battery'] },
  { slot: 'repair_issue_charge', tokens: ['carga', 'pin', 'conector', 'usb', 'charging'] },
  { slot: 'repair_issue_board', tokens: ['placa', 'mother', 'board', 'corto', 'encendido'] },
  { slot: 'repair_issue_camera', tokens: ['camara', 'camera'] },
  { slot: 'repair_issue_audio', tokens: ['audio', 'parlante', 'microfono', 'auricular', 'speaker'] },
  { slot: 'repair_issue_software', tokens: ['software', 'sistema', 'android', 'ios', 'flash'] },
  { slot: 'repair_issue_water', tokens: ['agua', 'humedad', 'mojado', 'liquido'] },
];

function normalizeIssueText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function resolveRepairIssueIconSlot(value?: string | null) {
  const normalized = normalizeIssueText(value ?? '');
  if (!normalized) return REPAIR_ISSUE_ICON_FALLBACK_SLOT;
  const match = ISSUE_ICON_RULES.find((rule) => rule.tokens.some((token) => normalized.includes(token)));
  return match?.slot ?? REPAIR_ISSUE_ICON_FALLBACK_SLOT;
}

export function normalizeRepairIssueIconSlot(value?: string | null) {
  const slot = (value ?? '').trim();
  if (!slot) return null;
  if (!/^(icon|checkout|repair_issue)_[a-z0-9_]{2,100}$/.test(slot)) return null;
  return slot;
}
