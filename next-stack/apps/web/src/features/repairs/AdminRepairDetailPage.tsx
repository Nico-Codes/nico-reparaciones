import { AlertTriangle, ArrowLeft, ShieldCheck, Wrench } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  AdminRepairDetailEditSection,
  AdminRepairDetailSidebar,
  AdminRepairDetailStatsGrid,
  AdminRepairDetailStatusSection,
  AdminRepairDetailSuggestedPricingSection,
} from './admin-repair-detail.sections';
import { RepairProviderPartPricingSection } from './RepairProviderPartPricingSection';
import { formatDateTime } from './repair-ui';
import { useAdminRepairDetail } from './use-admin-repair-detail';

export function AdminRepairDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const locationNotice =
    typeof location.state === 'object' && location.state && 'notice' in location.state && typeof location.state.notice === 'string'
      ? location.state.notice
      : '';

  const detail = useAdminRepairDetail({ id, initialNotice: locationNotice });

  if (detail.loading) {
    return (
      <PageShell context="admin">
        <PageHeader
          context="admin"
          eyebrow="Reparaciones"
          title="Cargando detalle"
          subtitle="Estamos preparando la informacion completa del caso."
          actions={<StatusBadge label="Cargando" tone="info" />}
        />
        <SectionCard>
          <LoadingBlock label="Cargando reparacion" lines={6} />
        </SectionCard>
      </PageShell>
    );
  }

  if (detail.loadError && !detail.item) {
    return (
      <PageShell context="admin">
        <PageHeader
          context="admin"
          eyebrow="Reparaciones"
          title="Caso no disponible"
          subtitle="No pudimos recuperar el detalle solicitado."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/repairs">
                <ArrowLeft className="h-4 w-4" />
                Volver a reparaciones
              </Link>
            </Button>
          }
        />
        <SectionCard>
          <EmptyState
            icon={<Wrench className="h-5 w-5" />}
            title={detail.loadError}
            description="Vuelve al listado para revisar otro caso o reintenta la carga desde el panel."
            actions={
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => detail.reload()}>
                  Reintentar
                </Button>
                <Button asChild>
                  <Link to="/admin/repairs">Ir al listado</Link>
                </Button>
              </div>
            }
          />
        </SectionCard>
      </PageShell>
    );
  }

  if (!detail.item || !detail.providerPartProps) {
    return (
      <PageShell context="admin">
        <PageHeader
          context="admin"
          eyebrow="Reparaciones"
          title="Caso no encontrado"
          subtitle="El registro solicitado no esta disponible en este momento."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/repairs">Volver a reparaciones</Link>
            </Button>
          }
        />
        <SectionCard>
          <EmptyState
            icon={<AlertTriangle className="h-5 w-5" />}
            title="No encontramos la reparacion"
            description="Revisa el listado completo y abre otro caso desde la tabla principal."
          />
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <PageShell context="admin" className="space-y-5" data-admin-repair-detail-page>
      <PageHeader
        context="admin"
        eyebrow="Reparaciones"
        title={`Caso ${detail.code}`}
        subtitle={`${detail.item.customerName || 'Cliente sin nombre'} | ${formatDateTime(detail.item.createdAt)}`}
        actions={
          <>
            <StatusBadge label={detail.statusLabel} tone={detail.statusTone} />
            {detail.hasChanges ? <StatusBadge label="Cambios pendientes" tone="warning" /> : null}
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/repairs">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/admin/garantias/crear?repairId=${encodeURIComponent(detail.item.id)}`}>Registrar garantia</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/repairs/${encodeURIComponent(detail.item.id)}/print`} target="_blank" rel="noreferrer">
                Imprimir
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/repairs/${encodeURIComponent(detail.item.id)}/ticket`} target="_blank" rel="noreferrer">
                Ticket
              </a>
            </Button>
          </>
        }
      />

      <AdminRepairDetailStatsGrid summary={detail.summary} />

      {detail.loadError ? (
        <div className="ui-alert ui-alert--warning" data-reveal>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No pudimos refrescar el caso</span>
            <div className="ui-alert__text">{detail.loadError}</div>
          </div>
          <Button type="button" size="sm" variant="ghost" className="ml-auto self-start" onClick={() => detail.reload({ showLoading: false })}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {detail.saveError ? (
        <div className="ui-alert ui-alert--danger" data-reveal>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo completar la accion</span>
            <div className="ui-alert__text">{detail.saveError}</div>
          </div>
        </div>
      ) : null}

      {detail.notice ? (
        <div className="ui-alert ui-alert--success" data-reveal>
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Cambios guardados</span>
            <div className="ui-alert__text">{detail.notice}</div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.85fr)]">
        <div className="space-y-5">
          <AdminRepairDetailStatusSection
            status={detail.item.status}
            statusLabel={detail.statusLabel}
            statusSummary={detail.statusSummary}
            deviceLabel={detail.deviceLabel}
            issueLabel={detail.formValues.issueLabel}
          />

          <AdminRepairDetailEditSection
            values={detail.formValues}
            fieldErrors={detail.fieldErrors}
            saving={detail.saving}
            pricingLoading={detail.pricingLoading}
            hasChanges={detail.hasChanges}
            onCustomerNameChange={detail.setCustomerName}
            onCustomerPhoneChange={detail.setCustomerPhone}
            onDeviceBrandChange={detail.setDeviceBrand}
            onDeviceModelChange={detail.setDeviceModel}
            onIssueLabelChange={detail.setIssueLabel}
            onStatusChange={detail.setStatus}
            onQuotedPriceChange={detail.setQuotedPrice}
            onFinalPriceChange={detail.setFinalPrice}
            onNotesChange={detail.setNotes}
            onSave={detail.save}
          />

          <AdminRepairDetailSuggestedPricingSection
            pricingInputState={detail.pricingInput}
            pricingBadge={detail.pricingBadge}
            pricingLoading={detail.pricingLoading}
            activePricingError={detail.activePricingError}
            pricingNeedsRefresh={detail.pricingNeedsRefresh}
            activePricingResult={detail.activePricingResult}
            quotedPriceValue={detail.parsedQuotedPriceValue}
            canUseSuggested={detail.canUseSuggested}
            saving={detail.saving}
            onRecalculate={detail.recalculateSuggestedPrice}
            onUseSuggested={detail.useSuggestedPrice}
          />

          <RepairProviderPartPricingSection {...detail.providerPartProps} />
        </div>

        <AdminRepairDetailSidebar
          item={detail.item}
          code={detail.code}
          statusLabel={detail.statusLabel}
          timeline={detail.timeline}
          whatsappDraft={detail.whatsappDraft}
          whatsappLoading={detail.whatsappLoading}
          whatsappError={detail.whatsappError}
          whatsappOpening={detail.whatsappOpening}
          onOpenManualWhatsapp={detail.openManualWhatsapp}
        />
      </div>
    </PageShell>
  );
}
