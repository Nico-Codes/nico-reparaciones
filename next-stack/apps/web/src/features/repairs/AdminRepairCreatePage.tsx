import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { TextAreaField } from '@/components/ui/textarea-field';
import { StatusBadge } from '@/components/ui/status-badge';
import { RepairProviderPartPricingSection } from './RepairProviderPartPricingSection';
import {
  AdminRepairCreateBasicSection,
  AdminRepairCreateDiagnosisSection,
  AdminRepairCreateSubmitSection,
} from './admin-repair-create.sections';
import { useAdminRepairCreate } from './use-admin-repair-create';

export function AdminRepairCreatePage() {
  const create = useAdminRepairCreate();

  return (
    <PageShell context="admin" className="space-y-5" data-admin-repair-create-page>
      <PageHeader
        context="admin"
        eyebrow="Servicio tecnico"
        title="Nueva reparacion"
        subtitle="Ingresa el caso con los datos minimos y, si queres, vincularlo al catalogo tecnico activo."
        actions={
          <>
            <StatusBadge label="Alta manual" tone="info" />
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/repairs">
                <ArrowLeft className="h-4 w-4" />
                Volver al listado
              </Link>
            </Button>
          </>
        }
      />

      {create.submitError ? (
        <div className="ui-alert ui-alert--danger" data-reveal>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo crear la reparacion</span>
            <div className="ui-alert__text">{create.submitError}</div>
          </div>
        </div>
      ) : null}

      {create.catalogError ? (
        <div className="ui-alert ui-alert--warning" data-reveal>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Catalogo parcial</span>
            <div className="ui-alert__text">{create.catalogError} Podes continuar con carga manual de marca, modelo y falla.</div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto self-start"
            disabled={create.catalogBusy || create.submitting}
            onClick={create.reloadCatalog}
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      <form className="repair-create-stack" onSubmit={create.onSubmit}>
        <div className="account-stack">
          <AdminRepairCreateBasicSection {...create.basicSectionProps} />

          <AdminRepairCreateDiagnosisSection {...create.diagnosisSectionProps} />

          <div data-admin-repair-create-provider-part>
            <RepairProviderPartPricingSection {...create.providerPartProps} />
          </div>

          <details className="nr-disclosure nr-disclosure--full" data-admin-repair-create-optional>
            <summary className="nr-disclosure__summary">
              <span className="nr-disclosure__title">Notas internas</span>
              <span className="nr-disclosure__meta">Opcional</span>
            </summary>
            <div className="nr-disclosure__body">
              <TextAreaField
                label="Notas internas"
                value={create.notesProps.value}
                onChange={(event) => create.notesProps.onChange(event.target.value)}
                rows={5}
                placeholder="Ej: ingresa con funda, sin cargador, pantalla encendida, pero tactil intermitente."
                maxLength={2000}
                disabled={create.submitting}
                wrapperClassName="m-0"
              />
            </div>
          </details>
        </div>

        <AdminRepairCreateSubmitSection {...create.submitSectionProps} />
      </form>
    </PageShell>
  );
}
