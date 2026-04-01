import { Link } from 'react-router-dom';
import type { WhatsappLogItem } from './whatsappApi';
import {
  cleanWhatsappDisplayText,
  whatsappAttemptLabel,
  whatsappProviderStatusLabel,
  whatsappStatusClassName,
  whatsappStatusLabel,
} from './whatsapp-ui';
import {
  getOrderWhatsappTemplateRows,
  ORDER_WHATSAPP_TEMPLATE_ORDER,
  ORDER_WHATSAPP_VARIABLES,
} from './admin-whatsapp-orders.helpers';

export function AdminWhatsappOrdersHero() {
  return (
    <section className="store-hero">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Plantillas WhatsApp - Pedidos</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Edita mensajes por estado. Si dejas vacio, se usa el texto predeterminado.
          </p>
        </div>
        <Link to="/admin/configuraciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
          Volver a configuracion
        </Link>
      </div>
    </section>
  );
}

export function AdminWhatsappOrdersFeedback({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  return (
    <>
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {success}
        </div>
      ) : null}
    </>
  );
}

export function AdminWhatsappOrdersVariablesSection() {
  return (
    <section className="card overflow-hidden">
      <div className="card-body !p-0">
        <div className="border-b border-zinc-100 px-4 py-4 md:px-5">
          <h2 className="text-xl font-black tracking-tight text-zinc-900">Variables disponibles</h2>
          <p className="mt-1 text-sm text-zinc-600">Podes combinarlas como quieras en cada plantilla.</p>
        </div>

        <div className="grid gap-3 px-4 py-4 md:grid-cols-2 md:px-5 xl:grid-cols-3">
          {ORDER_WHATSAPP_VARIABLES.map((variable) => (
            <div key={variable.key} className="rounded-2xl border border-zinc-200 bg-white px-3 py-3">
              <div className="font-mono text-sm font-bold text-zinc-900">{variable.key}</div>
              <div className="mt-1 text-sm text-zinc-600">{variable.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminWhatsappOrdersTemplatesSection({
  loading,
  saving,
  templates,
  onChange,
}: {
  loading: boolean;
  saving: boolean;
  templates: Record<string, string>;
  onChange: (templateKey: string, body: string) => void;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {loading ? (
        <div className="card xl:col-span-2">
          <div className="card-body p-4 text-sm text-zinc-600">Cargando plantillas...</div>
        </div>
      ) : (
        ORDER_WHATSAPP_TEMPLATE_ORDER.map((template) => (
          <section key={template.key} className="card overflow-hidden">
            <div className="card-body !p-0">
              <div className="border-b border-zinc-100 px-4 py-4">
                <h3 className="text-xl font-black tracking-tight text-zinc-900">{template.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{template.key}</p>
              </div>
              <div className="px-4 py-4">
                <textarea
                  rows={getOrderWhatsappTemplateRows(template.key)}
                  value={templates[template.key] ?? ''}
                  onChange={(event) => onChange(template.key, event.target.value)}
                  disabled={loading || saving}
                  className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm"
                />
              </div>
            </div>
          </section>
        ))
      )}
    </section>
  );
}

export function AdminWhatsappOrdersActions({
  loading,
  saving,
  onReset,
  onSave,
}: {
  loading: boolean;
  saving: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <button
        type="button"
        onClick={onReset}
        disabled={loading || saving}
        className="btn-outline !h-11 !rounded-xl px-5 text-sm font-bold"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={loading || saving}
        className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold disabled:opacity-60"
      >
        {saving ? 'Guardando...' : 'Guardar plantillas'}
      </button>
    </div>
  );
}

export function AdminWhatsappOrdersLogsSection({
  logsLoading,
  logs,
  onRefresh,
}: {
  logsLoading: boolean;
  logs: WhatsappLogItem[];
  onRefresh: () => void;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="card-body !p-0">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-4 md:px-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-zinc-900">Logs recientes (pedidos)</h2>
            <p className="mt-1 text-sm text-zinc-600">Mensajes generados automaticamente al cambiar estados.</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold"
          >
            Actualizar
          </button>
        </div>
        <div className="space-y-3 px-4 py-4 md:px-5">
          {logsLoading ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-600">
              Cargando logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-600">
              Sin logs todavia.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-zinc-900">
                      {cleanWhatsappDisplayText(log.templateKey) || 'manual'}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {log.targetType || 'order'} · {log.targetId || '-'} ·{' '}
                      {new Date(log.createdAt).toLocaleString('es-AR')}
                    </div>
                  </div>
                  <span className={whatsappStatusClassName(log.status)}>{whatsappStatusLabel(log.status)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span>{whatsappAttemptLabel(log)}</span>
                  {whatsappProviderStatusLabel(log) ? <span>{whatsappProviderStatusLabel(log)}</span> : null}
                  {log.remoteMessageId ? <span>ID remoto: {log.remoteMessageId}</span> : null}
                  {log.phone ? <span>Destino: {log.phone}</span> : null}
                </div>
                {log.errorMessage ? (
                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                    {log.errorMessage}
                  </div>
                ) : null}
                {log.message ? (
                  <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-700">
                    {log.message}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
