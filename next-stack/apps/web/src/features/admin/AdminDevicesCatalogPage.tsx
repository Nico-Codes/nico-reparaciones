import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from './api';
import {
  buildBrandOptions,
  buildDeviceTypeOptions,
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
import { readRepairCalculationScope } from './admin-repair-calculation-context';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';

export function AdminDevicesCatalogPage() {
  const [searchParams] = useSearchParams();
  const initialScopeRef = useRef(readRepairCalculationScope(searchParams));
  const hydratedFromSearchRef = useRef(false);
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
    const preferredTypeId =
      !hydratedFromSearchRef.current &&
      initialScopeRef.current.deviceTypeId &&
      activeTypes.some((item) => item.id === initialScopeRef.current.deviceTypeId)
        ? initialScopeRef.current.deviceTypeId
        : '';
    const nextDeviceTypeId = deviceType || preferredTypeId || getDefaultDeviceTypeId(activeTypes);
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
    return { brands: brandsResponse.items, issues: issuesResponse.items };
  }

  async function loadModels(brandId?: string) {
    const response = await deviceCatalogApi.models(brandId || undefined);
    setModels(response.items);
  }

  async function refreshAll(nextSelectedBrandId = selectedBrandId) {
    setError('');
    try {
      const nextDeviceTypeId = await loadDeviceTypes();
      const { brands: nextBrands } = await loadBrandsAndIssues(nextDeviceTypeId || undefined);
      const preferredBrandId =
        !hydratedFromSearchRef.current &&
        initialScopeRef.current.deviceBrandId &&
        nextBrands.some((item) => item.id === initialScopeRef.current.deviceBrandId)
          ? initialScopeRef.current.deviceBrandId
          : '';
      const resolvedBrandId =
        nextSelectedBrandId && nextBrands.some((item) => item.id === nextSelectedBrandId)
          ? nextSelectedBrandId
          : preferredBrandId;
      hydratedFromSearchRef.current = true;
      setSelectedBrandId(resolvedBrandId);
      await loadModels(resolvedBrandId || undefined);
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

  const filteredModels = useMemo(
    () => getFilteredModels(models, selectedBrandId),
    [models, selectedBrandId],
  );
  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === selectedBrandId) ?? null,
    [brands, selectedBrandId],
  );
  const deviceTypeOptions = useMemo(
    () => buildDeviceTypeOptions(deviceTypes),
    [deviceTypes],
  );
  const brandOptions = useMemo(() => buildBrandOptions(brands), [brands]);

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
      const response = await deviceCatalogApi.createBrand({
        deviceTypeId: deviceType,
        name: brandDraft.trim(),
        slug: slugify(brandDraft),
        active: true,
      });
      setBrandDraft('');
      setSelectedBrandId(response.item.id);
      await refreshAll(response.item.id);
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

  async function deleteBrand(item: BrandItem) {
    const confirmed = window.confirm(
      `Vas a eliminar la marca "${item.name}".\n\nEste cambio es irreversible. Si solo queres ocultarla, usa "Desactivar".`,
    );
    if (!confirmed) return;
    await runCatalogAction(async () => {
      const nextSelectedBrandId = selectedBrandId === item.id ? '' : selectedBrandId;
      await deviceCatalogApi.deleteBrand(item.id);
      if (nextSelectedBrandId !== selectedBrandId) {
        setSelectedBrandId(nextSelectedBrandId);
      }
      await refreshAll(nextSelectedBrandId);
    }, 'Error eliminando marca');
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

  async function deleteModel(item: ModelItem) {
    const confirmed = window.confirm(
      `Vas a eliminar el modelo "${item.name}".\n\nEste cambio es irreversible. Si solo queres ocultarlo, usa "Desactivar".`,
    );
    if (!confirmed) return;
    await runCatalogAction(async () => {
      await deviceCatalogApi.deleteModel(item.id);
      await refreshAll();
    }, 'Error eliminando modelo');
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

  async function deleteIssue(item: IssueItem) {
    const confirmed = window.confirm(
      `Vas a eliminar la falla "${item.name}".\n\nEste cambio es irreversible. Si solo queres ocultarla, usa "Desactivar".`,
    );
    if (!confirmed) return;
    await runCatalogAction(async () => {
      await deviceCatalogApi.deleteIssue(item.id);
      await refreshAll();
    }, 'Error eliminando falla');
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
          selectedBrandId={selectedBrandId}
          onBrandDraftChange={setBrandDraft}
          onCreateBrand={() => void handleCreateBrand()}
          onRenameBrand={(item) => void renameBrand(item)}
          onToggleBrand={(item) => void toggleBrand(item)}
          onDeleteBrand={(item) => void deleteBrand(item)}
          onSelectBrand={setSelectedBrandId}
        />
        <AdminDevicesCatalogModelsSection
          filteredModels={filteredModels}
          modelDraft={modelDraft}
          selectedBrandId={selectedBrandId}
          selectedBrandName={selectedBrand?.name ?? ''}
          manageGroupsTo={`/admin/gruposmodelos${selectedBrandId || deviceType ? `?${new URLSearchParams({
            ...(deviceType ? { deviceTypeId: deviceType } : {}),
            ...(selectedBrandId ? { deviceBrandId: selectedBrandId } : {}),
          }).toString()}` : ''}`}
          onModelDraftChange={setModelDraft}
          onCreateModel={() => void handleCreateModel()}
          onRenameModel={(item) => void renameModel(item)}
          onToggleModel={(item) => void toggleModel(item)}
          onDeleteModel={(item) => void deleteModel(item)}
        />
        <AdminDevicesCatalogIssuesSection
          issues={issues}
          issueDraft={issueDraft}
          onIssueDraftChange={setIssueDraft}
          onCreateIssue={() => void handleCreateIssue()}
          onRenameIssue={(item) => void renameIssue(item)}
          onToggleIssue={(item) => void toggleIssue(item)}
          onDeleteIssue={(item) => void deleteIssue(item)}
        />
      </div>
    </div>
  );
}
