import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { ordersApi } from './api';
import { buildAdminOrderDetailView, orderCode } from './admin-order-detail.helpers';
import {
  AdminOrderDetailAlerts,
  AdminOrderDetailBody,
  AdminOrderDetailHeaderActions,
  AdminOrderDetailLoadingState,
  AdminOrderDetailMetrics,
  AdminOrderDetailNotFoundState,
  AdminOrderDetailUnavailableState,
} from './admin-order-detail.sections';
import type { OrderItem } from './types';

export function AdminOrderDetailPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('PENDIENTE');
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await ordersApi.adminOrder(id);
      setItem(res.item);
      setStatus(res.item.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el pedido.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function saveStatus() {
    if (!item) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await ordersApi.adminUpdateStatus(item.id, status);
      setItem(res.item);
      setStatus(res.item.status);
      setNotice('Estado actualizado correctamente.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el estado.');
    } finally {
      setSaving(false);
    }
  }

  const view = useMemo(() => (item ? buildAdminOrderDetailView(item) : null), [item]);

  if (loading) return <AdminOrderDetailLoadingState />;
  if (error && !item) return <AdminOrderDetailUnavailableState error={error} />;
  if (!item || !view) return <AdminOrderDetailNotFoundState />;

  return (
    <PageShell context="admin" className="space-y-5">
      <PageHeader
        context="admin"
        eyebrow="Pedidos"
        title={`Pedido ${orderCode(item.id)}`}
        subtitle={view.subtitle}
        actions={<AdminOrderDetailHeaderActions view={view} />}
      />

      <AdminOrderDetailMetrics view={view} />
      <AdminOrderDetailAlerts error={error} notice={notice} />
      <AdminOrderDetailBody
        item={item}
        status={status}
        saving={saving}
        view={view}
        onStatusChange={setStatus}
        onSaveStatus={() => void saveStatus()}
      />
    </PageShell>
  );
}
