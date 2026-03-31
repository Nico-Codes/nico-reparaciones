import { AlertTriangle, Building2, Clock3, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  TICKET_PAPER_OPTIONS,
  type BusinessForm,
} from './admin-business-settings.helpers';

type AdminBusinessSettingsFeedbackProps = {
  error: string;
  success: string;
};

type AdminBusinessSettingsMainProps = {
  form: BusinessForm;
  onChange: <K extends keyof BusinessForm>(field: K, value: BusinessForm[K]) => void;
};

type AdminBusinessSettingsSidebarProps = {
  form: BusinessForm;
};

type AdminBusinessSettingsActionsProps = {
  isDirty: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export function AdminBusinessSettingsFeedback({
  error,
  success,
}: AdminBusinessSettingsFeedbackProps) {
  return (
    <>
      {error ? (
        <div className="ui-alert ui-alert--danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo guardar la configuracion.</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="ui-alert ui-alert--success">
          <Building2 className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Configuracion actualizada.</span>
            <div className="ui-alert__text">{success}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AdminBusinessSettingsMain({
  form,
  onChange,
}: AdminBusinessSettingsMainProps) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Contacto y atencion"
        description="Datos visibles para clientes y placeholders reutilizados por templates de mensajes."
        actions={<StatusBadge tone="info" size="sm" label="Canal publico" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="WhatsApp del local"
            hint='Se usa en el boton "Escribir por WhatsApp".'
            value={form.shopWhatsapp}
            onChange={(event) => onChange('shopWhatsapp', event.target.value)}
            placeholder="Ej: +54 341 5550000"
          />
          <div className="ui-field min-w-0">
            <span className="ui-field__label">Papel ticket por defecto</span>
            <CustomSelect
              value={form.ticketPaper}
              onChange={(value) => onChange('ticketPaper', value)}
              options={TICKET_PAPER_OPTIONS}
              triggerClassName="min-h-11 rounded-[1rem]"
              ariaLabel="Seleccionar papel ticket por defecto"
            />
            <span className="ui-field__hint">Se usa al confirmar e imprimir tickets o comprobantes.</span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TextAreaField
            label="Direccion del local"
            hint="Placeholder disponible: {shop_address}"
            value={form.shopAddress}
            onChange={(event) => onChange('shopAddress', event.target.value)}
            rows={4}
            placeholder="Ej: Av. San Martin 123"
          />
          <TextAreaField
            label="Horarios de atencion"
            hint="Placeholder disponible: {shop_hours}"
            value={form.shopHours}
            onChange={(event) => onChange('shopHours', event.target.value)}
            rows={4}
            placeholder="Ej: Lun a Vie 9-13 / 16-20"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Alertas operativas"
        description="Defini cuando un pedido o una reparacion deben aparecer como demorados en el dashboard."
        actions={<StatusBadge tone="accent" size="sm" label="Operacion interna" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            type="number"
            min={0}
            label="Pedido demorado (horas)"
            hint="Aplica a pedidos pendientes, confirmados o preparando."
            value={form.orderDelayHours}
            onChange={(event) => onChange('orderDelayHours', event.target.value)}
          />
          <TextField
            type="number"
            min={0}
            label="Reparacion demorada (dias)"
            hint="Aplica a recibido, diagnosticando, esperando aprobacion y reparando."
            value={form.repairDelayDays}
            onChange={(event) => onChange('repairDelayDays', event.target.value)}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Portada de tienda"
        description="Defini el texto principal del hero publico. La imagen visual se administra por separado desde identidad visual."
        actions={<StatusBadge tone="neutral" size="sm" label="Branding" />}
      >
        <div className="ui-alert ui-alert--info mb-4">
          <Store className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Imagen de portada</span>
            <div className="ui-alert__text">
              La imagen del hero se gestiona desde Configuracion &gt; Identidad visual &gt; Fondo portada tienda.
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TextField
            label="Titulo de portada"
            value={form.storeHeroTitle}
            onChange={(event) => onChange('storeHeroTitle', event.target.value)}
            placeholder="Ej: Novedades de la semana"
          />
          <TextAreaField
            label="Texto de portada"
            value={form.storeHeroText}
            onChange={(event) => onChange('storeHeroText', event.target.value)}
            rows={4}
            placeholder="Ej: Ingresaron nuevos modulos, cables y accesorios."
          />
        </div>
      </SectionCard>
    </div>
  );
}

export function AdminBusinessSettingsSidebar({
  form,
}: AdminBusinessSettingsSidebarProps) {
  return (
    <div className="space-y-6">
      <SectionCard
        tone="muted"
        title="Resumen rapido"
        description="Referencia de uso para soporte, mensajes y vistas publicas del sistema."
        actions={<Clock3 className="h-4 w-4 text-zinc-500" />}
      >
        <div className="fact-list">
          <div className="fact-row">
            <span className="fact-label">WhatsApp</span>
            <span className="fact-value fact-value--text">{form.shopWhatsapp || 'No configurado'}</span>
          </div>
          <div className="fact-row">
            <span className="fact-label">Direccion</span>
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
        title="Publicacion"
        description="Estado del contenido principal que impacta en la tienda y en la comunicacion con clientes."
      >
        <div className="choice-grid">
          <div className={`choice-card ${form.storeHeroTitle.trim() ? 'is-active' : ''}`}>
            <div>
              <div className="choice-card__title">Hero con titulo</div>
              <div className="choice-card__hint">
                {form.storeHeroTitle.trim()
                  ? 'Se mostrara el encabezado personalizado.'
                  : 'Si queda vacio, se usa el valor por defecto.'}
              </div>
            </div>
          </div>
          <div className={`choice-card ${form.storeHeroText.trim() ? 'is-active' : ''}`}>
            <div>
              <div className="choice-card__title">Hero con texto auxiliar</div>
              <div className="choice-card__hint">
                {form.storeHeroText.trim()
                  ? 'La portada mostrara un mensaje secundario propio.'
                  : 'Si queda vacio, se usa el texto estandar.'}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function AdminBusinessSettingsActions({
  isDirty,
  saving,
  onCancel,
  onSave,
}: AdminBusinessSettingsActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Button type="button" variant="outline" onClick={onCancel} disabled={!isDirty || saving}>
        Cancelar
      </Button>
      <Button type="button" onClick={onSave} disabled={saving || !isDirty}>
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </div>
  );
}

export function AdminBusinessSettingsPageActions({
  isDirty,
}: {
  isDirty: boolean;
}) {
  return (
    <>
      <StatusBadge
        tone={isDirty ? 'warning' : 'success'}
        label={isDirty ? 'Cambios pendientes' : 'Sin cambios pendientes'}
      />
      <Button asChild variant="outline" size="sm">
        <Link to="/admin/configuraciones">Volver a configuracion</Link>
      </Button>
    </>
  );
}
