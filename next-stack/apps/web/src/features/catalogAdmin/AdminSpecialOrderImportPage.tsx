import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Layers3,
  Loader2,
  PackageSearch,
  RefreshCcw,
  Save,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { adminApi, type AdminProviderItem } from '@/features/admin/api';
import {
  catalogAdminApi,
  type AdminCategory,
  type SpecialOrderImportPreview,
  type SpecialOrderPreviewItem,
  type SpecialOrderProfile,
  type SpecialOrderSectionMappingInput,
} from './api';
import { buildCategoryPathLabel } from './admin-product-form.helpers';

type ProfileDraft = {
  supplierId: string;
  name: string;
  active: boolean;
  defaultUsdRate: string;
  defaultShippingUsd: string;
  fallbackMarginPercent: string;
  defaultColorSheetUrl: string;
  rememberColorSheet: boolean;
};

type SectionMappingDraft = {
  categoryId: string;
  createCategoryName: string;
};

const NEW_CATEGORY_VALUE = '__new__';

export function AdminSpecialOrderImportPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const colorCsvInputRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [profiles, setProfiles] = useState<SpecialOrderProfile[]>([]);
  const [providers, setProviders] = useState<AdminProviderItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [profileMode, setProfileMode] = useState<'edit' | 'create'>('edit');
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(() => emptyProfileDraft());

  const [rawText, setRawText] = useState('');
  const [usdRate, setUsdRate] = useState('');
  const [shippingUsd, setShippingUsd] = useState('');
  const [colorSheetUrl, setColorSheetUrl] = useState('');
  const [colorCsvText, setColorCsvText] = useState('');
  const [preview, setPreview] = useState<SpecialOrderImportPreview | null>(null);
  const [previewDirty, setPreviewDirty] = useState(false);
  const [sectionMappings, setSectionMappings] = useState<Record<string, SectionMappingDraft>>({});
  const [excludedSectionKeys, setExcludedSectionKeys] = useState<string[] | null>(null);
  const [excludedSourceKeys, setExcludedSourceKeys] = useState<string[] | null>(null);
  const [excludedRowIds, setExcludedRowIds] = useState<string[] | null>(null);
  const [rememberExclusions, setRememberExclusions] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const providerOptions = useMemo(
    () => providers.filter((provider) => provider.active).sort((left, right) => left.name.localeCompare(right.name, 'es')),
    [providers],
  );

  const sortedCategories = useMemo(() => [...categories], [categories]);

  useEffect(() => {
    async function loadInitialData() {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError('');

      try {
        const [profilesResponse, providersResponse, categoriesResponse] = await Promise.all([
          catalogAdminApi.specialOrderProfiles(),
          adminApi.providers({ active: '1' }),
          catalogAdminApi.categories(),
        ]);

        if (requestId !== requestIdRef.current) return;

        const nextProfiles = profilesResponse.items;
        setProfiles(nextProfiles);
        setProviders(providersResponse.items);
        setCategories(categoriesResponse.items);

        const initialProfile = pickInitialProfile(nextProfiles);
        if (initialProfile) {
          setSelectedProfileId(initialProfile.id);
          setProfileMode('edit');
          setProfileDraft(profileToDraft(initialProfile));
          setUsdRate(formatDecimalInput(initialProfile.defaultUsdRate));
          setShippingUsd(formatDecimalInput(initialProfile.defaultShippingUsd));
          setColorSheetUrl(initialProfile.defaultColorSheetUrl ?? '');
          setColorCsvText('');
        } else {
          const fallbackSupplierId = providersResponse.items.find((provider) => provider.active)?.id ?? '';
          setSelectedProfileId('');
          setProfileMode('create');
          setProfileDraft(emptyProfileDraft(fallbackSupplierId));
          setUsdRate('');
          setShippingUsd('');
          setColorSheetUrl('');
          setColorCsvText('');
        }
      } catch (cause) {
        if (requestId !== requestIdRef.current) return;
        setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los datos del importador.');
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  useEffect(() => {
    if (profileMode !== 'edit' || !selectedProfile) return;
    setProfileDraft(profileToDraft(selectedProfile));
  }, [profileMode, selectedProfile]);

  const hasPreview = Boolean(preview);
  const effectiveExcludedSectionKeySet = useMemo(
    () => new Set(excludedSectionKeys ?? preview?.selection.excludedSectionKeys ?? []),
    [excludedSectionKeys, preview],
  );
  const effectiveExcludedSourceKeySet = useMemo(
    () => new Set(excludedSourceKeys ?? preview?.selection.excludedSourceKeys ?? []),
    [excludedSourceKeys, preview],
  );
  const effectiveExcludedRowIdSet = useMemo(
    () => new Set(excludedRowIds ?? preview?.selection.excludedRowIds ?? []),
    [excludedRowIds, preview],
  );
  const rememberedSectionKeySet = useMemo(
    () => new Set(preview?.selection.rememberedSectionKeys ?? []),
    [preview],
  );
  const rememberedSourceKeySet = useMemo(
    () => new Set(preview?.selection.rememberedSourceKeys ?? []),
    [preview],
  );
  const duplicateCountBySourceKey = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of preview?.items ?? []) {
      counts.set(item.sourceKey, (counts.get(item.sourceKey) ?? 0) + 1);
    }
    return counts;
  }, [preview]);
  const itemsBySection = useMemo(() => {
    const grouped = new Map<string, SpecialOrderPreviewItem[]>();
    for (const item of preview?.items ?? []) {
      const bucket = grouped.get(item.sectionKey);
      if (bucket) {
        bucket.push(item);
      } else {
        grouped.set(item.sectionKey, [item]);
      }
    }
    return grouped;
  }, [preview]);
  const colorWarningsBySection = useMemo(() => {
    const grouped = new Map<string, SpecialOrderImportPreview['colorImport']['warnings']>();
    for (const warning of preview?.colorImport.warnings ?? []) {
      const key = `${warning.sectionKey}::${warning.sectionName}`;
      const bucket = grouped.get(key);
      if (bucket) {
        bucket.push(warning);
      } else {
        grouped.set(key, [warning]);
      }
    }
    return Array.from(grouped.entries()).map(([key, warnings]) => ({
      key,
      sectionName: warnings[0]?.sectionName ?? 'Sin seccion',
      warnings,
    }));
  }, [preview]);
  const includedItems =
    preview?.items.filter((item) =>
      isPreviewItemIncluded(item, effectiveExcludedSectionKeySet, effectiveExcludedSourceKeySet, effectiveExcludedRowIdSet),
    ) ?? [];
  const conflictItems = includedItems.filter((item) => item.status === 'conflict');
  const currentExcludedCount = (preview?.items.length ?? 0) - includedItems.length;
  const rememberedSelectionCount =
    (preview?.selection.rememberedSectionKeys.length ?? 0) + (preview?.selection.rememberedSourceKeys.length ?? 0);

  function markPreviewDirty() {
    setPreviewDirty(true);
  }

  function resetPreviewState() {
    setPreview(null);
    setPreviewDirty(false);
    setSectionMappings({});
    setExcludedSectionKeys(null);
    setExcludedSourceKeys(null);
    setExcludedRowIds(null);
    setExpandedSections({});
    setRememberExclusions(false);
  }

  function handleProfileSelection(nextProfileId: string) {
    setSelectedProfileId(nextProfileId);
    const nextProfile = profiles.find((profile) => profile.id === nextProfileId) ?? null;
    if (nextProfile) {
      setProfileMode('edit');
      setProfileDraft(profileToDraft(nextProfile));
      setUsdRate(formatDecimalInput(nextProfile.defaultUsdRate));
      setShippingUsd(formatDecimalInput(nextProfile.defaultShippingUsd));
      setColorSheetUrl(nextProfile.defaultColorSheetUrl ?? '');
      setColorCsvText('');
    }
    resetPreviewState();
    setNotice('');
    setError('');
  }

  function beginCreateProfile() {
    const defaultSupplierId = providerOptions[0]?.id ?? '';
    setProfileMode('create');
    setProfileDraft(emptyProfileDraft(defaultSupplierId));
    setColorSheetUrl('');
    setColorCsvText('');
    setNotice('');
    setError('');
  }

  function restoreSelectedProfile() {
    if (!selectedProfile) return;
    setProfileMode('edit');
    setProfileDraft(profileToDraft(selectedProfile));
    setColorSheetUrl(selectedProfile.defaultColorSheetUrl ?? '');
    setColorCsvText('');
  }

  async function refreshProfilesAfterSave(nextSelectedProfileId?: string) {
    const response = await catalogAdminApi.specialOrderProfiles();
    setProfiles(response.items);

    const nextId = nextSelectedProfileId ?? selectedProfileId;
    const nextSelected = response.items.find((item) => item.id === nextId) ?? pickInitialProfile(response.items);
    if (nextSelected) {
      setSelectedProfileId(nextSelected.id);
      setProfileDraft(profileToDraft(nextSelected));
      if (!usdRate.trim()) setUsdRate(formatDecimalInput(nextSelected.defaultUsdRate));
      if (!shippingUsd.trim()) setShippingUsd(formatDecimalInput(nextSelected.defaultShippingUsd));
      setColorSheetUrl(nextSelected.defaultColorSheetUrl ?? '');
    }
  }

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');

    const payload = normalizeProfileDraft(profileDraft);
    if (!payload.name) {
      setError('Ingresa un nombre para el perfil de encargue.');
      return;
    }
    if (!payload.supplierId) {
      setError('Selecciona un proveedor para el perfil.');
      return;
    }

    setProfileSaving(true);
    try {
      if (profileMode === 'create') {
        const response = await catalogAdminApi.createSpecialOrderProfile(payload);
        await refreshProfilesAfterSave(response.item.id);
        setSelectedProfileId(response.item.id);
        setProfileMode('edit');
        setUsdRate(formatDecimalInput(response.item.defaultUsdRate));
        setShippingUsd(formatDecimalInput(response.item.defaultShippingUsd));
        setNotice('Perfil de encargue creado correctamente.');
      } else if (selectedProfileId) {
        const response = await catalogAdminApi.updateSpecialOrderProfile(selectedProfileId, payload);
        await refreshProfilesAfterSave(response.item.id);
        setNotice('Perfil actualizado correctamente.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el perfil.');
    } finally {
      setProfileSaving(false);
    }
  }

  function buildPreviewPayload(overrides?: {
    excludedSectionKeys?: string[] | null;
    excludedSourceKeys?: string[] | null;
    excludedRowIds?: string[] | null;
  }) {
    const payload: {
      profileId: string;
      rawText: string;
      usdRate: number | null;
      shippingUsd: number | null;
      colorSheetUrl: string | null;
      colorCsvText: string | null;
      sectionMappings: SpecialOrderSectionMappingInput[];
      excludedSectionKeys?: string[];
      excludedSourceKeys?: string[];
      excludedRowIds?: string[];
      rememberExclusions: boolean;
    } = {
      profileId: selectedProfileId,
      rawText,
      usdRate: parseOptionalNumber(usdRate),
      shippingUsd: parseOptionalNumber(shippingUsd),
      colorSheetUrl: colorSheetUrl.trim() || null,
      colorCsvText: colorCsvText.trim() || null,
      sectionMappings: serializeSectionMappings(sectionMappings),
      rememberExclusions,
    };
    const nextExcludedSectionKeys = overrides?.excludedSectionKeys ?? excludedSectionKeys;
    const nextExcludedSourceKeys = overrides?.excludedSourceKeys ?? excludedSourceKeys;
    const nextExcludedRowIds = overrides?.excludedRowIds ?? excludedRowIds;
    if (nextExcludedSectionKeys !== null) payload.excludedSectionKeys = nextExcludedSectionKeys;
    if (nextExcludedSourceKeys !== null) payload.excludedSourceKeys = nextExcludedSourceKeys;
    if (nextExcludedRowIds !== null) payload.excludedRowIds = nextExcludedRowIds;
    return payload;
  }

  async function runPreview(overrides?: {
    excludedSectionKeys?: string[] | null;
    excludedSourceKeys?: string[] | null;
    excludedRowIds?: string[] | null;
  }) {
    setError('');
    setNotice('');

    if (!selectedProfileId) {
      setError('Selecciona o crea un perfil antes de analizar el listado.');
      return;
    }
    if (!rawText.trim()) {
      setError('Pega el listado del proveedor o carga un archivo .txt antes de analizar.');
      return;
    }

    setPreviewLoading(true);
    try {
      const response = await catalogAdminApi.previewSpecialOrderImport(buildPreviewPayload(overrides));
      setPreview(response);
      setPreviewDirty(false);
      setExcludedSectionKeys(response.selection.excludedSectionKeys);
      setExcludedSourceKeys(response.selection.excludedSourceKeys);
      setExcludedRowIds(response.selection.excludedRowIds);
      const conflictSectionKeys = new Set(
        response.items.filter((item) => item.included && item.status === 'conflict').map((item) => item.sectionKey),
      );
      setExpandedSections((current) => {
        if (conflictSectionKeys.size === 0) return current;
        const next = { ...current };
        for (const sectionKey of conflictSectionKeys) next[sectionKey] = true;
        return next;
      });
      setSectionMappings(
        Object.fromEntries(
          response.sections.map((section) => [
            section.sectionKey,
            {
              categoryId: section.categoryId ?? '',
              createCategoryName: section.createCategoryName ?? section.sectionName,
            },
          ]),
        ),
      );
      setNotice(
        `Preview listo: ${response.summary.newCount} nuevos, ${response.summary.updatedCount} actualizados y ${response.summary.deactivatedCount} a desactivar.`,
      );
    } catch (cause) {
      setPreview(null);
      setPreviewDirty(false);
      setError(cause instanceof Error ? cause.message : 'No se pudo analizar el listado.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleApply() {
    setError('');
    setNotice('');

    if (!preview) {
      setError('Analiza el listado antes de aplicarlo.');
      return;
    }
    if (previewDirty) {
      setError('Reanaliza el listado antes de aplicar para confirmar mapeos y exclusiones.');
      return;
    }
    if (preview.blocked) {
      setError('El preview sigue bloqueado por conflictos. Excluye filas duplicadas y vuelve a analizar.');
      return;
    }

    setApplying(true);
    try {
      const response = await catalogAdminApi.applySpecialOrderImport(buildPreviewPayload());
      setNotice(
        `Importacion aplicada. Batch ${response.batchId}: ${response.summary.newCount} nuevos, ${response.summary.updatedCount} actualizados y ${response.summary.deactivatedCount} desactivados.`,
      );
      await refreshProfilesAfterSave(response.item.id);
      setPreviewDirty(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo aplicar la importacion.');
    } finally {
      setApplying(false);
    }
  }

  async function handleFilePicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setRawText(text);
      markPreviewDirty();
      setNotice(`Archivo cargado: ${file.name}`);
    } catch {
      setError('No se pudo leer el archivo seleccionado.');
    } finally {
      event.target.value = '';
    }
  }

  async function handleColorCsvPicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setColorCsvText(text);
      markPreviewDirty();
      setNotice(`CSV de colores cargado: ${file.name}`);
    } catch {
      setError('No se pudo leer el CSV de colores seleccionado.');
    } finally {
      event.target.value = '';
    }
  }

  function updateMapping(sectionKey: string, next: Partial<SectionMappingDraft>) {
    setSectionMappings((current) => ({
      ...current,
      [sectionKey]: {
        categoryId: current[sectionKey]?.categoryId ?? '',
        createCategoryName: current[sectionKey]?.createCategoryName ?? '',
        ...next,
      },
    }));
    markPreviewDirty();
  }

  function toggleRowExclusion(rowId: string) {
    setExcludedRowIds((current) => {
      const base = current ?? preview?.selection.excludedRowIds ?? [];
      return toggleKey(base, rowId);
    });
    markPreviewDirty();
  }

  function toggleSectionExclusion(sectionKey: string) {
    setExcludedSectionKeys((current) => toggleKey(current ?? preview?.selection.excludedSectionKeys ?? [], sectionKey));
    markPreviewDirty();
  }

  function toggleSourceExclusion(sourceKey: string) {
    setExcludedSourceKeys((current) => toggleKey(current ?? preview?.selection.excludedSourceKeys ?? [], sourceKey));
    markPreviewDirty();
  }

  function toggleItemExclusion(item: SpecialOrderPreviewItem) {
    const duplicateCount = duplicateCountBySourceKey.get(item.sourceKey) ?? 0;
    const currentlySourceExcluded = effectiveExcludedSourceKeySet.has(item.sourceKey);
    if (duplicateCount > 1 && !currentlySourceExcluded) {
      toggleRowExclusion(item.rowId);
      return;
    }
    toggleSourceExclusion(item.sourceKey);
  }

  function toggleSectionExpanded(sectionKey: string) {
    setExpandedSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  }

  async function resolveConflictsAutomatically() {
    if (!preview) return;
    const nextExcludedRowIds = new Set(excludedRowIds ?? preview.selection.excludedRowIds ?? []);
    const keptBySourceKey = new Set<string>();

    for (const item of preview.items) {
      if (!isPreviewItemIncluded(item, effectiveExcludedSectionKeySet, effectiveExcludedSourceKeySet, effectiveExcludedRowIdSet)) {
        continue;
      }
      if (item.status !== 'conflict') continue;
      if (!keptBySourceKey.has(item.sourceKey)) {
        keptBySourceKey.add(item.sourceKey);
        continue;
      }
      nextExcludedRowIds.add(item.rowId);
    }

    if (nextExcludedRowIds.size === (excludedRowIds ?? preview.selection.excludedRowIds ?? []).length) {
      setError('No encontramos filas extra para excluir automaticamente. Revisa las secciones marcadas con conflicto.');
      return;
    }

    await runPreview({
      excludedRowIds: Array.from(nextExcludedRowIds),
    });
    setNotice('Duplicados conflictivos resueltos automaticamente. Revisa el preview actualizado.');
  }

  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Catalogo"
        title="Nuevo listado de encargue"
        subtitle="Pega el texto del proveedor, revisa el preview y sincroniza productos por encargue sin tocar el inventario real."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/productos">
                <ArrowLeft className="h-4 w-4" />
                Volver a productos
              </Link>
            </Button>
            {hasPreview ? (
              <StatusBadge
                tone={previewDirty ? 'warning' : preview?.blocked ? 'danger' : 'success'}
                label={previewDirty ? 'Preview desactualizado' : preview?.blocked ? 'Preview bloqueado' : 'Preview vigente'}
              />
            ) : null}
          </>
        }
      />

      <SectionCard tone="info" bodyClassName="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-zinc-900">Como funciona este flujo</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoPill
              icon={<FileText className="h-4 w-4" />}
              title="1. Pegas el listado"
              description="Soporta secciones tipo *Samsung*, precios en USD y lineas Sin Stock."
            />
            <InfoPill
              icon={<Layers3 className="h-4 w-4" />}
              title="2. Mapeas categorias"
              description="Cada seccion se vincula a una categoria existente o crea una nueva."
            />
            <InfoPill
              icon={<PackageSearch className="h-4 w-4" />}
              title="3. Seleccionas y sincronizas"
              description="Activas solo lo que te interesa y, si quieres, recuerdas esa decision para futuras corridas."
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <MetricTile label="Scope" value={selectedProfile?.name ?? 'Sin perfil'} tone="accent" />
          <MetricTile label="Proveedor" value={selectedProfile?.supplier.name ?? 'Definir perfil'} tone="neutral" />
        </div>
      </SectionCard>

      {error ? (
        <SectionCard tone="info" className="border-rose-200 bg-rose-50">
          <div className="text-sm font-semibold text-rose-700">{error}</div>
        </SectionCard>
      ) : null}

      {notice ? (
        <SectionCard tone="info" className="border-emerald-200 bg-emerald-50">
          <div className="text-sm font-semibold text-emerald-700">{notice}</div>
        </SectionCard>
      ) : null}

      {loading ? (
        <SectionCard title="Cargando importador" description="Preparando perfiles, proveedores y categorias.">
          <LoadingBlock lines={5} />
        </SectionCard>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)]">
          <div className="space-y-6">
            <SectionCard
              title="Perfil de importacion"
              description="El perfil recuerda proveedor, dolar, envio, margen fallback y mapeos de secciones."
              actions={
                profileMode === 'create' ? (
                  selectedProfile ? (
                    <Button type="button" variant="outline" size="sm" onClick={restoreSelectedProfile}>
                      Cancelar alta
                    </Button>
                  ) : null
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={beginCreateProfile}>
                    Nuevo perfil
                  </Button>
                )
              }
            >
              <div className="grid gap-4">
                <label className="ui-field">
                  <span className="ui-field__label">Perfil activo</span>
                  <span className="ui-field__control">
                    <select
                      className="ui-input"
                      value={selectedProfileId}
                      onChange={(event) => handleProfileSelection(event.target.value)}
                      disabled={profiles.length === 0}
                    >
                      <option value="">Selecciona un perfil</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name} · {profile.supplier.name}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>

                <form className="grid gap-4" onSubmit={(event) => void handleProfileSubmit(event)}>
                  <TextField
                    label="Nombre del perfil"
                    value={profileDraft.name}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ej. Celulares usados PDA"
                  />

                  <label className="ui-field">
                    <span className="ui-field__label">Proveedor</span>
                    <span className="ui-field__control">
                      <select
                        className="ui-input"
                        value={profileDraft.supplierId}
                        onChange={(event) => setProfileDraft((current) => ({ ...current, supplierId: event.target.value }))}
                      >
                        <option value="">Selecciona proveedor</option>
                        {providerOptions.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <TextField
                      label="Dolar base"
                      type="number"
                      min={0}
                      step="0.01"
                      value={profileDraft.defaultUsdRate}
                      onChange={(event) =>
                        setProfileDraft((current) => ({ ...current, defaultUsdRate: event.target.value }))
                      }
                    />
                    <TextField
                      label="Envio USD"
                      type="number"
                      min={0}
                      step="0.01"
                      value={profileDraft.defaultShippingUsd}
                      onChange={(event) =>
                        setProfileDraft((current) => ({ ...current, defaultShippingUsd: event.target.value }))
                      }
                    />
                    <TextField
                      label="Margen fallback %"
                      type="number"
                      min={0}
                      step="0.01"
                      value={profileDraft.fallbackMarginPercent}
                      onChange={(event) =>
                        setProfileDraft((current) => ({ ...current, fallbackMarginPercent: event.target.value }))
                      }
                    />
                  </div>

                  <TextField
                    label="Google Sheet de colores por defecto"
                    value={profileDraft.defaultColorSheetUrl}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, defaultColorSheetUrl: event.target.value }))
                    }
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit?gid=0"
                  />

                  <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={profileDraft.active}
                      onChange={(event) => setProfileDraft((current) => ({ ...current, active: event.target.checked }))}
                    />
                    Perfil activo para nuevas corridas
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={profileDraft.rememberColorSheet}
                      onChange={(event) =>
                        setProfileDraft((current) => ({ ...current, rememberColorSheet: event.target.checked }))
                      }
                    />
                    Recordar la URL de la hoja de colores en este perfil
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={profileSaving}>
                      {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {profileMode === 'create' ? 'Crear perfil' : 'Actualizar perfil'}
                    </Button>
                    {selectedProfile?.lastBatch ? (
                      <StatusBadge
                        size="sm"
                        tone="info"
                        label={`Ultimo batch ${formatDateTime(selectedProfile.lastBatch.createdAt)}`}
                      />
                    ) : null}
                  </div>
                </form>
              </div>
            </SectionCard>

            <SectionCard
              title="Corrida actual"
              description="Puedes sobrescribir dolar y envio solo para esta importacion sin tocar el perfil base."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Dolar para esta corrida"
                  type="number"
                  min={0}
                  step="0.01"
                  value={usdRate}
                  onChange={(event) => {
                    setUsdRate(event.target.value);
                    markPreviewDirty();
                  }}
                  placeholder={selectedProfile ? formatDecimalInput(selectedProfile.defaultUsdRate) : '0'}
                />
                <TextField
                  label="Envio USD para esta corrida"
                  type="number"
                  min={0}
                  step="0.01"
                  value={shippingUsd}
                  onChange={(event) => {
                    setShippingUsd(event.target.value);
                    markPreviewDirty();
                  }}
                  placeholder={selectedProfile ? formatDecimalInput(selectedProfile.defaultShippingUsd) : '0'}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Listado del proveedor"
              description="Pega el texto completo o carga un .txt. El parser ignora encabezados basura, links y notas operativas."
              actions={
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Cargar .txt
                </Button>
              }
            >
              <div className="grid gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={(event) => void handleFilePicked(event)}
                />

                <TextAreaField
                  label="Texto del listado"
                  value={rawText}
                  onChange={(event) => {
                    setRawText(event.target.value);
                    markPreviewDirty();
                  }}
                  rows={18}
                  placeholder="Pega aca el mensaje completo del proveedor."
                  hint="Soporta secciones como *Samsung*, precios USD y lineas Sin Stock."
                />

                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => void runPreview()} disabled={previewLoading || !rawText.trim()}>
                    {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
                    {hasPreview ? 'Reanalizar listado' : 'Analizar listado'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRawText('');
                      resetPreviewState();
                      setNotice('');
                      setError('');
                    }}
                    disabled={!rawText && !hasPreview}
                  >
                    Limpiar texto
                  </Button>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Fuente de colores"
              description="Opcional. Puedes pegar una URL publica de Google Sheets o cargar un CSV exportado para detectar colores y stock por color."
              actions={(
                <Button type="button" variant="outline" size="sm" onClick={() => colorCsvInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Cargar CSV
                </Button>
              )}
            >
              <div className="grid gap-4">
                <input
                  ref={colorCsvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => void handleColorCsvPicked(event)}
                />

                <TextField
                  label="URL Google Sheet"
                  value={colorSheetUrl}
                  onChange={(event) => {
                    setColorSheetUrl(event.target.value);
                    markPreviewDirty();
                  }}
                  placeholder={selectedProfile?.defaultColorSheetUrl ?? 'https://docs.google.com/spreadsheets/d/.../edit?gid=0'}
                />

                <TextAreaField
                  label="CSV cargado"
                  value={colorCsvText}
                  onChange={(event) => {
                    setColorCsvText(event.target.value);
                    markPreviewDirty();
                  }}
                  rows={6}
                  placeholder="Si subes un CSV o pegas su contenido aca, tiene prioridad sobre la URL de Google Sheets."
                  hint="Si completas ambas fuentes, se usa primero el CSV de esta corrida."
                />

                <div className="flex flex-wrap gap-2">
                  {colorCsvText.trim() ? <StatusBadge size="sm" tone="accent" label="Fuente activa: CSV" /> : null}
                  {!colorCsvText.trim() && colorSheetUrl.trim() ? (
                    <StatusBadge size="sm" tone="info" label="Fuente activa: Google Sheet" />
                  ) : null}
                  {!colorCsvText.trim() && !colorSheetUrl.trim() ? (
                    <StatusBadge size="sm" tone="neutral" label="Sin colores para esta corrida" />
                  ) : null}
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            {!preview ? (
              <SectionCard
                title="Preview pendiente"
                description="Analiza el listado para ver nuevas altas, actualizaciones, faltantes y conflictos antes de aplicar."
              >
                <EmptyState
                  title="Todavia no hay preview"
                  description="Cuando analices el texto, aca vas a ver el resumen del lote, el mapping por secciones y los productos detectados."
                  icon={<FileText className="h-5 w-5" />}
                />
              </SectionCard>
            ) : (
              <>
                <SectionCard
                  title="Resumen del lote"
                  description="Estados calculados con el perfil seleccionado, reglas de precio actuales y exclusiones manuales."
                  actions={
                    <div className="flex flex-wrap gap-2">
                      {preview.blocked ? <StatusBadge tone="danger" size="sm" label="Conflictos pendientes" /> : null}
                      {previewDirty ? <StatusBadge tone="warning" size="sm" label="Reanalizar antes de aplicar" /> : null}
                    </div>
                  }
                >
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <MetricTile label="Nuevos" value={String(preview.summary.newCount)} tone="success" />
                    <MetricTile label="Actualizados" value={String(preview.summary.updatedCount)} tone="accent" />
                    <MetricTile label="Sin cambios" value={String(preview.summary.unchangedCount)} tone="neutral" />
                    <MetricTile
                      label="Sin stock proveedor"
                      value={String(preview.summary.supplierOutOfStockCount)}
                      tone="warning"
                    />
                    <MetricTile label="A desactivar" value={String(preview.summary.deactivatedCount)} tone="danger" />
                    <MetricTile
                      label="Conflictos"
                      value={String(preview.summary.conflictCount)}
                      tone={preview.summary.conflictCount > 0 ? 'danger' : 'neutral'}
                    />
                    <MetricTile label="Excluidos" value={String(currentExcludedCount)} tone="info" />
                  </div>

                  {preview.colorImport.enabled ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <MetricTile label="Colores vinculados" value={String(preview.colorImport.matchedCount)} tone="accent" />
                      <MetricTile label="Colores nuevos" value={String(preview.colorImport.newCount)} tone="success" />
                      <MetricTile label="Colores actualizados" value={String(preview.colorImport.updatedCount)} tone="info" />
                      <MetricTile label="Sin match" value={String(preview.colorImport.unmatchedCount)} tone="warning" />
                      <MetricTile label="Colores sin stock" value={String(preview.colorImport.outOfStockCount)} tone="warning" />
                      <MetricTile label="Colores a desactivar" value={String(preview.colorImport.deactivatedCount)} tone="danger" />
                    </div>
                  ) : null}

                  {preview.summary.conflictCount > 0 ? (
                    <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                      Hay duplicados con el mismo producto dentro del listado activo. Puedes abrir las secciones marcadas con conflicto o usar{' '}
                      <span className="font-semibold">Resolver duplicados</span> para dejar solo la primera aparicion incluida de cada uno.
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button type="button" onClick={() => void handleApply()} disabled={applying || preview.blocked || previewDirty}>
                      {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Aplicar importacion
                    </Button>
                    {preview.summary.conflictCount > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void resolveConflictsAutomatically()}
                        disabled={previewLoading || applying}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Resolver duplicados
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" onClick={() => void runPreview()} disabled={previewLoading}>
                      <RefreshCcw className="h-4 w-4" />
                      Reanalizar
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/admin/productos">Ver catalogo</Link>
                    </Button>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Mapeo de secciones"
                  description="Cada seccion del texto termina en una categoria. Si eliges crear nueva, esa categoria se genera al aplicar."
                >
                  <div className="space-y-4">
                    {preview.sections.map((section) => {
                      const mapping = sectionMappings[section.sectionKey] ?? {
                        categoryId: section.categoryId ?? '',
                        createCategoryName: section.createCategoryName ?? section.sectionName,
                      };
                      const createNew = !mapping.categoryId;

                      return (
                        <div
                          key={section.sectionKey}
                          className="grid gap-4 rounded-3xl border border-zinc-200 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)]"
                        >
                          <div className="space-y-2">
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Seccion detectada</div>
                            <div className="text-base font-semibold text-zinc-900">{section.sectionName}</div>
                            <div className="flex flex-wrap gap-2">
                              <StatusBadge
                                size="sm"
                                tone={section.mappingSource === 'new' ? 'warning' : section.mappingSource === 'input' ? 'accent' : 'info'}
                                label={mappingSourceLabel(section.mappingSource)}
                              />
                              {section.willCreateCategory ? <StatusBadge size="sm" tone="accent" label="Se crea categoria" /> : null}
                            </div>
                          </div>

                          <label className="ui-field">
                            <span className="ui-field__label">Categoria destino</span>
                            <span className="ui-field__control">
                              <select
                                className="ui-input"
                                value={mapping.categoryId || NEW_CATEGORY_VALUE}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  updateMapping(section.sectionKey, {
                                    categoryId: value === NEW_CATEGORY_VALUE ? '' : value,
                                    createCategoryName:
                                      value === NEW_CATEGORY_VALUE ? mapping.createCategoryName || section.sectionName : '',
                                  });
                                }}
                              >
                                <option value={NEW_CATEGORY_VALUE}>Crear categoria nueva</option>
                                {sortedCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {buildCategoryPathLabel(category)}
                                  </option>
                                ))}
                              </select>
                            </span>
                          </label>

                          <TextField
                            label={createNew ? 'Nombre de categoria nueva' : 'Categoria vinculada'}
                            value={createNew ? mapping.createCategoryName : section.categoryName ?? ''}
                            onChange={(event) => updateMapping(section.sectionKey, { createCategoryName: event.target.value })}
                            disabled={!createNew}
                            placeholder={section.sectionName}
                          />
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Seleccion por secciones"
                  description="Decides primero por marca o tipo. Si necesitas afinar, despliegas la seccion y excluyes productos puntuales."
                  actions={
                    <div className="flex flex-wrap gap-2">
                      {conflictItems.length > 0 ? (
                        <StatusBadge tone="danger" size="sm" label={`${conflictItems.length} conflictivos`} />
                      ) : null}
                      {currentExcludedCount > 0 ? (
                        <StatusBadge tone="warning" size="sm" label={`${currentExcludedCount} excluidos`} />
                      ) : null}
                    </div>
                  }
                >
                  {preview.items.length === 0 ? (
                    <EmptyState
                      title="No encontramos lineas utilizables"
                      description="Revisa el formato del listado o confirma que las lineas incluyan secciones validas y precios en USD."
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-4">
                        <label className="flex flex-wrap items-center gap-3 text-sm font-semibold text-zinc-800">
                          <input
                            type="checkbox"
                            checked={rememberExclusions}
                            onChange={(event) => setRememberExclusions(event.target.checked)}
                          />
                          Recordar esta seleccion para proximos listados de este perfil
                        </label>
                        <div className="mt-2 text-xs leading-relaxed text-zinc-600">
                          Si lo activas al aplicar, la web volvera a dejar desmarcadas estas secciones y productos en la proxima corrida.
                        </div>
                        {rememberedSelectionCount > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {preview.selection.rememberedSectionKeys.length > 0 ? (
                              <StatusBadge
                                tone="info"
                                size="sm"
                                label={`${preview.selection.rememberedSectionKeys.length} secciones recordadas`}
                              />
                            ) : null}
                            {preview.selection.rememberedSourceKeys.length > 0 ? (
                              <StatusBadge
                                tone="info"
                                size="sm"
                                label={`${preview.selection.rememberedSourceKeys.length} productos recordados`}
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-3">
                        {preview.sections.map((section) => {
                          const sectionItems = itemsBySection.get(section.sectionKey) ?? [];
                          const sectionExcluded = effectiveExcludedSectionKeySet.has(section.sectionKey);
                          const includedCount = sectionItems.filter((item) =>
                            isPreviewItemIncluded(item, effectiveExcludedSectionKeySet, effectiveExcludedSourceKeySet, effectiveExcludedRowIdSet),
                          ).length;
                          const sectionExcludedCount = sectionItems.length - includedCount;
                          const sectionHasConflict = sectionItems.some(
                            (item) =>
                              isPreviewItemIncluded(
                                item,
                                effectiveExcludedSectionKeySet,
                                effectiveExcludedSourceKeySet,
                                effectiveExcludedRowIdSet,
                              ) && item.status === 'conflict',
                          );
                          const sectionRememberedProductCount = sectionItems.filter((item) =>
                            rememberedSourceKeySet.has(item.sourceKey),
                          ).length;
                          const expanded = expandedSections[section.sectionKey] ?? false;

                          return (
                            <div key={section.sectionKey} className="overflow-hidden rounded-3xl border border-zinc-200 bg-white">
                              <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4">
                                <div className="min-w-0 flex-1 space-y-2">
                                  <div className="text-base font-semibold text-zinc-900">{section.sectionName}</div>
                                  <div className="flex flex-wrap gap-2">
                                    <StatusBadge
                                      size="sm"
                                      tone={sectionExcluded ? 'warning' : 'success'}
                                      label={sectionExcluded ? 'Seccion excluida' : `${includedCount}/${sectionItems.length} incluidos`}
                                    />
                                    <StatusBadge
                                      size="sm"
                                      tone={section.mappingSource === 'new' ? 'warning' : section.mappingSource === 'input' ? 'accent' : 'info'}
                                      label={mappingSourceLabel(section.mappingSource)}
                                    />
                                    {rememberedSectionKeySet.has(section.sectionKey) ? (
                                      <StatusBadge size="sm" tone="info" label="Exclusion recordada" />
                                    ) : null}
                                    {sectionRememberedProductCount > 0 ? (
                                      <StatusBadge
                                        size="sm"
                                        tone="info"
                                        label={`${sectionRememberedProductCount} productos recordados`}
                                      />
                                    ) : null}
                                    {sectionHasConflict ? <StatusBadge size="sm" tone="danger" label="Conflictos" /> : null}
                                    {section.willCreateCategory ? <StatusBadge size="sm" tone="accent" label="Crea categoria" /> : null}
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    Categoria: {section.categoryName ?? section.createCategoryName ?? 'Sin categoria'} ·{' '}
                                    {sectionExcludedCount} excluidos
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <label className="flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700">
                                    <input
                                      type="checkbox"
                                      checked={!sectionExcluded}
                                      onChange={() => toggleSectionExclusion(section.sectionKey)}
                                    />
                                    {!sectionExcluded ? 'Incluir seccion' : 'Seccion fuera'}
                                  </label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleSectionExpanded(section.sectionKey)}
                                  >
                                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    {expanded ? 'Ocultar productos' : `Ver productos (${sectionItems.length})`}
                                  </Button>
                                </div>
                              </div>

                              {expanded ? (
                                <div className="border-t border-zinc-200 bg-zinc-50/60 px-4 py-4">
                                  <div className="space-y-3">
                                    {sectionItems.map((item) => {
                                      const itemIncluded = isPreviewItemIncluded(
                                        item,
                                        effectiveExcludedSectionKeySet,
                                        effectiveExcludedSourceKeySet,
                                        effectiveExcludedRowIdSet,
                                      );
                                      const duplicateCount = duplicateCountBySourceKey.get(item.sourceKey) ?? 0;
                                      const rowExcluded = effectiveExcludedRowIdSet.has(item.rowId);
                                      const sourceExcluded = effectiveExcludedSourceKeySet.has(item.sourceKey);
                                      const useRowToggle = duplicateCount > 1 && !sourceExcluded;
                                      const toggleLabel = sectionExcluded
                                        ? 'Hereda exclusion de la seccion'
                                        : useRowToggle
                                          ? rowExcluded
                                            ? 'Fila excluida'
                                            : 'Excluir solo esta fila'
                                          : itemIncluded
                                            ? 'Producto incluido'
                                            : 'Producto excluido';

                                      return (
                                        <div
                                          key={item.rowId}
                                          className={`rounded-3xl border bg-white p-4 ${rowRingClass(item, !itemIncluded)}`}
                                        >
                                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="min-w-0 flex-1">
                                              <label className="flex items-start gap-3">
                                                <input
                                                  type="checkbox"
                                                  checked={itemIncluded}
                                                  disabled={sectionExcluded}
                                                  onChange={() => toggleItemExclusion(item)}
                                                />
                                                <div className="min-w-0">
                                                  <div className="font-semibold text-zinc-900">{item.title}</div>
                                                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                                                    <span>Linea {item.lineNumber}</span>
                                                    <span>{toggleLabel}</span>
                                                    {duplicateCount > 1 ? <span>Duplicado x{duplicateCount}</span> : null}
                                                    {item.existingProduct ? <span>Existe como {item.existingProduct.name}</span> : null}
                                                  </div>
                                                  {item.existingProduct ? (
                                                    <div className="mt-2 text-xs text-zinc-500">
                                                      Actual: ${item.existingProduct.price.toLocaleString('es-AR')} ·{' '}
                                                      {availabilityLabel(item.existingProduct.supplierAvailability)}
                                                    </div>
                                                  ) : null}
                                                </div>
                                              </label>
                                            </div>

                                            <div className="grid min-w-0 gap-3 text-sm text-zinc-700 sm:grid-cols-2 xl:min-w-[22rem]">
                                              <div>
                                                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                  Origen
                                                </div>
                                                <div className="mt-1 font-semibold text-zinc-900">
                                                  {item.sourcePriceUsd == null ? 'Sin precio' : `USD ${item.sourcePriceUsd.toLocaleString('es-AR')}`}
                                                </div>
                                                <div className="mt-1 text-xs text-zinc-500">
                                                  Costo ARS $ {item.nextCostPrice.toLocaleString('es-AR')}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                  Venta
                                                </div>
                                                <div className="mt-1 font-semibold text-zinc-900">
                                                  $ {item.nextPrice.toLocaleString('es-AR')}
                                                </div>
                                                <div className="mt-1 text-xs text-zinc-500">
                                                  Margen {item.marginPercent.toLocaleString('es-AR')}%
                                                </div>
                                              </div>
                                              <div className="sm:col-span-2 flex flex-wrap gap-2">
                                                <StatusBadge size="sm" tone={statusTone(item.status)} label={statusLabel(item.status)} />
                                                <StatusBadge
                                                  size="sm"
                                                  tone={item.supplierAvailability === 'OUT_OF_STOCK' ? 'warning' : 'success'}
                                                  label={availabilityLabel(item.supplierAvailability)}
                                                />
                                                {rememberedSourceKeySet.has(item.sourceKey) ? (
                                                  <StatusBadge size="sm" tone="info" label="Producto recordado" />
                                                ) : null}
                                                {rowExcluded ? (
                                                  <StatusBadge size="sm" tone="warning" label="Exclusion por fila" />
                                                ) : null}
                                                {item.collapsedDuplicate ? (
                                                  <StatusBadge size="sm" tone="neutral" label="Duplicado unificado" />
                                                ) : null}
                                                {item.conflictReason ? (
                                                  <StatusBadge size="sm" tone="danger" label={item.conflictReason} />
                                                ) : null}
                                              </div>
                                              <div className="sm:col-span-2 text-xs text-zinc-500">
                                                Categoria: {item.categoryName ?? item.createCategoryName ?? 'Sin categoria'} ·{' '}
                                                {item.appliedRuleName ?? 'Fallback del perfil'}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </SectionCard>

                {preview.colorImport.enabled ? (
                  <SectionCard
                    title="Preview de colores"
                    description="Los colores solo enriquecen productos por encargue ya detectados en el TXT. Las filas sin match quedan como warning y no bloquean la importacion."
                  >
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge
                            size="sm"
                            tone={preview.colorImport.sourceKind === 'csv' ? 'accent' : 'info'}
                            label={preview.colorImport.sourceKind === 'csv' ? 'Fuente: CSV' : 'Fuente: Google Sheet'}
                          />
                          <StatusBadge size="sm" tone="neutral" label={`${preview.colorImport.rowsParsed} filas leidas`} />
                          {preview.colorImport.sourceLabel ? (
                            <StatusBadge size="sm" tone="neutral" label={preview.colorImport.sourceLabel} />
                          ) : null}
                        </div>

                        {preview.colorImport.warnings.length > 0 ? (
                          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4">
                            <div className="text-sm font-semibold text-amber-900">
                              {preview.colorImport.warnings.length} filas del sheet no se importan
                            </div>
                            <div className="mt-3 space-y-3 text-sm text-amber-900">
                              {colorWarningsBySection.map((group) => (
                                <details key={group.key} className="rounded-2xl border border-amber-200 bg-white/80 px-3 py-2">
                                  <summary className="cursor-pointer list-none">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="font-semibold">{group.sectionName}</div>
                                      <StatusBadge size="sm" tone="warning" label={`${group.warnings.length} sin match`} />
                                    </div>
                                  </summary>
                                  <div className="mt-3 space-y-2">
                                    {group.warnings.slice(0, 20).map((warning) => (
                                      <div key={warning.rowId} className="rounded-2xl border border-amber-100 bg-white px-3 py-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <div className="font-semibold">Fila {warning.rowNumber}</div>
                                          <StatusBadge size="sm" tone="neutral" label={colorWarningReasonLabel(warning.reasonCode)} />
                                        </div>
                                        <div className="mt-1 text-xs text-zinc-600">{warning.rawTitle}</div>
                                        <div className="mt-1 text-xs text-amber-800">{warning.reason}</div>
                                        {warning.suggestions.length > 0 ? (
                                          <div className="mt-2 text-xs text-zinc-600">
                                            Sugerencias: {warning.suggestions.join(' · ')}
                                          </div>
                                        ) : null}
                                      </div>
                                    ))}
                                    {group.warnings.length > 20 ? (
                                      <div className="text-xs font-semibold text-amber-800">
                                        Se muestran 20 de {group.warnings.length} filas para mantener la vista compacta.
                                      </div>
                                    ) : null}
                                  </div>
                                </details>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {preview.colorImport.items.length === 0 ? (
                          <EmptyState
                            title="No se detectaron colores vinculables"
                            description="Carga una hoja publica o CSV valido y revisa que el nombre base del producto coincida con el TXT."
                          />
                        ) : (
                          <div className="space-y-3">
                            {preview.colorImport.items.map((group) => (
                              <details key={group.productSourceKey} className="rounded-3xl border border-zinc-200 bg-white px-4 py-3">
                                <summary className="cursor-pointer list-none">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <div className="font-semibold text-zinc-900">{group.productTitle}</div>
                                      <div className="text-xs text-zinc-500">{group.sectionName} · {group.items.length} colores detectados</div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <StatusBadge size="sm" tone="accent" label={`${group.items.length} colores`} />
                                      {group.items.some((item) => item.supplierAvailability === 'OUT_OF_STOCK') ? (
                                        <StatusBadge size="sm" tone="warning" label="Incluye agotados" />
                                      ) : null}
                                    </div>
                                  </div>
                                </summary>

                                <div className="mt-4 space-y-2">
                                  {group.items.map((item) => (
                                    <div key={item.rowId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-3 py-2">
                                      <div>
                                        <div className="font-semibold text-zinc-900">{item.label}</div>
                                        <div className="text-xs text-zinc-500">{item.rawTitle}</div>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <StatusBadge size="sm" tone={item.status === 'new' ? 'success' : item.status === 'availability_update' ? 'info' : 'neutral'} label={item.status === 'new' ? 'Nuevo' : item.status === 'availability_update' ? 'Actualiza' : 'Sin cambios'} />
                                        <StatusBadge size="sm" tone={item.supplierAvailability === 'OUT_OF_STOCK' ? 'warning' : 'success'} label={item.supplierAvailability === 'OUT_OF_STOCK' ? 'Sin stock' : 'Stock'} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            ))}
                          </div>
                        )}
                      </div>
                  </SectionCard>
                ) : null}

                <SectionCard
                  title="Productos a desactivar por faltante"
                  description="Estos productos existian en el perfil anterior pero ya no aparecen en el listado actual."
                >
                  {preview.missing.length === 0 ? (
                    <EmptyState
                      title="No hay faltantes para desactivar"
                      description="Todo lo previamente activo del perfil sigue presente en el listado analizado."
                      icon={<CheckCircle2 className="h-5 w-5" />}
                    />
                  ) : (
                    <div className="space-y-3">
                      {preview.missing.map((item) => (
                        <div
                          key={item.productId}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3"
                        >
                          <div>
                            <div className="font-semibold text-zinc-900">{item.title}</div>
                            <div className="text-xs text-zinc-500">{item.categoryName ?? 'Sin categoria'}</div>
                          </div>
                          <StatusBadge tone="warning" size="sm" label="Se desactiva" />
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function InfoPill({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/80 p-4">
      <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-950 text-white">
        {icon}
      </div>
      <div className="text-sm font-semibold text-zinc-900">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-zinc-600">{description}</div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';
}) {
  const toneClasses: Record<typeof tone, string> = {
    neutral: 'border-zinc-200 bg-white text-zinc-900',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    accent: 'border-indigo-200 bg-indigo-50 text-indigo-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
  };

  return (
    <div className={`rounded-3xl border px-4 py-3 ${toneClasses[tone]}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">{label}</div>
      <div className="mt-2 text-xl font-black">{value}</div>
    </div>
  );
}

function emptyProfileDraft(supplierId = ''): ProfileDraft {
  return {
    supplierId,
    name: '',
    active: true,
    defaultUsdRate: '',
    defaultShippingUsd: '',
    fallbackMarginPercent: '15',
    defaultColorSheetUrl: '',
    rememberColorSheet: false,
  };
}

function pickInitialProfile(profiles: SpecialOrderProfile[]) {
  return profiles.find((profile) => profile.active) ?? profiles[0] ?? null;
}

function profileToDraft(profile: SpecialOrderProfile): ProfileDraft {
  return {
    supplierId: profile.supplier.id,
    name: profile.name,
    active: profile.active,
    defaultUsdRate: formatDecimalInput(profile.defaultUsdRate),
    defaultShippingUsd: formatDecimalInput(profile.defaultShippingUsd),
    fallbackMarginPercent: formatDecimalInput(profile.fallbackMarginPercent),
    defaultColorSheetUrl: profile.defaultColorSheetUrl ?? '',
    rememberColorSheet: profile.rememberColorSheet,
  };
}

function normalizeProfileDraft(draft: ProfileDraft) {
  return {
    supplierId: draft.supplierId.trim(),
    name: draft.name.trim(),
    active: draft.active,
    defaultUsdRate: parseOptionalNumber(draft.defaultUsdRate) ?? 0,
    defaultShippingUsd: parseOptionalNumber(draft.defaultShippingUsd) ?? 0,
    fallbackMarginPercent: parseOptionalNumber(draft.fallbackMarginPercent) ?? 0,
    defaultColorSheetUrl: draft.defaultColorSheetUrl.trim() || null,
    rememberColorSheet: draft.rememberColorSheet,
  };
}

function parseOptionalNumber(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDecimalInput(value: number) {
  if (!Number.isFinite(value)) return '';
  return value.toString();
}

function serializeSectionMappings(mappings: Record<string, SectionMappingDraft>): SpecialOrderSectionMappingInput[] {
  return Object.entries(mappings).map(([sectionKey, mapping]) => ({
    sectionKey,
    categoryId: mapping.categoryId.trim() || null,
    createCategoryName: mapping.categoryId.trim() ? null : mapping.createCategoryName.trim() || null,
  }));
}

function toggleKey(current: string[], value: string) {
  return current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value];
}

function isPreviewItemIncluded(
  item: SpecialOrderPreviewItem,
  excludedSectionKeys: Set<string>,
  excludedSourceKeys: Set<string>,
  excludedRowIds: Set<string>,
) {
  return !item.collapsedDuplicate && !excludedSectionKeys.has(item.sectionKey) && !excludedSourceKeys.has(item.sourceKey) && !excludedRowIds.has(item.rowId);
}

function statusLabel(status: SpecialOrderPreviewItem['status']) {
  switch (status) {
    case 'new':
      return 'Nuevo';
    case 'price_update':
      return 'Actualiza precio';
    case 'availability_update':
      return 'Actualiza disponibilidad';
    case 'unchanged':
      return 'Sin cambios';
    case 'missing_deactivate':
      return 'Se desactiva';
    case 'conflict':
      return 'Duplicado/conflicto';
    default:
      return status;
  }
}

function statusTone(status: SpecialOrderPreviewItem['status']) {
  switch (status) {
    case 'new':
      return 'success';
    case 'price_update':
      return 'accent';
    case 'availability_update':
      return 'info';
    case 'unchanged':
      return 'neutral';
    case 'missing_deactivate':
      return 'warning';
    case 'conflict':
      return 'danger';
    default:
      return 'neutral';
  }
}

function availabilityLabel(value: SpecialOrderPreviewItem['supplierAvailability']) {
  switch (value) {
    case 'IN_STOCK':
      return 'Disponible proveedor';
    case 'OUT_OF_STOCK':
      return 'Sin stock proveedor';
    case 'UNKNOWN':
      return 'Disponibilidad sin confirmar';
    default:
      return value;
  }
}

function mappingSourceLabel(value: 'input' | 'profile' | 'existing' | 'new') {
  switch (value) {
    case 'input':
      return 'Mapeo manual';
    case 'profile':
      return 'Recordado por perfil';
    case 'existing':
      return 'Categoria existente';
    case 'new':
      return 'Seccion nueva';
    default:
      return value;
  }
}

function colorWarningReasonLabel(reasonCode: SpecialOrderImportPreview['colorImport']['warnings'][number]['reasonCode']) {
  switch (reasonCode) {
    case 'section_excluded':
      return 'Seccion excluida';
    case 'product_excluded':
      return 'Producto excluido';
    case 'no_product_match':
      return 'Sin producto base';
    case 'ambiguous_match':
      return 'Ambiguo';
    case 'empty_color':
      return 'Color no aislado';
    case 'duplicate_variant':
      return 'Duplicado';
    default:
      return reasonCode;
  }
}

function rowRingClass(item: SpecialOrderPreviewItem, excluded: boolean) {
  if (excluded) return 'ring-zinc-200 opacity-70';
  if (item.status === 'conflict') return 'ring-rose-300';
  if (item.supplierAvailability === 'OUT_OF_STOCK') return 'ring-amber-300';
  return 'ring-zinc-200';
}

function formatDateTime(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'sin fecha';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}
