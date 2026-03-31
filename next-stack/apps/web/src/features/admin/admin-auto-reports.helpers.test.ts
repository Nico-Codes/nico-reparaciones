import { describe, expect, it } from 'vitest';
import {
  buildOperationalAlertsHistoryResetPayload,
  buildReportForm,
  buildReportSettingsPayload,
  DEFAULT_REPORT_FORM,
  getReportStatusMeta,
  hasAutoReportsChanges,
  normalizeAntiSpamWindow,
  parseOperationalAlertsSummary,
} from './admin-auto-reports.helpers';
import type { AdminSettingItem } from './settingsApi';

function makeSetting(input: Partial<AdminSettingItem> & Pick<AdminSettingItem, 'key' | 'value' | 'group' | 'type'>): AdminSettingItem {
  return {
    id: null,
    label: null,
    createdAt: null,
    updatedAt: null,
    ...input,
  };
}

describe('admin-auto-reports.helpers', () => {
  it('hydrates report form from settings and falls back invalid range', () => {
    const form = buildReportForm(
      new Map([
        ['ops_weekly_report_emails', makeSetting({ key: 'ops_weekly_report_emails', value: 'ops@test.com', group: 'ops_reports', type: 'text' })],
        ['ops_weekly_report_range_days', makeSetting({ key: 'ops_weekly_report_range_days', value: '120', group: 'ops_reports', type: 'number' })],
      ]),
    );

    expect(form).toEqual({
      ...DEFAULT_REPORT_FORM,
      weeklyEmails: 'ops@test.com',
      reportRange: '30',
    });
  });

  it('normalizes dedupe window and builds save payload', () => {
    const result = buildReportSettingsPayload({
      weeklyEmails: ' a@test.com ',
      alertsEmails: ' b@test.com ',
      sendDay: 'friday',
      sendHour: '09:30',
      reportRange: '90',
      antiSpamWindow: '1',
    });

    expect(normalizeAntiSpamWindow('999999')).toBe('10080');
    expect(result.normalizedForm.antiSpamWindow).toBe('5');
    expect(result.items.find((item) => item.key === 'ops_weekly_report_emails')?.value).toBe('a@test.com');
    expect(result.items.find((item) => item.key === 'ops_operational_alerts_dedupe_minutes')?.value).toBe('5');
  });

  it('parses operational summary and detects form changes', () => {
    expect(parseOperationalAlertsSummary('{"orders":2,"repairs":"3"}')).toEqual({ orders: 2, repairs: 3 });
    expect(parseOperationalAlertsSummary('nope')).toEqual({ orders: 0, repairs: 0 });
    expect(hasAutoReportsChanges(DEFAULT_REPORT_FORM, DEFAULT_REPORT_FORM)).toBe(false);
    expect(hasAutoReportsChanges({ ...DEFAULT_REPORT_FORM, sendHour: '10:00' }, DEFAULT_REPORT_FORM)).toBe(true);
  });

  it('builds reset payload and status fallback', () => {
    const resetPayload = buildOperationalAlertsHistoryResetPayload();
    expect(resetPayload).toHaveLength(5);
    expect(resetPayload.find((item) => item.key === 'ops_operational_alerts_last_summary')?.value).toBe('{}');
    expect(getReportStatusMeta('dry_run')).toEqual({ label: 'Dry-run', className: 'badge-sky' });
    expect(getReportStatusMeta('missing')).toEqual({ label: 'Sin ejecuciones', className: 'badge-zinc' });
  });
});
