import { useEffect, useMemo, useState } from 'react';
import { brandAssetsApi } from './brandAssetsApi';
import {
  buildHeroFormState,
  buildHeroSettingsPayload,
  DEFAULT_HERO_FORM_STATE,
  type HeroAssetSlot,
  type HeroSettingsFormState,
} from './admin-store-hero-settings.helpers';
import {
  AdminStoreHeroAlerts,
  AdminStoreHeroAssetsSection,
  AdminStoreHeroHeader,
  AdminStoreHeroTextSettingsSection,
} from './admin-store-hero-settings.sections';
import { adminSettingsApi, type AdminSettingItem } from './settingsApi';

export function AdminStoreHeroSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<HeroAssetSlot | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<HeroSettingsFormState>(DEFAULT_HERO_FORM_STATE);
  const [selectedFiles, setSelectedFiles] = useState<Partial<Record<HeroAssetSlot, File | null>>>({});

  useEffect(() => {
    void loadSettings();
  }, []);

  const settingsByKey = useMemo(
    () => new Map(settings.map((setting) => [setting.key, setting])),
    [settings],
  );

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const res = await adminSettingsApi.list();
      setSettings(res.items);
      setForm(buildHeroFormState(res.items));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando configuracion');
    } finally {
      setLoading(false);
    }
  }

  async function saveTextSettings() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminSettingsApi.save(buildHeroSettingsPayload(settingsByKey, form));
      setSuccess('Portada de tienda guardada');
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando portada de tienda');
    } finally {
      setSaving(false);
    }
  }

  async function uploadHeroImage(slot: HeroAssetSlot) {
    const file = selectedFiles[slot];
    if (!file) return;
    setUploadingSlot(slot);
    setError('');
    setSuccess('');
    try {
      await brandAssetsApi.upload(slot, file);
      setSelectedFiles((current) => ({ ...current, [slot]: null }));
      setSuccess('Imagen de portada guardada');
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo imagen');
    } finally {
      setUploadingSlot(null);
    }
  }

  async function resetHeroImage(slot: HeroAssetSlot) {
    setUploadingSlot(slot);
    setError('');
    setSuccess('');
    try {
      await brandAssetsApi.reset(slot);
      setSelectedFiles((current) => ({ ...current, [slot]: null }));
      setSuccess('Imagen restaurada por defecto');
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error restaurando imagen');
    } finally {
      setUploadingSlot(null);
    }
  }

  function patchForm<K extends keyof HeroSettingsFormState>(field: K, value: HeroSettingsFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="store-shell space-y-5">
      <AdminStoreHeroHeader />
      <AdminStoreHeroAlerts error={error} success={success} />
      <AdminStoreHeroAssetsSection
        settingsByKey={settingsByKey}
        disabled={loading || saving}
        uploadingSlot={uploadingSlot}
        selectedFiles={selectedFiles}
        onSelectFile={(slot, file) => setSelectedFiles((current) => ({ ...current, [slot]: file }))}
        onUpload={(slot) => void uploadHeroImage(slot)}
        onReset={(slot) => void resetHeroImage(slot)}
      />
      <AdminStoreHeroTextSettingsSection
        form={form}
        disabled={loading || saving}
        saving={saving}
        onChange={patchForm}
        onSave={() => void saveTextSettings()}
      />
    </div>
  );
}
