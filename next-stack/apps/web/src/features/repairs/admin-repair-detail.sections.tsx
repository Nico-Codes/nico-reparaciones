import { AlertTriangle, Calculator, Clock3, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import type { RepairPricingResolveResult } from './api';
import {
  DETAIL_STATUS_OPTIONS,
  eventTypeLabel,
  repairDetailStatusAlertTone,
  type AdminRepairDetailFormErrors,
  type AdminRepairDetailFormValues,
} from './admin-repair-detail.helpers';
import { pricingRuleModeLabel } from './repair-pricing';
import { formatDateTime, money, repairProgressSteps } from './repair-ui';
import type { RepairItem, RepairTimelineEvent } from './types';

type StatsGridProps = {
  summary: {
    quoted: number | null;
    final: number | null;
    timelineCount: number;
  };
};

type StatusSectionProps = {
  status: string;
  statusLabel: string;
  statusSummary: string;
  deviceLabel: string;
  issueLabel: string;
};

type EditSectionProps = {
  values: AdminRepairDetailFormValues;
  fieldErrors: AdminRepairDetailFormErrors;
  saving: boolean;
  pricingLoading: boolean;
  hasChanges: boolean;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onDeviceBrandChange: (value: string) => void;
  onDeviceModelChange: (value: string) => void;
  onIssueLabelChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onQuotedPriceChange: (value: string) => void;
  onFinalPriceChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSave: () => void;
};

type PricingSectionProps = {
  pricingInputState: {
    canResolve: boolean;
    reason: string;
  };
  pricingBadge: {
    label: string;
    tone: StatusBadgeProps['tone'];
  };
  pricingLoading: boolean;
  activePricingError: string;
  pricingNeedsRefresh: boolean;
  activePricingResult: RepairPricingResolveResult | null;
  quotedPriceValue: number | null;
  canUseSuggested: boolean;
  saving: boolean;
  onRecalculate: () => void;
  onUseSuggested: () => void;
};

type SidebarProps = {
  item: RepairItem;
  code: string;
  statusLabel: string;
  timeline: RepairTimelineEvent[];
};

export function AdminRepairDetailStatsGrid({ summary }: StatsGridProps) {
  return (
    <div className="nr-stat-grid">
      <div className="nr-stat-card">
        <div className="nr-stat-card__label">Presupuesto</div>
        <div className="nr-stat-card__value">{money(summary.quoted)}</div>
        <div className="nr-stat-card__meta">Valor estimado informado al cliente.</div>
      </div>
      <div className="nr-stat-card">
        <div className="nr-stat-card__label">Precio final</div>
        <div className="nr-stat-card__value">{money(summary.final)}</div>
        <div className="nr-stat-card__meta">Monto confirmado para el cierre.</div>
      </div>
      <div className="nr-stat-card">
        <div className="nr-stat-card__label">Seguimiento</div>
        <div className="nr-stat-card__value">{summary.timelineCount}</div>
        <div className="nr-stat-card__meta">Eventos registrados en el historial.</div>
      </div>
    </div>
  );
}

export function AdminRepairDetailStatusSection({
  status,
  statusLabel,
  statusSummary,
  deviceLabel,
  issueLabel,
}: StatusSectionProps) {
  return (
    <SectionCard
      title="Estado y seguimiento"
      description="Visualiza el avance del caso y el proximo hito esperado para el cliente."
      actions={<StatusBadge label={statusLabel} tone={repairDetailStatusAlertTone(status)} size="sm" />}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
        <ProgressSteps items={repairProgressSteps(status)} />

        <div className="account-stack">
          <div className="summary-box">
            <div className="summary-box__label">Equipo</div>
            <div className="mt-2 text-[1.35rem] font-black tracking-tight text-zinc-950">{deviceLabel}</div>
            <div className="summary-box__hint">{issueLabel || 'Falla pendiente de definicion'}</div>
          </div>

          <div className={`ui-alert ui-alert--${repairDetailStatusAlertTone(status)}`}>
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">{statusLabel}</span>
              <div className="ui-alert__text">{statusSummary}</div>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function AdminRepairDetailEditSection({
  values,
  fieldErrors,
  saving,
  pricingLoading,
  hasChanges,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onDeviceBrandChange,
  onDeviceModelChange,
  onIssueLabelChange,
  onStatusChange,
  onQuotedPriceChange,
  onFinalPriceChange,
  onNotesChange,
  onSave,
}: EditSectionProps) {
  return (
    <SectionCard
      title="Editar reparacion"
      description="Actualiza solo datos que realmente persisten en el caso: cliente, equipo, diagnostico, estado y precios."
      actions={<StatusBadge label={hasChanges ? 'Cambios pendientes' : 'Sin cambios'} tone={hasChanges ? 'warning' : 'neutral'} size="sm" />}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <TextField
          label="Nombre del cliente"
          value={values.customerName}
          onChange={(event) => onCustomerNameChange(event.target.value)}
          placeholder="Ej: Nicolas Perez"
          maxLength={190}
          error={fieldErrors.customerName}
          disabled={saving}
        />
        <TextField
          label="Telefono"
          value={values.customerPhone}
          onChange={(event) => onCustomerPhoneChange(event.target.value)}
          placeholder="Ej: 11 5555-1234"
          maxLength={60}
          inputMode="tel"
          error={fieldErrors.customerPhone}
          disabled={saving}
        />
        <TextField
          label="Marca del equipo"
          value={values.deviceBrand}
          onChange={(event) => onDeviceBrandChange(event.target.value)}
          placeholder="Ej: Samsung"
          maxLength={120}
          disabled={saving}
        />
        <TextField
          label="Modelo del equipo"
          value={values.deviceModel}
          onChange={(event) => onDeviceModelChange(event.target.value)}
          placeholder="Ej: A34"
          maxLength={120}
          disabled={saving}
        />
        <TextField
          label="Falla principal"
          value={values.issueLabel}
          onChange={(event) => onIssueLabelChange(event.target.value)}
          placeholder="Ej: Cambio de modulo"
          maxLength={190}
          disabled={saving}
        />
        <div>
          <label className="mb-1 block text-sm font-bold text-zinc-700">Estado del caso</label>
          <CustomSelect
            value={values.status}
            onChange={onStatusChange}
            options={DETAIL_STATUS_OPTIONS}
            disabled={saving}
            triggerClassName="min-h-10 rounded-xl"
            ariaLabel="Estado de la reparacion"
          />
        </div>
        <TextField
          label="Presupuesto"
          inputMode="decimal"
          value={values.quotedPrice}
          onChange={(event) => onQuotedPriceChange(event.target.value)}
          placeholder="0"
          error={fieldErrors.quotedPrice}
          disabled={saving}
        />
        <TextField
          label="Precio final"
          inputMode="decimal"
          value={values.finalPrice}
          onChange={(event) => onFinalPriceChange(event.target.value)}
          placeholder="0"
          error={fieldErrors.finalPrice}
          disabled={saving}
        />
      </div>

      <TextAreaField
        label="Notas y diagnostico"
        value={values.notes}
        onChange={(event) => onNotesChange(event.target.value)}
        placeholder="Detalle del diagnostico, repuestos usados, observaciones y proximos pasos."
        rows={6}
        maxLength={2000}
        wrapperClassName="mt-4"
        disabled={saving}
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" onClick={onSave} disabled={saving || pricingLoading || !hasChanges} data-admin-repair-detail-save>
          {saving ? 'Guardando...' : hasChanges ? 'Guardar cambios' : 'Sin cambios'}
        </Button>
        <Button asChild variant="outline" disabled={saving}>
          <Link to="/admin/repairs">Cancelar</Link>
        </Button>
      </div>
    </SectionCard>
  );
}

export function AdminRepairDetailSuggestedPricingSection({
  pricingInputState,
  pricingBadge,
  pricingLoading,
  activePricingError,
  pricingNeedsRefresh,
  activePricingResult,
  quotedPriceValue,
  canUseSuggested,
  saving,
  onRecalculate,
  onUseSuggested,
}: PricingSectionProps) {
  return (
    <SectionCard
      title="Presupuesto sugerido"
      description="Consulta las reglas activas para comparar el presupuesto cargado con una sugerencia calculada."
      actions={<StatusBadge label={pricingBadge.label} tone={pricingBadge.tone} size="sm" />}
    >
      {!pricingInputState.canResolve ? (
        <div className="ui-alert ui-alert--info">
          <Calculator className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Datos insuficientes para calcular</span>
            <div className="ui-alert__text">{pricingInputState.reason}</div>
          </div>
        </div>
      ) : pricingLoading ? (
        <LoadingBlock label="Calculando presupuesto sugerido" lines={4} />
      ) : activePricingError ? (
        <div className="ui-alert ui-alert--danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No pudimos resolver una sugerencia</span>
            <div className="ui-alert__text">{activePricingError}</div>
          </div>
        </div>
      ) : pricingNeedsRefresh ? (
        <div className="ui-alert ui-alert--warning">
          <Calculator className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Los datos cambiaron</span>
            <div className="ui-alert__text">Recalcula la sugerencia para comparar el presupuesto con las reglas activas actuales.</div>
          </div>
        </div>
      ) : activePricingResult?.matched && activePricingResult.suggestion ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="summary-box">
              <div className="summary-box__label">Presupuesto cargado</div>
              <div className="summary-box__value">{money(quotedPriceValue, 'Sin definir')}</div>
              <div className="summary-box__hint">Es el valor editable del caso antes de guardar cambios.</div>
            </div>
            <div className="summary-box">
              <div className="summary-box__label">Sugerido por reglas</div>
              <div className="summary-box__value">{money(activePricingResult.suggestion.suggestedTotal, 'Sin sugerencia')}</div>
              <div className="summary-box__hint">
                {activePricingResult.rule?.name ?? 'Regla activa'} · {pricingRuleModeLabel(activePricingResult)}
              </div>
            </div>
          </div>

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
                  : `${activePricingResult.suggestion.profitPercent}%${activePricingResult.suggestion.minProfit != null ? ` · mínimo $ ${activePricingResult.suggestion.minProfit.toLocaleString('es-AR')}` : ''}`}
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
      ) : activePricingResult ? (
        <div className="ui-alert ui-alert--warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No hay una regla aplicable</span>
            <div className="ui-alert__text">Puedes seguir con presupuesto manual o ajustar la informacion del caso y volver a calcular.</div>
          </div>
        </div>
      ) : (
        <div className="ui-alert ui-alert--info">
          <Calculator className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Listo para calcular</span>
            <div className="ui-alert__text">Usa la informacion actual del caso para comparar tu presupuesto con las reglas activas.</div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onRecalculate}
          disabled={!pricingInputState.canResolve || pricingLoading || saving}
          data-admin-repair-detail-calc
        >
          {pricingLoading ? 'Calculando...' : activePricingResult || pricingNeedsRefresh ? 'Recalcular' : 'Calcular sugerido'}
        </Button>
        <Button type="button" variant="secondary" onClick={onUseSuggested} disabled={!canUseSuggested || pricingLoading || saving} data-admin-repair-detail-use-suggested>
          Usar sugerido
        </Button>
      </div>
    </SectionCard>
  );
}

export function AdminRepairDetailSidebar({ item, code, statusLabel, timeline }: SidebarProps) {
  return (
    <aside className="account-stack account-sticky">
      <SectionCard title="Resumen del caso" description="Datos administrativos y comerciales relevantes para seguimiento.">
        <div className="fact-list">
          <FactRow label="Codigo" value={code} />
          <FactRow label="Cliente" value={item.customerName || 'Sin nombre'} />
          <FactRow label="Telefono" value={item.customerPhone || 'No informado'} />
          <FactRow label="Ingreso" value={formatDateTime(item.createdAt)} />
          <FactRow label="Ultima actualizacion" value={formatDateTime(item.updatedAt)} />
          <FactRow label="Estado" value={statusLabel} />
        </div>
      </SectionCard>

      <SectionCard title="Historial" description="Eventos registrados para revisar la trazabilidad del caso.">
        {timeline.length === 0 ? (
          <EmptyState
            icon={<Clock3 className="h-5 w-5" />}
            title="Todavia no hay eventos"
            description="El historial se completa automaticamente a medida que se registran cambios en la reparacion."
          />
        ) : (
          <div className="space-y-3">
            {timeline.map((event) => (
              <div key={event.id} className="detail-panel">
                <div className="detail-panel__label">{eventTypeLabel(event.eventType)}</div>
                <div className="detail-panel__value">{event.message || 'Sin detalle adicional.'}</div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{formatDateTime(event.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </aside>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact-row">
      <div className="fact-label">{label}</div>
      <div className="fact-value fact-value--text">{value}</div>
    </div>
  );
}
