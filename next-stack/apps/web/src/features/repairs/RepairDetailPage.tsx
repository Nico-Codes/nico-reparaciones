import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { repairsApi } from './api';
import { resolveRepairDetailLoadError } from './repair-detail.helpers';
import { RepairDetailEmpty, RepairDetailLayout, RepairDetailLoading } from './repair-detail.sections';
import type { RepairItem } from './types';

export function RepairDetailPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<RepairItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    repairsApi
      .myDetail(id)
      .then((res) => {
        if (active) setItem(res.item);
      })
      .catch((cause) => {
        if (active) setError(resolveRepairDetailLoadError(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <RepairDetailLoading />;
  if (error || !item) return <RepairDetailEmpty error={error} />;
  return <RepairDetailLayout item={item} />;
}
