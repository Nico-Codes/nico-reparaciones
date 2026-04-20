import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ordersApi } from './api';
import {
  orderUsesTransferPayment,
  resolveOrderDetailLoadError,
} from './order-detail.helpers';
import { OrderDetailEmpty, OrderDetailLayout, OrderDetailLoading } from './order-detail.sections';
import type { CheckoutTransferDetails, OrderItem } from './types';

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [transferDetails, setTransferDetails] = useState<CheckoutTransferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([ordersApi.myOrder(id), ordersApi.checkoutConfig()])
      .then(([orderResult, configResult]) => {
        if (!active) return;
        if (orderResult.status !== 'fulfilled') {
          setError(resolveOrderDetailLoadError(orderResult.reason));
          return;
        }

        const nextOrder = orderResult.value.item;
        setOrder(nextOrder);

        if (
          orderUsesTransferPayment(nextOrder.paymentMethod) &&
          configResult.status === 'fulfilled'
        ) {
          setTransferDetails(configResult.value.transferDetails);
        } else {
          setTransferDetails(null);
        }
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
  return <OrderDetailLayout order={order} transferDetails={transferDetails} />;
}
