import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  DAY_OPTIONS,
  RANGE_OPTIONS,
  type OperationalAlertsSummary,
  type ReportForm,
  type ReportStatusMeta,
} from './admin-auto-reports.helpers';

type AdminAutoReportsFeedbackProps = {
  error: string;
  success: string;
};

type AdminAutoReportsSettingsSectionProps = {
  form: ReportForm;
  loading: boolean;
  saving: boolean;
  hasChanges: boolean;
  sendingWeekly: boolean;
  sendingOperational: boolean;
  onChange: <K extends keyof ReportForm>(field: K, value: ReportForm[K]) => void;
  onSave: () => void;
  onSendWeeklyNow: () => void;
  onSendOperationalNow: () => void;
};

type AdminAutoReportsHistorySectionProps = {
  statusMeta: ReportStatusMeta;
  lastRunAt: string;
  lastRecipients: string;
  lastSummary: OperationalAlertsSummary;
  lastError: string;
  clearingHistory: boolean;
  onClearHistory: () => void;
};

export function AdminAutoReportsHeader() {
  return (
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
  );
}

export function AdminAutoReportsFeedback({ error, success }: AdminAutoReportsFeedbackProps) {
  return (
    <>
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}
    </>
  );
}

export function AdminAutoReportsSettingsSection({
  form,
  loading,
  saving,
  hasChanges,
  sendingWeekly,
  sendingOperational,
  onChange,
  onSave,
  onSendWeeklyNow,
  onSendOperationalNow,
}: AdminAutoReportsSettingsSectionProps) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-black tracking-tight text-zinc-900">Reportes semanales</div>
          <p className="mt-1 text-sm text-zinc-500">Define destinatarios y frecuencia para el envio automatico de resumenes.</p>
        </div>
        <span className="inline-flex h-7 items-center rounded-full border border-sky-200 bg-sky-50 px-3 text-sm font-black text-sky-700">
          Email
        </span>
      </div>
      <div className="card-body space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-zinc-900">Emails destinatarios (separados por coma)</label>
          <textarea
            value={form.weeklyEmails}
            onChange={(event) => onChange('weeklyEmails', event.target.value)}
            rows={3}
            disabled={loading}
            className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm disabled:bg-zinc-50"
          />
          <p className="mt-2 text-sm text-zinc-500">Si queda vacio, no se enviara ningun reporte automatico.</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">Dia de envio</label>
            <CustomSelect
              value={form.sendDay}
              onChange={(value) => onChange('sendDay', value)}
              disabled={loading}
              options={[...DAY_OPTIONS]}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar dia de envio"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">Hora de envio</label>
            <input
              type="time"
              value={form.sendHour}
              onChange={(event) => onChange('sendHour', event.target.value)}
              disabled={loading}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm disabled:bg-zinc-50"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">Rango del reporte</label>
            <CustomSelect
              value={form.reportRange}
              onChange={(value) => onChange('reportRange', value as ReportForm['reportRange'])}
              disabled={loading}
              options={[...RANGE_OPTIONS]}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar rango del reporte"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 md:p-4">
          <div className="text-xl font-black tracking-tight text-zinc-900">Alertas operativas automaticas</div>
          <p className="mt-1 text-sm text-zinc-600">Correo diario con pedidos y reparaciones demoradas (anti-spam incluido).</p>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">Emails para alertas operativas (opcional)</label>
              <textarea
                value={form.alertsEmails}
                onChange={(event) => onChange('alertsEmails', event.target.value)}
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
                onChange={(event) => onChange('antiSpamWindow', event.target.value)}
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
            onClick={onSave}
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
            onClick={onSendWeeklyNow}
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
            onClick={onSendOperationalNow}
            disabled={loading || sendingOperational}
            className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sendingOperational ? 'Enviando...' : 'Enviar alerta operativa ahora'}
          </button>
        </div>
      </div>
    </section>
  );
}

export function AdminAutoReportsHistorySection({
  statusMeta,
  lastRunAt,
  lastRecipients,
  lastSummary,
  lastError,
  clearingHistory,
  onClearHistory,
}: AdminAutoReportsHistorySectionProps) {
  return (
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
            onClick={onClearHistory}
            disabled={clearingHistory}
            className="btn-ghost !h-8 !rounded-xl px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {clearingHistory ? 'Limpiando...' : 'Limpiar'}
          </button>
        </div>
      </div>
      <div className="card-body grid gap-3 text-sm md:grid-cols-2">
        <div className="space-y-1 text-zinc-700">
          <div>
            <span className="font-bold">Fecha:</span> {lastRunAt || '-'}
          </div>
          <div>
            <span className="font-bold">Pedidos alertados:</span> {lastSummary.orders}
          </div>
        </div>
        <div className="space-y-1 text-zinc-700">
          <div>
            <span className="font-bold">Destinatarios:</span> {lastRecipients || '-'}
          </div>
          <div>
            <span className="font-bold">Reparaciones alertadas:</span> {lastSummary.repairs}
          </div>
        </div>
      </div>
      {lastError ? (
        <div className="mx-5 mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">Ultimo error: {lastError}</div>
      ) : null}
    </section>
  );
}
