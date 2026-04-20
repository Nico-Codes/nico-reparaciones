import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingCart,
  Smartphone,
  Store,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { brandAssetsApi } from './brandAssetsApi';
import {
  acceptFromFormats,
  DEFAULT_AUTH_VISUAL_FORM_STATE,
  normalizeHexColor,
  resolveAssetState,
  VISUAL_IDENTITY_SECTIONS,
  type AssetCard,
  type AssetSectionDefinition,
  type AuthVisualFormState,
  type PreviewSpec,
  type VisualIconName,
} from './admin-visual-identity.helpers';
import type { AdminSettingItem } from './settingsApi';

type AdminVisualIdentityAlertsProps = {
  error: string;
  success: string;
};

type AdminVisualIdentityResourcesSectionProps = {
  settingsByKey: Map<string, AdminSettingItem>;
  loading: boolean;
  uploadingSlot: string | null;
  selectedFiles: Record<string, File | null>;
  onSelectFile: (item: AssetCard, file: File | null) => void;
  onUpload: (item: AssetCard) => void;
  onReset: (item: AssetCard) => void;
};

type AdminVisualIdentityAuthCopySectionProps = {
  form: AuthVisualFormState;
  disabled: boolean;
  saving: boolean;
  onChange: <K extends keyof AuthVisualFormState>(field: K, value: AuthVisualFormState[K]) => void;
  onSave: () => void;
};

const ICONS_BY_NAME: Record<VisualIconName, ReactNode> = {
  settings: <Settings className="h-7 w-7" />,
  cart: <ShoppingCart className="h-7 w-7" />,
  logout: <LogOut className="h-7 w-7" />,
  repairLookup: <Smartphone className="h-7 w-7" />,
  myOrders: <Boxes className="h-7 w-7" />,
  myRepairs: <Wrench className="h-7 w-7" />,
  dashboard: <LayoutDashboard className="h-7 w-7" />,
  store: <Store className="h-7 w-7" />,
};

export function AdminVisualIdentityHeader() {
  return (
    <section className="store-hero">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Identidad visual</h1>
          <p className="mt-1 text-sm text-zinc-600">Sube y administra logos, iconos, favicons, fondos visuales y el copy del panel de acceso web en desktop y mobile.</p>
        </div>
        <Link to="/admin/configuraciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
          Volver a configuracion
        </Link>
      </div>
    </section>
  );
}

export function AdminVisualIdentityAlerts({ error, success }: AdminVisualIdentityAlertsProps) {
  return (
    <>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</div> : null}
    </>
  );
}

