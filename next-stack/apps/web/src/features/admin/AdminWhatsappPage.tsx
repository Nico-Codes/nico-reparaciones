import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { whatsappApi, type WhatsappLogItem } from './whatsappApi';

type VariableInfo = {
  key: string;
  description: string;
};

type RepairTemplateDef = {
  title: string;
  key: string;
};

const WHATSAPP_VARIABLES: VariableInfo[] = [
  { key: '{customer_name}', description: 'Nombre del cliente' },
  { key: '{code}', description: 'Código de reparación' },
  { key: '{status}', description: 'Clave del estado (ej: ready_pickup)' },
  { key: '{status_label}', description: 'Nombre lindo del estado (ej: Listo para retirar)' },
  { key: '{lookup_url}', description: 'Link a la página /reparacion' },
  { key: '{phone}', description: 'Teléfono del cliente' },
  { key: '{device_brand}', description: 'Marca del equipo' },
  { key: '{device_model}', description: 'Modelo del equipo' },
  { key: '{device}', description: 'Marca + Modelo' },
  { key: '{final_price}', description: 'Precio final (si existe)' },
  { key: '{warranty_days}', description: 'Garantía en días' },
  { key: '{approval_url}', description: 'Link firmado para que el cliente apruebe/rechace presupuesto' },
  { key: '{shop_address}', description: 'Dirección del local (Admin > Configuración)' },
  { key: '{shop_hours}', description: 'Horarios (Admin > Configuracion)' },
];

const TEMPLATE_ORDER: RepairTemplateDef[] = [
  { key: 'received', title: 'Recibido' },
  { key: 'diagnosing', title: 'Diagnosticando' },
  { key: 'waiting_approval', title: 'Esperando aprobación' },
  { key: 'repairing', title: 'En reparación' },
  { key: 'ready_pickup', title: 'Listo para retirar' },
  { key: 'delivered', title: 'Entregado' },
  { key: 'cancelled', title: 'Cancelado' },
];

function defaultTemplateBody(templateKey: string) {
  if (templateKey === 'waiting_approval') {
    return [
      'Hola {customer_name} 👋',
      'Tu reparación ({code}) está en estado: *{status_label}*.',
      'Necesitamos tu aprobación para continuar.',
      'Aprobá o rechazá acá: {approval_url}',
      '',
      'Podés consultar el estado en: {lookup_url}',
      'Código: {code}',
      'Equipo: {device}',
      'NicoReparaciones',
    ].join('\n');
  }

  if (templateKey === 'ready_pickup') {
    return [
      'Hola {customer_name} 👋',
      'Tu reparación ({code}) está en estado: *{status_label}*.',
      '¡Ya está lista para retirar! ✅',
      '',
      '📍 Dirección: {shop_address}',
      '🕒 Horarios: {shop_hours}',
      '',
      'Podés consultar el estado en: {lookup_url}',
      'Código: {code}',
      'Equipo: {device}',
      'NicoReparaciones',
    ].join('\n');
  }

  if (templateKey === 'delivered') {
    return [
      'Hola {customer_name} 👋',
      'Tu reparación ({code}) está en estado: *{status_label}*.',
      '¡Gracias por tu visita! 🙌',
      '',
      'Podés consultar el estado en: {lookup_url}',
      'Código: {code}',
      'Equipo: {device}',
      'NicoReparaciones',
    ].join('\n');
  }

  return [
    'Hola {customer_name} 👋',
    'Tu reparación ({code}) está en estado: *{status_label}*.',
    '',
    'Podés consultar el estado en: {lookup_url}',
    'Código: {code}',
    'Equipo: {device}',
    'NicoReparaciones',
  ].join('\n');
}

