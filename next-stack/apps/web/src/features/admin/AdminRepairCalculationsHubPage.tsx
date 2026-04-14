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
  AdminRepairCalculationsRulesPanel,
  AdminRepairCalculationsScopeSection,
  AdminRepairCalculationsTypesPanel,
} from './admin-repair-calculations-hub.sections';
import { fromApiRepairRule, type RepairRuleRow } from './admin-repair-pricing-rules.helpers';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi } from '@/features/repairs/api';

type RepairRulesApiRow = NonNullable<Awaited<ReturnType<typeof repairsApi.pricingRulesList>>['items']>;

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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallbackMessage);
    }
  }

  async function createDeviceType() {
    if (!typeDraft.trim()) return;
    setCreatingType(true);
    await runCatalogAction(
      async () => {
        const response = await adminApi.createDeviceType({ name: typeDraft.trim(), active: typeDraftActive });
        pendingScopePatchRef.current = { deviceTypeId: response.item.id };
        setTypeDraft('');
        setTypeDraftActive(true);
      },
      'Tipo de dispositivo creado.',
      'No se pudo crear el tipo de dispositivo.',
    );
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
    await runCatalogAction(
      async () => {
        const response = await deviceCatalogApi.createBrand({
          deviceTypeId: scope.deviceTypeId,
          name: brandDraft.trim(),
          slug: slugify(brandDraft),
          active: true,
        });
        pendingScopePatchRef.current = { deviceBrandId: response.item.id };
        setBrandDraft('');
      },
      'Marca creada.',
      'No se pudo crear la marca.',
    );
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
    await runCatalogAction(
      async () => {
        const response = await adminApi.createModelGroup({
          deviceBrandId: scope.deviceBrandId,
          name: groupDraft.trim(),
          active: groupDraftActive,
        });
        pendingScopePatchRef.current = { deviceModelGroupId: response.item.id };
        setGroupDraft('');
        setGroupDraftActive(true);
      },
      'Grupo creado.',
      'No se pudo crear el grupo.',
    );
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
    if (hasExactModelDuplicate) {
      setError(`Ya existe un modelo con ese nombre dentro de ${selectedBrand?.name || 'la marca activa'}.`);
      return;
    }
    await runCatalogAction(
      async () => {
        const response = await deviceCatalogApi.createModel({
          brandId: scope.deviceBrandId,
          name: modelDraft.trim(),
          slug: slugify(modelDraft),
        });
        pendingScopePatchRef.current = { deviceModelId: response.item.id };
        setModelDraft('');
      },
      'Modelo creado.',
      'No se pudo crear el modelo.',
    );
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
    await runCatalogAction(
      async () => {
        const response = await deviceCatalogApi.createIssue({
          deviceTypeId: scope.deviceTypeId,
          name: issueDraft.trim(),
          slug: slugify(issueDraft),
          active: true,
        });
        pendingScopePatchRef.current = { deviceIssueTypeId: response.item.id };
        setIssueDraft('');
      },
      'Falla creada.',
      'No se pudo crear la falla.',
    );
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

  function promptName(message: string) {
    return window.prompt(message)?.trim() ?? '';
  }

  async function quickCreateDeviceType() {
    const nextName = promptName('Nuevo tipo de dispositivo');
    if (!nextName) return;
    setCreatingType(true);
    await runCatalogAction(
      async () => {
        const response = await adminApi.createDeviceType({ name: nextName, active: true });
        pendingScopePatchRef.current = { deviceTypeId: response.item.id };
      },
      'Tipo de dispositivo creado desde el scope.',
      'No se pudo crear el tipo de dispositivo.',
    );
    setCreatingType(false);
  }

  async function quickCreateBrand() {
    if (!scope.deviceTypeId) return;
    const nextName = promptName('Nueva marca para el tipo actual');
    if (!nextName) return;
    await runCatalogAction(
      async () => {
        const response = await deviceCatalogApi.createBrand({
          deviceTypeId: scope.deviceTypeId,
          name: nextName,
          slug: slugify(nextName),
          active: true,
        });
        pendingScopePatchRef.current = { deviceBrandId: response.item.id };
      },
      'Marca creada desde el scope.',
      'No se pudo crear la marca.',
    );
  }

  async function quickCreateGroup() {
    if (!scope.deviceBrandId) return;
    const nextName = promptName('Nuevo grupo para la marca activa');
    if (!nextName) return;
    await runCatalogAction(
      async () => {
        const response = await adminApi.createModelGroup({
          deviceBrandId: scope.deviceBrandId,
          name: nextName,
          active: true,
        });
        pendingScopePatchRef.current = { deviceModelGroupId: response.item.id };
      },
      'Grupo creado desde el scope.',
      'No se pudo crear el grupo.',
    );
  }

  async function quickCreateModel() {
    if (!scope.deviceBrandId) return;
    const nextName = promptName('Nuevo modelo para la marca activa');
    if (!nextName) return;
    if (hasExactModelMatch(brandModels, nextName)) {
      setError(`Ya existe un modelo con ese nombre dentro de ${selectedBrand?.name || 'la marca activa'}.`);
      return;
    }
    await runCatalogAction(
      async () => {
        const response = await deviceCatalogApi.createModel({
          brandId: scope.deviceBrandId,
          name: nextName,
          slug: slugify(nextName),
        });
        pendingScopePatchRef.current = { deviceModelId: response.item.id };
      },
      'Modelo creado desde el scope.',
      'No se pudo crear el modelo.',
    );
  }

  async function quickCreateIssue() {
    if (!scope.deviceTypeId) return;
    const nextName = promptName('Nueva falla para el tipo activo');
    if (!nextName) return;
    await runCatalogAction(
      async () => {
        const response = await deviceCatalogApi.createIssue({
          deviceTypeId: scope.deviceTypeId,
          name: nextName,
          slug: slugify(nextName),
          active: true,
        });
        pendingScopePatchRef.current = { deviceIssueTypeId: response.item.id };
      },
      'Falla creada desde el scope.',
      'No se pudo crear la falla.',
    );
  }

  const deviceTypeMenuAction = useMemo<CustomSelectMenuAction>(
    () => ({
      label: '+ Agregar tipo',
      onSelect: () => void quickCreateDeviceType(),
      helperText: 'Si no aparece en la lista, lo creas aca mismo.',
    }),
    [],
  );
  const brandMenuAction = useMemo<CustomSelectMenuAction>(
    () => ({
      label: scope.deviceTypeId ? '+ Agregar marca' : 'Primero elegi un tipo',
      onSelect: () => void quickCreateBrand(),
      disabled: !scope.deviceTypeId,
      helperText: scope.deviceTypeId
        ? 'La nueva marca queda vinculada al tipo activo y se selecciona sola.'
        : 'Marca depende del tipo de dispositivo.',
    }),
    [scope.deviceTypeId],
  );
  const groupMenuAction = useMemo<CustomSelectMenuAction>(
    () => ({
      label: scope.deviceBrandId ? '+ Agregar grupo' : 'Primero elegi una marca',
      onSelect: () => void quickCreateGroup(),
      disabled: !scope.deviceBrandId,
      helperText: scope.deviceBrandId
        ? 'El grupo nuevo queda dentro de la marca activa.'
        : 'Grupo depende de la marca activa.',
    }),
    [scope.deviceBrandId],
  );
  const modelMenuAction = useMemo<CustomSelectMenuAction>(
    () => ({
      label: scope.deviceBrandId ? '+ Agregar modelo' : 'Primero elegi una marca',
      onSelect: () => void quickCreateModel(),
      disabled: !scope.deviceBrandId,
      helperText: scope.deviceBrandId
        ? 'El modelo nuevo queda dentro de la marca activa.'
        : 'Modelo depende de la marca activa.',
    }),
    [scope.deviceBrandId],
  );
  const issueMenuAction = useMemo<CustomSelectMenuAction>(
    () => ({
      label: scope.deviceTypeId ? '+ Agregar falla' : 'Primero elegi un tipo',
      onSelect: () => void quickCreateIssue(),
      disabled: !scope.deviceTypeId,
      helperText: scope.deviceTypeId
        ? 'La falla nueva queda ligada al tipo activo.'
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
            onNewNameChange={setTypeDraft}
            onNewActiveChange={setTypeDraftActive}
            onCreate={() => void createDeviceType()}
            onRowChange={(id, patch) => setDeviceTypes((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))}
            onSave={(row) => void saveDeviceType(row)}
            onDelete={(row) => void deleteDeviceType(row)}
            openTo={`/admin/tiposdispositivo${buildRepairCalculationSearch({ deviceTypeId: scope.deviceTypeId })}`}
          />

          <AdminRepairCalculationsBrandsPanel
            rows={filteredBrands}
            draft={brandDraft}
            selectedBrandId={scope.deviceBrandId}
            creatingDisabled={!scope.deviceTypeId || !brandDraft.trim()}
            onDraftChange={setBrandDraft}
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
            onDraftChange={setGroupDraft}
            onActiveChange={setGroupDraftActive}
            onCreate={() => void createGroup()}
            onRowChange={(id, patch) =>
              setGroups((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
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
            onDraftChange={setModelDraft}
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
            onDraftChange={setIssueDraft}
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