export function AdminVisualIdentityResourcesSection({
  settingsByKey,
  loading,
  uploadingSlot,
  selectedFiles,
  onSelectFile,
  onUpload,
  onReset,
}: AdminVisualIdentityResourcesSectionProps) {
  return (
    <section className="card overflow-hidden">
      <div className="card-body !p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-4 md:px-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-zinc-900">Recursos visuales</h2>
            <p className="mt-1 text-sm text-zinc-600">Puedes subir con click o arrastrando desde el escritorio.</p>
          </div>
          <span className="inline-flex h-7 items-center rounded-full border border-sky-200 bg-sky-50 px-3 text-sm font-black text-sky-800">
            Identidad
          </span>
        </div>

        <div className="space-y-6 px-4 py-4 md:px-5 md:py-5">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            Nota: las imagenes de productos se gestionan desde <span className="font-black">Admin &gt; Productos</span>.
          </div>

          {VISUAL_IDENTITY_SECTIONS.map((section) => (
            <AssetSection
              key={section.title}
              section={section}
              renderCard={(item) => {
                const selectedFile = selectedFiles[item.slot] ?? null;
                const assetState = resolveAssetState(item, settingsByKey);

                return (
                  <AssetUploadCard
                    key={item.title}
                    item={item}
                    loading={loading}
                    uploading={uploadingSlot === item.slot}
                    selectedFile={selectedFile}
                    isCustom={assetState.isCustom}
                    displayPath={assetState.displayPath}
                    imageUrl={brandAssetsApi.toApiAssetUrl(assetState.effectivePath, assetState.updatedAt)}
                    onSelectFile={(file) => onSelectFile(item, file)}
                    onUpload={() => onUpload(item)}
                    onReset={() => onReset(item)}
                  />
                );
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminVisualIdentityAuthCopySection({
  form,
  disabled,
  saving,
  onChange,
  onSave,
}: AdminVisualIdentityAuthCopySectionProps) {
  return (
    <section className="card overflow-hidden">
      <div className="card-body space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight text-zinc-900">Textos de acceso</h2>
            <p className="mt-1 text-sm text-zinc-600">Controla el copy y los colores del panel izquierdo de auth sin tocar codigo.</p>
          </div>
          <span className="inline-flex h-7 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-black text-zinc-800">
            /auth/login
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid gap-4">
            <TextField
              label="Texto superior"
              value={form.eyebrow}
              maxLength={80}
              disabled={disabled}
              onChange={(event) => onChange('eyebrow', event.target.value)}
              hint="Linea corta arriba del titulo principal."
            />

            <TextField
              label="Titulo principal"
              value={form.title}
              maxLength={120}
              disabled={disabled}
              onChange={(event) => onChange('title', event.target.value)}
            />

            <TextAreaField
              label="Descripcion"
              value={form.description}
              maxLength={220}
              rows={4}
              disabled={disabled}
              onChange={(event) => onChange('description', event.target.value)}
              hint="Se usa en login, registro, reset y demas pantallas que heredan AuthLayout."
            />

            <div className="grid gap-4 md:grid-cols-3">
              <TextField
                label="Color texto superior"
                value={form.eyebrowColor}
                maxLength={7}
                disabled={disabled}
                onChange={(event) => onChange('eyebrowColor', event.target.value.toUpperCase())}
                hint="HEX. Ejemplo: #FFFFFF"
                trailing={
                  <input
                    type="color"
                    aria-label="Elegir color del texto superior"
                    value={normalizeHexColor(form.eyebrowColor)}
                    disabled={disabled}
                    className="h-8 w-8 cursor-pointer rounded-full border border-zinc-200 bg-transparent p-0"
                    onChange={(event) => onChange('eyebrowColor', event.target.value.toUpperCase())}
                  />
                }
              />

              <TextField
                label="Color titulo"
                value={form.titleColor}
                maxLength={7}
                disabled={disabled}
                onChange={(event) => onChange('titleColor', event.target.value.toUpperCase())}
                hint="HEX. Ejemplo: #FFFFFF"
                trailing={
                  <input
                    type="color"
                    aria-label="Elegir color del titulo"
                    value={normalizeHexColor(form.titleColor)}
                    disabled={disabled}
                    className="h-8 w-8 cursor-pointer rounded-full border border-zinc-200 bg-transparent p-0"
                    onChange={(event) => onChange('titleColor', event.target.value.toUpperCase())}
                  />
                }
              />

              <TextField
                label="Color descripcion"
                value={form.descriptionColor}
                maxLength={7}
                disabled={disabled}
                onChange={(event) => onChange('descriptionColor', event.target.value.toUpperCase())}
                hint="HEX. Ejemplo: #FFFFFF"
                trailing={
                  <input
                    type="color"
                    aria-label="Elegir color de la descripcion"
                    value={normalizeHexColor(form.descriptionColor)}
                    disabled={disabled}
                    className="h-8 w-8 cursor-pointer rounded-full border border-zinc-200 bg-transparent p-0"
                    onChange={(event) => onChange('descriptionColor', event.target.value.toUpperCase())}
                  />
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-black text-zinc-900">Preview de copy</p>
            <div
              className="mt-3 rounded-2xl bg-zinc-950 px-4 py-5 shadow-sm"
            >
              <div
                className="text-[11px] font-black uppercase tracking-[0.16em] opacity-80"
                style={{ color: normalizeHexColor(form.eyebrowColor) }}
              >
                {form.eyebrow || DEFAULT_AUTH_VISUAL_FORM_STATE.eyebrow}
              </div>
              <div
                className="mt-2 text-2xl font-black leading-none tracking-tight"
                style={{ color: normalizeHexColor(form.titleColor) }}
              >
                {form.title || DEFAULT_AUTH_VISUAL_FORM_STATE.title}
              </div>
              <p
                className="mt-3 text-sm leading-6 opacity-90"
                style={{ color: normalizeHexColor(form.descriptionColor) }}
              >
                {form.description || DEFAULT_AUTH_VISUAL_FORM_STATE.description}
              </p>
            </div>

            <Button type="button" variant="default" className="mt-4 w-full" disabled={disabled} onClick={onSave}>
              {saving ? 'Guardando...' : 'Guardar textos'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AssetSection({
  section,
  renderCard,
}: {
  section: AssetSectionDefinition;
  renderCard: (item: AssetCard) => ReactNode;
}) {
  const gridClass =
    section.columns === 'one'
      ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
      : section.columns === 'two'
        ? 'grid gap-4 lg:grid-cols-2'
        : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3';

  return (
    <section className="space-y-3">
      <h3 className="text-xl font-black tracking-tight text-zinc-900">{section.title}</h3>
      <div className={gridClass}>{section.items.map(renderCard)}</div>
    </section>
  );
}

function AssetUploadCard({
  item,
  loading,
  uploading,
  selectedFile,
  isCustom,
  displayPath,
  imageUrl,
  onSelectFile,
  onUpload,
  onReset,
}: {
  item: AssetCard;
  loading: boolean;
  uploading: boolean;
  selectedFile: File | null;
  isCustom: boolean;
  displayPath: string;
  imageUrl: string | null;
  onSelectFile: (file: File | null) => void;
  onUpload: () => void;
  onReset: () => void;
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-xl font-black tracking-tight text-zinc-900">{item.title}</h4>
          <p className="truncate text-sm text-zinc-500">{displayPath}</p>
        </div>
        <StatusBadge status={isCustom ? 'Personalizado' : 'Por defecto'} />
      </div>

      <AssetImagePreview item={item} selectedFile={selectedFile} imageUrl={imageUrl} />

      <label className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700">
        Arrastra un archivo o haz click para elegir
        <input
          type="file"
          accept={acceptFromFormats(item.formats)}
          disabled={loading || uploading}
          className="hidden"
          onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
        />
      </label>

      {selectedFile ? (
        <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {uploading
            ? `Subiendo ${selectedFile.name}...`
            : `Archivo seleccionado: ${selectedFile.name}. Si la subida fallo, puedes reintentarlo.`}
        </div>
      ) : null}

      <p className="mt-2 text-xs text-zinc-500">
        Formatos: {item.formats} | Max: {item.maxKb} KB
        {item.recommendedPx ? ` | Recomendado: ${item.recommendedPx}` : ''}
      </p>

      {selectedFile ? (
        <button
          type="button"
          disabled={loading || uploading}
          onClick={onUpload}
          className="mt-3 h-11 w-full rounded-2xl bg-zinc-300 px-4 text-base font-black text-white disabled:opacity-80"
        >
          {uploading ? 'Subiendo...' : 'Reintentar subida'}
        </button>
      ) : (
        <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          El archivo se sube apenas lo eliges.
        </div>
      )}

      {item.showReset ? (
        <button
          type="button"
          disabled={loading || uploading}
          onClick={onReset}
          className="btn-outline mt-3 !h-11 w-full !rounded-2xl text-sm font-bold"
        >
          Restaurar por defecto
        </button>
      ) : null}
    </article>
  );
}

function AssetImagePreview({
  item,
  selectedFile,
  imageUrl,
}: {
  item: AssetCard;
  selectedFile: File | null;
  imageUrl: string | null;
}) {
  const imageClass = item.preview.kind === 'hero' ? 'h-full w-full object-cover' : 'h-full w-full object-contain';
  const showGeneratedPreview =
    item.preview.kind === 'brand' || item.preview.kind === 'icon' || item.preview.kind === 'logo' || item.defaultPath.trim().length > 0;

  return (
    <div className="mt-3 flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
      {imageUrl ? (
        <img src={imageUrl} alt={item.title} className={imageClass} />
      ) : showGeneratedPreview ? (
        <Preview spec={item.preview} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-4 text-center">
          <p className="text-sm font-black text-zinc-800">Sin imagen configurada</p>
          <p className="text-xs text-zinc-500">
            {selectedFile
              ? `Archivo seleccionado: ${selectedFile.name}. La previsualizacion cambia cuando queda guardado.`
              : item.recommendedPx
                ? `Sube un archivo. Recomendado: ${item.recommendedPx}`
                : 'Sube un archivo para ver la previsualizacion real.'}
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: 'Por defecto' | 'Personalizado' }) {
  const tone =
    status === 'Personalizado'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-zinc-200 bg-zinc-50 text-zinc-800';

  return <span className={`inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-sm font-black ${tone}`}>{status}</span>;
}

function Preview({ spec }: { spec: PreviewSpec }) {
  if (spec.kind === 'brand') {
    const sizeClass =
      spec.size === 'lg' ? 'h-20 w-20 text-5xl' : spec.size === 'md' ? 'h-16 w-16 text-4xl' : 'h-12 w-12 text-3xl';

    return (
      <div className={`flex items-center justify-center rounded-xl bg-white text-blue-600 ${sizeClass}`}>
        <BrandGlyph mono={spec.mono} />
      </div>
    );
  }

  if (spec.kind === 'hero') {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 ${spec.mobile ? 'h-12 w-36' : 'h-12 w-72'}`}>
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:14px_14px]" />
        <div className="absolute inset-y-0 left-3 flex items-center">
          <BrandGlyph compact />
        </div>
        <div className="absolute inset-y-0 right-3 flex items-center text-right text-[9px] font-black uppercase tracking-wide text-white/90">
          <div>
            <div>Electronica</div>
            <div>Reparacion</div>
            <div>Accesorios</div>
          </div>
        </div>
      </div>
    );
  }

  if (spec.kind === 'icon') {
    return <div className={`flex items-center justify-center ${spec.tint ?? 'text-zinc-500'}`}>{ICONS_BY_NAME[spec.icon]}</div>;
  }

  return (
    <div className="flex items-center justify-center rounded-lg bg-white px-6 py-3 text-black">
      <BrandGlyph mono size="logo" />
    </div>
  );
}

function BrandGlyph({
  mono = false,
  compact = false,
  size = 'normal',
}: {
  mono?: boolean;
  compact?: boolean;
  size?: 'normal' | 'logo';
}) {
  const phoneClass = compact ? 'h-9 w-7 text-[18px]' : size === 'logo' ? 'h-16 w-12 text-[28px]' : 'h-14 w-10 text-[24px]';
  const colorClass = mono ? 'border-current text-current' : 'border-blue-600 text-blue-600';
  const wrenchColor = mono ? 'bg-current' : 'bg-blue-600';

  return (
    <div className={`relative ${size === 'logo' ? 'h-20 w-28' : compact ? 'h-10 w-12' : 'h-16 w-20'}`}>
      <span className={`absolute left-1 top-1 block h-1 w-9 rotate-45 rounded-full ${wrenchColor} opacity-90`} />
      <span className={`absolute bottom-1 left-1 block h-1 w-9 -rotate-45 rounded-full ${wrenchColor} opacity-90`} />
      <span className={`absolute right-1 top-1 block h-1 w-9 -rotate-45 rounded-full ${wrenchColor} opacity-90`} />
      <span className={`absolute bottom-1 right-1 block h-1 w-9 rotate-45 rounded-full ${wrenchColor} opacity-90`} />
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[10px] border-2 bg-white font-black leading-none ${phoneClass} ${colorClass}`}>
        <div className="flex h-full items-center justify-center">N</div>
      </div>
    </div>
  );
}
