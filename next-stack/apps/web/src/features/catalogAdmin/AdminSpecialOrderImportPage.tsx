import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
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

type ProfileDraft = {
  supplierId: string;
  name: string;
  active: boolean;
  defaultUsdRate: string;
  defaultShippingUsd: string;
  fallbackMarginPercent: string;
};

type SectionMappingDraft = {
  categoryId: string;
  createCategoryName: string;
};

const NEW_CATEGORY_VALUE = '__new__';

export function AdminSpecialOrderImportPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
  const [preview, setPreview] = useState<SpecialOrderImportPreview | null>(null);
  const [previewDirty, setPreviewDirty] = useState(false);
  const [sectionMappings, setSectionMappings] = useState<Record<string, SectionMappingDraft>>({});
  const [excludedRowIds, setExcludedRowIds] = useState<string[]>([]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const providerOptions = useMemo(
    () => providers.filter((provider) => provider.active).sort((left, right) => left.name.localeCompare(right.name, 'es')),
    [providers],
  );

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.name.localeCompare(right.name, 'es')),
    [categories],
  );

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
        } else {
          const fallbackSupplierId = providersResponse.items.find((provider) => provider.active)?.id ?? '';
          setSelectedProfileId('');
          setProfileMode('create');
          setProfileDraft(emptyProfileDraft(fallbackSupplierId));
          setUsdRate('');
          setShippingUsd('');
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
  const includedItems = preview?.items.filter((item) => item.included) ?? [];
  const conflictItems = includedItems.filter((item) => item.status === 'conflict');

  function markPreviewDirty() {
    setPreviewDirty(true);
  }

  function resetPreviewState() {
    setPreview(null);
    setPreviewDirty(false);
    setSectionMappings({});
    setExcludedRowIds([]);
  }

  function handleProfileSelection(nextProfileId: string) {
    setSelectedProfileId(nextProfileId);
    const nextProfile = profiles.find((profile) => profile.id === nextProfileId) ?? null;
    if (nextProfile) {
      setProfileMode('edit');
      setProfileDraft(profileToDraft(nextProfile));
      setUsdRate(formatDecimalInput(nextProfile.defaultUsdRate));
      setShippingUsd(formatDecimalInput(nextProfile.defaultShippingUsd));
    }
    resetPreviewState();
    setNotice('');
    setError('');
  }

  function beginCreateProfile() {
    const defaultSupplierId = providerOptions[0]?.id ?? '';
    setProfileMode('create');
    setProfileDraft(emptyProfileDraft(defaultSupplierId));
    setNotice('');
    setError('');
  }

  function restoreSelectedProfile() {
    if (!selectedProfile) return;
    setProfileMode('edit');
    setProfileDraft(profileToDraft(selectedProfile));
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

  function buildPreviewPayload() {
    return {
      profileId: selectedProfileId,
      rawText,
      usdRate: parseOptionalNumber(usdRate),
      shippingUsd: parseOptionalNumber(shippingUsd),
      sectionMappings: serializeSectionMappings(sectionMappings),
      excludedRowIds,
    };
  }

  async function runPreview() {
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
      const response = await catalogAdminApi.previewSpecialOrderImport(buildPreviewPayload());
      setPreview(response);
      setPreviewDirty(false);
      setExcludedRowIds(response.items.filter((item) => !item.included).map((item) => item.rowId));
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
      setNotice(`Preview listo: ${response.summary.newCount} nuevos, ${response.summary.updatedCount} actualizados y ${response.summary.deactivatedCount} a desactivar.`);
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
      if (current.includes(rowId)) return current.filter((value) => value !== rowId);
      return [...current, rowId];
    });
    markPreviewDirty();
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
              title="3. Sincronizas"
              description="Crea o actualiza productos por encargue y desactiva los faltantes del perfil."
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <MetricTile label="Scope" value={selectedProfile?.name ?? 'Sin perfil'} tone="accent" />
          <MetricTile
            label="Proveedor"
            value={selectedProfile?.supplier.name ?? 'Definir perfil'}
            tone="neutral"
          />
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

                  <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={profileDraft.active}
                      onChange={(event) => setProfileDraft((current) => ({ ...current, active: event.target.checked }))}
                    />
                    Perfil activo para nuevas corridas
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
          </div>

          <div className="space-y-6">
            {!preview ? (
              <SectionCard title="Preview pendiente" description="Analiza el listado para ver nuevas altas, actualizaciones, faltantes y conflictos antes de aplicar.">
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
                    <MetricTile label="Sin stock proveedor" value={String(preview.summary.supplierOutOfStockCount)} tone="warning" />
                    <MetricTile label="A desactivar" value={String(preview.summary.deactivatedCount)} tone="danger" />
                    <MetricTile label="Conflictos" value={String(preview.summary.conflictCount)} tone={preview.summary.conflictCount > 0 ? 'danger' : 'neutral'} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button type="button" onClick={() => void handleApply()} disabled={applying || preview.blocked || previewDirty}>
                      {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Aplicar importacion
                    </Button>
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
                        <div key={section.sectionKey} className="grid gap-4 rounded-3xl border border-zinc-200 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)]">
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
                                      value === NEW_CATEGORY_VALUE
                                        ? mapping.createCategoryName || section.sectionName
                                        : '',
                                  });
                                }}
                              >
                                <option value={NEW_CATEGORY_VALUE}>Crear categoria nueva</option>
                                {sortedCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
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
                  title="Productos detectados"
                  description="Puedes excluir filas conflictivas o lineas que no quieras sincronizar. Luego reanaliza para recalcular el lote."
                  actions={
                    <div className="flex flex-wrap gap-2">
                      {conflictItems.length > 0 ? <StatusBadge tone="danger" size="sm" label={`${conflictItems.length} conflictivos`} /> : null}
                      {excludedRowIds.length > 0 ? <StatusBadge tone="warning" size="sm" label={`${excludedRowIds.length} excluidos`} /> : null}
                    </div>
                  }
                >
                  {preview.items.length === 0 ? (
                    <EmptyState
                      title="No encontramos lineas utilizables"
                      description="Revisa el formato del listado o confirma que las lineas incluyan secciones validas y precios en USD."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                            <th className="px-3 py-2">Incluye</th>
                            <th className="px-3 py-2">Producto</th>
                            <th className="px-3 py-2">Precio origen</th>
                            <th className="px-3 py-2">Precio final</th>
                            <th className="px-3 py-2">Estado</th>
                            <th className="px-3 py-2">Categoria</th>
                            <th className="px-3 py-2">Regla</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.items.map((item) => {
                            const excluded = excludedRowIds.includes(item.rowId);
                            return (
                              <tr key={item.rowId} className={`rounded-3xl bg-white shadow-sm ring-1 ${rowRingClass(item, excluded)}`}>
                                <td className="px-3 py-3 align-top">
                                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                                    <input
                                      type="checkbox"
                                      checked={!excluded}
                                      onChange={() => toggleRowExclusion(item.rowId)}
                                    />
                                    {!excluded ? 'Incluido' : 'Excluido'}
                                  </label>
                                </td>
                                <td className="px-3 py-3 align-top">
                                  <div className="font-semibold text-zinc-900">{item.title}</div>
                                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                                    <span>{item.sectionName}</span>
                                    <span>Linea {item.lineNumber}</span>
                                    {item.existingProduct ? <span>Existe como {item.existingProduct.name}</span> : null}
                                  </div>
                                  {item.existingProduct ? (
                                    <div className="mt-2 text-xs text-zinc-500">
                                      Actual: ${item.existingProduct.price.toLocaleString('es-AR')} ·{' '}
                                      {availabilityLabel(item.existingProduct.supplierAvailability)}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="px-3 py-3 align-top text-zinc-700">
                                  {item.sourcePriceUsd == null ? 'Sin precio' : `USD ${item.sourcePriceUsd.toLocaleString('es-AR')}`}
                                  <div className="mt-1 text-xs text-zinc-500">Costo ARS $ {item.nextCostPrice.toLocaleString('es-AR')}</div>
                                </td>
                                <td className="px-3 py-3 align-top font-semibold text-zinc-900">
                                  $ {item.nextPrice.toLocaleString('es-AR')}
                                  <div className="mt-1 text-xs font-medium text-zinc-500">Margen {item.marginPercent.toLocaleString('es-AR')}%</div>
                                </td>
                                <td className="px-3 py-3 align-top">
                                  <div className="flex flex-col gap-2">
                                    <StatusBadge size="sm" tone={statusTone(item.status)} label={statusLabel(item.status)} />
                                    <StatusBadge
                                      size="sm"
                                      tone={item.supplierAvailability === 'OUT_OF_STOCK' ? 'warning' : 'success'}
                                      label={availabilityLabel(item.supplierAvailability)}
                                    />
                                  </div>
                                </td>
                                <td className="px-3 py-3 align-top text-zinc-700">
                                  <div>{item.categoryName ?? item.createCategoryName ?? 'Sin categoria'}</div>
                                  {item.willCreateCategory ? <div className="mt-1 text-xs text-zinc-500">Se crea al aplicar</div> : null}
                                </td>
                                <td className="px-3 py-3 align-top text-zinc-700">
                                  {item.appliedRuleName ?? 'Fallback del perfil'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </SectionCard>

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
                        <div key={item.productId} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3">
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
