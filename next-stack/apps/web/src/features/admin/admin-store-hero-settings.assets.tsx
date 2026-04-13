import { useEffect, useState } from 'react';
import { brandAssetsApi } from './brandAssetsApi';
import { HERO_ASSETS, type HeroAsset, type HeroAssetSlot } from './admin-store-hero-settings.helpers';
import type { AdminSettingItem } from './settingsApi';

type AdminStoreHeroAssetsSectionProps = {
  settingsByKey: Map<string, AdminSettingItem>;
  disabled: boolean;
  uploadingSlot: HeroAssetSlot | null;
  selectedFiles: Partial<Record<HeroAssetSlot, File | null>>;
  onSelectFile: (slot: HeroAssetSlot, file: File | null) => void;
  onUpload: (slot: HeroAssetSlot) => void;
  onReset: (slot: HeroAssetSlot) => void;
};

export function AdminStoreHeroAssetsSection({
  settingsByKey,
  disabled,
  uploadingSlot,
  selectedFiles,
  onSelectFile,
  onUpload,
  onReset,
}: AdminStoreHeroAssetsSectionProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {HERO_ASSETS.map((item) => (
        <HeroAssetCard
          key={item.title}
          item={item}
          disabled={disabled}
          uploading={uploadingSlot === item.slot}
          selectedFile={selectedFiles[item.slot] ?? null}
          imageUrl={brandAssetsApi.toApiAssetUrl(settingsByKey.get(item.settingKey)?.value)}
          isCustom={Boolean((settingsByKey.get(item.settingKey)?.value ?? '').trim())}
          onSelectFile={(file) => onSelectFile(item.slot, file)}
          onUpload={() => onUpload(item.slot)}
          onReset={() => onReset(item.slot)}
        />
      ))}
    </section>
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
          <HeroImagePreview item={item} selectedFile={selectedFile} imageUrl={imageUrl} />

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
              onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
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

function HeroImagePreview({
  item,
  selectedFile,
  imageUrl,
}: {
  item: HeroAsset;
  selectedFile: File | null;
  imageUrl: string | null;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [selectedFile]);

  return (
    <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
      {previewUrl ? (
        <img src={previewUrl} alt={item.title} className="h-full w-full object-cover" />
      ) : imageUrl ? (
        <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
      ) : (
        <HeroPreview mobile={item.mobile} />
      )}
    </div>
  );
}

function HeroPreview({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500">
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
