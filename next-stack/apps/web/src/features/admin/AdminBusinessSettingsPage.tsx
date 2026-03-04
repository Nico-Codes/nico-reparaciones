import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminSettingsApi, type AdminSettingItem } from './settingsApi';

type BusinessForm = {
  shopWhatsapp: string;
  shopAddress: string;
  shopHours: string;
  ticketPaper: string;
  orderDelayHours: string;
  repairDelayDays: string;
  storeHeroTitle: string;
  storeHeroText: string;
};

const DEFAULT_FORM: BusinessForm = {
  shopWhatsapp: '',
  shopAddress: '',
  shopHours: '',
  ticketPaper: '80',
  orderDelayHours: '24',
  repairDelayDays: '3',
  storeHeroTitle: '',
  storeHeroText: '',
};

function settingValue(map: Map<string, AdminSettingItem>, key: string, fallback = '') {
  return map.get(key)?.value ?? fallback;
}

export function AdminBusinessSettingsPage() {
  const [form, setForm] = useState<BusinessForm>(DEFAULT_FORM);
  const [initialForm, setInitialForm] = useState<BusinessForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await adminSettingsApi.list();
      const map = new Map<string, AdminSettingItem>(res.items.map((i) => [i.key, i]));
      const next: BusinessForm = {
        shopWhatsapp: settingValue(map, 'shop_phone', ''),
        shopAddress: settingValue(map, 'shop_address', ''),
        shopHours: settingValue(map, 'shop_hours', ''),
        ticketPaper: settingValue(map, 'ticket_paper_default', '80'),
        orderDelayHours: settingValue(map, 'ops_alert_order_stale_hours', '24'),
        repairDelayDays: settingValue(map, 'ops_alert_repair_stale_days', '3'),
        storeHeroTitle: settingValue(map, 'store_hero_title', ''),
        storeHeroText: settingValue(map, 'store_hero_subtitle', ''),
      };
      setForm(next);
      setInitialForm(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos de negocio');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminSettingsApi.save([
        { key: 'shop_phone', value: form.shopWhatsapp, group: 'business', label: 'Teléfono WhatsApp', type: 'text' },
        { key: 'shop_address', value: form.shopAddress, group: 'business', label: 'Dirección del local', type: 'textarea' },
        { key: 'shop_hours', value: form.shopHours, group: 'business', label: 'Horarios del local', type: 'textarea' },
        { key: 'ticket_paper_default', value: form.ticketPaper, group: 'business', label: 'Papel ticket por defecto', type: 'text' },
        { key: 'ops_alert_order_stale_hours', value: form.orderDelayHours, group: 'ops_reports', label: 'Pedido demorado (horas)', type: 'number' },
        { key: 'ops_alert_repair_stale_days', value: form.repairDelayDays, group: 'ops_reports', label: 'Reparación demorada (días)', type: 'number' },
        { key: 'store_hero_title', value: form.storeHeroTitle, group: 'branding', label: 'Título portada tienda', type: 'text' },
        { key: 'store_hero_subtitle', value: form.storeHeroText, group: 'branding', label: 'Texto portada tienda', type: 'textarea' },
      ]);
      setInitialForm(form);
      setSuccess('Datos guardados.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando datos de negocio');
    } finally {
      setSaving(false);
    }
  }

  function cancelChanges() {
    setForm(initialForm);
    setError('');
    setSuccess('');
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Datos del negocio</h1>
            <p className="mt-1 text-sm text-zinc-600">Información base usada en mensajes y comprobantes.</p>
          </div>
          <Link to="/admin/configuraciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver a configuración
          </Link>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</div> : null}

      <section className="card">
        <div className="card-body space-y-4 p-4 md:p-5">
          <Field label='WhatsApp del local (opcional)' hint='Se usa para el botón "Escribir por WhatsApp".'>
            <input
              value={form.shopWhatsapp}
              onChange={(e) => setForm((prev) => ({ ...prev, shopWhatsapp: e.target.value }))}
              placeholder="Ej: +54 341 5550000"
              disabled={loading}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </Field>

          <Field label="Dirección del local (opcional)" hint="Placeholder: {shop_address}">
            <textarea
              value={form.shopAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, shopAddress: e.target.value }))}
              rows={3}
              placeholder="Ej: Av. San Martín 123"
              disabled={loading}
              className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm"
            />
          </Field>

          <Field label="Horarios (opcional)" hint="Placeholder: {shop_hours}">
            <textarea
              value={form.shopHours}
              onChange={(e) => setForm((prev) => ({ ...prev, shopHours: e.target.value }))}
              rows={3}
              placeholder="Ej: Lun a Vie 9-13 / 16-20"
              disabled={loading}
              className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm"
            />
          </Field>

          <Field label="Papel ticket por defecto" hint='Se usa en "Confirmar e imprimir" y en reimpresión de ventas rápidas.'>
            <select
              value={form.ticketPaper}
              onChange={(e) => setForm((prev) => ({ ...prev, ticketPaper: e.target.value }))}
              disabled={loading}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            >
              <option value="80">80 mm</option>
              <option value="58">58 mm</option>
              <option value="a4">A4</option>
            </select>
          </Field>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xl font-black tracking-tight text-zinc-900">Alertas operativas (dashboard)</div>
            <p className="mt-1 text-sm text-zinc-600">Define cuándo un pedido o reparación se considera demorado.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-900">Pedido demorado (horas)</label>
                <input
                  type="number"
                  min={0}
                  value={form.orderDelayHours}
                  onChange={(e) => setForm((prev) => ({ ...prev, orderDelayHours: e.target.value }))}
                  disabled={loading}
                  className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                />
                <p className="mt-2 text-sm text-zinc-500">Estados: pendiente, confirmado, preparando.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-900">Reparación demorada (días)</label>
                <input
                  type="number"
                  min={0}
                  value={form.repairDelayDays}
                  onChange={(e) => setForm((prev) => ({ ...prev, repairDelayDays: e.target.value }))}
                  disabled={loading}
                  className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                />
                <p className="mt-2 text-sm text-zinc-500">Estados: recibido, diagnosticando, esperando aprobación, reparando.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
            Portada de tienda: la imagen se cambia desde <span className="font-black">Configuración &gt; Identidad visual &gt; Fondo portada tienda</span>.
          </div>

          <Field label="Título portada tienda (opcional)">
            <input
              value={form.storeHeroTitle}
              onChange={(e) => setForm((prev) => ({ ...prev, storeHeroTitle: e.target.value }))}
              placeholder="Ej: Novedades de la semana"
              disabled={loading}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </Field>

          <Field label="Texto portada tienda (opcional)">
            <textarea
              value={form.storeHeroText}
              onChange={(e) => setForm((prev) => ({ ...prev, storeHeroText: e.target.value }))}
              rows={3}
              placeholder="Ej: Ingresaron nuevos módulos, cables y accesorios."
              disabled={loading}
              className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm"
            />
          </Field>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <button type="button" onClick={cancelChanges} disabled={loading || saving} className="btn-outline !h-11 !rounded-xl px-5 text-sm font-bold">
              Cancelar
            </button>
            <button type="button" onClick={() => void save()} disabled={loading || saving} className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-900">{label}</label>
      {children}
      {hint ? <p className="mt-2 text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}
