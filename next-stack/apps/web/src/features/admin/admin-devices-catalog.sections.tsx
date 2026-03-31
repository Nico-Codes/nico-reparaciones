import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import type {
  BrandItem,
  IssueItem,
  ModelItem,
} from './admin-devices-catalog.helpers';

type AdminDevicesCatalogHeroProps = {
  error: string;
};

type AdminDevicesCatalogFiltersProps = {
  deviceType: string;
  selectedBrandId: string;
  deviceTypeOptions: Array<{ value: string; label: string }>;
  brandOptions: Array<{ value: string; label: string }>;
  onDeviceTypeChange: (value: string) => void;
  onSelectedBrandChange: (value: string) => void;
};

type AdminDevicesCatalogBrandsSectionProps = {
  brands: BrandItem[];
  brandDraft: string;
  onBrandDraftChange: (value: string) => void;
  onCreateBrand: () => void;
  onRenameBrand: (item: BrandItem) => void;
  onToggleBrand: (item: BrandItem) => void;
};

type AdminDevicesCatalogModelsSectionProps = {
  filteredModels: ModelItem[];
  modelDraft: string;
  selectedBrandId: string;
  onModelDraftChange: (value: string) => void;
  onCreateModel: () => void;
  onRenameModel: (item: ModelItem) => void;
  onToggleModel: (item: ModelItem) => void;
};

type AdminDevicesCatalogIssuesSectionProps = {
  issues: IssueItem[];
  issueDraft: string;
  onIssueDraftChange: (value: string) => void;
  onCreateIssue: () => void;
  onRenameIssue: (item: IssueItem) => void;
  onToggleIssue: (item: IssueItem) => void;
};

export function AdminDevicesCatalogHero({ error }: AdminDevicesCatalogHeroProps) {
  return (
    <>
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Catalogo de dispositivos</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Gestiona marcas, modelos y fallas por tipo. En lugar de borrar, desactiva.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/tiposreparacion" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Tipos
            </Link>
            <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Precios
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>
      ) : null}
    </>
  );
}

export function AdminDevicesCatalogFilters({
  deviceType,
  selectedBrandId,
  deviceTypeOptions,
  brandOptions,
  onDeviceTypeChange,
  onSelectedBrandChange,
}: AdminDevicesCatalogFiltersProps) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="text-xl font-black tracking-tight text-zinc-900">Filtro de catalogo</div>
        <p className="mt-1 text-sm text-zinc-500">Selecciona tipo y marca para administrar cada bloque.</p>
      </div>
      <div className="card-body space-y-3">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-zinc-800">Tipo</label>
            <CustomSelect
              value={deviceType}
              onChange={onDeviceTypeChange}
              options={deviceTypeOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar tipo de dispositivo"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-zinc-800">Marca (para modelos)</label>
            <CustomSelect
              value={selectedBrandId}
              onChange={onSelectedBrandChange}
              options={brandOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar marca"
            />
          </div>
        </div>
        <div className="grid gap-2 text-xs text-zinc-500 lg:grid-cols-3">
          <p>Esto filtra marcas y fallas.</p>
          <p>Esto filtra modelos.</p>
          <p className="lg:text-right">Tip: en "Nueva reparacion" solo se muestran items activos.</p>
        </div>
      </div>
    </section>
  );
}

