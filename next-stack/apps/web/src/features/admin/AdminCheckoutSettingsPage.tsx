import { useEffect, useState } from 'react';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  buildCheckoutSettingsForm,
  buildCheckoutSettingsPayload,
  DEFAULT_CHECKOUT_SETTINGS_FORM,
  hasCheckoutSettingsChanges,
  type CheckoutSettingsForm,
} from './admin-checkout-settings.helpers';
import {
  AdminCheckoutSettingsActions,
  AdminCheckoutSettingsFeedback,
  AdminCheckoutSettingsMain,
  AdminCheckoutSettingsPageActions,
  AdminCheckoutSettingsSidebar,
} from './admin-checkout-settings.sections';
import { adminSettingsApi } from './settingsApi';

export function AdminCheckoutSettingsPage() {
  const [form, setForm] = useState<CheckoutSettingsForm>(DEFAULT_CHECKOUT_SETTINGS_FORM);
  const [initialForm, setInitialForm] = useState<CheckoutSettingsForm>(
    DEFAULT_CHECKOUT_SETTINGS_FORM,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isDirty = hasCheckoutSettingsChanges(form, initialForm);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await adminSettingsApi.list();
      const nextForm = buildCheckoutSettingsForm(
        new Map(response.items.map((item) => [item.key, item])),
      );
      setForm(nextForm);
      setInitialForm(nextForm);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo cargar la configuracion de checkout.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminSettingsApi.save(buildCheckoutSettingsPayload(form));
      setInitialForm(form);
      setSuccess('La configuracion de checkout se guardo correctamente.');
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'No se pudieron guardar los cambios.',
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelChanges() {
    setForm(initialForm);
    setError('');
    setSuccess('');
  }

  function patchForm<K extends keyof CheckoutSettingsForm>(
    field: K,
    value: CheckoutSettingsForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  if (loading) {
    return (
      <PageShell context="admin" className="space-y-6">
        <PageHeader
          context="admin"
          eyebrow="Configuracion"
          title="Checkout y pagos"
          subtitle="Cargando la configuracion avanzada del checkout y el bloque de transferencia."
          actions={<StatusBadge tone="info" label="Cargando" />}
        />
        <SectionCard>
          <LoadingBlock label="Cargando checkout y pagos" lines={4} />
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Configuracion"
        title="Checkout y pagos"
        subtitle="Define como se presenta el bloque de transferencia y deja listos los cuatro metodos de pago del checkout."
        actions={<AdminCheckoutSettingsPageActions isDirty={isDirty} />}
      />

      <AdminCheckoutSettingsFeedback error={error} success={success} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.9fr)]">
        <AdminCheckoutSettingsMain form={form} onChange={patchForm} />

        <div className="space-y-6">
          <AdminCheckoutSettingsSidebar form={form} />
          <AdminCheckoutSettingsActions
            isDirty={isDirty}
            saving={saving}
            onCancel={cancelChanges}
            onSave={() => void save()}
          />
        </div>
      </div>
    </PageShell>
  );
}
