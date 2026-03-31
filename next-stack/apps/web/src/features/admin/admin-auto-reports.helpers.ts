import type { AdminSettingItem } from './settingsApi';

export type ReportForm = {
  weeklyEmails: string;
  alertsEmails: string;
  sendDay: string;
  sendHour: string;
  reportRange: '7' | '30' | '90';
  antiSpamWindow: string;
};

export type ReportStatusMeta = {
  label: string;
  className: string;
};

export type OperationalAlertsSummary = {
  orders: number;
  repairs: number;
};

export const DAY_OPTIONS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miercoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sabado' },
  { value: 'sunday', label: 'Domingo' },
] as const;

export const RANGE_OPTIONS = [
  { value: '7', label: 'Ultimos 7 dias' },
  { value: '30', label: 'Ultimos 30 dias' },
  { value: '90', label: 'Ultimos 90 dias' },
] as const;

export const STATUS_META: Record<string, ReportStatusMeta> = {
  sent: { label: 'Enviado', className: 'badge-emerald' },
  dry_run: { label: 'Dry-run', className: 'badge-sky' },
  deduped: { label: 'Omitido (anti-spam)', className: 'badge-amber' },
  no_alerts: { label: 'Sin alertas', className: 'badge-zinc' },
  failed: { label: 'Error', className: 'badge-rose' },
  '': { label: 'Sin ejecuciones', className: 'badge-zinc' },
};

export const DEFAULT_REPORT_FORM: ReportForm = {
  weeklyEmails: '',
  alertsEmails: '',
  sendDay: 'monday',
  sendHour: '08:00',
  reportRange: '30',
  antiSpamWindow: '360',
};

export function getReportSetting(map: Map<string, AdminSettingItem>, key: string, fallback = '') {
  return map.get(key)?.value ?? fallback;
}

export function normalizeReportRange(value: string): ReportForm['reportRange'] {
  return value === '7' || value === '30' || value === '90' ? value : '30';
}

export function normalizeAntiSpamWindow(value: string) {
  return String(Math.max(5, Math.min(10080, Number(value) || 360)));
}

export function buildReportForm(map: Map<string, AdminSettingItem>): ReportForm {
  return {
    weeklyEmails: getReportSetting(map, 'ops_weekly_report_emails', DEFAULT_REPORT_FORM.weeklyEmails),
    alertsEmails: getReportSetting(map, 'ops_operational_alerts_emails', DEFAULT_REPORT_FORM.alertsEmails),
    sendDay: getReportSetting(map, 'ops_weekly_report_day', DEFAULT_REPORT_FORM.sendDay),
    sendHour: getReportSetting(map, 'ops_weekly_report_time', DEFAULT_REPORT_FORM.sendHour),
    reportRange: normalizeReportRange(getReportSetting(map, 'ops_weekly_report_range_days', DEFAULT_REPORT_FORM.reportRange)),
    antiSpamWindow: getReportSetting(map, 'ops_operational_alerts_dedupe_minutes', DEFAULT_REPORT_FORM.antiSpamWindow),
  };
}

export function buildReportSettingsPayload(form: ReportForm) {
  const normalizedDedupe = normalizeAntiSpamWindow(form.antiSpamWindow);

  return {
    normalizedForm: { ...form, antiSpamWindow: normalizedDedupe },
    items: [
      { key: 'ops_weekly_report_emails', value: form.weeklyEmails.trim(), group: 'ops_reports', label: 'Weekly report emails', type: 'text' },
      { key: 'ops_weekly_report_day', value: form.sendDay, group: 'ops_reports', label: 'Weekly report day', type: 'text' },
      { key: 'ops_weekly_report_time', value: form.sendHour, group: 'ops_reports', label: 'Weekly report time', type: 'text' },
      { key: 'ops_weekly_report_range_days', value: form.reportRange, group: 'ops_reports', label: 'Weekly report range days', type: 'number' },
      {
        key: 'ops_operational_alerts_emails',
        value: form.alertsEmails.trim(),
        group: 'ops_reports',
        label: 'Operational alerts emails',
        type: 'text',
      },
      {
        key: 'ops_operational_alerts_dedupe_minutes',
        value: normalizedDedupe,
        group: 'ops_reports',
        label: 'Operational alerts dedupe minutes',
        type: 'number',
      },
    ],
  };
}

export function buildOperationalAlertsHistoryResetPayload() {
  return [
    { key: 'ops_operational_alerts_last_status', value: '', group: 'ops_reports', label: 'Operational alerts last status', type: 'text' },
    { key: 'ops_operational_alerts_last_run_at', value: '', group: 'ops_reports', label: 'Operational alerts last run at', type: 'text' },
    {
      key: 'ops_operational_alerts_last_recipients',
      value: '',
      group: 'ops_reports',
      label: 'Operational alerts last recipients',
      type: 'text',
    },
    {
      key: 'ops_operational_alerts_last_summary',
      value: '{}',
      group: 'ops_reports',
      label: 'Operational alerts last summary',
      type: 'json',
    },
    { key: 'ops_operational_alerts_last_error', value: '', group: 'ops_reports', label: 'Operational alerts last error', type: 'text' },
  ];
}

export function parseOperationalAlertsSummary(raw: string): OperationalAlertsSummary {
  try {
    const parsed = JSON.parse(raw);
    return {
      orders: Number(parsed?.orders ?? 0) || 0,
      repairs: Number(parsed?.repairs ?? 0) || 0,
    };
  } catch {
    return { orders: 0, repairs: 0 };
  }
}

export function hasAutoReportsChanges(current: ReportForm, initial: ReportForm | null) {
  return initial ? JSON.stringify(current) !== JSON.stringify(initial) : false;
}

export function getReportStatusMeta(status: string) {
  return STATUS_META[status] ?? STATUS_META[''];
}
