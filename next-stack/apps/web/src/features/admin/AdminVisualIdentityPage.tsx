import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
import { brandAssetsApi } from './brandAssetsApi';
import { adminSettingsApi, type AdminSettingItem } from './settingsApi';

type AssetCard = {
  title: string;
  filename: string;
  slot: string;
  settingKey: string;
  defaultPath: string;
  formats: string;
  maxKb: number;
  preview: PreviewSpec;
  showReset?: boolean;
};

type PreviewSpec =
  | { kind: 'brand'; size?: 'sm' | 'md' | 'lg'; mono?: boolean }
  | { kind: 'hero'; mobile?: boolean }
  | { kind: 'icon'; node: ReactNode; tint?: string }
  | { kind: 'logo' };

const FAVICON_ASSETS: AssetCard[] = [
  { title: 'Favicon .ico', filename: 'favicon.ico', slot: 'favicon_ico', settingKey: 'brand_asset.favicon_ico.path', defaultPath: 'favicon.ico', formats: 'ICO', maxKb: 1024, preview: { kind: 'brand', size: 'sm' }, showReset: true },
  { title: 'Favicon 16×16', filename: 'favicon-16x16.png', slot: 'favicon_16', settingKey: 'brand_asset.favicon_16.path', defaultPath: 'favicon-16x16.png', formats: 'PNG, ICO, WEBP', maxKb: 1024, preview: { kind: 'brand', size: 'sm' }, showReset: true },
  { title: 'Favicon 32×32', filename: 'favicon-32x32.png', slot: 'favicon_32', settingKey: 'brand_asset.favicon_32.path', defaultPath: 'favicon-32x32.png', formats: 'PNG, ICO, WEBP', maxKb: 1024, preview: { kind: 'brand', size: 'sm' }, showReset: true },
  { title: 'Icono Android 192', filename: 'android-chrome-192x192.png', slot: 'android_192', settingKey: 'brand_asset.android_192.path', defaultPath: 'android-chrome-192x192.png', formats: 'PNG, JPG, JPEG, WEBP', maxKb: 2048, preview: { kind: 'brand', size: 'md' }, showReset: true },
  { title: 'Icono Android 512', filename: 'android-chrome-512x512.png', slot: 'android_512', settingKey: 'brand_asset.android_512.path', defaultPath: 'android-chrome-512x512.png', formats: 'PNG, JPG, JPEG, WEBP', maxKb: 4096, preview: { kind: 'brand', size: 'md' }, showReset: true },
  { title: 'Icono Apple Touch', filename: 'apple-touch-icon.png', slot: 'apple_touch', settingKey: 'brand_asset.apple_touch.path', defaultPath: 'apple-touch-icon.png', formats: 'PNG, JPG, JPEG, WEBP', maxKb: 2048, preview: { kind: 'brand', size: 'md' }, showReset: true },
];

const STORE_HERO_ASSETS: AssetCard[] = [
  { title: 'Fondo portada tienda (desktop)', filename: 'brand-assets/store_home_hero_desktop.png', slot: 'store_hero_desktop', settingKey: 'store_hero_image_desktop', defaultPath: '', formats: 'PNG, JPG, JPEG, WEBP', maxKb: 6144, preview: { kind: 'hero' }, showReset: true },
  { title: 'Fondo portada tienda (movil)', filename: 'brand-assets/store_home_hero_mobile.png', slot: 'store_hero_mobile', settingKey: 'store_hero_image_mobile', defaultPath: '', formats: 'PNG, JPG, JPEG, WEBP', maxKb: 4096, preview: { kind: 'hero', mobile: true }, showReset: true },
];

