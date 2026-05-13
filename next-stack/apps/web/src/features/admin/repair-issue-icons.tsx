import type { ReactNode } from 'react';
import { BatteryWarning, Camera, CircleHelp, Cpu, Droplets, MonitorX, PlugZap, Volume2, Code2 } from 'lucide-react';
import { VISUAL_IDENTITY_SECTIONS } from './admin-visual-identity.helpers';

export type RepairIssueIconOption = {
  slot: string;
  label: string;
  group: 'recommended' | 'existing' | 'custom';
};

export const REPAIR_ISSUE_FALLBACK_SLOT = 'repair_issue_generic';

export const REPAIR_ISSUE_RECOMMENDED_ICONS: RepairIssueIconOption[] = [
  { slot: 'repair_issue_screen', label: 'Modulo / pantalla rota', group: 'recommended' },
  { slot: 'repair_issue_battery', label: 'Bateria', group: 'recommended' },
  { slot: 'repair_issue_charge', label: 'Placa de carga', group: 'recommended' },
  { slot: 'repair_issue_board', label: 'Placa / mother', group: 'recommended' },
  { slot: 'repair_issue_camera', label: 'Camara', group: 'recommended' },
  { slot: 'repair_issue_audio', label: 'Audio / parlante', group: 'recommended' },
  { slot: 'repair_issue_software', label: 'Software', group: 'recommended' },
  { slot: 'repair_issue_water', label: 'Humedad / agua', group: 'recommended' },
  { slot: 'repair_issue_generic', label: 'Falla generica', group: 'recommended' },
];

const FALLBACKS: Record<string, ReactNode> = {
  repair_issue_screen: <MonitorX className="h-full w-full" />,
  repair_issue_battery: <BatteryWarning className="h-full w-full" />,
  repair_issue_charge: <PlugZap className="h-full w-full" />,
  repair_issue_board: <Cpu className="h-full w-full" />,
  repair_issue_camera: <Camera className="h-full w-full" />,
  repair_issue_audio: <Volume2 className="h-full w-full" />,
  repair_issue_software: <Code2 className="h-full w-full" />,
  repair_issue_water: <Droplets className="h-full w-full" />,
  repair_issue_generic: <CircleHelp className="h-full w-full" />,
};

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
  if (!normalized) return REPAIR_ISSUE_FALLBACK_SLOT;
  if (['modulo', 'pantalla', 'display', 'lcd', 'touch', 'vidrio'].some((token) => normalized.includes(token))) return 'repair_issue_screen';
  if (normalized.includes('bateria') || normalized.includes('battery')) return 'repair_issue_battery';
  if (['carga', 'pin', 'conector', 'usb', 'charging'].some((token) => normalized.includes(token))) return 'repair_issue_charge';
  if (['placa', 'mother', 'board', 'corto', 'encendido'].some((token) => normalized.includes(token))) return 'repair_issue_board';
  if (normalized.includes('camara') || normalized.includes('camera')) return 'repair_issue_camera';
  if (['audio', 'parlante', 'microfono', 'auricular', 'speaker'].some((token) => normalized.includes(token))) return 'repair_issue_audio';
  if (['software', 'sistema', 'android', 'ios', 'flash'].some((token) => normalized.includes(token))) return 'repair_issue_software';
  if (['agua', 'humedad', 'mojado', 'liquido'].some((token) => normalized.includes(token))) return 'repair_issue_water';
  return REPAIR_ISSUE_FALLBACK_SLOT;
}

export function getRepairIssueIconFallback(slot?: string | null) {
  return FALLBACKS[slot || ''] ?? FALLBACKS[REPAIR_ISSUE_FALLBACK_SLOT];
}

export function buildRepairIssueIconOptions(customSlots: string[] = []) {
  const recommendedSlots = new Set(REPAIR_ISSUE_RECOMMENDED_ICONS.map((item) => item.slot));
  const existing = VISUAL_IDENTITY_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({ slot: item.slot, label: item.title, group: 'existing' as const })),
  ).filter((item) => !recommendedSlots.has(item.slot));
  const custom = customSlots
    .filter((slot) => slot.startsWith('repair_issue_') && !recommendedSlots.has(slot))
    .map((slot) => ({ slot, label: `Icono personalizado (${slot.replace(/^repair_issue_/, '')})`, group: 'custom' as const }));

  const bySlot = new Map<string, RepairIssueIconOption>();
  for (const option of [...REPAIR_ISSUE_RECOMMENDED_ICONS, ...custom, ...existing]) {
    if (!bySlot.has(option.slot)) bySlot.set(option.slot, option);
  }
  return [...bySlot.values()];
}

export function buildDynamicRepairIssueIconSlot(seed: string) {
  const safeSeed = seed
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  return `repair_issue_${safeSeed || 'custom'}_${Date.now().toString(36)}`;
}