export function AdminWhatsappPage() {
  const [templates, setTemplates] = useState<Record<string, string>>(
    Object.fromEntries(TEMPLATE_ORDER.map((t) => [t.key, defaultTemplateBody(t.key)])),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState<WhatsappLogItem[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const initialTemplates = useMemo(
    () => Object.fromEntries(TEMPLATE_ORDER.map((t) => [t.key, defaultTemplateBody(t.key)])) as Record<string, string>,
    [],
  );

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await whatsappApi.templates({ channel: 'repairs' });
      const byTemplateKey = new Map(res.items.map((item) => [item.templateKey, item.body]));
      setTemplates(
        Object.fromEntries(
          TEMPLATE_ORDER.map((t) => [t.key, byTemplateKey.get(t.key) ?? defaultTemplateBody(t.key)]),
        ) as Record<string, string>,
      );
      await loadLogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando WhatsApp');
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const res = await whatsappApi.logs({ channel: 'repairs' });
      setLogs(res.items.slice(0, 12));
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  async function saveTemplates() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await whatsappApi.saveTemplates({
        channel: 'repairs',
        items: TEMPLATE_ORDER.map((t) => ({
          templateKey: t.key,
          body: templates[t.key] ?? '',
          enabled: true,
        })),
      });
      setSuccess('Plantillas guardadas');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando plantillas');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Plantillas WhatsApp</h1>
            <p className="mt-1 text-sm text-zinc-600">Edita mensajes por estado. Si dejas vacío, se usa el texto predeterminado.</p>
          </div>
          <Link to="/admin/configuraciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver a configuración
          </Link>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</div> : null}

      <section className="card overflow-hidden">
        <div className="card-body !p-0">
          <div className="border-b border-zinc-100 px-4 py-4 md:px-5">
            <h2 className="text-xl font-black tracking-tight text-zinc-900">Variables disponibles</h2>
            <p className="mt-1 text-sm text-zinc-600">Puedes combinarlas como quieras en cada plantilla.</p>
          </div>

          <div className="grid gap-3 px-4 py-4 md:grid-cols-2 md:px-5 xl:grid-cols-3">
            {WHATSAPP_VARIABLES.map((v) => (
              <div key={v.key} className="rounded-2xl border border-zinc-200 bg-white px-3 py-3">
                <div className="font-mono text-sm font-bold text-zinc-900">{v.key}</div>
                <div className="mt-1 text-sm text-zinc-600">{v.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {loading ? (
          <div className="card xl:col-span-2">
            <div className="card-body p-4 text-sm text-zinc-600">Cargando plantillas...</div>
          </div>
        ) : (
          TEMPLATE_ORDER.map((t) => (
            <section key={t.key} className="card overflow-hidden">
              <div className="card-body !p-0">
                <div className="border-b border-zinc-100 px-4 py-4">
                  <h3 className="text-xl font-black tracking-tight text-zinc-900">{t.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{t.key}</p>
                </div>
                <div className="px-4 py-4">
                  <textarea
                    rows={t.key === 'waiting_approval' || t.key === 'ready_pickup' ? 8 : 6}
                    value={templates[t.key] ?? ''}
                    onChange={(e) => setTemplates((prev) => ({ ...prev, [t.key]: e.target.value }))}
                    disabled={loading || saving}
                    className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm"
                  />
                </div>
              </div>
            </section>
          ))
        )}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setTemplates(initialTemplates)}
          disabled={loading || saving}
          className="btn-outline !h-11 !rounded-xl px-5 text-sm font-bold"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void saveTemplates()}
          disabled={saving || loading}
          className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold"
        >
          {saving ? 'Guardando...' : 'Guardar plantillas'}
        </button>
      </div>

      <section className="card overflow-hidden">
        <div className="card-body !p-0">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-4 md:px-5">
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-900">Logs recientes (reparaciones)</h2>
              <p className="mt-1 text-sm text-zinc-600">Mensajes generados automáticamente al cambiar estados.</p>
            </div>
            <button type="button" onClick={() => void loadLogs()} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
              Actualizar
            </button>
          </div>
          <div className="space-y-3 px-4 py-4 md:px-5">
            {logsLoading ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-600">Cargando logs...</div>
            ) : logs.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-600">Sin logs todavía.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-zinc-900">{log.templateKey || 'manual'}</div>
                      <div className="text-xs text-zinc-500">
                        {log.targetType || 'repair'} · {log.targetId || '-'} · {new Date(log.createdAt).toLocaleString('es-AR')}
                      </div>
                    </div>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-bold text-zinc-700">{log.status}</span>
                  </div>
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
    </div>
  );
}
