import { useEffect, useMemo, useState } from 'react';
import { brandAssetsApi } from './brandAssetsApi';
import {
  AdminVisualIdentityAlerts,
  AdminVisualIdentityHeader,
  AdminVisualIdentityResourcesSection,
} from './admin-visual-identity.sections';
import type { AssetCard } from './admin-visual-identity.helpers';
import { adminSettingsApi, type AdminSettingItem } from './settingsApi';

export function AdminVisualIdentityPage() {
  const [settings, setSettings] = useState<AdminSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando identidad visual');
    } finally {
      setLoading(false);
    }
  }

  async function uploadAsset(item: AssetCard) {
    const file = selectedFiles[item.slot];
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

  return (
    <div className="store-shell space-y-5">
      <AdminVisualIdentityHeader />
      <AdminVisualIdentityAlerts error={error} success={success} />
      <AdminVisualIdentityResourcesSection
        settingsByKey={settingsByKey}
        loading={loading}
        uploadingSlot={uploadingSlot}
        selectedFiles={selectedFiles}
        onSelectFile={(slot, file) => setSelectedFiles((current) => ({ ...current, [slot]: file }))}
        onUpload={(item) => void uploadAsset(item)}
        onReset={(item) => void resetAsset(item)}
      />
    </div>
  );
}
