import { useEffect, useMemo, useState } from 'react';
import { adminApi } from './api';
import {
  buildOperationalAlertsHistoryResetPayload,
  buildReportForm,
  buildReportSettingsPayload,
  DEFAULT_REPORT_FORM,
  getReportSetting,
  getReportStatusMeta,
  hasAutoReportsChanges,
  parseOperationalAlertsSummary,
  type ReportForm,
} from './admin-auto-reports.helpers';
import {
  AdminAutoReportsFeedback,
  AdminAutoReportsHeader,
  AdminAutoReportsHistorySection,
  AdminAutoReportsSettingsSection,
} from './admin-auto-reports.sections';
import { adminSettingsApi, type AdminSettingItem } from './settingsApi';

export function AdminAutoReportsPage() {
  const [form, setForm] = useState<ReportForm>(DEFAULT_REPORT_FORM);
  const [initialForm, setInitialForm] = useState<ReportForm | null>(null);
  const [settingsMap, setSettingsMap] = useState<Map<string, AdminSettingItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [sendingWeekly, setSendingWeekly] = useState(false);
  const [sendingOperational, setSendingOperational] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    async function safeLoad() {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const res = await adminSettingsApi.list();
        if (!mounted) return;
        const nextMap = new Map<string, AdminSettingItem>(res.items.map((item) => [item.key, item]));
        const nextForm = buildReportForm(nextMap);
        setSettingsMap(nextMap);
        setForm(nextForm);
        setInitialForm(nextForm);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando reportes');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void safeLoad();
    return () => {
      mounted = false;
    };
  }, []);

  const hasChanges = hasAutoReportsChanges(form, initialForm);
  const lastStatus = getReportSetting(settingsMap, 'ops_operational_alerts_last_status', '');
  const lastRunAt = getReportSetting(settingsMap, 'ops_operational_alerts_last_run_at', '');
  const lastRecipients = getReportSetting(settingsMap, 'ops_operational_alerts_last_recipients', '');
  const lastError = getReportSetting(settingsMap, 'ops_operational_alerts_last_error', '');
  const statusMeta = getReportStatusMeta(lastStatus);
  const lastSummary = useMemo(
    () => parseOperationalAlertsSummary(getReportSetting(settingsMap, 'ops_operational_alerts_last_summary', '{}')),
    [settingsMap],
  );

  async function saveSettings(items: Array<{ key: string; value: string; group: string; label: string; type: string }>) {
    const res = await adminSettingsApi.save(items);
    setSettingsMap(new Map<string, AdminSettingItem>(res.items.map((item) => [item.key, item])));
    return res;
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { items, normalizedForm } = buildReportSettingsPayload(form);
      await saveSettings(items);
      setForm(normalizedForm);
      setInitialForm(normalizedForm);
      setSuccess('Configuracion guardada.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la configuracion');
    } finally {
      setSaving(false);
    }
  }

  async function reloadSettingsOnly() {
    try {
      const res = await adminSettingsApi.list();
      setSettingsMap(new Map<string, AdminSettingItem>(res.items.map((item) => [item.key, item])));
    } catch {
      // leave current UI state
    }
  }

  async function handleClearHistory() {
    setClearingHistory(true);
    setError('');
    setSuccess('');
    try {
      await saveSettings(buildOperationalAlertsHistoryResetPayload());
      setSuccess('Historial de alertas operativas limpiado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo limpiar el historial');
    } finally {
      setClearingHistory(false);
    }
  }

  async function handleSendWeeklyNow() {
    setSendingWeekly(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminApi.sendWeeklyReportNow(Number(form.reportRange) as 7 | 30 | 90);
      setSuccess(`Reporte semanal enviado (${res.status}) a ${res.recipients.length} destinatario(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el reporte semanal');
    } finally {
      setSendingWeekly(false);
    }
  }

  async function handleSendOperationalNow() {
    setSendingOperational(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminApi.sendOperationalAlertsNow();
      setSuccess(`Alerta operativa ejecutada (${res.status}). Pedidos: ${res.summary.orders}, Reparaciones: ${res.summary.repairs}.`);
      await reloadSettingsOnly();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la alerta operativa');
      await reloadSettingsOnly();
    } finally {
      setSendingOperational(false);
    }
  }

  function patchForm<K extends keyof ReportForm>(field: K, value: ReportForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="store-shell space-y-5">
      <AdminAutoReportsHeader />
      <AdminAutoReportsFeedback error={error} success={success} />
      <AdminAutoReportsSettingsSection
        form={form}
        loading={loading}
        saving={saving}
        hasChanges={hasChanges}
        sendingWeekly={sendingWeekly}
        sendingOperational={sendingOperational}
        onChange={patchForm}
        onSave={() => void handleSave()}
        onSendWeeklyNow={() => void handleSendWeeklyNow()}
        onSendOperationalNow={() => void handleSendOperationalNow()}
      />
      <AdminAutoReportsHistorySection
        statusMeta={statusMeta}
        lastRunAt={lastRunAt}
        lastRecipients={lastRecipients}
        lastSummary={lastSummary}
        lastError={lastError}
        clearingHistory={clearingHistory}
        onClearHistory={() => void handleClearHistory()}
      />
    </div>
  );
}
