import { useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminAccountingItem } from '@/features/admin/api';
import {
  buildAccountingCategoryOptions,
  buildAccountingRequestParams,
  type AccountingCategorySummaryItem,
  type AccountingDirectionFilter,
  type AccountingSummary,
} from './admin-accounting.helpers';
import {
  AdminAccountingCategorySummarySection,
  AdminAccountingEntriesSection,
  AdminAccountingFeedback,
  AdminAccountingFilters,
  AdminAccountingHero,
  AdminAccountingSummaryCards,
} from './admin-accounting.sections';

export function AdminAccountingPage() {
  const [rows, setRows] = useState<AdminAccountingItem[]>([]);
  const [categories, setCategories] = useState<AccountingCategorySummaryItem[]>([]);
  const [summary, setSummary] = useState<AccountingSummary>({
    entriesCount: 0,
    inflowTotal: 0,
    outflowTotal: 0,
    netTotal: 0,
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [direction, setDirection] = useState<AccountingDirectionFilter>('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await adminApi.accounting(
          buildAccountingRequestParams({ q, direction, category, from, to }),
        );
        if (!mounted) return;
        setRows(response.items);
        setCategories(response.categorySummary);
        setSummary(response.summary);
        setAvailableCategories(response.categories);
        if (!from) setFrom(response.filters.from);
        if (!to) setTo(response.filters.to);
      } catch (cause) {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'Error cargando contabilidad');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  const categoryOptions = useMemo(
    () => buildAccountingCategoryOptions(availableCategories),
    [availableCategories],
  );

  return (
    <div className="store-shell space-y-5">
      <AdminAccountingHero />
      <AdminAccountingFeedback error={error} />
      <AdminAccountingSummaryCards summary={summary} />
      <AdminAccountingCategorySummarySection categories={categories} />
      <AdminAccountingFilters
        q={q}
        direction={direction}
        category={category}
        from={from}
        to={to}
        categoryOptions={categoryOptions}
        onQueryChange={setQ}
        onDirectionChange={setDirection}
        onCategoryChange={setCategory}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={() => setRefreshTick((value) => value + 1)}
        onClear={() => {
          setQ('');
          setDirection('');
          setCategory('');
          setRefreshTick((value) => value + 1);
        }}
      />
      <AdminAccountingEntriesSection rows={rows} loading={loading} />
    </div>
  );
}