const NAV_ICON_ASSETS: AssetCard[] = [
  { title: 'Icono ajustes', filename: 'icons/settings.svg', slot: 'icon_settings', settingKey: 'brand_asset.icon_settings.path', defaultPath: 'icons/settings.svg', formats: 'SVG, PNG, JPG, JPEG, WEBP', maxKb: 2048, preview: { kind: 'icon', node: <Settings className="h-7 w-7" />, tint: 'text-slate-500' }, showReset: true },
  { title: 'Icono carrito', filename: 'icons/carrito.svg', slot: 'icon_carrito', settingKey: 'brand_asset.icon_carrito.path', defaultPath: 'icons/carrito.svg', formats: 'SVG, PNG, JPG, JPEG, WEBP', maxKb: 2048, preview: { kind: 'icon', node: <ShoppingCart className="h-7 w-7" />, tint: 'text-amber-500' }, showReset: true },
  { title: 'Icono cerrar sesion', filename: 'icons/logout.svg', slot: 'icon_logout', settingKey: 'brand_asset.icon_logout.path', defaultPath: 'icons/logout.svg', formats: 'SVG, PNG, JPG, JPEG, WEBP', maxKb: 2048, preview: { kind: 'icon', node: <LogOut className="h-7 w-7" />, tint: 'text-rose-500' }, showReset: true },
  { title: 'Icono consultar reparacion', filename: 'icons/consultar-reparacion.svg', slot: 'icon_consultar_reparacion', settingKey: 'brand_asset.icon_consultar_reparacion.path', defaultPath: 'icons/consultar-reparacion.svg', formats: 'SVG, PNG, JPG, JPEG, WEBP', maxKb: 2048, preview: { kind: 'icon', node: <Smartphone className="h-7 w-7" />, tint: 'text-sky-600' }, showReset: true },
  { title: 'Icono mis pedidos', filename: 'icons/mis-pedidos.svg', slot: 'icon_mis_pedidos', settingKey: 'brand_asset.icon_mis_pedidos.path', defaultPath: 'icons/mis-pedidos.svg', formats: 'SVG, PNG, JPG, JPEG, WEBP', maxKb: 2048, preview: { kind: 'icon', node: <Boxes className="h-7 w-7" />, tint: 'text-blue-500' }, showReset: true },
  { title: 'Icono mis reparaciones', filename: 'icons/mis-reparaciones.svg', slot: 'icon_mis_reparaciones', settingKey: 'brand_asset.icon_mis_reparaciones.path', defaultPath: 'icons/mis-reparaciones.svg', formats: 'SVG, PNG, JPG, JPEG, WEBP', maxKb: 2048, preview: { kind: 'icon', node: <Wrench className="h-7 w-7" />, tint: 'text-zinc-700' }, showReset: true },
  { title: 'Icono panel de admin', filename: 'icons/dashboard.svg', slot: 'icon_dashboard', settingKey: 'brand_asset.icon_dashboard.path', defaultPath: 'icons/dashboard.svg', formats: 'SVG, PNG, JPG, JPEG, WEBP', maxKb: 2048, preview: { kind: 'icon', node: <LayoutDashboard className="h-7 w-7" />, tint: 'text-slate-500' }, showReset: true },
  { title: 'Icono tienda', filename: 'icons/tienda.svg', slot: 'icon_tienda', settingKey: 'brand_asset.icon_tienda.path', defaultPath: 'icons/tienda.svg', formats: 'SVG, PNG, JPG, JPEG, WEBP', maxKb: 2048, preview: { kind: 'icon', node: <Store className="h-7 w-7" />, tint: 'text-sky-600' }, showReset: true },
];

const LOGO_ASSETS: AssetCard[] = [
  { title: 'Logo principal', filename: 'brand/logo.png', slot: 'logo_principal', settingKey: 'brand_asset.logo_principal.path', defaultPath: 'brand/logo.png', formats: 'PNG, JPG, JPEG, WEBP, SVG', maxKb: 4096, preview: { kind: 'logo' }, showReset: true },
];

const ALL_ASSETS = [...FAVICON_ASSETS, ...STORE_HERO_ASSETS, ...NAV_ICON_ASSETS, ...LOGO_ASSETS];

export function AdminVisualIdentityPage() {
  const [settings, setSettings] = useState<AdminSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const settingsByKey = useMemo(() => new Map(settings.map((s) => [s.key, s])), [settings]);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const res = await adminSettingsApi.list();
      setSettings(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando identidad visual');
    } finally {
      setLoading(false);
    }
  }

  async function uploadAsset(item: AssetCard) {
    const file = selectedFiles[item.slot];
    if (!file) return;
    setUploadingSlot(item.slot);
    setError('');
    setSuccess('');
    try {
      await brandAssetsApi.upload(item.slot, file);
      setSelectedFiles((prev) => ({ ...prev, [item.slot]: null }));
      setSuccess(`${item.title} actualizado`);
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo archivo');
    } finally {
      setUploadingSlot(null);
    }
  }

  async function resetAsset(item: AssetCard) {
    setUploadingSlot(item.slot);
    setError('');
    setSuccess('');
    try {
      await brandAssetsApi.reset(item.slot);
      setSelectedFiles((prev) => ({ ...prev, [item.slot]: null }));
      setSuccess(`${item.title} restaurado por defecto`);
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error restaurando asset');
    } finally {
      setUploadingSlot(null);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Identidad visual</h1>
            <p className="mt-1 text-sm text-zinc-600">Sube y administra logos, iconos y favicons del sitio.</p>
          </div>
          <Link to="/admin/configuraciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver a configuracion
          </Link>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</div> : null}

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

            <AssetSection title="Favicons e iconos de app" items={FAVICON_ASSETS} columns="three" renderCard={(item) => renderCard(item)} />
            <AssetSection title="Portada de tienda" items={STORE_HERO_ASSETS} columns="two" renderCard={(item) => renderCard(item)} />
            <AssetSection title="Iconos de navegacion" items={NAV_ICON_ASSETS} columns="three" renderCard={(item) => renderCard(item)} />
            <AssetSection title="Logos" items={LOGO_ASSETS} columns="one" renderCard={(item) => renderCard(item)} />
          </div>
        </div>
      </section>
    </div>
  );

  function renderCard(item: AssetCard) {
    const selectedFile = selectedFiles[item.slot] ?? null;
    const settingValue = settingsByKey.get(item.settingKey)?.value ?? '';
    const isCustom = settingValue.trim().length > 0;
    const effectivePath = isCustom ? settingValue : item.defaultPath;
    const imageUrl = brandAssetsApi.toApiAssetUrl(effectivePath);
    return (
      <AssetUploadCard
        key={item.title}
        item={item}
        loading={loading}
        uploading={uploadingSlot === item.slot}
        selectedFile={selectedFile}
        isCustom={isCustom}
        imageUrl={imageUrl}
        onSelectFile={(file) => setSelectedFiles((prev) => ({ ...prev, [item.slot]: file }))}
        onUpload={() => void uploadAsset(item)}
        onReset={() => void resetAsset(item)}
      />
    );
  }
}

