import { Truck } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { money } from './repair-ui';
import {
  snapshotStatusLabel,
  snapshotStatusTone,
  snapshotValueOrigin,
} from './repair-provider-part-pricing-section.helpers';
import type { RepairPricingSnapshotItem } from './types';

type Props = {
  mode: 'create' | 'detail';
  activeSnapshot: RepairPricingSnapshotItem | null;
  quotedPriceValue: number | null;
  snapshotHistory: RepairPricingSnapshotItem[];
};

export function RepairProviderPartPricingSnapshotPanels({
  mode,
  activeSnapshot,
  quotedPriceValue,
  snapshotHistory,
}: Props) {
  const activeSnapshotOrigin = activeSnapshot ? snapshotValueOrigin(activeSnapshot, quotedPriceValue) : null;

  return (
    <>
      {activeSnapshot ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4" data-admin-repair-active-snapshot>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Snapshot activo</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">
                {activeSnapshot.supplierNameSnapshot || 'Proveedor sin nombre'} · {activeSnapshot.partNameSnapshot}
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                {activeSnapshot.partSkuSnapshot ? `SKU ${activeSnapshot.partSkuSnapshot} · ` : ''}
                {money(activeSnapshot.baseCost, 'Sin costo base')} · {activeSnapshot.pricingRuleNameSnapshot || 'Sin regla asociada'}
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                {activeSnapshot.appliedAt
                  ? `Aplicado ${new Date(activeSnapshot.appliedAt).toLocaleString('es-AR')}`
                  : `Creado ${new Date(activeSnapshot.createdAt).toLocaleString('es-AR')}`}
              </div>
            </div>
            <StatusBadge
              label={snapshotStatusLabel(activeSnapshot, activeSnapshot.id)}
              tone={snapshotStatusTone(activeSnapshot, activeSnapshot.id)}
              size="sm"
            />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="detail-panel">
              <div className="detail-panel__label">Sugerido por cálculo</div>
              <div className="detail-panel__value">{money(activeSnapshot.suggestedQuotedPrice, 'Sin sugerido')}</div>
            </div>
            <div className="detail-panel">
              <div className="detail-panel__label">Precio aplicado al caso</div>
              <div className="detail-panel__value">{money(activeSnapshot.appliedQuotedPrice, 'Sin aplicar')}</div>
              {activeSnapshot.manualOverridePrice != null ? (
                <div className="mt-1 text-xs font-medium text-amber-700">
                  Override manual: {money(activeSnapshot.manualOverridePrice, 'Sin override')}
                </div>
              ) : null}
            </div>
            <div className="detail-panel">
              <div className="detail-panel__label">Presupuesto actual</div>
              <div className="detail-panel__value">{money(quotedPriceValue, 'Sin definir')}</div>
            </div>
          </div>

          {activeSnapshotOrigin ? (
            <div className={`ui-alert mt-4 ${activeSnapshotOrigin.tone === 'success' ? 'ui-alert--success' : 'ui-alert--warning'}`}>
              <Truck className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <span className="ui-alert__title">{activeSnapshotOrigin.title}</span>
                <div className="ui-alert__text">{activeSnapshotOrigin.description}</div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 fact-list">
            <div className="fact-row">
              <div className="fact-label">Cantidad</div>
              <div className="fact-value fact-value--text">{activeSnapshot.quantity}</div>
            </div>
            <div className="fact-row">
              <div className="fact-label">Extras / envío</div>
              <div className="fact-value fact-value--text">
                {money(activeSnapshot.extraCost, '0')} · Envío {money(activeSnapshot.shippingCost, '0')}
              </div>
            </div>
            <div className="fact-row">
              <div className="fact-label">Regla aplicada</div>
              <div className="fact-value fact-value--text">
                {activeSnapshot.pricingRuleNameSnapshot || 'Sin regla'} ·{' '}
                {activeSnapshot.calcModeSnapshot === 'FIXED_TOTAL' ? 'Total fijo' : 'Base + margen'}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {mode === 'detail' ? (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-950">Historial de snapshots</div>
              <div className="text-sm text-zinc-500">Últimos cálculos persistidos para este caso.</div>
            </div>
            <StatusBadge
              label={snapshotHistory.length > 0 ? `${snapshotHistory.length} registrados` : 'Sin historial'}
              tone={snapshotHistory.length > 0 ? 'info' : 'neutral'}
              size="sm"
            />
          </div>

          {snapshotHistory.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-5 w-5" />}
              title="Todavía no hay snapshots guardados"
              description="Cuando apliques un cálculo con proveedor y repuesto, quedará trazado acá para futuras revisiones."
            />
          ) : (
            <div className="space-y-3" data-admin-repair-snapshot-history>
              {snapshotHistory.map((snapshot) => {
                const origin = snapshotValueOrigin(
                  snapshot,
                  activeSnapshot?.id === snapshot.id ? quotedPriceValue : snapshot.appliedQuotedPrice,
                );
                return (
                  <div key={snapshot.id} className="detail-panel">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="detail-panel__label">
                          {snapshot.supplierNameSnapshot || 'Proveedor sin nombre'} · {snapshot.partNameSnapshot}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-zinc-900">
                          {money(snapshot.baseCost, 'Sin costo base')}
                          {snapshot.partSkuSnapshot ? ` · SKU ${snapshot.partSkuSnapshot}` : ''}
                        </div>
                        <div className="mt-1 text-sm text-zinc-500">
                          {snapshot.pricingRuleNameSnapshot || 'Sin regla asociada'} ·{' '}
                          {snapshot.appliedAt
                            ? new Date(snapshot.appliedAt).toLocaleString('es-AR')
                            : new Date(snapshot.createdAt).toLocaleString('es-AR')}
                        </div>
                      </div>
                      <StatusBadge
                        label={snapshotStatusLabel(snapshot, activeSnapshot?.id ?? null)}
                        tone={snapshotStatusTone(snapshot, activeSnapshot?.id ?? null)}
                        size="sm"
                      />
                    </div>

                    <div className="mt-3 fact-list">
                      <div className="fact-row">
                        <div className="fact-label">Sugerido</div>
                        <div className="fact-value">{money(snapshot.suggestedQuotedPrice, 'Sin sugerido')}</div>
                      </div>
                      <div className="fact-row">
                        <div className="fact-label">Aplicado</div>
                        <div className="fact-value">{money(snapshot.appliedQuotedPrice, 'Sin aplicar')}</div>
                      </div>
                      <div className="fact-row">
                        <div className="fact-label">Lectura operativa</div>
                        <div className="fact-value fact-value--text">{origin.title}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
