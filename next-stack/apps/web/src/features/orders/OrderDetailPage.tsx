import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ordersApi } from './api';
import { resolveOrderDetailLoadError } from './order-detail.helpers';
import { OrderDetailEmpty, OrderDetailLayout, OrderDetailLoading } from './order-detail.sections';
import type { OrderItem } from './types';

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    ordersApi
      .myOrder(id)
      .then((res) => {
        if (active) setOrder(res.item);
      })
      .catch((cause) => {
        if (active) setError(resolveOrderDetailLoadError(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <OrderDetailLoading />;
  if (error || !order) return <OrderDetailEmpty error={error} />;
  return <OrderDetailLayout order={order} />;
}
