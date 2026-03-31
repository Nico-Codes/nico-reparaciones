import { AlertTriangle, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import type { RepairPricingResolveResult } from './api';
import type {
  AdminRepairCreateFormErrors,
  AdminRepairCreateFormValues,
} from './admin-repair-create.helpers';
import { pricingRuleModeLabel } from './repair-pricing';
import { money } from './repair-ui';

type BasicSectionProps = {
  loadingTypes: boolean;
  loadingBrands: boolean;
  loadingModels: boolean;
  submitting: boolean;
  deviceTypeOptions: Array<{ value: string; label: string }>;
  brandOptions: Array<{ value: string; label: string }>;
  modelOptions: Array<{ value: string; label: string }>;
  values: AdminRepairCreateFormValues;
  fieldErrors: AdminRepairCreateFormErrors;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onDeviceTypeIdChange: (value: string) => void;
  onDeviceBrandIdChange: (value: string) => void;
  onDeviceModelIdChange: (value: string) => void;
  onDeviceBrandChange: (value: string) => void;
  onDeviceModelChange: (value: string) => void;
};

type DiagnosisSectionProps = {
  loadingIssues: boolean;
  submitting: boolean;
  issueOptions: Array<{ value: string; label: string }>;
  values: AdminRepairCreateFormValues;
  fieldErrors: AdminRepairCreateFormErrors;
  pricingBadge: {
    label: string;
    tone: StatusBadgeProps['tone'];
  };
  pricingInputState: {
    canResolve: boolean;
    reason: string;
  };
  pricingLoading: boolean;
  activePricingError: string;
  pricingNeedsRefresh: boolean;
  activePricingResult: RepairPricingResolveResult | null;
  canUseSuggested: boolean;
  onDeviceIssueTypeIdChange: (value: string) => void;
  onIssueLabelChange: (value: string) => void;
  onQuotedPriceChange: (value: string) => void;
  onRecalculate: () => void;
  onUseSuggested: () => void;
};

type SubmitSectionProps = {
  devicePreview: string;
  customerName: string;
  resolvedIssue: string | null;
  quotedPriceValue: number | null;
  submitting: boolean;
};

export function AdminRepairCreateBasicSection({
  loadingTypes,
  loadingBrands,
  loadingModels,
  submitting,
  deviceTypeOptions,
  brandOptions,
  modelOptions,
  values,
  fieldErrors,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onDeviceTypeIdChange,
  onDeviceBrandIdChange,
  onDeviceModelIdChange,
  onDeviceBrandChange,
  onDeviceModelChange,
}: BasicSectionProps) {
  return (
    <SectionCard
      title="Datos basicos"
      description="Carga lo minimo para abrir rapido el caso: cliente, equipo y referencia visible."
      actions={<StatusBadge label="Paso 1" tone="neutral" size="sm" />}
      className="repair-create-card"
      bodyClassName="space-y-5"
      data-admin-repair-create-basic
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <TextField
          label="Nombre del cliente *"
          value={values.customerName}
          onChange={(event) => onCustomerNameChange(event.target.value)}
          placeholder="Ej: Nicolas Perez"
          autoComplete="name"
          error={fieldErrors.customerName}
          maxLength={190}
          disabled={submitting}
        />
        <TextField
          label="Telefono"
          value={values.customerPhone}
          onChange={(event) => onCustomerPhoneChange(event.target.value)}
          placeholder="Ej: 11 5555-1234"
          autoComplete="tel"
          inputMode="tel"
          error={fieldErrors.customerPhone}
          hint="Opcional. Si lo cargas, validamos un minimo de 6 digitos."
          maxLength={60}
          disabled={submitting}
        />
        <div className="ui-field">
          <span className="ui-field__label">Tipo de equipo</span>
          <CustomSelect
            value={values.deviceTypeId}
            onChange={onDeviceTypeIdChange}
            options={deviceTypeOptions}
            disabled={loadingTypes || submitting}
            className="w-full"
            triggerClassName="min-h-11 rounded-[1rem]"
            ariaLabel="Seleccionar tipo de equipo"
          />
          <span className="ui-field__hint">Podes omitirlo y cargar la marca y el modelo en forma manual.</span>
        </div>
        <div className="ui-field">
          <span className="ui-field__label">Marca exacta del catalogo</span>
          <CustomSelect
            value={values.deviceBrandId}
            onChange={onDeviceBrandIdChange}
            options={brandOptions}
            disabled={loadingBrands || submitting}
            className="w-full"
            triggerClassName="min-h-11 rounded-[1rem]"
            ariaLabel="Seleccionar marca exacta del catalogo"
          />
          <span className="ui-field__hint">Ayuda al calculo y a la busqueda de repuestos cuando el equipo existe en el catalogo.</span>
        </div>
        <div className="ui-field">
          <span className="ui-field__label">Modelo exacto del catalogo</span>
          <CustomSelect
            value={values.deviceModelId}
            onChange={onDeviceModelIdChange}
            options={modelOptions}
            disabled={loadingModels || !values.deviceBrandId || submitting}
            className="w-full"
            triggerClassName="min-h-11 rounded-[1rem]"
            ariaLabel="Seleccionar modelo exacto del catalogo"
          />
          <span className="ui-field__hint">Se habilita cuando elegis una marca exacta y mejora la precision del calculo.</span>
        </div>
        <TextField
          label="Marca visible"
          value={values.deviceBrand}
          onChange={(event) => onDeviceBrandChange(event.target.value)}
          placeholder="Ej: Samsung"
          hint="Si elegis una marca exacta del catalogo, la usamos como valor por defecto."
          maxLength={120}
          disabled={submitting}
        />
        <TextField
          label="Modelo visible"
          value={values.deviceModel}
          onChange={(event) => onDeviceModelChange(event.target.value)}
          placeholder="Ej: Galaxy A32"
          hint="Podes dejarlo manual aunque uses catalogo."
          maxLength={120}
          disabled={submitting}
        />
      </div>
    </SectionCard>
  );
}

export function AdminRepairCreateDiagnosisSection({
  loadingIssues,
  submitting,
  issueOptions,
  values,
  fieldErrors,
  pricingBadge,
  pricingInputState,
  pricingLoading,
  activePricingError,
  pricingNeedsRefresh,
  activePricingResult,
  canUseSuggested,
  onDeviceIssueTypeIdChange,
  onIssueLabelChange,
  onQuotedPriceChange,
  onRecalculate,
  onUseSuggested,
}: DiagnosisSectionProps) {
  return (
    <SectionCard
      title="Diagnostico rapido"
      description="Define la falla, carga un presupuesto manual si ya lo conoces y usa la sugerencia automatica solo si te sirve."
      actions={
        <>
          <StatusBadge label="Paso 2" tone="neutral" size="sm" />
          <StatusBadge label={pricingBadge.label} tone={pricingBadge.tone} size="sm" />
        </>
      }
      className="repair-create-card"
      bodyClassName="space-y-5"
      data-admin-repair-create-diagnosis
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ui-field">
          <span className="ui-field__label">Falla del catalogo</span>
          <CustomSelect
            value={values.deviceIssueTypeId}
            onChange={onDeviceIssueTypeIdChange}
            options={issueOptions}
            disabled={loadingIssues || submitting}
            className="w-full"
            triggerClassName="min-h-11 rounded-[1rem]"
            ariaLabel="Seleccionar falla del catalogo"
          />
          <span className="ui-field__hint">Si no la encontras, usa el texto libre de la derecha.</span>
        </div>
        <TextField
          label="Falla o texto libre"
          value={values.issueLabel}
          onChange={(event) => onIssueLabelChange(event.target.value)}
          placeholder="Ej: Modulo roto / no carga"
          maxLength={190}
          hint="Podes dejarlo manual aunque selecciones una falla del catalogo."
          disabled={submitting}
        />
        <TextField
          label="Presupuesto cargado"
          value={values.quotedPrice}
          onChange={(event) => onQuotedPriceChange(event.target.value)}
          placeholder="Ej: 25000"
          inputMode="decimal"
          error={fieldErrors.quotedPrice}
          hint="Editable. Solo se usa el sugerido si vos lo confirmas."
          disabled={submitting}
        />
        <div className="summary-box">
          <div className="summary-box__label">Presupuesto sugerido</div>
          <div className="summary-box__value">
            {activePricingResult?.matched && activePricingResult.suggestion
              ? money(activePricingResult.suggestion.suggestedTotal, 'Sin sugerencia')
              : 'Sin sugerencia'}
          </div>
          <div className="summary-box__hint">
            {activePricingResult?.matched && activePricingResult.rule
              ? `${activePricingResult.rule.name} · ${pricingRuleModeLabel(activePricingResult)}`
              : pricingInputState.canResolve
                ? 'Calcula una sugerencia con las reglas actuales.'
                : pricingInputState.reason}
          </div>
        </div>
      </div>

      {!pricingInputState.canResolve ? (
        <div className="ui-alert ui-alert--info">
          <Calculator className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Datos insuficientes para calcular</span>
            <div className="ui-alert__text">{pricingInputState.reason}</div>
          </div>
        </div>
      ) : pricingLoading ? (
        <LoadingBlock label="Calculando presupuesto sugerido" lines={3} />
      ) : activePricingError ? (
        <div className="ui-alert ui-alert--danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No pudimos calcular la sugerencia</span>
            <div className="ui-alert__text">{activePricingError}</div>
          </div>
        </div>
      ) : pricingNeedsRefresh ? (
        <div className="ui-alert ui-alert--warning">
          <Calculator className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">La sugerencia quedo vieja</span>
            <div className="ui-alert__text">Recalcula para que coincida con el equipo y la falla que estas cargando ahora.</div>
          </div>
        </div>
      ) : activePricingResult && !activePricingResult.matched ? (
        <div className="ui-alert ui-alert--warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No encontramos una regla aplicable</span>
            <div className="ui-alert__text">Podes seguir con un presupuesto manual o ajustar marca, modelo y falla antes de recalcular.</div>
          </div>
        </div>
      ) : null}

      {activePricingResult?.matched && activePricingResult.suggestion ? (
        <details className="nr-disclosure">
          <summary className="nr-disclosure__summary">
            <span className="nr-disclosure__title">Ver detalle de la regla aplicada</span>
            <span className="nr-disclosure__meta">{pricingRuleModeLabel(activePricingResult)}</span>
          </summary>
          <div className="nr-disclosure__body">
            <div className="fact-list">
              <div className="fact-row">
                <div className="fact-label">Base</div>
                <div className="fact-value">{money(activePricingResult.suggestion.basePrice, 'Sin base')}</div>
              </div>
              <div className="fact-row">
                <div className="fact-label">Margen / total</div>
                <div className="fact-value fact-value--text">
                  {activePricingResult.suggestion.calcMode === 'FIXED_TOTAL'
                    ? 'Total fijo definido por regla'
                    : `${activePricingResult.suggestion.profitPercent}%${activePricingResult.suggestion.minProfit != null ? ` · minimo $ ${activePricingResult.suggestion.minProfit.toLocaleString('es-AR')}` : ''}`}
                </div>
              </div>
              <div className="fact-row">
                <div className="fact-label">Piso / envio</div>
                <div className="fact-value fact-value--text">
                  {activePricingResult.suggestion.minFinalPrice != null ? `Piso $ ${activePricingResult.suggestion.minFinalPrice.toLocaleString('es-AR')}` : 'Sin piso'}
                  {activePricingResult.suggestion.shippingFee != null ? ` · Envio $ ${activePricingResult.suggestion.shippingFee.toLocaleString('es-AR')}` : ''}
                </div>
              </div>
            </div>
          </div>
        </details>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onRecalculate}
          disabled={!pricingInputState.canResolve || pricingLoading || submitting}
          data-admin-repair-create-calc
        >
          {pricingLoading ? 'Calculando...' : activePricingResult || pricingNeedsRefresh ? 'Recalcular' : 'Calcular sugerido'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onUseSuggested}
          disabled={!canUseSuggested || pricingLoading || submitting}
          data-admin-repair-create-use-suggested
        >
          Usar sugerido
        </Button>
      </div>
    </SectionCard>
  );
}

export function AdminRepairCreateSubmitSection({
  devicePreview,
  customerName,
  resolvedIssue,
  quotedPriceValue,
  submitting,
}: SubmitSectionProps) {
  return (
    <SectionCard
      tone="muted"
      title="Listo para crear"
      description="La reparacion se crea en estado Recibido. Podes seguir solo con texto libre o aplicar catalogo, sugerencia y snapshot si te sirven."
      className="repair-create-card"
    >
      <div className="repair-create-footer">
        <div className="repair-create-footer__summary">
          <span className="repair-create-footer__eyebrow">Resumen rapido</span>
          <div className="repair-create-footer__title">{devicePreview}</div>
          <div className="repair-create-footer__meta">
            {customerName.trim() || 'Cliente pendiente'} · {resolvedIssue || 'Falla pendiente'} ·{' '}
            {quotedPriceValue != null ? `$ ${quotedPriceValue.toLocaleString('es-AR')}` : 'Sin presupuesto cargado'}
          </div>
        </div>
        <div className="repair-create-footer__actions">
          <Button asChild variant="outline" disabled={submitting}>
            <Link to="/admin/repairs">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={submitting} data-admin-repair-create-submit>
            {submitting ? 'Creando reparacion...' : 'Crear reparacion'}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
