import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime, money, orderStatusLabel, ORDER_STATUS_OPTIONS, orderStatusTone } from './admin-orders.helpers';
import type { OrderItem } from './types';

export function AdminOrderDetailPanel({
  selectedDetail,
  onChangeStatus,
}: {
  selectedDetail: OrderItem;
  onChangeStatus: (orderId: string, status: string) => void;
}) {
  return (
    <div className="space-y-4">
      <section className="nr-stat-grid">
        <OrderMetricCard label="Metodo de pago" value={selectedDetail.paymentMethod || 'Sin definir'} meta="Informacion registrada en la compra" />
        <OrderMetricCard label="Items" value={String(selectedDetail.items.length)} meta="Lineas incluidas en el pedido" />
        <OrderMetricCard label="Actualizado" value={formatDateTime(selectedDetail.updatedAt)} meta="Ultimo cambio registrado" />
        <OrderMetricCard label="Canal" value={selectedDetail.user ? 'Compra web' : 'Venta local'} meta="Origen de la operacion" />
      </section>

      <div className="detail-grid">
        <div className="detail-stack">
          <div className="detail-panel">
            <div className="detail-panel__label">Estado actual</div>
            <div className="mt-3 space-y-3">
              <CustomSelect
                value={selectedDetail.status}
                onChange={(nextStatus) => onChangeStatus(selectedDetail.id, nextStatus)}
                options={ORDER_STATUS_OPTIONS}
                className="w-full"
                triggerClassName="min-h-11 rounded-[1rem]"
                ariaLabel="Estado del pedido"
              />
              <StatusBadge label={orderStatusLabel(selectedDetail.status)} tone={orderStatusTone(selectedDetail.status)} />
            </div>
          </div>
          <div className="detail-panel">
            <div className="detail-panel__label">Cliente</div>
            <div className="detail-panel__value">
              <div className="font-semibold text-zinc-900">{selectedDetail.user?.name || 'Venta local'}</div>
              <div>{selectedDetail.user?.email || 'Sin email asociado'}</div>
            </div>
          </div>
        </div>

        <div className="detail-panel">
          <div className="detail-panel__label">Items del pedido</div>
          <div className="mt-3 line-list">
            {selectedDetail.items.map((line) => (
              <div key={line.id} className="line-item">
                <div className="line-item__main">
                  <div className="line-item__title">{line.name}</div>
                  <div className="line-item__meta">
                    Cantidad {line.quantity} · Unitario {money(line.unitPrice)}
                  </div>
                </div>
                <div className="line-item__total">{money(line.lineTotal)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminOrderDetailState({
  loadingDetail,
  selectedDetail,
  onReload,
  onChangeStatus,
}: {
  loadingDetail: boolean;
  selectedDetail: OrderItem | null;
  onReload: () => void;
  onChangeStatus: (orderId: string, status: string) => void;
}) {
  if (loadingDetail) {
    return <LoadingBlock label="Cargando detalle del pedido" lines={3} />;
  }

  if (!selectedDetail) {
    return (
      <EmptyState
        title="No se pudo cargar el detalle"
        description="Reintenta la carga o abre el pedido en su vista completa."
        actions={
          <Button type="button" variant="outline" onClick={onReload}>
            Actualizar listado
          </Button>
        }
      />
    );
  }

  return <AdminOrderDetailPanel selectedDetail={selectedDetail} onChangeStatus={onChangeStatus} />;
}

function OrderMetricCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <article className="nr-stat-card">
      <div className="nr-stat-card__label">{label}</div>
      <div className="nr-stat-card__value">{value}</div>
      <div className="nr-stat-card__meta">{meta}</div>
    </article>
  );
}
