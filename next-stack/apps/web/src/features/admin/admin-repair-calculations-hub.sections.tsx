import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SectionCard } from '@/components/ui/section-card';
import { CustomSelect, type CustomSelectMenuAction } from '@/components/ui/custom-select';
import type { BrandItem, DeviceTypeItem, IssueItem, ModelItem, SimilarModelMatch } from './admin-devices-catalog.helpers';
import type { RepairRuleRow } from './admin-repair-pricing-rules.helpers';
import type { RepairCalculationGroupItem, RepairCalculationScope } from './admin-repair-calculation-context';

type ScopeSummaryItem = {
  label: string;
  value: string;
};

type RuleCardItem = {
  row: RepairRuleRow;
  specificityShort: string;
  specificityLabel: string;
  specificityTone: string;
  editTo: string;
};

export function AdminRepairCalculationsHubHero({
  error,
  success,
  openRulesTo,
}: {
  error: string;
  success: string;
  openRulesTo: string;
}) {
  return (
    <>
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Catalogo tecnico y calculo</h1>
            <p className="mt-1 max-w-3xl text-sm text-zinc-600">
              Entrada unica para entender y gestionar como se organiza el arbol tecnico de reparaciones y como impacta en las reglas automaticas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/calculos" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Volver a calculos
            </Link>
            <Link to={openRulesTo} className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Editor de reglas
            </Link>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}
    </>
  );
}

