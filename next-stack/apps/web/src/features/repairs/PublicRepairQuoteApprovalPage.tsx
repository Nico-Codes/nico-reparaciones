import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { repairsApi } from './api';
import {
  canLoadPublicRepairQuoteApproval,
  resolvePublicRepairQuoteApprovalActionError,
  resolvePublicRepairQuoteApprovalLoadError,
} from './public-repair-quote-approval.helpers';
import { PublicRepairQuoteApprovalPageShell } from './public-repair-quote-approval.sections';
import type { PublicRepairQuoteApprovalItem } from './types';

export function PublicRepairQuoteApprovalPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') ?? '').trim();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<PublicRepairQuoteApprovalItem | null>(null);
  const [canDecide, setCanDecide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!canLoadPublicRepairQuoteApproval(id, token)) {
        if (!active) return;
        setError('El enlace de aprobacion es invalido o esta incompleto.');
        setLoading(false);
        return;
      }

      try {
        const response = await repairsApi.publicQuoteApproval(id, token);
        if (!active) return;
        setItem(response.item);
        setCanDecide(response.canDecide);
      } catch (cause) {
        if (!active) return;
        setError(resolvePublicRepairQuoteApprovalLoadError(cause));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id, token]);

  async function onDecision(action: 'approve' | 'reject') {
    if (!canLoadPublicRepairQuoteApproval(id, token) || !canDecide || actionLoading) return;
    setActionLoading(action);
    setError(null);
    setMessage(null);
    try {
      const response =
        action === 'approve'
          ? await repairsApi.publicQuoteApprove(id, token)
          : await repairsApi.publicQuoteReject(id, token);
      setItem(response.item);
      setCanDecide(response.canDecide);
      setMessage(response.message);
    } catch (cause) {
      setError(resolvePublicRepairQuoteApprovalActionError(cause));
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <PublicRepairQuoteApprovalPageShell
      id={id}
      loading={loading}
      error={error}
      item={item}
      canDecide={canDecide}
      message={message}
      actionLoading={actionLoading}
      onDecision={(action) => void onDecision(action)}
    />
  );
}
