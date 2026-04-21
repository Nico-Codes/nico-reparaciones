import {
  AlertTriangle,
  Banknote,
  CreditCard,
  Landmark,
  Palette,
  WalletCards,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import {
  countConfiguredTransferFields,
  type CheckoutSettingsForm,
} from './admin-checkout-settings.helpers';

type AdminCheckoutSettingsFeedbackProps = {
  error: string;
  success: string;
};

type AdminCheckoutSettingsMainProps = {
  form: CheckoutSettingsForm;
  onChange: <K extends keyof CheckoutSettingsForm>(
    field: K,
    value: CheckoutSettingsForm[K],
  ) => void;
};

type AdminCheckoutSettingsSidebarProps = {
  form: CheckoutSettingsForm;
};

type AdminCheckoutSettingsActionsProps = {
  isDirty: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
};

const PAYMENT_METHOD_CARDS = [
  {
    key: 'efectivo',
    title: 'Pago en el local',
    description: 'Se muestra como retiro en local y usa icono configurable desde identidad visual.',
    icon: Banknote,
    toggleField: null,
  },
  {
    key: 'transferencia',
    title: 'Transferencia',
    description: 'Muestra los datos bancarios configurados en esta pantalla antes de confirmar.',
    icon: Landmark,
    toggleField: null,
  },
  {
    key: 'debito',
    title: 'Tarjeta debito',
    description: 'Metodo presencial al retirar. Activala cuando quieras ofrecer pagos con debito.',
    icon: CreditCard,
    toggleField: 'debitEnabled',
  },
  {
    key: 'credito',
    title: 'Tarjeta credito',
    description: 'Metodo presencial al retirar. Activala cuando quieras ofrecer pagos con credito.',
    icon: WalletCards,
    toggleField: 'creditEnabled',
  },
] as const;

const TRANSFER_FIELD_PREVIEW = [
  { key: 'holderValue', labelKey: 'holderLabel' },
  { key: 'bankValue', labelKey: 'bankLabel' },
  { key: 'aliasValue', labelKey: 'aliasLabel' },
  { key: 'cvuValue', labelKey: 'cvuLabel' },
  { key: 'taxIdValue', labelKey: 'taxIdLabel' },
  { key: 'extraValue', labelKey: 'extraLabel' },
] as const;

export function AdminCheckoutSettingsFeedback({
  error,
  success,
}: AdminCheckoutSettingsFeedbackProps) {
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
          <Landmark className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Checkout actualizado.</span>
            <div className="ui-alert__text">{success}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AdminCheckoutSettingsMain({
  form,
  onChange,
}: AdminCheckoutSettingsMainProps) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Metodos de pago visibles"
        description="Efectivo y transferencia quedan activos. Debito y credito quedan deshabilitados hasta que los actives desde esta pantalla."
        actions={<StatusBadge tone="info" size="sm" label="Checkout" />}
      >
        <div className="ui-alert ui-alert--info mb-4">
          <Palette className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Iconos editables</span>
            <div className="ui-alert__text">
              Los iconos se cambian desde Configuracion &gt; Identidad visual &gt; Checkout y pagos.
              La disponibilidad de debito y credito se cambia aca.
            </div>
          </div>
        </div>

        <div className="choice-grid">
          {PAYMENT_METHOD_CARDS.map((item) => {
            const Icon = item.icon;
            const toggleField = item.toggleField;
            const enabled = toggleField ? form[toggleField] : true;
            return (
              <label
                key={item.key}
                className={`choice-card ${enabled ? 'is-active' : 'is-disabled'}`}
              >
                {toggleField ? (
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) => onChange(toggleField, event.target.checked)}
                  />
                ) : null}
                <Icon className="mt-0.5 h-4 w-4 flex-none text-sky-600" />
                <div>
                  <div className="choice-card__title">
                    {item.title}
                    {toggleField ? (
                      <span className="ml-2 text-[0.72rem] font-black uppercase tracking-[0.14em] text-slate-500">
                        {enabled ? 'Activo' : 'Deshabilitado'}
                      </span>
                    ) : null}
                  </div>
                  <div className="choice-card__hint">{item.description}</div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/configuracion/identidadvisual">Editar iconos de pago</Link>
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Datos para transferencia"
        description="Este bloque aparece automaticamente en /checkout cuando el cliente elige transferencia."
        actions={
          <StatusBadge
            tone={countConfiguredTransferFields(form) > 0 ? 'success' : 'warning'}
            size="sm"
            label={
              countConfiguredTransferFields(form) > 0
                ? `${countConfiguredTransferFields(form)} datos cargados`
                : 'Sin datos cargados'
            }
          />
        }
      >
        <div className="grid gap-4">
          <TextField
            label="Titulo del bloque"
            value={form.transferTitle}
            onChange={(event) => onChange('transferTitle', event.target.value)}
            placeholder="Datos para transferencia"
          />
          <TextAreaField
            label="Descripcion"
            rows={3}
            value={form.transferDescription}
            onChange={(event) => onChange('transferDescription', event.target.value)}
            placeholder="Explica como usar los datos antes de confirmar el pedido."
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TextField
            label="Label titular"
            value={form.holderLabel}
            onChange={(event) => onChange('holderLabel', event.target.value)}
          />
          <TextField
            label="Dato titular"
            value={form.holderValue}
            onChange={(event) => onChange('holderValue', event.target.value)}
            placeholder="Ej: NICO REPARACIONES"
          />
          <TextField
            label="Label banco"
            value={form.bankLabel}
            onChange={(event) => onChange('bankLabel', event.target.value)}
          />
          <TextField
            label="Dato banco"
            value={form.bankValue}
            onChange={(event) => onChange('bankValue', event.target.value)}
            placeholder="Ej: Banco Galicia"
          />
          <TextField
            label="Label alias"
            value={form.aliasLabel}
            onChange={(event) => onChange('aliasLabel', event.target.value)}
          />
          <TextField
            label="Dato alias"
            value={form.aliasValue}
            onChange={(event) => onChange('aliasValue', event.target.value)}
            placeholder="Ej: NICO.REPARACIONES"
          />
          <TextField
            label="Label CVU / CBU"
            value={form.cvuLabel}
            onChange={(event) => onChange('cvuLabel', event.target.value)}
          />
          <TextField
            label="Dato CVU / CBU"
            value={form.cvuValue}
            onChange={(event) => onChange('cvuValue', event.target.value)}
            placeholder="Ej: 0000003100000000000000"
          />
          <TextField
            label="Label CUIT / CUIL"
            value={form.taxIdLabel}
            onChange={(event) => onChange('taxIdLabel', event.target.value)}
          />
          <TextField
            label="Dato CUIT / CUIL"
            value={form.taxIdValue}
            onChange={(event) => onChange('taxIdValue', event.target.value)}
            placeholder="Ej: 20-12345678-9"
          />
          <TextField
            label="Label extra"
            value={form.extraLabel}
            onChange={(event) => onChange('extraLabel', event.target.value)}
          />
          <TextField
            label="Dato extra"
            value={form.extraValue}
            onChange={(event) => onChange('extraValue', event.target.value)}
            placeholder="Ej: Enviar comprobante por WhatsApp"
          />
        </div>

        <div className="mt-4">
          <TextAreaField
            label="Nota al pie"
            rows={3}
            value={form.transferNote}
            onChange={(event) => onChange('transferNote', event.target.value)}
            placeholder="Ej: Conserva el comprobante para presentarlo al retirar."
          />
        </div>
      </SectionCard>
    </div>
  );
}

export function AdminCheckoutSettingsSidebar({
  form,
}: AdminCheckoutSettingsSidebarProps) {
  const configuredFields = TRANSFER_FIELD_PREVIEW.filter(
    (item) => form[item.key].trim().length > 0,
  );

  return (
    <div className="space-y-6">
      <SectionCard
        tone="muted"
        title="Preview transferencia"
        description="Resumen de lo que el cliente vera en checkout al elegir transferencia."
      >
        <div className="fact-list">
          <div className="fact-row">
            <span className="fact-label">Titulo</span>
            <span className="fact-value fact-value--text">
              {form.transferTitle || 'Sin titulo'}
            </span>
          </div>
          <div className="fact-row">
            <span className="fact-label">Descripcion</span>
            <span className="fact-value fact-value--text">
              {form.transferDescription || 'Sin descripcion'}
            </span>
          </div>
          <div className="fact-row">
            <span className="fact-label">Campos visibles</span>
            <span className="fact-value">{configuredFields.length}</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {configuredFields.length ? (
            configuredFields.map((item) => (
              <div key={item.key} className="meta-tile">
                <div className="meta-tile__label">{form[item.labelKey] || 'Label'}</div>
                <div className="meta-tile__value">{form[item.key]}</div>
              </div>
            ))
          ) : (
            <div className="ui-alert ui-alert--warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <span className="ui-alert__title">Sin datos visibles</span>
                <div className="ui-alert__text">
                  Si el cliente elige transferencia, no vera alias, CVU ni otros datos hasta que
                  completes al menos un valor.
                </div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        tone="info"
        title="Nota operativa"
        description="La transferencia se sigue seleccionando en checkout aunque el bloque no tenga datos."
      >
        <div className="choice-grid">
          <div className={`choice-card ${configuredFields.length > 0 ? 'is-active' : ''}`}>
            <div>
              <div className="choice-card__title">Bloque de transferencia</div>
              <div className="choice-card__hint">
                {configuredFields.length > 0
                  ? 'El cliente vera datos bancarios antes de confirmar.'
                  : 'Checkout mostrara advertencia de datos pendientes.'}
              </div>
            </div>
          </div>
          <div className="choice-card is-active">
            <div>
              <div className="choice-card__title">Metodos fijos</div>
              <div className="choice-card__hint">
                Efectivo y transferencia quedan disponibles. Debito y credito dependen de los
                switches de la pantalla principal.
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function AdminCheckoutSettingsActions({
  isDirty,
  saving,
  onCancel,
  onSave,
}: AdminCheckoutSettingsActionsProps) {
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

export function AdminCheckoutSettingsPageActions({
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
