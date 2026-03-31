import { useEffect, useMemo, useState } from 'react';
import { adminApi } from './api';
import {
  buildBrandOptions,
  buildDeviceTypeOptions,
  getActiveBrands,
  getDefaultDeviceTypeId,
  getFilteredModels,
  slugify,
  type BrandItem,
  type DeviceTypeItem,
  type IssueItem,
  type ModelItem,
} from './admin-devices-catalog.helpers';
import {
  AdminDevicesCatalogBrandsSection,
  AdminDevicesCatalogFilters,
  AdminDevicesCatalogHero,
  AdminDevicesCatalogIssuesSection,
  AdminDevicesCatalogModelsSection,
} from './admin-devices-catalog.sections';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';

export function AdminDevicesCatalogPage() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeItem[]>([]);
  const [deviceType, setDeviceType] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [error, setError] = useState('');
  const [brandDraft, setBrandDraft] = useState('');
  const [modelDraft, setModelDraft] = useState('');
  const [issueDraft, setIssueDraft] = useState('');

  async function loadDeviceTypes() {
    const response = await adminApi.deviceTypes();
    const activeTypes = response.items.filter((item) => item.active);
    const nextDeviceTypeId = deviceType || getDefaultDeviceTypeId(activeTypes);
    setDeviceTypes(activeTypes);
    setDeviceType((current) => current || nextDeviceTypeId);
    return nextDeviceTypeId;
  }

  async function loadBrandsAndIssues(typeId?: string) {
    const [brandsResponse, issuesResponse] = await Promise.all([
      deviceCatalogApi.brands(typeId),
      deviceCatalogApi.issues(typeId),
    ]);
    setBrands(brandsResponse.items);
    setIssues(issuesResponse.items);
  }

  async function loadModels(brandId?: string) {
    const response = await deviceCatalogApi.models(brandId || undefined);
    setModels(response.items);
  }

  async function refreshAll() {
    setError('');
    try {
      const nextDeviceTypeId = await loadDeviceTypes();
      await loadBrandsAndIssues(nextDeviceTypeId || undefined);
      await loadModels(selectedBrandId || undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando catalogo');
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  useEffect(() => {
    void loadBrandsAndIssues(deviceType || undefined).catch((cause) =>
      setError(cause instanceof Error ? cause.message : 'Error cargando marcas y fallas'),
    );
  }, [deviceType]);

  useEffect(() => {
    void loadModels(selectedBrandId || undefined).catch((cause) =>
      setError(cause instanceof Error ? cause.message : 'Error cargando modelos'),
    );
  }, [selectedBrandId]);

  const activeBrands = useMemo(() => getActiveBrands(brands), [brands]);
  const filteredModels = useMemo(
    () => getFilteredModels(models, selectedBrandId),
    [models, selectedBrandId],
  );
  const deviceTypeOptions = useMemo(
    () => buildDeviceTypeOptions(deviceTypes),
    [deviceTypes],
  );
  const brandOptions = useMemo(() => buildBrandOptions(activeBrands), [activeBrands]);

  async function runCatalogAction(action: () => Promise<void>, fallback: string) {
    setError('');
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallback);
    }
  }

  async function handleCreateBrand() {
    if (!brandDraft.trim() || !deviceType) return;
    await runCatalogAction(async () => {
      await deviceCatalogApi.createBrand({
        deviceTypeId: deviceType,
        name: brandDraft.trim(),
        slug: slugify(brandDraft),
        active: true,
      });
      setBrandDraft('');
      await refreshAll();
    }, 'Error creando marca');
  }

  async function handleCreateModel() {
    if (!selectedBrandId || !modelDraft.trim()) return;
    await runCatalogAction(async () => {
      await deviceCatalogApi.createModel({
        brandId: selectedBrandId,
        name: modelDraft.trim(),
        slug: slugify(modelDraft),
      });
      setModelDraft('');
      await refreshAll();
    }, 'Error creando modelo');
  }

  async function handleCreateIssue() {
    if (!issueDraft.trim() || !deviceType) return;
    await runCatalogAction(async () => {
      await deviceCatalogApi.createIssue({
        deviceTypeId: deviceType,
        name: issueDraft.trim(),
        slug: slugify(issueDraft),
        active: true,
      });
      setIssueDraft('');
      await refreshAll();
    }, 'Error creando falla');
  }

  async function renameBrand(item: BrandItem) {
    const next = window.prompt('Nuevo nombre de marca', item.name)?.trim();
    if (!next || next === item.name) return;
    await runCatalogAction(async () => {
      await deviceCatalogApi.updateBrand(item.id, { name: next, slug: slugify(next) });
      await refreshAll();
    }, 'Error renombrando marca');
  }

  async function toggleBrand(item: BrandItem) {
    await runCatalogAction(async () => {
      await deviceCatalogApi.updateBrand(item.id, { active: !item.active });
      await refreshAll();
    }, 'Error actualizando marca');
  }

  async function renameModel(item: ModelItem) {
    const next = window.prompt('Nuevo nombre de modelo', item.name)?.trim();
    if (!next || next === item.name) return;
    await runCatalogAction(async () => {
      await deviceCatalogApi.updateModel(item.id, { name: next, slug: slugify(next) });
      await refreshAll();
    }, 'Error renombrando modelo');
  }

  async function toggleModel(item: ModelItem) {
    await runCatalogAction(async () => {
      await deviceCatalogApi.updateModel(item.id, { active: !item.active });
      await refreshAll();
    }, 'Error actualizando modelo');
  }

  async function renameIssue(item: IssueItem) {
    const next = window.prompt('Nuevo nombre de falla', item.name)?.trim();
    if (!next || next === item.name) return;
    await runCatalogAction(async () => {
      await deviceCatalogApi.updateIssue(item.id, { name: next, slug: slugify(next) });
      await refreshAll();
    }, 'Error renombrando falla');
  }

  async function toggleIssue(item: IssueItem) {
    await runCatalogAction(async () => {
      await deviceCatalogApi.updateIssue(item.id, { active: !item.active });
      await refreshAll();
    }, 'Error actualizando falla');
  }

  return (
    <div className="store-shell space-y-6">
      <AdminDevicesCatalogHero error={error} />
      <AdminDevicesCatalogFilters
        deviceType={deviceType}
        selectedBrandId={selectedBrandId}
        deviceTypeOptions={deviceTypeOptions}
        brandOptions={brandOptions}
        onDeviceTypeChange={setDeviceType}
        onSelectedBrandChange={setSelectedBrandId}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminDevicesCatalogBrandsSection
          brands={brands}
          brandDraft={brandDraft}
          onBrandDraftChange={setBrandDraft}
          onCreateBrand={() => void handleCreateBrand()}
          onRenameBrand={(item) => void renameBrand(item)}
          onToggleBrand={(item) => void toggleBrand(item)}
        />
        <AdminDevicesCatalogModelsSection
          filteredModels={filteredModels}
          modelDraft={modelDraft}
          selectedBrandId={selectedBrandId}
          onModelDraftChange={setModelDraft}
          onCreateModel={() => void handleCreateModel()}
          onRenameModel={(item) => void renameModel(item)}
          onToggleModel={(item) => void toggleModel(item)}
        />
        <AdminDevicesCatalogIssuesSection
          issues={issues}
          issueDraft={issueDraft}
          onIssueDraftChange={setIssueDraft}
          onCreateIssue={() => void handleCreateIssue()}
          onRenameIssue={(item) => void renameIssue(item)}
          onToggleIssue={(item) => void toggleIssue(item)}
        />
      </div>
    </div>
  );
}
