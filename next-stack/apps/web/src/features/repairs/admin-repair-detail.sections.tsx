import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import type { RepairPricingResolveResult } from './api';
import {
  DETAIL_STATUS_OPTIONS,
  type AdminRepairDetailFormErrors,
  type AdminRepairDetailFormValues,
} from './admin-repair-detail.helpers';
import { money } from './repair-ui';
import type { RepairItem, RepairTimelineEvent, RepairWhatsappDraft } from './types';
import { AdminRepairDetailSuggestedPricingSection } from './admin-repair-detail-pricing-panels';
import { AdminRepairDetailSidebar } from './admin-repair-detail-sidebar';
import { AdminRepairDetailStatusSection } from './admin-repair-detail-status-panels';

type StatsGridProps = {
  summary: {
    quoted: number | null;
    final: number | null;
    timelineCount: number;
  };
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
  whatsappDraft: RepairWhatsappDraft | null;
  whatsappLoading: boolean;
  whatsappError: string;
  whatsappOpening: boolean;
  onOpenManualWhatsapp: () => void;
};

export function AdminRepairDetailStatsGrid({ summary }: StatsGridProps) {
  return (
    <div className="nr-stat-grid">
      <StatCard label="Presupuesto" value={money(summary.quoted)} hint="Valor estimado informado al cliente." />
      <StatCard label="Precio final" value={money(summary.final)} hint="Monto confirmado para el cierre." />
      <StatCard label="Seguimiento" value={String(summary.timelineCount)} hint="Eventos registrados en el historial." />
    </div>
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

export {
  AdminRepairDetailStatusSection,
  AdminRepairDetailSuggestedPricingSection,
  AdminRepairDetailSidebar,
};

export type { PricingSectionProps, SidebarProps };

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="nr-stat-card">
      <div className="nr-stat-card__label">{label}</div>
      <div className="nr-stat-card__value">{value}</div>
      <div className="nr-stat-card__meta">{hint}</div>
    </div>
  );
}
