import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { brandAssetsApi } from './brandAssetsApi';
import { adminSettingsApi, type AdminSettingItem } from './settingsApi';

type HeroAsset = {
  title: string;
  slot: 'store_hero_desktop' | 'store_hero_mobile';
  settingKey: 'store_hero_image_desktop' | 'store_hero_image_mobile';
  recommended: string;
  optional: string;
  maxKb: number;
  mobile?: boolean;
};

const HERO_ASSETS: HeroAsset[] = [
  {
    title: 'Imagen desktop/tablet',
    slot: 'store_hero_desktop',
    settingKey: 'store_hero_image_desktop',
    recommended: '1920 x 500 px',
    optional: '3840 x 1000',
    maxKb: 6144,
  },
  {
    title: 'Imagen movil',
    slot: 'store_hero_mobile',
    settingKey: 'store_hero_image_mobile',
    recommended: '1280 x 720 px',
    optional: '1920 x 1080',
    maxKb: 4096,
    mobile: true,
  },
];

export function AdminStoreHeroSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [gradientIntensity, setGradientIntensity] = useState('100');
  const [gradientExtent, setGradientExtent] = useState('80');
  const [gradientColor, setGradientColor] = useState('#1052BE');
  const [highContrast, setHighContrast] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    void loadSettings();
  }, []);

  const settingsByKey = useMemo(
    () => new Map(settings.map((s) => [s.key, s])),
    [settings],
  );

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const res = await adminSettingsApi.list();
      setSettings(res.items);
      const map = new Map(res.items.map((s) => [s.key, s.value]));
      setTitle(map.get('store_hero_title') ?? '');
      setText(map.get('store_hero_subtitle') ?? '');
      setGradientIntensity(map.get('store_hero_fade_intensity') ?? '42');
      setGradientExtent(map.get('store_hero_fade_size') ?? '96');
      setHighContrast((map.get('store_hero_fade_mid_alpha') ?? '0.58') !== '0');
      const rgb = (map.get('store_hero_fade_rgb_desktop') ?? '16, 82, 190').trim();
      setGradientColor(rgbToHex(rgb) ?? '#1052BE');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando configuracion');
    } finally {
      setLoading(false);
    }
  }

  async function saveTextSettings() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const rgb = hexToRgbString(gradientColor) ?? '16, 82, 190';
      const toSave = [
        patchSetting(settingsByKey.get('store_hero_title'), 'store_hero_title', title, 'branding', 'Titulo portada tienda', 'text'),
        patchSetting(settingsByKey.get('store_hero_subtitle'), 'store_hero_subtitle', text, 'branding', 'Subtitulo portada tienda', 'textarea'),
        patchSetting(settingsByKey.get('store_hero_fade_intensity'), 'store_hero_fade_intensity', gradientIntensity, 'branding', 'Fade intensidad', 'number'),
        patchSetting(settingsByKey.get('store_hero_fade_size'), 'store_hero_fade_size', gradientExtent, 'branding', 'Fade tamano px', 'number'),
        patchSetting(settingsByKey.get('store_hero_fade_rgb_desktop'), 'store_hero_fade_rgb_desktop', rgb, 'branding', 'Fade portada desktop (RGB)', 'text'),
        patchSetting(settingsByKey.get('store_hero_fade_rgb_mobile'), 'store_hero_fade_rgb_mobile', rgb, 'branding', 'Fade portada mobile (RGB)', 'text'),
        patchSetting(
          settingsByKey.get('store_hero_fade_mid_alpha'),
          'store_hero_fade_mid_alpha',
          highContrast ? '0.58' : '0',
          'branding',
          'Fade alpha medio',
          'text',
        ),
      ];
      await adminSettingsApi.save(toSave);
      setSuccess('Portada de tienda guardada');
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando portada de tienda');
    } finally {
      setSaving(false);
    }
  }

  async function uploadHeroImage(slot: HeroAsset['slot']) {
    const file = selectedFiles[slot];
    if (!file) return;
    setUploadingSlot(slot);
    setError('');
    setSuccess('');
    try {
      await brandAssetsApi.upload(slot, file);
      setSelectedFiles((prev) => ({ ...prev, [slot]: null }));
      setSuccess('Imagen de portada guardada');
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo imagen');
    } finally {
      setUploadingSlot(null);
    }
  }

  async function resetHeroImage(slot: HeroAsset['slot']) {
    setUploadingSlot(slot);
    setError('');
    setSuccess('');
    try {
      await brandAssetsApi.reset(slot);
      setSelectedFiles((prev) => ({ ...prev, [slot]: null }));
      setSuccess('Imagen restaurada por defecto');
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error restaurando imagen');
    } finally {
      setUploadingSlot(null);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Portada de tienda</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Administra la imagen principal que se muestra al entrar a la tienda.
            </p>
          </div>
          <Link to="/admin/configuraciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver a configuracion
          </Link>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</div> : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {HERO_ASSETS.map((item) => (
          <HeroAssetCard
            key={item.title}
            item={item}
            disabled={loading || saving}
            uploading={uploadingSlot === item.slot}
            selectedFile={selectedFiles[item.slot] ?? null}
            imageUrl={brandAssetsApi.toApiAssetUrl(settingsByKey.get(item.settingKey)?.value)}
            isCustom={Boolean((settingsByKey.get(item.settingKey)?.value ?? '').trim())}
            onSelectFile={(file) => setSelectedFiles((prev) => ({ ...prev, [item.slot]: file }))}
            onUpload={() => void uploadHeroImage(item.slot)}
            onReset={() => void resetHeroImage(item.slot)}
          />
        ))}
      </section>

      <section className="card overflow-hidden">
        <div className="card-body !p-0">
          <div className="border-b border-zinc-100 px-4 py-4 md:px-5">
            <h2 className="text-xl font-black tracking-tight text-zinc-900">Textos y degradado</h2>
          </div>

          <div className="space-y-4 px-4 py-4 md:px-5 md:py-5">
            <Field label="Titulo (opcional)">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Novedades de la semana"
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              />
            </Field>

            <Field label="Texto (opcional)">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="Ej: Ingresaron nuevos modulos y accesorios."
                className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Intensidad del degradado (0-100)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradientIntensity}
                  onChange={(e) => setGradientIntensity(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                />
              </Field>
              <Field label="Extension del degradado (px)">
                <input
                  type="number"
                  min={0}
                  value={gradientExtent}
                  onChange={(e) => setGradientExtent(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                />
              </Field>
            </div>

            <Field
              label="Color manual del degradado (hex)"
              hint="Opcional. Si lo completas, se usa este color para el degradado en todos los dispositivos. Si lo dejas vacio, el color se calcula automaticamente desde la imagen."
            >
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2">
                <input
                  type="color"
                  value={gradientColor}
                  onChange={(e) => setGradientColor(e.target.value)}
                  className="h-8 w-14 rounded border border-zinc-200 bg-transparent p-0"
                />
                <input
                  value={gradientColor}
                  onChange={(e) => setGradientColor(e.target.value)}
                  placeholder="#1052BE"
                  className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm"
                />
              </div>
            </Field>

            <label className="flex items-center gap-3 text-sm font-bold text-zinc-800">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-cyan-700"
              />
              Modo contraste alto del degradado
            </label>

            <p className="text-sm text-zinc-500">
              El degradado se superpone sobre el bloque siguiente al hero y no agrega altura extra al layout.
            </p>

            <div>
              <button
                type="button"
                onClick={() => void saveTextSettings()}
                disabled={loading || saving}
                className="btn-primary !h-11 !rounded-2xl px-5 text-sm font-bold disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar textos'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroAssetCard({
  item,
  disabled,
  uploading,
  selectedFile,
  imageUrl,
  isCustom,
  onSelectFile,
  onUpload,
  onReset,
}: {
  item: HeroAsset;
  disabled?: boolean;
  uploading?: boolean;
  selectedFile: File | null;
  imageUrl: string | null;
  isCustom: boolean;
  onSelectFile: (file: File | null) => void;
  onUpload: () => void;
  onReset: () => void;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="card-body !p-0">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-4">
          <h2 className="text-xl font-black tracking-tight text-zinc-900">{item.title}</h2>
          <span className="inline-flex h-7 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-800">
            {isCustom ? 'Personalizada' : 'Por defecto'}
          </span>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
            {selectedFile ? (
              <img src={URL.createObjectURL(selectedFile)} alt={item.title} className="h-full w-full object-cover" />
            ) : imageUrl ? (
              <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <HeroPreview mobile={item.mobile} />
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            Recomendado: <span className="font-black">{item.recommended}</span> (opcional retina: {item.optional}).{' '}
            {item.mobile ? 'Mantener elementos importantes centrados.' : 'El hero usa alto fijo y puede recortar laterales.'}
          </div>

          <label className="flex h-11 w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700">
            Arrastra una imagen o haz click para elegir
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              disabled={disabled || uploading}
              className="hidden"
              onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <p className="text-xs text-zinc-500">Formatos: PNG, JPG, JPEG, WEBP | Max: {item.maxKb} KB</p>

          <button
            type="button"
            disabled={disabled || uploading || !selectedFile}
            onClick={onUpload}
            className="h-11 w-full rounded-2xl bg-zinc-300 px-4 text-base font-black text-white disabled:opacity-80"
          >
            {uploading ? 'Guardando...' : 'Guardar imagen'}
          </button>

          <button type="button" disabled={disabled || uploading} onClick={onReset} className="btn-outline !h-11 w-full !rounded-2xl text-sm font-bold">
            Restaurar por defecto
          </button>
        </div>
      </div>
    </section>
  );
}

function patchSetting(
  existing: AdminSettingItem | undefined,
  key: string,
  value: string,
  group: string,
  label: string,
  type: string,
) {
  return {
    key,
    value,
    group: existing?.group ?? group,
    label: existing?.label ?? label,
    type: existing?.type ?? type,
  };
}

function rgbToHex(rgb: string) {
  const parts = rgb.split(',').map((p) => Number.parseInt(p.trim(), 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return `#${parts.map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function hexToRgbString(hex: string) {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function HeroPreview({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 ${
        mobile ? 'h-44 w-full' : 'h-44 w-full'
      }`}
    >
      <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_15%_20%,white_1px,transparent_1px)] [background-size:14px_14px]" />
      <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#0b3d91]/80 to-transparent" />

      <div className={`absolute left-1/2 top-4 -translate-x-1/2 text-center text-white ${mobile ? 'scale-90' : ''}`}>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">Tu tienda de</div>
        <div className="mt-1 text-3xl font-black leading-none tracking-tight">ELECTRONICA</div>
        <div className="mx-auto mt-2 inline-flex rounded-md bg-yellow-300 px-3 py-0.5 text-sm font-black text-zinc-900">
          AL MEJOR PRECIO
        </div>
        <div className="mx-auto mt-3 inline-flex items-center rounded-xl bg-sky-900/70 px-4 py-2 text-sm font-bold text-white shadow-sm ring-1 ring-white/20">
          Reparaciones con
          <span className="ml-1 text-yellow-200">Garantia Asegurada</span>
        </div>
      </div>

      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 ${mobile ? 'scale-90' : ''}`}>
        <div className="flex items-end gap-2">
          <DevicePill h="h-16" w="w-8" rotate="-rotate-12" color="from-pink-400 to-rose-500" />
          <DevicePill h="h-12" w="w-7" rotate="rotate-6" color="from-zinc-100 to-zinc-300" />
          <DevicePill h="h-14" w="w-7" rotate="-rotate-3" color="from-zinc-100 to-zinc-200" />
          <div className="h-12 w-12 rounded-full bg-zinc-900 shadow ring-2 ring-white/20" />
          <div className="h-10 w-16 rounded-full bg-zinc-950 shadow ring-2 ring-white/20" />
        </div>
      </div>
    </div>
  );
}

function DevicePill({
  h,
  w,
  rotate,
  color,
}: {
  h: string;
  w: string;
  rotate: string;
  color: string;
}) {
  return <div className={`${h} ${w} ${rotate} rounded-lg bg-gradient-to-b ${color} shadow ring-2 ring-white/20`} />;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-900">{label}</label>
      {children}
      {hint ? <p className="mt-2 text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}
