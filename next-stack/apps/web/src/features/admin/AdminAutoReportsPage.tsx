import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from './api';
import { adminSettingsApi, type AdminSettingItem } from './settingsApi';

type ReportForm = {
  weeklyEmails: string;
  alertsEmails: string;
  sendDay: string;
  sendHour: string;
  reportRange: '7' | '30' | '90';
  antiSpamWindow: string;
};

const DAY_OPTIONS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miercoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sabado' },
  { value: 'sunday', label: 'Domingo' },
] as const;

const STATUS_META: Record<string, { label: string; className: string }> = {
  sent: { label: 'Enviado', className: 'badge-emerald' },
  dry_run: { label: 'Dry-run', className: 'badge-sky' },
  deduped: { label: 'Omitido (anti-spam)', className: 'badge-amber' },
  no_alerts: { label: 'Sin alertas', className: 'badge-zinc' },
  failed: { label: 'Error', className: 'badge-rose' },
  '': { label: 'Sin ejecuciones', className: 'badge-zinc' },
};

function getSetting(map: Map<string, AdminSettingItem>, key: string, fallback = '') {
  return map.get(key)?.value ?? fallback;
}

function parseSummary(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function AdminAutoReportsPage() {
  const [form, setForm] = useState<ReportForm>({
    weeklyEmails: '',
    alertsEmails: '',
    sendDay: 'monday',
    sendHour: '08:00',
    reportRange: '30',
    antiSpamWindow: '360',
  });
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
    async function load() {
      const res = await adminSettingsApi.list();
      if (!mounted) return;
      const map = new Map<string, AdminSettingItem>(res.items.map((i) => [i.key, i]));
      setSettingsMap(map);

      const nextForm: ReportForm = {
        weeklyEmails: getSetting(map, 'ops_weekly_report_emails', ''),
        alertsEmails: getSetting(map, 'ops_operational_alerts_emails', ''),
        sendDay: getSetting(map, 'ops_weekly_report_day', 'monday'),
        sendHour: getSetting(map, 'ops_weekly_report_time', '08:00'),
        reportRange: (['7', '30', '90'].includes(getSetting(map, 'ops_weekly_report_range_days', '30'))
          ? getSetting(map, 'ops_weekly_report_range_days', '30')
          : '30') as ReportForm['reportRange'],
        antiSpamWindow: getSetting(map, 'ops_operational_alerts_dedupe_minutes', '360'),
      };
      setForm(nextForm);
      setInitialForm(nextForm);
    }

    async function safeLoad() {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        await load();
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

  const hasChanges = initialForm ? JSON.stringify(form) !== JSON.stringify(initialForm) : false;
  const lastStatus = getSetting(settingsMap, 'ops_operational_alerts_last_status', '');
  const lastRunAt = getSetting(settingsMap, 'ops_operational_alerts_last_run_at', '');
  const lastRecipients = getSetting(settingsMap, 'ops_operational_alerts_last_recipients', '');
  const lastError = getSetting(settingsMap, 'ops_operational_alerts_last_error', '');
  const lastSummary = useMemo(
    () => parseSummary(getSetting(settingsMap, 'ops_operational_alerts_last_summary', '{}')),
    [settingsMap],
  );
  const statusMeta = STATUS_META[lastStatus] ?? STATUS_META[''];

  async function saveSettings(items: Array<{ key: string; value: string; group: string; label: string; type: string }>) {
    const res = await adminSettingsApi.save(items);
    setSettingsMap(new Map<string, AdminSettingItem>(res.items.map((i) => [i.key, i])));
    return res;
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const normalizedDedupe = String(Math.max(5, Math.min(10080, Number(form.antiSpamWindow) || 360)));
      await saveSettings([
        { key: 'ops_weekly_report_emails', value: form.weeklyEmails.trim(), group: 'ops_reports', label: 'Weekly report emails', type: 'text' },
        { key: 'ops_weekly_report_day', value: form.sendDay, group: 'ops_reports', label: 'Weekly report day', type: 'text' },
        { key: 'ops_weekly_report_time', value: form.sendHour, group: 'ops_reports', label: 'Weekly report time', type: 'text' },
        { key: 'ops_weekly_report_range_days', value: form.reportRange, group: 'ops_reports', label: 'Weekly report range days', type: 'number' },
        { key: 'ops_operational_alerts_emails', value: form.alertsEmails.trim(), group: 'ops_reports', label: 'Operational alerts emails', type: 'text' },
        { key: 'ops_operational_alerts_dedupe_minutes', value: normalizedDedupe, group: 'ops_reports', label: 'Operational alerts dedupe minutes', type: 'number' },
      ]);
      const normalized = { ...form, antiSpamWindow: normalizedDedupe };
      setForm(normalized);
      setInitialForm(normalized);
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
      setSettingsMap(new Map<string, AdminSettingItem>(res.items.map((i) => [i.key, i])));
    } catch {
      // leave current UI state
    }
  }

  async function handleClearHistory() {
    setClearingHistory(true);
    setError('');
    setSuccess('');
    try {
      await saveSettings([
        { key: 'ops_operational_alerts_last_status', value: '', group: 'ops_reports', label: 'Operational alerts last status', type: 'text' },
        { key: 'ops_operational_alerts_last_run_at', value: '', group: 'ops_reports', label: 'Operational alerts last run at', type: 'text' },
        { key: 'ops_operational_alerts_last_recipients', value: '', group: 'ops_reports', label: 'Operational alerts last recipients', type: 'text' },
        { key: 'ops_operational_alerts_last_summary', value: '{}', group: 'ops_reports', label: 'Operational alerts last summary', type: 'json' },
        { key: 'ops_operational_alerts_last_error', value: '', group: 'ops_reports', label: 'Operational alerts last error', type: 'text' },
      ]);
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
      setSuccess(
        `Alerta operativa ejecutada (${res.status}). Pedidos: ${res.summary.orders}, Reparaciones: ${res.summary.repairs}.`,
      );
      await reloadSettingsOnly();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la alerta operativa');
      await reloadSettingsOnly();
    } finally {
      setSendingOperational(false);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Reportes automaticos</h1>
            <p className="mt-1 text-sm text-zinc-600">Configura envio semanal de KPIs del dashboard.</p>
          </div>
          <Link to="/admin/configuraciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver a configuracion
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-black tracking-tight text-zinc-900">Reportes semanales</div>
            <p className="mt-1 text-sm text-zinc-500">
              Define destinatarios y frecuencia para el envio automatico de resumenes.
            </p>
          </div>
          <span className="inline-flex h-7 items-center rounded-full border border-sky-200 bg-sky-50 px-3 text-sm font-black text-sky-700">
            Email
          </span>
        </div>
        <div className="card-body space-y-5">
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
          {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">Emails destinatarios (separados por coma)</label>
            <textarea
              value={form.weeklyEmails}
              onChange={(e) => setForm((p) => ({ ...p, weeklyEmails: e.target.value }))}
              rows={3}
              disabled={loading}
              className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm disabled:bg-zinc-50"
            />
            <p className="mt-2 text-sm text-zinc-500">Si queda vacio, no se enviara ningun reporte automatico.</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">Dia de envio</label>
              <select
                value={form.sendDay}
                onChange={(e) => setForm((p) => ({ ...p, sendDay: e.target.value }))}
                disabled={loading}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm disabled:bg-zinc-50"
              >
                {DAY_OPTIONS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">Hora de envio</label>
              <input
                type="time"
                value={form.sendHour}
                onChange={(e) => setForm((p) => ({ ...p, sendHour: e.target.value }))}
                disabled={loading}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm disabled:bg-zinc-50"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">Rango del reporte</label>
              <select
                value={form.reportRange}
                onChange={(e) => setForm((p) => ({ ...p, reportRange: e.target.value as ReportForm['reportRange'] }))}
                disabled={loading}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm disabled:bg-zinc-50"
              >
                <option value="7">Ultimos 7 dias</option>
                <option value="30">Ultimos 30 dias</option>
                <option value="90">Ultimos 90 dias</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 md:p-4">
            <div className="text-xl font-black tracking-tight text-zinc-900">Alertas operativas automaticas</div>
            <p className="mt-1 text-sm text-zinc-600">Correo diario con pedidos/reparaciones demoradas (anti-spam incluido).</p>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-900">Emails para alertas operativas (opcional)</label>
                <textarea
                  value={form.alertsEmails}
                  onChange={(e) => setForm((p) => ({ ...p, alertsEmails: e.target.value }))}
                  rows={3}
                  placeholder="ops@tudominio.com, soporte@tudominio.com"
                  disabled={loading}
                  className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm disabled:bg-zinc-50"
                />
                <p className="mt-2 text-sm text-zinc-500">Si queda vacio, usa emails de reporte semanal y luego admins.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-900">Ventana anti-spam (minutos)</label>
                <input
                  type="number"
                  min={5}
                  max={10080}
                  value={form.antiSpamWindow}
                  onChange={(e) => setForm((p) => ({ ...p, antiSpamWindow: e.target.value }))}
                  disabled={loading}
                  className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm disabled:bg-zinc-50"
                />
                <p className="mt-2 text-sm text-zinc-500">No reenvia la misma alerta durante esta ventana (ej: 360 = 6 horas).</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link to="/admin/configuraciones" className="btn-outline !h-11 !rounded-xl px-5 text-sm font-bold">
              Volver a configuracion
            </Link>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={loading || saving || !hasChanges}
              className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar reporte semanal'}
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-600">
            El scheduler del servidor toma esta configuracion y ejecuta <code>ops:dashboard-report-email</code> cada semana.
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleSendWeeklyNow()}
              disabled={loading || sendingWeekly}
              className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingWeekly ? 'Enviando...' : 'Enviar reporte ahora'}
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-600">
            Alertas operativas automaticas: se ejecuta <code>ops:operational-alerts-email</code> diariamente. Si no configuras destinatarios
            especificos, se envian a admins o a los emails del reporte semanal.
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleSendOperationalNow()}
              disabled={loading || sendingOperational}
              className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingOperational ? 'Enviando...' : 'Enviar alerta operativa ahora'}
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-black tracking-tight text-zinc-900">Ultima ejecucion de alertas operativas</div>
            <p className="mt-1 text-sm text-zinc-500">Historial rapido para verificar funcionamiento sin revisar logs.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={statusMeta.className}>{statusMeta.label}</span>
            <button
              type="button"
              onClick={() => void handleClearHistory()}
              disabled={clearingHistory}
              className="btn-ghost !h-8 !rounded-xl px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {clearingHistory ? 'Limpiando...' : 'Limpiar'}
            </button>
          </div>
        </div>
        <div className="card-body grid gap-3 text-sm md:grid-cols-2">
          <div className="space-y-1 text-zinc-700">
            <div><span className="font-bold">Fecha:</span> {lastRunAt || '—'}</div>
            <div><span className="font-bold">Pedidos alertados:</span> {Number(lastSummary.orders ?? 0) || 0}</div>
          </div>
          <div className="space-y-1 text-zinc-700">
            <div><span className="font-bold">Destinatarios:</span> {lastRecipients || '—'}</div>
            <div><span className="font-bold">Reparaciones alertadas:</span> {Number(lastSummary.repairs ?? 0) || 0}</div>
          </div>
        </div>
        {lastError ? (
          <div className="mx-5 mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            Ultimo error: {lastError}
          </div>
        ) : null}
      </section>
    </div>
  );
}
