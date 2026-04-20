import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ordersApi } from './api';
import {
  buildOrderTransferWhatsappUrl,
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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [proofFeedback, setProofFeedback] = useState('');
  const [proofFeedbackTone, setProofFeedbackTone] = useState<'success' | 'warning'>('success');

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
        setProofFile(null);
        setProofFeedback('');
        setProofFeedbackTone('success');

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

  const transferWhatsappUrl = useMemo(() => {
    if (!order) return null;
    return buildOrderTransferWhatsappUrl(order, transferDetails);
  }, [order, transferDetails]);

  async function uploadTransferProof() {
    if (!order || !proofFile) return;
    setProofUploading(true);
    setProofFeedback('');
    try {
      const response = await ordersApi.uploadTransferProof(order.id, proofFile);
      setOrder(response.item);
      setProofFile(null);
      setProofFeedback('Comprobante cargado correctamente.');
      setProofFeedbackTone('success');
    } catch (cause) {
      setProofFeedback(cause instanceof Error ? cause.message : 'No pudimos cargar el comprobante.');
      setProofFeedbackTone('warning');
    } finally {
      setProofUploading(false);
    }
  }

  if (loading) return <OrderDetailLoading />;
  if (error || !order) return <OrderDetailEmpty error={error} />;
  return (
    <OrderDetailLayout
      order={order}
      transferDetails={transferDetails}
      transferWhatsappUrl={transferWhatsappUrl}
      proofFile={proofFile}
      proofUploading={proofUploading}
      proofFeedback={proofFeedback}
      proofFeedbackTone={proofFeedbackTone}
      onProofFileChange={setProofFile}
      onProofUpload={() => void uploadTransferProof()}
    />
  );
}
