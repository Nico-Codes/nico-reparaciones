import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CustomSelectMenuAction } from '@/components/ui/custom-select';
import { adminApi } from './api';
import type { DeviceTypeItem, BrandItem, IssueItem, ModelItem } from './admin-devices-catalog.helpers';
import { findSimilarModels, hasExactModelMatch, slugify } from './admin-devices-catalog.helpers';
import {
  applyRepairCalculationScopePatch,
  buildRepairCalculationSearch,
  buildRepairRuleSpecificity,
  buildRepairScopeSummary,
  EMPTY_REPAIR_CALCULATION_SCOPE,
  filterRepairRulesByScope,
  hydrateRepairCalculationScope,
  readRepairCalculationScope,
  sortRowsByFocusId,
  type RepairCalculationCatalog,
  type RepairCalculationGroupItem,
  type RepairCalculationScope,
} from './admin-repair-calculation-context';
import {
  AdminRepairCalculationsBrandsPanel,
  AdminRepairCalculationsGroupsPanel,
  AdminRepairCalculationsGuideSection,
  AdminRepairCalculationsHubHero,
  AdminRepairCalculationsIssuesPanel,
  AdminRepairCalculationsModelsPanel,
  AdminRepairCalculationsQuickCreateDialog,
  AdminRepairCalculationsRulesPanel,
  AdminRepairCalculationsScopeSection,
  AdminRepairCalculationsTypesPanel,
} from './admin-repair-calculations-hub.sections';
import { fromApiRepairRule, type RepairRuleRow } from './admin-repair-pricing-rules.helpers';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi } from '@/features/repairs/api';

type RepairRulesApiRow = NonNullable<Awaited<ReturnType<typeof repairsApi.pricingRulesList>>['items']>;
type QuickCreateKind = 'deviceType' | 'brand' | 'group' | 'model' | 'issue';
type QuickCreateState = { kind: QuickCreateKind; value: string };

function normalizeTaxonomyDraft(value: string) {
  return value.toUpperCase();
}

