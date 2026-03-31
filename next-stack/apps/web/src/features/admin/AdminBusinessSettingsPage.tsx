import { useEffect, useState } from 'react';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  buildBusinessForm,
  buildBusinessSettingsPayload,
  DEFAULT_BUSINESS_FORM,
  hasBusinessSettingsChanges,
  type BusinessForm,
} from './admin-business-settings.helpers';
import {
  AdminBusinessSettingsActions,
  AdminBusinessSettingsFeedback,
  AdminBusinessSettingsMain,
  AdminBusinessSettingsPageActions,
  AdminBusinessSettingsSidebar,
} from './admin-business-settings.sections';
import { adminSettingsApi, type AdminSettingItem } from './settingsApi';

export function AdminBusinessSettingsPage() {
  const [form, setForm] = useState<BusinessForm>(DEFAULT_BUSINESS_FORM);
  const [initialForm, setInitialForm] = useState<BusinessForm>(DEFAULT_BUSINESS_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isDirty = hasBusinessSettingsChanges(form, initialForm);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await adminSettingsApi.list();
      const settingsByKey = new Map<string, AdminSettingItem>(
        response.items.map((item) => [item.key, item]),
      );
      const nextForm = buildBusinessForm(settingsByKey);
      setForm(nextForm);
      setInitialForm(nextForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los datos del negocio.');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminSettingsApi.save(buildBusinessSettingsPayload(form));
      setInitialForm(form);
      setSuccess('Los datos del negocio se guardaron correctamente.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  function cancelChanges() {
    setForm(initialForm);
    setError('');
    setSuccess('');
  }

  function patchForm<K extends keyof BusinessForm>(field: K, value: BusinessForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  if (loading) {
    return (
      <PageShell context="admin" className="space-y-6">
        <PageHeader
          context="admin"
          eyebrow="Configuracion"
          title="Datos del negocio"
          subtitle="Cargando los ajustes base que usa el sistema en mensajes, comprobantes y vistas publicas."
          actions={<StatusBadge tone="info" label="Cargando" />}
        />
        <SectionCard>
          <LoadingBlock label="Cargando datos del negocio" lines={4} />
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Configuracion"
        title="Datos del negocio"
        subtitle="Informacion general reutilizada en mensajes, comprobantes, alertas y portada de la tienda."
        actions={<AdminBusinessSettingsPageActions isDirty={isDirty} />}
      />

      <AdminBusinessSettingsFeedback error={error} success={success} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.9fr)]">
        <AdminBusinessSettingsMain form={form} onChange={patchForm} />

        <div className="space-y-6">
          <AdminBusinessSettingsSidebar form={form} />
          <AdminBusinessSettingsActions
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