export function AdminRepairCalculationsGuideSection() {
  return (
    <SectionCard
      title="Orden real del catalogo"
      description="Visualmente se trabaja en secuencia, pero la logica de negocio sigue siendo arbol."
      tone="info"
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-sky-700">Arbol tecnico</div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-black text-zinc-900">
            <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-white">Tipo</span>
            <span className="text-zinc-400">-&gt;</span>
            <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-white">Marca</span>
            <span className="text-zinc-400">-&gt;</span>
            <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-white">Grupo</span>
            <span className="text-zinc-400">-&gt;</span>
            <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-white">Modelo</span>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <span className="font-black">Falla por Tipo:</span> no cuelga del modelo. Filtra reglas dentro del tipo activo.
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">Como aplica una regla</div>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            <p>
              <span className="font-black text-zinc-900">1.</span> El scope actual limita que marcas, grupos, modelos y fallas ves.
            </p>
            <p>
              <span className="font-black text-zinc-900">2.</span> Las reglas visibles se filtran por ese scope.
            </p>
            <p>
              <span className="font-black text-zinc-900">3.</span> Gana la regla mas especifica; si empatan, manda la prioridad.
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function AdminRepairCalculationsScopeSection({
  scope,
  summary,
  deviceTypeOptions,
  brandOptions,
  groupOptions,
  modelOptions,
  issueOptions,
  deviceTypeAction,
  brandAction,
  groupAction,
  modelAction,
  issueAction,
  onScopeChange,
  onClear,
}: {
  scope: RepairCalculationScope;
  summary: ScopeSummaryItem[];
  deviceTypeOptions: Array<{ value: string; label: string }>;
  brandOptions: Array<{ value: string; label: string }>;
  groupOptions: Array<{ value: string; label: string }>;
  modelOptions: Array<{ value: string; label: string }>;
  issueOptions: Array<{ value: string; label: string }>;
  deviceTypeAction?: CustomSelectMenuAction;
  brandAction?: CustomSelectMenuAction;
  groupAction?: CustomSelectMenuAction;
  modelAction?: CustomSelectMenuAction;
  issueAction?: CustomSelectMenuAction;
  onScopeChange: (patch: Partial<RepairCalculationScope>) => void;
  onClear: () => void;
}) {
  return (
    <SectionCard
      title="Scope activo"
      description="Este contexto manda que paneles ves y que reglas pueden aplicar."
      actions={
        <button type="button" onClick={onClear} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
          Limpiar contexto
        </button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ScopeField label="Tipo">
            <CustomSelect
              value={scope.deviceTypeId}
              onChange={(value) => onScopeChange({ deviceTypeId: value })}
              options={deviceTypeOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar tipo"
              menuAction={deviceTypeAction}
            />
          </ScopeField>
          <ScopeField label="Marca">
            <CustomSelect
              value={scope.deviceBrandId}
              onChange={(value) => onScopeChange({ deviceBrandId: value })}
              options={brandOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar marca"
              menuAction={brandAction}
            />
          </ScopeField>
          <ScopeField label="Grupo">
            <CustomSelect
              value={scope.deviceModelGroupId}
              onChange={(value) => onScopeChange({ deviceModelGroupId: value })}
              options={groupOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar grupo"
              menuAction={groupAction}
            />
          </ScopeField>
          <ScopeField label="Modelo">
            <CustomSelect
              value={scope.deviceModelId}
              onChange={(value) => onScopeChange({ deviceModelId: value })}
              options={modelOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar modelo"
              menuAction={modelAction}
            />
          </ScopeField>
          <ScopeField label="Falla">
            <CustomSelect
              value={scope.deviceIssueTypeId}
              onChange={(value) => onScopeChange({ deviceIssueTypeId: value })}
              options={issueOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar falla"
              menuAction={issueAction}
            />
          </ScopeField>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {summary.map((item) => (
            <div key={item.label} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">{item.label}</div>
              <div className="mt-1 text-sm font-bold text-zinc-900">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function AdminRepairCalculationsTypesPanel({
  rows,
  newName,
  newActive,
  creating,
  savingId,
  deletingId,
  focusedId,
  onNewNameChange,
  onNewActiveChange,
  onCreate,
  onRowChange,
  onSave,
  onDelete,
  openTo,
}: {
  rows: DeviceTypeItem[];
  newName: string;
  newActive: boolean;
  creating: boolean;
  savingId: string | null;
  deletingId: string | null;
  focusedId: string;
  onNewNameChange: (value: string) => void;
  onNewActiveChange: (value: boolean) => void;
  onCreate: () => void;
  onRowChange: (id: string, patch: Partial<DeviceTypeItem>) => void;
  onSave: (row: DeviceTypeItem) => void;
  onDelete: (row: DeviceTypeItem) => void;
  openTo: string;
}) {
  return (
    <SectionCard
      title="Tipos"
      description="Base del arbol. Desde aca nace todo lo demas."
      actions={<Link to={openTo} className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">Abrir editor</Link>}
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-zinc-800">Nuevo tipo</label>
            <input
              value={newName}
              onChange={(event) => onNewNameChange(event.target.value)}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              placeholder="Ej: Celular"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800 md:pb-3">
            <input type="checkbox" checked={newActive} onChange={(event) => onNewActiveChange(event.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
            Activo
          </label>
          <button type="button" onClick={onCreate} disabled={creating || !newName.trim()} className="btn-primary !h-11 !rounded-2xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
            {creating ? 'Creando...' : 'Crear'}
          </button>
        </div>

        <div className="max-h-80 space-y-2 overflow-auto pr-1">
          {rows.length === 0 ? <PanelEmptyState label="Sin tipos cargados." /> : null}
          {rows.map((row) => (
            <div
              key={row.id}
              className={`rounded-2xl border bg-white p-3 shadow-sm ${focusedId === row.id ? 'border-sky-300 ring-2 ring-sky-100' : 'border-zinc-200'}`}
            >
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-500">Nombre</label>
                  <input
                    value={row.name}
                    onChange={(event) => onRowChange(row.id, { name: event.target.value })}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 md:pb-2">
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={(event) => onRowChange(row.id, { active: event.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  Activo
                </label>
                <button type="button" onClick={() => onSave(row)} disabled={savingId === row.id || deletingId === row.id || !row.name.trim()} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
                  {savingId === row.id ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => onDelete(row)} disabled={savingId === row.id || deletingId === row.id} className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {deletingId === row.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function AdminRepairCalculationsBrandsPanel({
  rows,
  draft,
  selectedBrandId,
  creatingDisabled,
  onDraftChange,
  onCreate,
  onRename,
  onToggle,
  onDelete,
  onSelect,
  openTo,
}: {
  rows: BrandItem[];
  draft: string;
  selectedBrandId: string;
  creatingDisabled: boolean;
  onDraftChange: (value: string) => void;
  onCreate: () => void;
  onRename: (row: BrandItem) => void;
  onToggle: (row: BrandItem) => void;
  onDelete: (row: BrandItem) => void;
  onSelect: (row: BrandItem) => void;
  openTo: string;
}) {
  return (
    <SectionCard
      title="Marcas"
      description="Se filtran por tipo y despues ordenan grupos y modelos."
      actions={<Link to={openTo} className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">Abrir editor</Link>}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <input value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Ej: Samsung" className="h-11 flex-1 rounded-2xl border border-zinc-200 px-3 text-sm" />
          <button type="button" onClick={onCreate} disabled={creatingDisabled} className="btn-primary !h-11 !rounded-2xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
            Agregar
          </button>
        </div>
        <div className="max-h-80 space-y-2 overflow-auto pr-1">
          {rows.length === 0 ? <PanelEmptyState label="No hay marcas para el tipo actual." /> : null}
          {rows.map((row) => (
            <SimpleTaxonomyCard
              key={row.id}
              title={row.name}
              subtitle={`slug: ${row.slug}`}
              active={row.active}
              selected={selectedBrandId === row.id}
              onSelect={() => onSelect(row)}
              selectLabel={selectedBrandId === row.id ? 'Marca activa' : 'Trabajar esta marca'}
              onRename={() => onRename(row)}
              onToggle={() => onToggle(row)}
              onDelete={() => onDelete(row)}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function AdminRepairCalculationsGroupsPanel({
  rows,
  draft,
  active,
  disabled,
  savingId,
  onDraftChange,
  onActiveChange,
  onCreate,
  onRowChange,
  onSave,
  openTo,
}: {
  rows: RepairCalculationGroupItem[];
  draft: string;
  active: boolean;
  disabled: boolean;
  savingId: string | null;
  onDraftChange: (value: string) => void;
  onActiveChange: (value: boolean) => void;
  onCreate: () => void;
  onRowChange: (id: string, patch: Partial<RepairCalculationGroupItem>) => void;
  onSave: (row: RepairCalculationGroupItem) => void;
  openTo: string;
}) {
  return (
    <SectionCard
      title="Grupos"
      description="Agrupan modelos dentro de una marca. Sirven para reglas intermedias."
      actions={<Link to={openTo} className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">Abrir editor</Link>}
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-zinc-800">Nuevo grupo</label>
            <input value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Ej: Serie A / PS5" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" disabled={disabled} />
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800 md:pb-3">
            <input type="checkbox" checked={active} onChange={(event) => onActiveChange(event.target.checked)} className="h-4 w-4 rounded border-zinc-300" disabled={disabled} />
            Activo
          </label>
          <button type="button" onClick={onCreate} disabled={disabled || !draft.trim()} className="btn-primary !h-11 !rounded-2xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
            Crear
          </button>
        </div>

        {disabled ? <PanelHint label="Primero selecciona una marca para crear o editar grupos." /> : null}

        <div className="max-h-80 space-y-2 overflow-auto pr-1">
          {!disabled && rows.length === 0 ? <PanelEmptyState label="No hay grupos para la marca actual." /> : null}
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-500">Nombre</label>
                  <input value={row.name} onChange={(event) => onRowChange(row.id, { name: event.target.value })} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 md:pb-2">
                  <input type="checkbox" checked={row.active} onChange={(event) => onRowChange(row.id, { active: event.target.checked })} className="h-4 w-4 rounded border-zinc-300" />
                  Activo
                </label>
                <button type="button" onClick={() => onSave(row)} disabled={savingId === row.id || !row.name.trim()} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
                  {savingId === row.id ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function AdminRepairCalculationsModelsPanel({
  rows,
  draft,
  similarRows,
  hasExactDuplicate,
  brandSelected,
  selectedBrandName,
  groupOptions,
  onDraftChange,
  onCreate,
  onRename,
  onToggle,
  onDelete,
  onAssignGroup,
  assigningModelId,
  openTo,
}: {
  rows: ModelItem[];
  draft: string;
  similarRows: SimilarModelMatch[];
  hasExactDuplicate: boolean;
  brandSelected: boolean;
  selectedBrandName: string;
  groupOptions: Array<{ value: string; label: string }>;
  onDraftChange: (value: string) => void;
  onCreate: () => void;
  onRename: (row: ModelItem) => void;
  onToggle: (row: ModelItem) => void;
  onDelete: (row: ModelItem) => void;
  onAssignGroup: (modelId: string, groupId: string) => void;
  assigningModelId: string | null;
  openTo: string;
}) {
  return (
    <SectionCard
      title="Modelos"
      description="Nacen dentro de una marca y opcionalmente se asignan a un grupo."
      actions={<Link to={openTo} className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">Abrir editor</Link>}
    >
      <div className="space-y-3">
        {brandSelected ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <span className="font-black">Marca activa:</span> {selectedBrandName}. Los modelos nuevos se crean dentro de esta marca.
          </div>
        ) : (
          <PanelHint label='Paso 2: en "Marcas", elegi "Trabajar esta marca" para poder crear modelos.' />
        )}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={brandSelected ? `Nuevo modelo para ${selectedBrandName}` : 'Primero elegi una marca'}
            className="h-11 flex-1 rounded-2xl border border-zinc-200 px-3 text-sm"
            disabled={!brandSelected}
          />
          <button type="button" onClick={onCreate} disabled={!brandSelected || hasExactDuplicate || !draft.trim()} className="btn-primary !h-11 !rounded-2xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
            {hasExactDuplicate ? 'Ya existe' : 'Agregar modelo'}
          </button>
        </div>
        {brandSelected && draft.trim() ? (
          <SimilarModelHint
            selectedBrandName={selectedBrandName}
            matches={similarRows}
            hasExactDuplicate={hasExactDuplicate}
          />
        ) : null}

        <div className="max-h-80 space-y-2 overflow-auto pr-1">
          {brandSelected && rows.length === 0 ? <PanelEmptyState label="No hay modelos para el contexto actual." /> : null}
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="font-bold text-zinc-900">{row.name}</div>
                  <div className="text-xs text-zinc-500">slug: {row.slug}</div>
                  <div className="text-xs text-zinc-500">Marca: {selectedBrandName || row.brand.name}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                    <button type="button" onClick={() => onRename(row)} className="text-sky-700">
                      Renombrar
                    </button>
                    <button type="button" onClick={() => onToggle(row)} className="text-zinc-700">
                      {row.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button type="button" onClick={() => onDelete(row)} className="text-rose-700">
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="w-full md:max-w-[220px]">
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-500">Grupo</label>
                  <CustomSelect
                    value={row.deviceModelGroupId ?? ''}
                    onChange={(value) => onAssignGroup(row.id, value)}
                    options={groupOptions}
                    disabled={assigningModelId === row.id}
                    triggerClassName="min-h-11 rounded-xl font-bold"
                    ariaLabel="Asignar grupo al modelo"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function AdminRepairCalculationsIssuesPanel({
  rows,
  draft,
  typeSelected,
  onDraftChange,
  onCreate,
  onRename,
  onToggle,
  onDelete,
  openTo,
}: {
  rows: IssueItem[];
  draft: string;
  typeSelected: boolean;
  onDraftChange: (value: string) => void;
  onCreate: () => void;
  onRename: (row: IssueItem) => void;
  onToggle: (row: IssueItem) => void;
  onDelete: (row: IssueItem) => void;
  openTo: string;
}) {
  return (
    <SectionCard
      title="Fallas"
      description="Dependen del tipo de dispositivo, no del modelo."
      actions={<Link to={openTo} className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">Abrir editor</Link>}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <input value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Ej: Modulo / No carga" className="h-11 flex-1 rounded-2xl border border-zinc-200 px-3 text-sm" disabled={!typeSelected} />
          <button type="button" onClick={onCreate} disabled={!typeSelected || !draft.trim()} className="btn-primary !h-11 !rounded-2xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
            Agregar
          </button>
        </div>

        {!typeSelected ? <PanelHint label="Primero selecciona un tipo para crear fallas." /> : null}

        <div className="max-h-80 space-y-2 overflow-auto pr-1">
          {typeSelected && rows.length === 0 ? <PanelEmptyState label="No hay fallas para el tipo actual." /> : null}
          {rows.map((row) => (
            <SimpleTaxonomyCard
              key={row.id}
              title={row.name}
              subtitle={`slug: ${row.slug}`}
              active={row.active}
              onRename={() => onRename(row)}
              onToggle={() => onToggle(row)}
              onDelete={() => onDelete(row)}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function AdminRepairCalculationsRulesPanel({
  rows,
  openTo,
  createTo,
}: {
  rows: RuleCardItem[];
  openTo: string;
  createTo: string;
}) {
  return (
    <SectionCard
      title="Reglas de calculo"
      description="Filtradas por el scope actual. Cuanto mas especifica, mas arriba manda."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to={openTo} className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">
            Abrir reglas
          </Link>
          <Link to={createTo} className="btn-primary !h-9 !rounded-xl px-4 text-sm font-bold">
            + Nueva regla
          </Link>
        </div>
      }
    >
      <div className="space-y-3">
        {rows.length === 0 ? <PanelEmptyState label="No hay reglas visibles para este contexto." /> : null}
        {rows.map(({ row, specificityShort, specificityLabel, specificityTone, editTo }) => (
          <div key={row.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-black text-zinc-900">{row.name || 'Regla sin nombre'}</div>
                  <span className={row.active ? 'badge-emerald' : 'badge-zinc'}>{row.active ? 'Activa' : 'Inactiva'}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${
                    specificityTone === 'maxima'
                      ? 'bg-zinc-900 text-white'
                      : specificityTone === 'muy-alta'
                        ? 'bg-sky-100 text-sky-900'
                        : specificityTone === 'alta'
                          ? 'bg-emerald-100 text-emerald-900'
                          : specificityTone === 'media'
                            ? 'bg-amber-100 text-amber-900'
                            : specificityTone === 'base'
                              ? 'bg-zinc-100 text-zinc-700'
                              : 'bg-zinc-50 text-zinc-500'
                  }`}>
                    {specificityShort}
                  </span>
                </div>
                <div className="mt-2 text-sm text-zinc-600">
                  <span className="font-bold text-zinc-800">Aplica por:</span> {specificityLabel}
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  Prioridad {row.priority || '0'} | {row.calcMode === 'FIXED_TOTAL' ? 'Total fijo' : 'Base + margen'} | Base ${row.basePrice || '0'}
                </div>
              </div>

              <Link to={editTo} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
                Editar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function AdminRepairCalculationsQuickCreateDialog({
  open,
  title,
  description,
  fieldLabel,
  placeholder,
  submitLabel,
  contextLabel,
  value,
  matches,
  hasExactDuplicate,
  onValueChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  fieldLabel: string;
  placeholder: string;
  submitLabel: string;
  contextLabel: string;
  value: string;
  matches: SimilarModelMatch[];
  hasExactDuplicate: boolean;
  onValueChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[560] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 border-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar formulario rapido"
      />
      <div className="card relative z-10 w-full max-w-xl overflow-hidden border border-sky-100 shadow-[0_28px_72px_-32px_rgba(15,23,42,0.45)]">
        <div className="card-head flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-black tracking-tight text-zinc-900">{title}</div>
            <p className="mt-1 text-sm text-zinc-600">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Cerrar">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="card-body space-y-4">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <span className="font-black">Contexto activo:</span> {contextLabel}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-zinc-800">{fieldLabel}</label>
            <input
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              placeholder={placeholder}
              className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-900"
              autoFocus
            />
          </div>

          {matches.length > 0 ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                hasExactDuplicate
                  ? 'border border-amber-200 bg-amber-50 text-amber-950'
                  : 'border border-sky-200 bg-sky-50 text-sky-950'
              }`}
            >
              <div className="font-black">
                {hasExactDuplicate
                  ? 'Ya existe un modelo equivalente para esta marca.'
                  : 'Encontramos modelos parecidos para esta marca.'}
              </div>
              <div className="mt-1 text-xs font-medium opacity-80">
                {hasExactDuplicate
                  ? 'Bloqueamos el alta para evitar un duplicado exacto.'
                  : 'Revisa estas coincidencias antes de crear otro registro.'}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {matches.map(({ item, exact }) => (
                  <span
                    key={item.id}
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      exact
                        ? 'border-amber-300 bg-white text-amber-900'
                        : 'border-sky-200 bg-white text-sky-900'
                    }`}
                  >
                    {item.name}
                    {exact ? ' · coincide exacto' : item.active ? ' · similar' : ' · similar inactivo'}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-outline !h-11 !rounded-2xl px-4 text-sm font-bold">
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!value.trim() || hasExactDuplicate}
              className="btn-primary !h-11 !rounded-2xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScopeField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-zinc-800">{label}</label>
      {children}
    </div>
  );
}

function PanelHint({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">{label}</div>;
}

function PanelEmptyState({ label }: { label: string }) {
  return <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">{label}</div>;
}

function SimilarModelHint({
  selectedBrandName,
  matches,
  hasExactDuplicate,
}: {
  selectedBrandName: string;
  matches: SimilarModelMatch[];
  hasExactDuplicate: boolean;
}) {
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        No encontramos modelos parecidos en {selectedBrandName}. Si confirmas que es nuevo, puedes crearlo.
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${
        hasExactDuplicate
          ? 'border border-amber-200 bg-amber-50 text-amber-950'
          : 'border border-sky-200 bg-sky-50 text-sky-950'
      }`}
    >
      <div className="font-black">
        {hasExactDuplicate
          ? `Ya existe un modelo igual dentro de ${selectedBrandName}.`
          : `Modelos parecidos en ${selectedBrandName}. Revisa antes de crear otro.`}
      </div>
      <div className="mt-1 text-xs font-medium opacity-80">
        {hasExactDuplicate
          ? 'Bloqueamos el alta para evitar duplicados exactos.'
          : 'Si uno ya corresponde, seleccionalo en el scope o reutiliza ese registro.'}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {matches.map(({ item, exact }) => (
          <span
            key={item.id}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              exact
                ? 'border-amber-300 bg-white text-amber-900'
                : 'border-sky-200 bg-white text-sky-900'
            }`}
          >
            {item.name}
            {exact ? ' · coincide exacto' : item.active ? ' · similar' : ' · similar inactivo'}
          </span>
        ))}
      </div>
    </div>
  );
}

function SimpleTaxonomyCard({
  title,
  subtitle,
  active,
  selected,
  onSelect,
  selectLabel,
  onRename,
  onToggle,
  onDelete,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  selected?: boolean;
  onSelect?: () => void;
  selectLabel?: string;
  onRename: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-3 shadow-sm ${selected ? 'border-sky-300 ring-2 ring-sky-100' : 'border-zinc-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-zinc-900">{title}</div>
          <div className="text-xs text-zinc-500">{subtitle}</div>
          {selected ? <div className="mt-1 text-xs font-bold text-sky-700">Activo para modelos y grupos</div> : null}
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
            {onSelect ? (
              <button type="button" onClick={onSelect} className="text-indigo-700">
                {selectLabel || 'Seleccionar'}
              </button>
            ) : null}
            <button type="button" onClick={onRename} className="text-sky-700">
              Renombrar
            </button>
            <button type="button" onClick={onToggle} className="text-zinc-700">
              {active ? 'Desactivar' : 'Activar'}
            </button>
            <button type="button" onClick={onDelete} className="text-rose-700">
              Eliminar
            </button>
          </div>
        </div>
        <span className={active ? 'badge-emerald' : 'badge-zinc'}>{active ? 'Activa' : 'Inactiva'}</span>
      </div>
    </div>
  );
}