function AssetSection({
  title,
  items,
  columns = 'three',
  renderCard,
}: {
  title: string;
  items: AssetCard[];
  columns?: 'one' | 'two' | 'three';
  renderCard: (item: AssetCard) => ReactNode;
}) {
  const gridClass =
    columns === 'one'
      ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
      : columns === 'two'
        ? 'grid gap-4 lg:grid-cols-2'
        : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3';

  return (
    <section className="space-y-3">
      <h3 className="text-xl font-black tracking-tight text-zinc-900">{title}</h3>
      <div className={gridClass}>{items.map(renderCard)}</div>
    </section>
  );
}

function AssetUploadCard({
  item,
  loading,
  uploading,
  selectedFile,
  isCustom,
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
  imageUrl: string | null;
  onSelectFile: (file: File | null) => void;
  onUpload: () => void;
  onReset: () => void;
}) {
  const previewObjectUrl = selectedFile ? URL.createObjectURL(selectedFile) : null;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-xl font-black tracking-tight text-zinc-900">{item.title}</h4>
          <p className="truncate text-sm text-zinc-500">{isCustom ? imageUrl?.split('/').slice(-2).join('/') ?? item.filename : item.filename}</p>
        </div>
        <StatusBadge status={isCustom ? 'Personalizado' : 'Por defecto'} />
      </div>

      <div className="mt-3 flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
        {previewObjectUrl || imageUrl ? (
          <img src={previewObjectUrl ?? imageUrl ?? undefined} alt={item.title} className="h-full w-full object-contain" />
        ) : (
          <Preview spec={item.preview} />
        )}
      </div>

      <label className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700">
        Arrastra un archivo o haz click para elegir
        <input
          type="file"
          accept={acceptFromFormats(item.formats)}
          disabled={loading || uploading}
          className="hidden"
          onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <p className="mt-2 text-xs text-zinc-500">
        Formatos: {item.formats} | Max: {item.maxKb} KB
      </p>

      <button
        type="button"
        disabled={loading || uploading || !selectedFile}
        onClick={onUpload}
        className="mt-3 h-11 w-full rounded-2xl bg-zinc-300 px-4 text-base font-black text-white disabled:opacity-80"
      >
        {uploading ? 'Subiendo...' : 'Subir archivo'}
      </button>

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

function StatusBadge({ status }: { status: 'Por defecto' | 'Personalizado' }) {
  const tone =
    status === 'Personalizado'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-zinc-200 bg-zinc-50 text-zinc-800';

  return (
    <span className={`inline-flex shrink-0 h-7 items-center rounded-full border px-3 text-sm font-black ${tone}`}>
      {status}
    </span>
  );
}

function Preview({ spec }: { spec: PreviewSpec }) {
  if (spec.kind === 'brand') {
    const sizeClass = spec.size === 'lg' ? 'h-20 w-20 text-5xl' : spec.size === 'md' ? 'h-16 w-16 text-4xl' : 'h-12 w-12 text-3xl';
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
    return <div className={`flex items-center justify-center ${spec.tint ?? 'text-zinc-500'}`}>{spec.node}</div>;
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

function acceptFromFormats(formats: string) {
  const map: Record<string, string> = {
    PNG: '.png',
    JPG: '.jpg',
    JPEG: '.jpeg',
    WEBP: '.webp',
    ICO: '.ico',
    SVG: '.svg',
  };
  return formats
    .split(',')
    .map((f) => map[f.trim().toUpperCase()])
    .filter(Boolean)
    .join(',');
}

