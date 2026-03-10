import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, Clock3, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { CustomSelect } from '@/components/ui/custom-select';
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

const ticketPaperOptions = [
  { value: '80', label: '80 mm' },
  { value: '58', label: '58 mm' },
  { value: 'a4', label: 'A4' },
];

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

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await adminSettingsApi.list();
      const map = new Map<string, AdminSettingItem>(response.items.map((item) => [item.key, item]));
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los datos del negocio.');
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
      setSuccess('Los datos del negocio se guardaron correctamente.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  function cancelChanges() {
    setForm(initialForm);
    setError('');
    setSuccess('');
  }

  if (loading) {
    return (
      <PageShell context="admin" className="space-y-6">
        <PageHeader
          context="admin"
          eyebrow="Configuración"
          title="Datos del negocio"
          subtitle="Cargando los ajustes base que usa el sistema en mensajes, comprobantes y vistas públicas."
          actions={<StatusBadge tone="info" label="Cargando" />}
        />
        <SectionCard>
          <LoadingBlock label="Cargando datos del negocio" lines={4} />
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Configuración"
        title="Datos del negocio"
        subtitle="Información general reutilizada en mensajes, comprobantes, alertas y portada de la tienda."
        actions={(
          <>
            <StatusBadge tone={isDirty ? 'warning' : 'success'} label={isDirty ? 'Cambios pendientes' : 'Sin cambios pendientes'} />
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/configuraciones">Volver a configuración</Link>
            </Button>
          </>
        )}
      />

      {error ? (
        <div className="ui-alert ui-alert--danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo guardar la configuración.</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="ui-alert ui-alert--success">
          <Building2 className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Configuración actualizada.</span>
            <div className="ui-alert__text">{success}</div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.9fr)]">
        <div className="space-y-6">
          <SectionCard
            title="Contacto y atención"
            description="Datos visibles para clientes y placeholders reutilizados por templates de mensajes."
            actions={<StatusBadge tone="info" size="sm" label="Canal público" />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="WhatsApp del local"
                hint='Se usa en el botón "Escribir por WhatsApp".'
                value={form.shopWhatsapp}
                onChange={(event) => setForm((current) => ({ ...current, shopWhatsapp: event.target.value }))}
                placeholder="Ej: +54 341 5550000"
              />
              <div className="ui-field min-w-0">
                <span className="ui-field__label">Papel ticket por defecto</span>
                <CustomSelect
                  value={form.ticketPaper}
                  onChange={(value) => setForm((current) => ({ ...current, ticketPaper: value }))}
                  options={ticketPaperOptions}
                  triggerClassName="min-h-11 rounded-[1rem]"
                  ariaLabel="Seleccionar papel ticket por defecto"
                />
                <span className="ui-field__hint">Se usa al confirmar e imprimir tickets o comprobantes.</span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <TextAreaField
                label="Dirección del local"
                hint="Placeholder disponible: {shop_address}"
                value={form.shopAddress}
                onChange={(event) => setForm((current) => ({ ...current, shopAddress: event.target.value }))}
                rows={4}
                placeholder="Ej: Av. San Martín 123"
              />
              <TextAreaField
                label="Horarios de atención"
                hint="Placeholder disponible: {shop_hours}"
                value={form.shopHours}
                onChange={(event) => setForm((current) => ({ ...current, shopHours: event.target.value }))}
                rows={4}
                placeholder="Ej: Lun a Vie 9-13 / 16-20"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Alertas operativas"
            description="Definí cuándo un pedido o una reparación deben aparecer como demorados en el dashboard."
            actions={<StatusBadge tone="accent" size="sm" label="Operación interna" />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                type="number"
                min={0}
                label="Pedido demorado (horas)"
                hint="Aplica a pedidos pendientes, confirmados o preparando."
                value={form.orderDelayHours}
                onChange={(event) => setForm((current) => ({ ...current, orderDelayHours: event.target.value }))}
              />
              <TextField
                type="number"
                min={0}
                label="Reparación demorada (días)"
                hint="Aplica a recibido, diagnosticando, esperando aprobación y reparando."
                value={form.repairDelayDays}
                onChange={(event) => setForm((current) => ({ ...current, repairDelayDays: event.target.value }))}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Portada de tienda"
            description="Definí el texto principal del hero público. La imagen visual se administra por separado desde identidad visual."
            actions={<StatusBadge tone="neutral" size="sm" label="Branding" />}
          >
            <div className="ui-alert ui-alert--info mb-4">
              <Store className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <span className="ui-alert__title">Imagen de portada</span>
                <div className="ui-alert__text">La imagen del hero se gestiona desde Configuración &gt; Identidad visual &gt; Fondo portada tienda.</div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <TextField
                label="Título de portada"
                value={form.storeHeroTitle}
                onChange={(event) => setForm((current) => ({ ...current, storeHeroTitle: event.target.value }))}
                placeholder="Ej: Novedades de la semana"
              />
              <TextAreaField
                label="Texto de portada"
                value={form.storeHeroText}
                onChange={(event) => setForm((current) => ({ ...current, storeHeroText: event.target.value }))}
                rows={4}
                placeholder="Ej: Ingresaron nuevos módulos, cables y accesorios."
              />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            tone="muted"
            title="Resumen rápido"
            description="Referencia de uso para soporte, mensajes y vistas públicas del sistema."
            actions={<Clock3 className="h-4 w-4 text-zinc-500" />}
          >
            <div className="fact-list">
              <div className="fact-row">
                <span className="fact-label">WhatsApp</span>
                <span className="fact-value fact-value--text">{form.shopWhatsapp || 'No configurado'}</span>
              </div>
              <div className="fact-row">
                <span className="fact-label">Dirección</span>
                <span className="fact-value fact-value--text">{form.shopAddress || 'No configurada'}</span>
              </div>
              <div className="fact-row">
                <span className="fact-label">Horarios</span>
                <span className="fact-value fact-value--text">{form.shopHours || 'No configurados'}</span>
              </div>
              <div className="fact-row">
                <span className="fact-label">Ticket</span>
                <span className="fact-value">{form.ticketPaper.toUpperCase()}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            tone="info"
            title="Publicación"
            description="Estado del contenido principal que impacta en la tienda y en la comunicación con clientes."
          >
            <div className="choice-grid">
              <div className={`choice-card ${form.storeHeroTitle.trim() ? 'is-active' : ''}`}>
                <div>
                  <div className="choice-card__title">Hero con título</div>
                  <div className="choice-card__hint">{form.storeHeroTitle.trim() ? 'Se mostrará el encabezado personalizado.' : 'Si queda vacío, se usa el valor por defecto.'}</div>
                </div>
              </div>
              <div className={`choice-card ${form.storeHeroText.trim() ? 'is-active' : ''}`}>
                <div>
                  <div className="choice-card__title">Hero con texto auxiliar</div>
                  <div className="choice-card__hint">{form.storeHeroText.trim() ? 'La portada mostrará un mensaje secundario propio.' : 'Si queda vacío, se usa el texto estándar.'}</div>
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={cancelChanges} disabled={!isDirty || saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving || !isDirty}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
