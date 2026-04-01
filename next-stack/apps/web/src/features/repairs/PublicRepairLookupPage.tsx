import { useState } from 'react';
import { repairsApi } from './api';
import {
  buildPublicRepairLookupPayload,
  canSubmitPublicRepairLookup,
  resolvePublicRepairLookupError,
} from './public-repair-lookup.helpers';
import { PublicRepairLookupLayout } from './public-repair-lookup.sections';
import type { PublicRepairLookupItem } from './types';

export function PublicRepairLookupPage() {
  const [repairId, setRepairId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [item, setItem] = useState<PublicRepairLookupItem | null>(null);

  const canSubmit = canSubmitPublicRepairLookup(repairId, customerPhone);

  async function lookupRepair() {
    if (!canSubmit) {
      setError('Ingresa el codigo y el telefono con el que registraste la reparacion.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    setItem(null);
    try {
      const response = await repairsApi.publicLookup(buildPublicRepairLookupPayload(repairId, customerPhone));
      if (!response.found || !response.item) {
        setMessage(response.message ?? 'No encontramos una reparacion con esos datos.');
        return;
      }
      setItem(response.item);
      if (response.message) setMessage(response.message);
    } catch (cause) {
      setError(resolvePublicRepairLookupError(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicRepairLookupLayout
      error={error}
      message={message}
      item={item}
      repairId={repairId}
      customerPhone={customerPhone}
      loading={loading}
      canSubmit={canSubmit}
      onSubmit={(event) => {
        event.preventDefault();
        void lookupRepair();
      }}
      onRepairIdChange={setRepairId}
      onCustomerPhoneChange={setCustomerPhone}
      onRetry={() => void lookupRepair()}
    />
  );
}