export function AdminDevicesCatalogBrandsSection({
  brands,
  brandDraft,
  onBrandDraftChange,
  onCreateBrand,
  onRenameBrand,
  onToggleBrand,
}: AdminDevicesCatalogBrandsSectionProps) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-2">
        <div className="text-2xl font-black tracking-tight text-zinc-900">Marcas</div>
        <span className="badge-zinc">{brands.length}</span>
      </div>
      <div className="card-body space-y-3">
        <div className="flex gap-2">
          <input
            value={brandDraft}
            onChange={(event) => onBrandDraftChange(event.target.value)}
            placeholder="Ej: Samsung"
            className="h-11 flex-1 rounded-2xl border border-zinc-200 px-3 text-sm"
          />
          <button type="button" className="btn-primary !h-11 !rounded-2xl px-4 text-sm font-bold" onClick={onCreateBrand}>
            Agregar
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200">
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
            <div>Nombre</div>
            <div>Estado</div>
          </div>
          <div className="max-h-44 overflow-auto">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2.5 text-sm last:border-b-0"
              >
                <div>
                  <div className="font-bold text-zinc-900">{brand.name}</div>
                  <button type="button" className="mt-1 text-xs font-semibold text-sky-700" onClick={() => onRenameBrand(brand)}>
                    Renombrar
                  </button>
                  <button type="button" className="mt-1 ml-3 text-xs font-semibold text-zinc-700" onClick={() => onToggleBrand(brand)}>
                    {brand.active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
                <span className={brand.active ? 'badge-emerald self-center' : 'badge-zinc self-center'}>
                  {brand.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminDevicesCatalogModelsSection({
  filteredModels,
  modelDraft,
  selectedBrandId,
  onModelDraftChange,
  onCreateModel,
  onRenameModel,
  onToggleModel,
}: AdminDevicesCatalogModelsSectionProps) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-2">
        <div className="text-2xl font-black tracking-tight text-zinc-900">Modelos</div>
        <span className="badge-zinc">{filteredModels.length}</span>
      </div>
      <div className="card-body space-y-3">
        <div className="flex gap-2">
          <input
            value={modelDraft}
            onChange={(event) => onModelDraftChange(event.target.value)}
            placeholder="Ej: A52 / iPhone 12"
            className="h-11 flex-1 rounded-2xl border border-zinc-200 px-3 text-sm"
            disabled={!selectedBrandId}
          />
          <button
            type="button"
            className="btn-primary !h-11 !rounded-2xl px-4 text-sm font-bold"
            disabled={!selectedBrandId}
            onClick={onCreateModel}
          >
            Agregar
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200">
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
            <div>Nombre</div>
            <div>Estado</div>
          </div>
          <div className="max-h-44 overflow-auto">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2.5 text-sm last:border-b-0"
              >
                <div>
                  <div className="font-bold text-zinc-900">{model.name}</div>
                  <div className="text-xs text-zinc-500">Grupo: -</div>
                  <button type="button" className="mt-1 text-xs font-semibold text-sky-700" onClick={() => onRenameModel(model)}>
                    Renombrar
                  </button>
                  <button type="button" className="mt-1 ml-3 text-xs font-semibold text-zinc-700" onClick={() => onToggleModel(model)}>
                    {model.active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
                <span className={model.active ? 'badge-emerald self-center' : 'badge-zinc self-center'}>
                  {model.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Link to="/admin/gruposmodelos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
          Administrar grupos de modelos
        </Link>
      </div>
    </section>
  );
}

export function AdminDevicesCatalogIssuesSection({
  issues,
  issueDraft,
  onIssueDraftChange,
  onCreateIssue,
  onRenameIssue,
  onToggleIssue,
}: AdminDevicesCatalogIssuesSectionProps) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-2">
        <div className="text-2xl font-black tracking-tight text-zinc-900">Fallas</div>
        <span className="badge-zinc">{issues.length}</span>
      </div>
      <div className="card-body space-y-3">
        <div className="flex gap-2">
          <input
            value={issueDraft}
            onChange={(event) => onIssueDraftChange(event.target.value)}
            placeholder="Ej: No carga / Pantalla"
            className="h-11 flex-1 rounded-2xl border border-zinc-200 px-3 text-sm"
          />
          <button type="button" className="btn-primary !h-11 !rounded-2xl px-4 text-sm font-bold" onClick={onCreateIssue}>
            Agregar
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200">
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
            <div>Nombre</div>
            <div>Estado</div>
          </div>
          <div className="max-h-44 overflow-auto">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2.5 text-sm last:border-b-0"
              >
                <div>
                  <div className="font-bold text-zinc-900">{issue.name}</div>
                  <div className="text-xs text-zinc-500">slug: {issue.slug}</div>
                  <button type="button" className="mt-1 text-xs font-semibold text-sky-700" onClick={() => onRenameIssue(issue)}>
                    Renombrar
                  </button>
                  <button type="button" className="mt-1 ml-3 text-xs font-semibold text-zinc-700" onClick={() => onToggleIssue(issue)}>
                    {issue.active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
                <span className={issue.active ? 'badge-emerald self-center' : 'badge-zinc self-center'}>
                  {issue.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
