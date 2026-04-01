import { useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminDashboardResponse } from './api';
import { buildAlertStats, resolveAdminAlertsLoadError, type AlertViewState } from './admin-alerts.helpers';
import { AdminAlertsLayout } from './admin-alerts.sections';

export function AdminAlertsPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seen, setSeen] = useState<AlertViewState>({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await adminApi.dashboard();
        if (!mounted) return;
        setData(response);
      } catch (cause) {
        if (!mounted) return;
        setError(resolveAdminAlertsLoadError(cause));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const { alerts, unseenCount, highSeverityCount } = useMemo(
    () => buildAlertStats(data?.alerts ?? [], seen),
    [data?.alerts, seen],
  );

  return (
    <AdminAlertsLayout
      loading={loading}
      error={error}
      alerts={alerts}
      unseenCount={unseenCount}
      highSeverityCount={highSeverityCount}
      seen={seen}
      onMarkAllSeen={() => setSeen(Object.fromEntries(alerts.map((alert) => [alert.id, true])))}
      onMarkSeen={(alertId) => setSeen((current) => ({ ...current, [alertId]: true }))}
    />
  );
}
