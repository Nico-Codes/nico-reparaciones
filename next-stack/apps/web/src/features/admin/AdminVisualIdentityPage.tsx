import { useEffect, useMemo, useState } from 'react';
import { brandAssetsApi } from './brandAssetsApi';
import {
  AdminVisualIdentityAlerts,
  AdminVisualIdentityAuthCopySection,
  AdminVisualIdentityHeader,
  AdminVisualIdentityResourcesSection,
} from './admin-visual-identity.sections';
import {
  buildAuthVisualFormState,
  buildAuthVisualSettingsPayload,
  DEFAULT_AUTH_VISUAL_FORM_STATE,
  type AssetCard,
  type AuthVisualFormState,
} from './admin-visual-identity.helpers';
import { adminSettingsApi, type AdminSettingItem } from './settingsApi';

export function AdminVisualIdentityPage() {
  const [settings, setSettings] = useState<AdminSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCopy, setSavingCopy] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authForm, setAuthForm] = useState<AuthVisualFormState>(DEFAULT_AUTH_VISUAL_FORM_STATE);

  const settingsByKey = useMemo(() => new Map(settings.map((setting) => [setting.key, setting])), [settings]);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const res = await adminSettingsApi.list();
      setSettings(res.items);
      setAuthForm(buildAuthVisualFormState(res.items));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando identidad visual');
    } finally {
      setLoading(false);
    }
  }

  async function uploadAsset(item: AssetCard, explicitFile?: File | null) {
    const file = explicitFile ?? selectedFiles[item.slot];
    if (!file) return;
    setUploadingSlot(item.slot);
    setError('');
    setSuccess('');
    try {
      await brandAssetsApi.upload(item.slot, file);
      setSelectedFiles((current) => ({ ...current, [item.slot]: null }));
      setSuccess(`${item.title} actualizado`);
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo archivo');
    } finally {
      setUploadingSlot(null);
    }
  }

  async function handleSelectFile(item: AssetCard, file: File | null) {
    setSelectedFiles((current) => ({ ...current, [item.slot]: file }));
    if (!file) return;
    await uploadAsset(item, file);
  }

  async function resetAsset(item: AssetCard) {
    setUploadingSlot(item.slot);
    setError('');
    setSuccess('');
    try {
      await brandAssetsApi.reset(item.slot);
      setSelectedFiles((current) => ({ ...current, [item.slot]: null }));
      setSuccess(`${item.title} restaurado por defecto`);
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error restaurando asset');
    } finally {
      setUploadingSlot(null);
    }
  }

  async function saveAuthCopy() {
    setSavingCopy(true);
    setError('');
    setSuccess('');
    try {
      await adminSettingsApi.save(buildAuthVisualSettingsPayload(settingsByKey, authForm));
      setSuccess('Textos de acceso actualizados');
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando textos de acceso');
    } finally {
      setSavingCopy(false);
    }
  }

  function patchAuthForm<K extends keyof AuthVisualFormState>(field: K, value: AuthVisualFormState[K]) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="store-shell space-y-5">
      <AdminVisualIdentityHeader />
      <AdminVisualIdentityAlerts error={error} success={success} />
      <AdminVisualIdentityResourcesSection
        settingsByKey={settingsByKey}
        loading={loading}
        uploadingSlot={uploadingSlot}
        selectedFiles={selectedFiles}
        onSelectFile={(item, file) => void handleSelectFile(item, file)}
        onUpload={(item) => void uploadAsset(item)}
        onReset={(item) => void resetAsset(item)}
      />
      <AdminVisualIdentityAuthCopySection
        form={authForm}
        disabled={loading || savingCopy || Boolean(uploadingSlot)}
        saving={savingCopy}
        onChange={patchAuthForm}
        onSave={() => void saveAuthCopy()}
      />
    </div>
  );
}
