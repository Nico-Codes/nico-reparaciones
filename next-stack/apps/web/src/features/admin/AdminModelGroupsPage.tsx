import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { adminApi } from './api';
import { readRepairCalculationScope } from './admin-repair-calculation-context';
import {
  buildModelGroupBrandOptions,
  buildModelGroupDeviceTypeOptions,
  buildModelGroupOptions,
  patchModelGroup,
  type BrandOpt,
  type DeviceTypeOpt,
  type GroupRow,
  type ModelRow,
} from './admin-model-groups.helpers';
import {
  AdminModelGroupsAlerts,
  AdminModelGroupsContent,
  AdminModelGroupsEmptyState,
  AdminModelGroupsFilters,
  AdminModelGroupsHero,
} from './admin-model-groups.sections';

export function AdminModelGroupsPage() {
  const [searchParams] = useSearchParams();
  const initialScope = useMemo(() => readRepairCalculationScope(searchParams), [searchParams]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeOpt[]>([]);
  const [brands, setBrands] = useState<BrandOpt[]>([]);
  const [deviceType, setDeviceType] = useState('');
  const [brand, setBrand] = useState('');
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [models, setModels] = useState<ModelRow[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupActive, setNewGroupActive] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingBrandData, setLoadingBrandData] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);
  const [assigningModelId, setAssigningModelId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadFilters() {
      setLoadingFilters(true);
      setError('');
      try {
        const typesRes = await adminApi.deviceTypes();
        if (!mounted) return;
        const activeTypes = typesRes.items.filter((item) => item.active);
        setDeviceTypes(activeTypes);
        setDeviceType((current) =>
          current ||
          (initialScope.deviceTypeId && activeTypes.some((item) => item.id === initialScope.deviceTypeId)
            ? initialScope.deviceTypeId
            : ''),
        );
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando catálogo');
      } finally {
        if (mounted) setLoadingFilters(false);
      }
    }
    void loadFilters();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadBrands() {
      setLoadingBrands(true);
      setError('');
      try {
        const brandsRes = await deviceCatalogApi.brands(deviceType || undefined);
        if (!mounted) return;
        const activeBrands = brandsRes.items.filter((item) => item.active);
        setBrands(activeBrands);
        setBrand((current) => {
          if (current && activeBrands.some((brandItem) => brandItem.id === current)) return current;
          if (initialScope.deviceBrandId && activeBrands.some((brandItem) => brandItem.id === initialScope.deviceBrandId)) {
            return initialScope.deviceBrandId;
          }
          return '';
        });
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando marcas');
        setBrands([]);
        setBrand('');
      } finally {
        if (mounted) setLoadingBrands(false);
      }
    }
    void loadBrands();
    return () => {
      mounted = false;
    };
  }, [deviceType]);

  async function loadBrandData(brandId: string) {
    if (!brandId) {
      setGroups([]);
      setModels([]);
      return;
    }
    setLoadingBrandData(true);
    setError('');
    try {
      const res = await adminApi.modelGroups(brandId);
      setGroups(res.groups);
      setModels(res.models);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando grupos/modelos');
    } finally {
      setLoadingBrandData(false);
    }
  }

  useEffect(() => {
    void loadBrandData(brand);
  }, [brand]);

  const deviceTypeOptions = useMemo(() => buildModelGroupDeviceTypeOptions(deviceTypes), [deviceTypes]);
  const brandOptions = useMemo(() => buildModelGroupBrandOptions(brands), [brands]);
  const groupOptions = useMemo(() => buildModelGroupOptions(groups), [groups]);

  async function createGroup() {
    if (!brand || !newGroupName.trim()) return;
    setCreatingGroup(true);
    setError('');
    setSuccess('');
    try {
      await adminApi.createModelGroup({ deviceBrandId: brand, name: newGroupName.trim(), active: newGroupActive });
      setNewGroupName('');
      setNewGroupActive(true);
      setSuccess('Grupo creado.');
      await loadBrandData(brand);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el grupo');
    } finally {
      setCreatingGroup(false);
    }
  }

  async function saveGroup(group: GroupRow) {
    setSavingGroupId(group.id);
    setError('');
    setSuccess('');
    try {
      await adminApi.updateModelGroup(group.id, { deviceBrandId: brand, name: group.name.trim(), active: group.active });
      setSuccess('Grupo actualizado.');
      await loadBrandData(brand);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el grupo');
    } finally {
      setSavingGroupId(null);
    }
  }

  async function assignModel(modelId: string, deviceModelGroupId: string) {
    setAssigningModelId(modelId);
    setError('');
    setSuccess('');
    try {
      await adminApi.assignModelGroup(modelId, { deviceBrandId: brand, deviceModelGroupId: deviceModelGroupId || null });
      setModels((current) =>
        current.map((model) => (model.id === modelId ? { ...model, deviceModelGroupId: deviceModelGroupId || null } : model)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo asignar el modelo');
    } finally {
      setAssigningModelId(null);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <AdminModelGroupsHero />
      <AdminModelGroupsAlerts error={error} success={success} />
      <AdminModelGroupsFilters
        deviceType={deviceType}
        brand={brand}
        loadingFilters={loadingFilters}
        loadingBrands={loadingBrands}
        deviceTypeOptions={deviceTypeOptions}
        brandOptions={brandOptions}
        onDeviceTypeChange={setDeviceType}
        onBrandChange={setBrand}
        onReload={() => void loadBrandData(brand)}
      />

      {!brand ? (
        <AdminModelGroupsEmptyState />
      ) : (
        <AdminModelGroupsContent
          groups={groups}
          models={models}
          groupOptions={groupOptions}
          newGroupName={newGroupName}
          newGroupActive={newGroupActive}
          loadingBrandData={loadingBrandData}
          creatingGroup={creatingGroup}
          savingGroupId={savingGroupId}
          assigningModelId={assigningModelId}
          onNewGroupNameChange={setNewGroupName}
          onNewGroupActiveChange={setNewGroupActive}
          onCreateGroup={() => void createGroup()}
          onPatchGroup={(groupId, patch) => setGroups((current) => patchModelGroup(current, groupId, patch))}
          onSaveGroup={(group) => void saveGroup(group)}
          onAssignModel={(modelId, groupId) => void assignModel(modelId, groupId)}
        />
      )}
    </div>
  );
}
