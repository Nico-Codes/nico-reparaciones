import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';

export type AdminRepairCreateSubmitSectionProps = {
  devicePreview: string;
  customerName: string;
  resolvedIssue: string | null;
  quotedPriceValue: number | null;
  submitting: boolean;
};

export function AdminRepairCreateSubmitPanel({
  devicePreview,
  customerName,
  resolvedIssue,
  quotedPriceValue,
  submitting,
}: AdminRepairCreateSubmitSectionProps) {
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
