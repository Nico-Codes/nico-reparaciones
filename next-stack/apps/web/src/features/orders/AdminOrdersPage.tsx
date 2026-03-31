import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { ordersApi } from './api';
import {
  buildOrderStatusCounts,
  buildOrderTotals,
  buildWhatsappCounters,
  hasOrderFilters,
} from './admin-orders.helpers';
import {
  AdminOrdersFilters,
  AdminOrdersHeaderActions,
  AdminOrdersMetrics,
  AdminOrdersTrackingSection,
} from './admin-orders.sections';
import type { OrderItem } from './types';

export function AdminOrdersPage() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  async function load() {
    const requestId = ++listRequestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const res = await ordersApi.adminOrders({ q, status: statusFilter || undefined });
      if (requestId !== listRequestIdRef.current) return;
      setItems(res.items);
      if (selectedId && !res.items.some((item) => item.id === selectedId)) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (cause) {
      if (requestId !== listRequestIdRef.current) return;
      setError(cause instanceof Error ? cause.message : 'Error cargando pedidos');
    } finally {
      if (requestId !== listRequestIdRef.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [q, statusFilter]);

  useEffect(() => {
    if (!selectedId) return;
    const requestId = ++detailRequestIdRef.current;
    setLoadingDetail(true);
    setDetail(null);
    void ordersApi
      .adminOrder(selectedId)
      .then((response) => {
        if (requestId !== detailRequestIdRef.current) return;
        setDetail(response.item);
      })
      .catch((cause) => {
        if (requestId !== detailRequestIdRef.current) return;
        setError(cause instanceof Error ? cause.message : 'Error cargando el detalle');
      })
      .finally(() => {
        if (requestId !== detailRequestIdRef.current) return;
        setLoadingDetail(false);
      });
  }, [selectedId]);

  async function changeStatus(orderId: string, status: string) {
    if (updatingOrderId === orderId) return;
    try {
      setUpdatingOrderId(orderId);
      const response = await ordersApi.adminUpdateStatus(orderId, status);
      setItems((current) => current.map((order) => (order.id === orderId ? response.item : order)));
      setDetail((current) => (current?.id === orderId ? response.item : current));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error actualizando el pedido');
    } finally {
      setUpdatingOrderId((current) => (current === orderId ? null : current));
    }
  }

  const totals = useMemo(() => buildOrderTotals(items), [items]);
  const statusCounts = useMemo(() => buildOrderStatusCounts(items), [items]);
  const whatsappCounters = useMemo(() => buildWhatsappCounters(items), [items]);
  const selectedDetail = detail && detail.id === selectedId ? detail : null;
  const filtersActive = hasOrderFilters(q, statusFilter);

  return (
    <PageShell context="admin" className="space-y-6" data-admin-orders-page>
      <PageHeader
        context="admin"
        eyebrow="Operacion comercial"
        title="Pedidos"
        subtitle="Seguimiento, cambio de estado y revision rapida del detalle sin salir del listado."
        actions={<AdminOrdersHeaderActions orderCount={totals.count} onRefresh={() => void load()} />}
      />

      <AdminOrdersMetrics totals={totals} statusCounts={statusCounts} />

      <AdminOrdersFilters
        q={q}
        statusFilter={statusFilter}
        hasFilters={filtersActive}
        onQueryChange={setQ}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={() => {
          setQ('');
          setStatusFilter('');
        }}
        onReload={() => void load()}
      />

      <AdminOrdersTrackingSection
        error={error}
        loading={loading}
        items={items}
        statusFilter={statusFilter}
        statusCounts={statusCounts}
        whatsappCounters={whatsappCounters}
        selectedId={selectedId}
        selectedDetail={selectedDetail}
        loadingDetail={loadingDetail}
        updatingOrderId={updatingOrderId}
        hasFilters={filtersActive}
        onSelectOrder={(orderId) =>
          setSelectedId((current) => {
            if (current === orderId) {
              setDetail(null);
              return null;
            }
            return orderId;
          })
        }
        onStatusFilterChange={setStatusFilter}
        onReload={() => void load()}
        onClearFilters={() => {
          setQ('');
          setStatusFilter('');
        }}
        onChangeStatus={(orderId, status) => {
          void changeStatus(orderId, status);
        }}
      />
    </PageShell>
  );
}
