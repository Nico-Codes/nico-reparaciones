import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { whatsappApi, type WhatsappLogItem } from './whatsappApi';

type VariableInfo = {
  key: string;
  description: string;
};

type OrderTemplateDef = {
  title: string;
  key: string;
};

const ORDER_VARIABLES: VariableInfo[] = [
  { key: '{customer_name}', description: 'Nombre del cliente' },
  { key: '{order_id}', description: 'ID del pedido' },
  { key: '{status}', description: 'Clave del estado (ej: preparando)' },
  { key: '{status_label}', description: 'Nombre lindo del estado (ej: Preparando)' },
  { key: '{total}', description: 'Total del pedido formateado' },
  { key: '{total_raw}', description: 'Total numérico sin formato' },
  { key: '{items_count}', description: 'Cantidad de ítems' },
  { key: '{items_summary}', description: 'Listado simple de ítems (líneas)' },
  { key: '{pickup_name}', description: 'Nombre de retiro' },
  { key: '{pickup_phone}', description: 'Teléfono de retiro' },
  { key: '{phone}', description: 'Teléfono (alias de pickup_phone)' },
  { key: '{notes}', description: 'Notas del cliente' },
  { key: '{my_orders_url}', description: 'Link a /mis-pedidos' },
  { key: '{store_url}', description: 'Link a /tienda' },
  { key: '{shop_address}', description: 'Dirección del local (Admin > Configuración)' },
  { key: '{shop_hours}', description: 'Horarios (Admin > Configuración)' },
  { key: '{shop_phone}', description: 'Teléfono del local' },
  { key: '{shop_name}', description: 'Nombre del negocio' },
];

const ORDER_TEMPLATES: OrderTemplateDef[] = [
  { title: 'Pendiente', key: 'pendiente' },
  { title: 'Confirmado', key: 'confirmado' },
  { title: 'Preparando', key: 'preparando' },
  { title: 'Listo para retirar', key: 'listo_retirar' },
  { title: 'Entregado', key: 'entregado' },
  { title: 'Cancelado', key: 'cancelado' },
];

function baseOrderBody(statusKey: string) {
  const common = [
    'Hola {customer_name} 👋',
    'Tu pedido *#{order_id}* está en estado: *{status_label}*.',
    'Total: {total}',
    'Ítems: {items_count}',
    '',
    '{items_summary}',
    '',
    'Ver tus pedidos: {my_orders_url}',
    'Tienda: {store_url}',
  ];

  if (statusKey === 'listo_retirar') {
    common.push('', '📍 Dirección: {shop_address}', '🕒 Horarios: {shop_hours}', '📞 Teléfono: {shop_phone}');
  }

  if (statusKey === 'entregado') {
    common.push('', '¡Gracias por tu compra! 🙌');
  }

  if (statusKey === 'cancelado') {
    common.push('', 'Si querés, lo revisamos por WhatsApp.');
  }

  return common.join('\n');
}

export function AdminWhatsappOrdersPage() {
  const initialTemplates = useMemo(
    () =>
      Object.fromEntries(
        ORDER_TEMPLATES.map((t) => [t.key, baseOrderBody(t.key)]),
      ) as Record<string, string>,
    [],
  );

  const [templates, setTemplates] = useState<Record<string, string>>(initialTemplates);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState<WhatsappLogItem[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await whatsappApi.templates({ channel: 'orders' });
      const byTemplateKey = new Map(res.items.map((item) => [item.templateKey, item.body]));
      setTemplates(
        Object.fromEntries(
          ORDER_TEMPLATES.map((t) => [
            t.key,
            byTemplateKey.get(t.key) ?? baseOrderBody(t.key),
          ]),
        ) as Record<string, string>,
      );
      await loadLogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando plantillas');
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const res = await whatsappApi.logs({ channel: 'orders' });
      setLogs(res.items.slice(0, 12));
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await whatsappApi.saveTemplates({
        channel: 'orders',
        items: ORDER_TEMPLATES.map((t) => ({
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
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Plantillas WhatsApp - Pedidos</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Edita mensajes por estado. Si dejas vacío, se usa el texto predeterminado.
            </p>
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
            {ORDER_VARIABLES.map((v) => (
              <div key={v.key} className="rounded-2xl border border-zinc-200 bg-white px-3 py-3">
                <div className="font-mono text-sm font-bold text-zinc-900">{v.key}</div>
                <div className="mt-1 text-sm text-zinc-600">{v.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {ORDER_TEMPLATES.map((t) => (
          <section key={t.key} className="card overflow-hidden">
            <div className="card-body !p-0">
              <div className="border-b border-zinc-100 px-4 py-4">
                <h3 className="text-xl font-black tracking-tight text-zinc-900">{t.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{t.key}</p>
              </div>
              <div className="px-4 py-4">
                <textarea
                  rows={8}
                  value={templates[t.key] ?? ''}
                  onChange={(e) => setTemplates((prev) => ({ ...prev, [t.key]: e.target.value }))}
                  disabled={loading || saving}
                  className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm"
                />
              </div>
            </div>
          </section>
        ))}
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
          onClick={() => void save()}
          disabled={loading || saving}
          className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar plantillas'}
        </button>
      </div>

      <section className="card overflow-hidden">
        <div className="card-body !p-0">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-4 md:px-5">
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-900">Logs recientes (pedidos)</h2>
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
                        {log.targetType || 'order'} · {log.targetId || '-'} · {new Date(log.createdAt).toLocaleString('es-AR')}
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
