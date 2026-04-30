import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ordersApi } from './api';
import {
  buildOrderReservationWhatsappUrl,
  buildOrderTransferWhatsappUrl,
  orderHasSpecialOrderLines,
  orderUsesTransferPayment,
  resolveOrderDetailLoadError,
} from './order-detail.helpers';
import { OrderDetailEmpty, OrderDetailLayout, OrderDetailLoading } from './order-detail.sections';
import type { CheckoutTransferDetails, OrderItem } from './types';

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [transferDetails, setTransferDetails] = useState<CheckoutTransferDetails | null>(null);
  const [businessWhatsappPhone, setBusinessWhatsappPhone] = useState<string | null>(null);
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
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

        setBusinessWhatsappPhone(
          configResult.status === 'fulfilled'
            ? configResult.value.businessContact?.whatsappPhone ?? configResult.value.transferDetails.supportWhatsappPhone
            : null,
        );

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

  useEffect(() => {
    if (!order || !orderHasSpecialOrderLines(order)) return;
    const params = new URLSearchParams(location.search);
    if (params.get('reservation') === '1') {
      setReservationDialogOpen(true);
      params.delete('reservation');
      navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
    }
  }, [location.pathname, location.search, navigate, order]);

  const transferWhatsappUrl = useMemo(() => {
    if (!order) return null;
    return buildOrderTransferWhatsappUrl(order, transferDetails);
  }, [order, transferDetails]);
  const reservationWhatsappUrl = useMemo(() => {
    if (!order) return null;
    const orderUrl = typeof window === 'undefined' ? null : window.location.href;
    return buildOrderReservationWhatsappUrl(order, businessWhatsappPhone, orderUrl);
  }, [businessWhatsappPhone, order]);

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
      reservationWhatsappUrl={reservationWhatsappUrl}
      reservationDialogOpen={reservationDialogOpen}
      proofFile={proofFile}
      proofUploading={proofUploading}
      proofFeedback={proofFeedback}
      proofFeedbackTone={proofFeedbackTone}
      onProofFileChange={setProofFile}
      onProofUpload={() => void uploadTransferProof()}
      onCloseReservationDialog={() => setReservationDialogOpen(false)}
    />
  );
}
