import { ArrowLeft, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
export { AdminProductEditFormLayout } from './admin-product-edit-panels';

export function AdminProductEditMissingState({ error }: { error: string }) {
  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Catalogo"
        title="Producto no encontrado"
        subtitle="El registro solicitado no esta disponible o ya no existe en el panel."
      />
      <SectionCard>
        <EmptyState
          title="No encontramos el producto"
          description={error || 'Volve al listado para continuar con otra edicion.'}
          actions={
            <Button asChild>
              <Link to="/admin/productos">Volver al catalogo</Link>
            </Button>
          }
        />
      </SectionCard>
    </PageShell>
  );
}

export function AdminProductEditFeedback({ error, success }: { error: string; success: string }) {
  return (
    <>
      {error ? (
        <div className="ui-alert ui-alert--danger">
          <Tag className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo actualizar el producto.</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="ui-alert ui-alert--success">
          <Tag className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Producto actualizado.</span>
            <div className="ui-alert__text">{success}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AdminProductEditHeaderActions({
  active,
  productId,
}: {
  active: boolean;
  productId: string;
}) {
  return (
    <>
      <StatusBadge tone={active ? 'success' : 'neutral'} label={active ? 'Activo' : 'Inactivo'} />
      <Button asChild variant="outline" size="sm">
        <Link to={`/admin/productos/${encodeURIComponent(productId)}/etiqueta`}>Etiqueta</Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to="/admin/productos">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </Button>
    </>
  );
}
