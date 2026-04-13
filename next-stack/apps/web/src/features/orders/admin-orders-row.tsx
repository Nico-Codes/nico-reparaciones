import { Link } from 'react-router-dom';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime, money, orderPrintHref, orderStatusLabel, ORDER_STATUS_OPTIONS, orderStatusTone, orderTicketHref, timeAgo } from './admin-orders.helpers';
import type { OrderItem } from './types';
import { AdminOrderDetailState } from './admin-orders-detail-panel';

export function AdminOrderRow({
  order,
  isActive,
  selectedDetail,
  loadingDetail,
  updatingOrderId,
  onSelect,
  onReload,
  onChangeStatus,
}: {
  order: OrderItem;
  isActive: boolean;
  selectedDetail: OrderItem | null;
  loadingDetail: boolean;
  updatingOrderId: string | null;
  onSelect: () => void;
  onReload: () => void;
  onChangeStatus: (orderId: string, status: string) => void;
}) {
  const customerName = order.user?.name || 'Venta local';
  const email = order.user?.email || 'Sin email';

  return (
    <article className={`admin-entity-row ${isActive ? 'is-active' : ''}`}>
      <div className="admin-entity-row__top">
        <div className="admin-entity-row__heading">
          <div className="admin-entity-row__title-row">
            <button type="button" className="admin-entity-row__title" onClick={onSelect}>
              Pedido #{order.id.slice(0, 6)}
            </button>
            <StatusBadge label={orderStatusLabel(order.status)} tone={orderStatusTone(order.status)} />
            <StatusBadge label={order.user ? 'Web' : 'Venta local'} tone="neutral" />
            {!order.user?.email ? <StatusBadge label="Sin email" tone="warning" /> : null}
          </div>
          <div className="admin-entity-row__meta">
            <span>{customerName}</span>
            <span>{email}</span>
            <span>{formatDateTime(order.createdAt)}</span>
            <span>{timeAgo(order.createdAt)}</span>
          </div>
        </div>
        <div className="admin-entity-row__aside">
          <span className="admin-entity-row__eyebrow">Total</span>
          <div className="admin-entity-row__value">{money(order.total)}</div>
        </div>
      </div>

      <div className="admin-entity-row__actions">
        <Button type="button" variant="secondary" size="sm" onClick={onSelect}>
          {isActive ? 'Ocultar resumen' : 'Ver resumen'}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/admin/orders/${encodeURIComponent(order.id)}`}>Abrir detalle</Link>
        </Button>
        <ActionDropdown
          renderTrigger={({ open, toggle, triggerRef, menuId }) => (
            <Button
              ref={triggerRef}
              type="button"
              variant="ghost"
              size="sm"
              disabled={updatingOrderId === order.id}
              aria-haspopup="menu"
              aria-controls={menuId}
              aria-expanded={open ? 'true' : 'false'}
              onClick={toggle}
            >
              Acciones
            </Button>
          )}
          menuClassName="min-w-[12rem]"
        >
          {(close) => (
            <>
              <Link to={orderPrintHref(order.id)} target="_blank" rel="noreferrer" className="dropdown-item" onClick={close}>
                Imprimir
              </Link>
              <Link to={orderTicketHref(order.id)} target="_blank" rel="noreferrer" className="dropdown-item" onClick={close}>
                Ticket
              </Link>
            </>
          )}
        </ActionDropdown>
        <ActionDropdown
          renderTrigger={({ open, toggle, triggerRef, menuId }) => (
            <Button
              ref={triggerRef}
              type="button"
              variant="default"
              size="sm"
              disabled={updatingOrderId === order.id}
              aria-haspopup="menu"
              aria-controls={menuId}
              aria-expanded={open ? 'true' : 'false'}
              onClick={toggle}
            >
              {updatingOrderId === order.id ? 'Guardando...' : 'Estado'}
            </Button>
          )}
          menuClassName="min-w-[13rem]"
        >
          {(close) => (
            <>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`dropdown-item ${order.status === option.value ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100' : ''}`}
                  onClick={() => {
                    onChangeStatus(order.id, option.value);
                    close();
                  }}
                  aria-disabled={order.status === option.value || updatingOrderId === order.id ? 'true' : 'false'}
                  disabled={order.status === option.value || updatingOrderId === order.id}
                >
                  {option.label}
                </button>
              ))}
            </>
          )}
        </ActionDropdown>
      </div>

      {isActive ? (
        <div className="admin-entity-row__detail">
          <AdminOrderDetailState
            loadingDetail={loadingDetail}
            selectedDetail={selectedDetail?.id === order.id ? selectedDetail : null}
            onReload={onReload}
            onChangeStatus={onChangeStatus}
          />
        </div>
      ) : null}
    </article>
  );
}