export function AdminRepairCalculationsHubPage() {
  const [searchParams] = useSearchParams();
  const initialScopeRef = useRef(readRepairCalculationScope(searchParams));
  const hydratedFromSearchRef = useRef(false);
  const pendingScopePatchRef = useRef<Partial<RepairCalculationScope> | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [groups, setGroups] = useState<RepairCalculationGroupItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [rules, setRules] = useState<RepairRuleRow[]>([]);
  const [scope, setScope] = useState<RepairCalculationScope>(EMPTY_REPAIR_CALCULATION_SCOPE);

  const [typeDraft, setTypeDraft] = useState('');
  const [typeDraftActive, setTypeDraftActive] = useState(true);
  const [brandDraft, setBrandDraft] = useState('');
  const [groupDraft, setGroupDraft] = useState('');
  const [groupDraftActive, setGroupDraftActive] = useState(true);
  const [modelDraft, setModelDraft] = useState('');
  const [issueDraft, setIssueDraft] = useState('');
  const [quickCreate, setQuickCreate] = useState<QuickCreateState | null>(null);

  const [creatingType, setCreatingType] = useState(false);
  const [savingTypeId, setSavingTypeId] = useState<string | null>(null);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);
  const [assigningModelId, setAssigningModelId] = useState<string | null>(null);

  const catalog = useMemo<RepairCalculationCatalog>(
    () => ({ deviceTypes, brands, groups, models, issues }),
    [deviceTypes, brands, groups, models, issues],
  );

  async function loadGroupCatalog(brandRows: BrandItem[]) {
    if (brandRows.length === 0) return [] as RepairCalculationGroupItem[];

    const settled = await Promise.allSettled(
      brandRows.map(async (brand) => {
        const response = await adminApi.modelGroups(brand.id);
        return response.groups.map((group) => ({ ...group, deviceBrandId: brand.id }));
      }),
    );

    return settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  }

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [deviceTypesRes, brandsRes, modelsRes, issuesRes, rulesRes] = await Promise.all([
        adminApi.deviceTypes(),
        deviceCatalogApi.brands(),
        deviceCatalogApi.models(),
        deviceCatalogApi.issues(),
        repairsApi.pricingRulesList(),
      ]);

      const nextDeviceTypes = deviceTypesRes.items;
      const nextBrands = brandsRes.items;
      const nextModels = modelsRes.items;
      const nextIssues = issuesRes.items;
      const nextGroups = await loadGroupCatalog(nextBrands);
      const nextRules = (rulesRes.items as RepairRulesApiRow).map(fromApiRepairRule);
      const nextCatalog: RepairCalculationCatalog = {
        deviceTypes: nextDeviceTypes,
        brands: nextBrands,
        groups: nextGroups,
        models: nextModels,
        issues: nextIssues,
      };

      setDeviceTypes(nextDeviceTypes);
      setBrands(nextBrands);
      setGroups(nextGroups);
      setModels(nextModels);
      setIssues(nextIssues);
      setRules(nextRules);
      setScope((current) => {
        const baseScope = !hydratedFromSearchRef.current
          ? hydrateRepairCalculationScope(initialScopeRef.current, nextCatalog)
          : hydrateRepairCalculationScope(current, nextCatalog);
        hydratedFromSearchRef.current = true;
        if (pendingScopePatchRef.current) {
          const pendingPatch = pendingScopePatchRef.current;
          pendingScopePatchRef.current = null;
          return applyRepairCalculationScopePatch(baseScope, pendingPatch, nextCatalog);
        }
        return baseScope;
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando catalogo tecnico');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const filteredBrands = useMemo(
    () => (!scope.deviceTypeId ? brands : brands.filter((brand) => brand.deviceTypeId === scope.deviceTypeId)),
    [brands, scope.deviceTypeId],
  );
  const filteredGroups = useMemo(
    () => (!scope.deviceBrandId ? [] : groups.filter((group) => group.deviceBrandId === scope.deviceBrandId)),
    [groups, scope.deviceBrandId],
  );
  const filteredModels = useMemo(
    () =>
      !scope.deviceBrandId
        ? []
        : models.filter(
            (model) =>
              model.brandId === scope.deviceBrandId &&
              (!scope.deviceModelGroupId || (model.deviceModelGroupId ?? '') === scope.deviceModelGroupId),
          ),
    [models, scope.deviceBrandId, scope.deviceModelGroupId],
  );
  const brandModels = useMemo(
    () => (!scope.deviceBrandId ? [] : models.filter((model) => model.brandId === scope.deviceBrandId)),
    [models, scope.deviceBrandId],
  );
  const filteredIssues = useMemo(
    () => (!scope.deviceTypeId ? issues : issues.filter((issue) => issue.deviceTypeId === scope.deviceTypeId)),
    [issues, scope.deviceTypeId],
  );
  const filteredRules = useMemo(
    () =>
      filterRepairRulesByScope(rules, scope, catalog)
        .map((row) => ({
          row,
          specificity: buildRepairRuleSpecificity(row),
        }))
        .sort((left, right) => {
          if (right.specificity.level !== left.specificity.level) {
            return right.specificity.level - left.specificity.level;
          }
          return Number(right.row.priority || 0) - Number(left.row.priority || 0);
        }),
    [rules, scope, catalog],
  );

  const scopeSearch = useMemo(() => buildRepairCalculationSearch(scope), [scope]);
  const summary = useMemo(() => buildRepairScopeSummary(scope, catalog), [scope, catalog]);
  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === scope.deviceBrandId) ?? null,
    [brands, scope.deviceBrandId],
  );
  const similarModels = useMemo(
    () => findSimilarModels(brandModels, modelDraft),
    [brandModels, modelDraft],
  );
  const hasExactModelDuplicate = useMemo(
    () => hasExactModelMatch(brandModels, modelDraft),
    [brandModels, modelDraft],
  );
  const quickCreateSimilarModels = useMemo(
    () => (quickCreate?.kind === 'model' ? findSimilarModels(brandModels, quickCreate.value) : []),
    [brandModels, quickCreate],
  );
  const quickCreateHasExactDuplicate = useMemo(
    () => (quickCreate?.kind === 'model' ? hasExactModelMatch(brandModels, quickCreate.value) : false),
    [brandModels, quickCreate],
  );

  const deviceTypeOptions = useMemo(
    () => [{ value: '', label: 'Tipo: Todos' }, ...deviceTypes.map((item) => ({ value: item.id, label: item.name }))],
    [deviceTypes],
  );
  const brandOptions = useMemo(
    () => [{ value: '', label: scope.deviceTypeId ? 'Marca: Todas' : 'Marca: primero tipo' }, ...filteredBrands.map((item) => ({ value: item.id, label: item.name }))],
    [filteredBrands, scope.deviceTypeId],
  );
  const groupOptions = useMemo(
    () => [{ value: '', label: scope.deviceBrandId ? 'Grupo: Todos' : 'Grupo: primero marca' }, ...filteredGroups.map((item) => ({ value: item.id, label: item.name }))],
    [filteredGroups, scope.deviceBrandId],
  );
  const modelOptions = useMemo(
    () => [{ value: '', label: scope.deviceBrandId ? 'Modelo: Todos' : 'Modelo: primero marca' }, ...filteredModels.map((item) => ({ value: item.id, label: item.name }))],
    [filteredModels, scope.deviceBrandId],
  );
  const issueOptions = useMemo(
    () => [{ value: '', label: scope.deviceTypeId ? 'Falla: Todas' : 'Falla: primero tipo' }, ...filteredIssues.map((item) => ({ value: item.id, label: item.name }))],
    [filteredIssues, scope.deviceTypeId],
  );

  function patchScope(patch: Partial<RepairCalculationScope>) {
    setScope((current) => applyRepairCalculationScopePatch(current, patch, catalog));
  }

  async function runCatalogAction(
    action: () => Promise<unknown>,
    successMessage: string,
    fallbackMessage: string,
  ) {
    setError('');
    setSuccess('');
    try {
      await action();
      setSuccess(successMessage);
      await loadAll();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallbackMessage);
      return false;
    }
  }

  async function createDeviceTypeValue(name: string, active = true, successMessage = 'Tipo de dispositivo creado.') {
    const normalizedName = normalizeTaxonomyDraft(name).trim();
    return runCatalogAction(
      async () => {
        const response = await adminApi.createDeviceType({ name: normalizedName, active });
        pendingScopePatchRef.current = { deviceTypeId: response.item.id };
      },
      successMessage,
      'No se pudo crear el tipo de dispositivo.',
    );
  }

  async function createBrandValue(name: string, successMessage = 'Marca creada.') {
    if (!scope.deviceTypeId) return false;
    const normalizedName = normalizeTaxonomyDraft(name).trim();
    return runCatalogAction(
      async () => {
        const response = await deviceCatalogApi.createBrand({
          deviceTypeId: scope.deviceTypeId,
          name: normalizedName,
          slug: slugify(normalizedName),
          active: true,
        });
        pendingScopePatchRef.current = { deviceBrandId: response.item.id };
      },
      successMessage,
      'No se pudo crear la marca.',
    );
  }

  async function createGroupValue(name: string, active = true, successMessage = 'Grupo creado.') {
    if (!scope.deviceBrandId) return false;
    const normalizedName = normalizeTaxonomyDraft(name).trim();
    return runCatalogAction(
      async () => {
        const response = await adminApi.createModelGroup({
          deviceBrandId: scope.deviceBrandId,
          name: normalizedName,
          active,
        });
        pendingScopePatchRef.current = { deviceModelGroupId: response.item.id };
      },
      successMessage,
      'No se pudo crear el grupo.',
    );
  }

  function getModelDuplicateError(name: string) {
    if (!hasExactModelMatch(brandModels, name)) return '';
    return `Ya existe un modelo con ese nombre dentro de ${selectedBrand?.name || 'la marca activa'}.`;
  }

  async function createModelValue(name: string, successMessage = 'Modelo creado.') {
    if (!scope.deviceBrandId) return false;
    const normalizedName = normalizeTaxonomyDraft(name).trim();
    const duplicateError = getModelDuplicateError(normalizedName);
    if (duplicateError) {
      setError(duplicateError);
      return false;
    }
    return runCatalogAction(
      async () => {
        const response = await deviceCatalogApi.createModel({
          brandId: scope.deviceBrandId,
          name: normalizedName,
          slug: slugify(normalizedName),
        });
        pendingScopePatchRef.current = { deviceModelId: response.item.id };
      },
      successMessage,
      'No se pudo crear el modelo.',
    );
  }

  async function createIssueValue(name: string, successMessage = 'Falla creada.') {
    if (!scope.deviceTypeId) return false;
    const normalizedName = normalizeTaxonomyDraft(name).trim();
    return runCatalogAction(
      async () => {
        const response = await deviceCatalogApi.createIssue({
          deviceTypeId: scope.deviceTypeId,
          name: normalizedName,
          slug: slugify(normalizedName),
          active: true,
        });
        pendingScopePatchRef.current = { deviceIssueTypeId: response.item.id };
      },
      successMessage,
      'No se pudo crear la falla.',
    );
  }

  function openQuickCreate(kind: QuickCreateKind) {
    setError('');
    setQuickCreate({ kind, value: '' });
  }

  function closeQuickCreate() {
    setQuickCreate(null);
  }

  async function submitQuickCreate() {
    if (!quickCreate || !quickCreate.value.trim()) return;
    let created = false;
    if (quickCreate.kind === 'deviceType') {
      created = await createDeviceTypeValue(quickCreate.value, true, 'Tipo de dispositivo creado desde el scope.');
    }
    if (quickCreate.kind === 'brand') {
      created = await createBrandValue(quickCreate.value, 'Marca creada desde el scope.');
    }
    if (quickCreate.kind === 'group') {
      created = await createGroupValue(quickCreate.value, true, 'Grupo creado desde el scope.');
    }
    if (quickCreate.kind === 'model') {
      created = await createModelValue(quickCreate.value, 'Modelo creado desde el scope.');
    }
    if (quickCreate.kind === 'issue') {
      created = await createIssueValue(quickCreate.value, 'Falla creada desde el scope.');
    }
    if (created) {
      closeQuickCreate();
    }
  }

  async function createDeviceType() {
    if (!typeDraft.trim()) return;
    setCreatingType(true);
    const created = await createDeviceTypeValue(typeDraft, typeDraftActive);
    if (created) {
      setTypeDraft('');
      setTypeDraftActive(true);
    }
    setCreatingType(false);
  }

  async function saveDeviceType(row: DeviceTypeItem) {
    setSavingTypeId(row.id);
    await runCatalogAction(
      () => adminApi.updateDeviceType(row.id, { name: row.name.trim(), active: row.active }),
      'Tipo de dispositivo actualizado.',
      'No se pudo guardar el tipo de dispositivo.',
    );
    setSavingTypeId(null);
  }

  async function deleteDeviceType(row: DeviceTypeItem) {
    const confirmed = window.confirm(
      `Vas a eliminar el tipo "${row.name}".\n\nEste cambio es irreversible. Si todavia tiene marcas, fallas, reparaciones o reglas, el sistema lo va a bloquear.`,
    );
    if (!confirmed) return;
    setDeletingTypeId(row.id);
    await runCatalogAction(
      () => adminApi.deleteDeviceType(row.id),
      'Tipo de dispositivo eliminado.',
      'No se pudo eliminar el tipo de dispositivo.',
    );
    setDeletingTypeId(null);
  }

  async function createBrand() {
    if (!scope.deviceTypeId || !brandDraft.trim()) return;
    const created = await createBrandValue(brandDraft);
    if (created) setBrandDraft('');
  }

  async function renameBrand(row: BrandItem) {
    const nextName = window.prompt('Nuevo nombre de marca', row.name)?.trim();
    if (!nextName || nextName === row.name) return;
    await runCatalogAction(
      () => deviceCatalogApi.updateBrand(row.id, { name: nextName, slug: slugify(nextName) }),
      'Marca actualizada.',
      'No se pudo renombrar la marca.',
    );
  }

  async function toggleBrand(row: BrandItem) {
    await runCatalogAction(
      () => deviceCatalogApi.updateBrand(row.id, { active: !row.active }),
      'Marca actualizada.',
      'No se pudo actualizar la marca.',
    );
  }

  async function deleteBrand(row: BrandItem) {
    const confirmed = window.confirm(
      `Vas a eliminar la marca "${row.name}".\n\nEste cambio es irreversible. Si todavia esta en uso, el sistema lo va a bloquear.`,
    );
    if (!confirmed) return;
    await runCatalogAction(
      () => deviceCatalogApi.deleteBrand(row.id),
      'Marca eliminada.',
      'No se pudo eliminar la marca.',
    );
  }

  async function createGroup() {
    if (!scope.deviceBrandId || !groupDraft.trim()) return;
    const created = await createGroupValue(groupDraft, groupDraftActive);
    if (created) {
      setGroupDraft('');
      setGroupDraftActive(true);
    }
  }

  async function saveGroup(row: RepairCalculationGroupItem) {
    setSavingGroupId(row.id);
    await runCatalogAction(
      () =>
        adminApi.updateModelGroup(row.id, {
          deviceBrandId: row.deviceBrandId,
          name: row.name.trim(),
          active: row.active,
        }),
      'Grupo actualizado.',
      'No se pudo guardar el grupo.',
    );
    setSavingGroupId(null);
  }

  async function createModel() {
    if (!scope.deviceBrandId || !modelDraft.trim()) return;
    const created = await createModelValue(modelDraft);
    if (created) setModelDraft('');
  }

  async function renameModel(row: ModelItem) {
    const nextName = window.prompt('Nuevo nombre de modelo', row.name)?.trim();
    if (!nextName || nextName === row.name) return;
    await runCatalogAction(
      () => deviceCatalogApi.updateModel(row.id, { name: nextName, slug: slugify(nextName) }),
      'Modelo actualizado.',
      'No se pudo renombrar el modelo.',
    );
  }

  async function toggleModel(row: ModelItem) {
    await runCatalogAction(
      () => deviceCatalogApi.updateModel(row.id, { active: !row.active }),
      'Modelo actualizado.',
      'No se pudo actualizar el modelo.',
    );
  }

  async function deleteModel(row: ModelItem) {
    const confirmed = window.confirm(
      `Vas a eliminar el modelo "${row.name}".\n\nEste cambio es irreversible. Si todavia esta en uso, el sistema lo va a bloquear.`,
    );
    if (!confirmed) return;
    await runCatalogAction(
      () => deviceCatalogApi.deleteModel(row.id),
      'Modelo eliminado.',
      'No se pudo eliminar el modelo.',
    );
  }

  async function assignModelGroup(modelId: string, groupId: string) {
    if (!scope.deviceBrandId) return;
    setAssigningModelId(modelId);
    await runCatalogAction(
      () =>
        adminApi.assignModelGroup(modelId, {
          deviceBrandId: scope.deviceBrandId,
          deviceModelGroupId: groupId || null,
        }),
      'Modelo reasignado.',
      'No se pudo asignar el grupo al modelo.',
    );
    setAssigningModelId(null);
  }

  async function createIssue() {
    if (!scope.deviceTypeId || !issueDraft.trim()) return;
    const created = await createIssueValue(issueDraft);
    if (created) setIssueDraft('');
  }

  async function renameIssue(row: IssueItem) {
    const nextName = window.prompt('Nuevo nombre de falla', row.name)?.trim();
    if (!nextName || nextName === row.name) return;
    await runCatalogAction(
      () => deviceCatalogApi.updateIssue(row.id, { name: nextName, slug: slugify(nextName) }),
      'Falla actualizada.',
      'No se pudo renombrar la falla.',
    );
  }

  async function toggleIssue(row: IssueItem) {
    await runCatalogAction(
      () => deviceCatalogApi.updateIssue(row.id, { active: !row.active }),
      'Falla actualizada.',
      'No se pudo actualizar la falla.',
    );
  }

  async function deleteIssue(row: IssueItem) {
    const confirmed = window.confirm(
      `Vas a eliminar la falla "${row.name}".\n\nEste cambio es irreversible. Si todavia esta en uso, el sistema lo va a bloquear.`,
    );
    if (!confirmed) return;
    await runCatalogAction(
      () => deviceCatalogApi.deleteIssue(row.id),
      'Falla eliminada.',
      'No se pudo eliminar la falla.',
    );
  }

  const rulesCards = filteredRules.map(({ row, specificity }) => ({
    row,
    specificityShort: specificity.shortLabel,
    specificityLabel: specificity.label,
    specificityTone: specificity.tone,
    editTo: `/admin/precios/${encodeURIComponent(row.id)}/editar${scopeSearch}`,
  }));
  const quickCreateMeta = useMemo(() => {
    if (!quickCreate) return null;

    const updateValue = (value: string) =>
      setQuickCreate((current) => (current ? { ...current, value: normalizeTaxonomyDraft(value) } : current));

    if (quickCreate.kind === 'deviceType') {
      return {
        title: 'Agregar tipo',
        description: 'Se crea en el catalogo tecnico y queda seleccionado en el scope.',
        fieldLabel: 'Nombre del tipo',
        placeholder: 'Ej: Celular',
        submitLabel: 'Crear tipo',
        contextLabel: 'Impacta la raiz del arbol tecnico.',
        value: quickCreate.value,
        onValueChange: updateValue,
        onClose: closeQuickCreate,
        onSubmit: () => void submitQuickCreate(),
        matches: [] as typeof quickCreateSimilarModels,
        hasExactDuplicate: false,
      };
    }

    if (quickCreate.kind === 'brand') {
      return {
        title: 'Agregar marca',
        description: 'La marca nueva queda vinculada al tipo activo y se selecciona automaticamente.',
        fieldLabel: 'Nombre de la marca',
        placeholder: 'Ej: Samsung',
        submitLabel: 'Crear marca',
        contextLabel: `Tipo activo: ${summary.find((item) => item.label === 'Tipo')?.value || 'Sin tipo'}`,
        value: quickCreate.value,
        onValueChange: updateValue,
        onClose: closeQuickCreate,
        onSubmit: () => void submitQuickCreate(),
        matches: [] as typeof quickCreateSimilarModels,
        hasExactDuplicate: false,
      };
    }

    if (quickCreate.kind === 'group') {
      return {
        title: 'Agregar grupo',
        description: 'El grupo se crea dentro de la marca activa para ordenar modelos y reglas.',
        fieldLabel: 'Nombre del grupo',
        placeholder: 'Ej: Galaxy A / Redmi Note',
        submitLabel: 'Crear grupo',
        contextLabel: `Marca activa: ${selectedBrand?.name || 'Sin marca'}`,
        value: quickCreate.value,
        onValueChange: updateValue,
        onClose: closeQuickCreate,
        onSubmit: () => void submitQuickCreate(),
        matches: [] as typeof quickCreateSimilarModels,
        hasExactDuplicate: false,
      };
    }

    if (quickCreate.kind === 'model') {
      return {
        title: 'Agregar modelo',
        description: 'Revisa las coincidencias antes de crear para no duplicar la marca activa.',
        fieldLabel: 'Nombre del modelo',
        placeholder: selectedBrand ? `Ej: ${selectedBrand.name} A13` : 'Ej: A13',
        submitLabel: quickCreateHasExactDuplicate ? 'Ya existe' : 'Crear modelo',
        contextLabel: `Marca activa: ${selectedBrand?.name || 'Sin marca'}`,
        value: quickCreate.value,
        onValueChange: updateValue,
        onClose: closeQuickCreate,
        onSubmit: () => void submitQuickCreate(),
        matches: quickCreateSimilarModels,
        hasExactDuplicate: quickCreateHasExactDuplicate,
      };
    }

    return {
      title: 'Agregar falla',
      description: 'La falla queda asociada al tipo activo y ya entra al scope.',
      fieldLabel: 'Nombre de la falla',
      placeholder: 'Ej: No carga / Pantalla',
      submitLabel: 'Crear falla',
      contextLabel: `Tipo activo: ${summary.find((item) => item.label === 'Tipo')?.value || 'Sin tipo'}`,
      value: quickCreate.value,
      onValueChange: updateValue,
      onClose: closeQuickCreate,
      onSubmit: () => void submitQuickCreate(),
      matches: [] as typeof quickCreateSimilarModels,
      hasExactDuplicate: false,
    };
  }, [quickCreate, quickCreateHasExactDuplicate, quickCreateSimilarModels, selectedBrand, summary]);

  const deviceTypeMenuAction = useMemo<CustomSelectMenuAction>(
    () => ({
      label: '+ Agregar tipo',
      onSelect: () => openQuickCreate('deviceType'),
      helperText: 'Abre un formulario rapido dentro de esta pantalla.',
    }),
    [],
  );
  const brandMenuAction = useMemo<CustomSelectMenuAction>(
    () => ({
      label: scope.deviceTypeId ? '+ Agregar marca' : 'Primero elegi un tipo',
      onSelect: () => openQuickCreate('brand'),
      disabled: !scope.deviceTypeId,
      helperText: scope.deviceTypeId
        ? 'Abre un formulario rapido y la vincula al tipo activo.'
        : 'Marca depende del tipo de dispositivo.',
    }),
    [scope.deviceTypeId],
  );
  const groupMenuAction = useMemo<CustomSelectMenuAction>(
    () => ({
      label: scope.deviceBrandId ? '+ Agregar grupo' : 'Primero elegi una marca',
      onSelect: () => openQuickCreate('group'),
      disabled: !scope.deviceBrandId,
      helperText: scope.deviceBrandId
        ? 'Abre un formulario rapido dentro de la marca activa.'
        : 'Grupo depende de la marca activa.',
    }),
    [scope.deviceBrandId],
  );
  const modelMenuAction = useMemo<CustomSelectMenuAction>(
    () => ({
      label: scope.deviceBrandId ? '+ Agregar modelo' : 'Primero elegi una marca',
      onSelect: () => openQuickCreate('model'),
      disabled: !scope.deviceBrandId,
      helperText: scope.deviceBrandId
        ? 'Abre un formulario rapido con control de duplicados.'
        : 'Modelo depende de la marca activa.',
    }),
    [scope.deviceBrandId],
  );
  const issueMenuAction = useMemo<CustomSelectMenuAction>(
    () => ({
      label: scope.deviceTypeId ? '+ Agregar falla' : 'Primero elegi un tipo',
      onSelect: () => openQuickCreate('issue'),
      disabled: !scope.deviceTypeId,
      helperText: scope.deviceTypeId
        ? 'Abre un formulario rapido ligado al tipo activo.'
        : 'Falla depende del tipo de dispositivo.',
    }),
    [scope.deviceTypeId],
  );

  return (
    <div className="store-shell space-y-6">
      <AdminRepairCalculationsHubHero
        error={error}
        success={success}
        openRulesTo={`/admin/precios${scopeSearch}`}
      />
      <AdminRepairCalculationsGuideSection />
      <AdminRepairCalculationsScopeSection
        scope={scope}
        summary={summary}
        deviceTypeOptions={deviceTypeOptions}
        brandOptions={brandOptions}
        groupOptions={groupOptions}
        modelOptions={modelOptions}
        issueOptions={issueOptions}
        deviceTypeAction={deviceTypeMenuAction}
        brandAction={brandMenuAction}
        groupAction={groupMenuAction}
        modelAction={modelMenuAction}
        issueAction={issueMenuAction}
        onScopeChange={patchScope}
        onClear={() => setScope(EMPTY_REPAIR_CALCULATION_SCOPE)}
      />
      <AdminRepairCalculationsQuickCreateDialog
        open={Boolean(quickCreateMeta)}
        title={quickCreateMeta?.title || ''}
        description={quickCreateMeta?.description || ''}
        fieldLabel={quickCreateMeta?.fieldLabel || ''}
        placeholder={quickCreateMeta?.placeholder || ''}
        submitLabel={quickCreateMeta?.submitLabel || 'Crear'}
        contextLabel={quickCreateMeta?.contextLabel || ''}
        value={quickCreateMeta?.value || ''}
        matches={quickCreateMeta?.matches || []}
        hasExactDuplicate={quickCreateMeta?.hasExactDuplicate || false}
        onValueChange={quickCreateMeta?.onValueChange || (() => {})}
        onClose={quickCreateMeta?.onClose || (() => {})}
        onSubmit={quickCreateMeta?.onSubmit || (() => {})}
      />

      {loading ? (
        <section className="card">
          <div className="card-body text-sm text-zinc-600">Cargando hub de reparaciones...</div>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <AdminRepairCalculationsTypesPanel
            rows={sortRowsByFocusId(deviceTypes, scope.deviceTypeId)}
            newName={typeDraft}
            newActive={typeDraftActive}
            creating={creatingType}
            savingId={savingTypeId}
            deletingId={deletingTypeId}
            focusedId={scope.deviceTypeId}
            onNewNameChange={(value) => setTypeDraft(normalizeTaxonomyDraft(value))}
            onNewActiveChange={setTypeDraftActive}
            onCreate={() => void createDeviceType()}
            onRowChange={(id, patch) =>
              setDeviceTypes((current) =>
                current.map((row) =>
                  row.id === id
                    ? { ...row, ...patch, ...(patch.name !== undefined ? { name: normalizeTaxonomyDraft(patch.name) } : {}) }
                    : row,
                ),
              )
            }
            onSave={(row) => void saveDeviceType(row)}
            onDelete={(row) => void deleteDeviceType(row)}
            openTo={`/admin/tiposdispositivo${buildRepairCalculationSearch({ deviceTypeId: scope.deviceTypeId })}`}
          />

          <AdminRepairCalculationsBrandsPanel
            rows={filteredBrands}
            draft={brandDraft}
            selectedBrandId={scope.deviceBrandId}
            creatingDisabled={!scope.deviceTypeId || !brandDraft.trim()}
            onDraftChange={(value) => setBrandDraft(normalizeTaxonomyDraft(value))}
            onCreate={() => void createBrand()}
            onRename={(row) => void renameBrand(row)}
            onToggle={(row) => void toggleBrand(row)}
            onDelete={(row) => void deleteBrand(row)}
            onSelect={(row) => patchScope({ deviceBrandId: row.id })}
            openTo={`/admin/catalogodispositivos${buildRepairCalculationSearch({
              deviceTypeId: scope.deviceTypeId,
              deviceBrandId: scope.deviceBrandId,
            })}`}
          />

          <AdminRepairCalculationsGroupsPanel
            rows={filteredGroups}
            draft={groupDraft}
            active={groupDraftActive}
            disabled={!scope.deviceBrandId}
            savingId={savingGroupId}
            onDraftChange={(value) => setGroupDraft(normalizeTaxonomyDraft(value))}
            onActiveChange={setGroupDraftActive}
            onCreate={() => void createGroup()}
            onRowChange={(id, patch) =>
              setGroups((current) =>
                current.map((row) =>
                  row.id === id
                    ? { ...row, ...patch, ...(patch.name !== undefined ? { name: normalizeTaxonomyDraft(patch.name) } : {}) }
                    : row,
                ),
              )
            }
            onSave={(row) => void saveGroup(row)}
            openTo={`/admin/gruposmodelos${buildRepairCalculationSearch({
              deviceTypeId: scope.deviceTypeId,
              deviceBrandId: scope.deviceBrandId,
              deviceModelGroupId: scope.deviceModelGroupId,
            })}`}
          />

          <AdminRepairCalculationsModelsPanel
            rows={filteredModels}
            draft={modelDraft}
            similarRows={similarModels}
            hasExactDuplicate={hasExactModelDuplicate}
            brandSelected={Boolean(scope.deviceBrandId)}
            selectedBrandName={selectedBrand?.name ?? ''}
            groupOptions={groupOptions}
            onDraftChange={(value) => setModelDraft(normalizeTaxonomyDraft(value))}
            onCreate={() => void createModel()}
            onRename={(row) => void renameModel(row)}
            onToggle={(row) => void toggleModel(row)}
            onDelete={(row) => void deleteModel(row)}
            onAssignGroup={(modelId, groupId) => void assignModelGroup(modelId, groupId)}
            assigningModelId={assigningModelId}
            openTo={`/admin/catalogodispositivos${buildRepairCalculationSearch({
              deviceTypeId: scope.deviceTypeId,
              deviceBrandId: scope.deviceBrandId,
              deviceModelGroupId: scope.deviceModelGroupId,
              deviceModelId: scope.deviceModelId,
            })}`}
          />

          <AdminRepairCalculationsIssuesPanel
            rows={filteredIssues}
            draft={issueDraft}
            typeSelected={Boolean(scope.deviceTypeId)}
            onDraftChange={(value) => setIssueDraft(normalizeTaxonomyDraft(value))}
            onCreate={() => void createIssue()}
            onRename={(row) => void renameIssue(row)}
            onToggle={(row) => void toggleIssue(row)}
            onDelete={(row) => void deleteIssue(row)}
            openTo={`/admin/tiposreparacion${buildRepairCalculationSearch({
              deviceTypeId: scope.deviceTypeId,
              deviceIssueTypeId: scope.deviceIssueTypeId,
            })}`}
          />

          <AdminRepairCalculationsRulesPanel
            rows={rulesCards}
            openTo={`/admin/precios${scopeSearch}`}
            createTo={`/admin/precios/crear${scopeSearch}`}
          />
        </div>
      )}
    </div>
  );
}
