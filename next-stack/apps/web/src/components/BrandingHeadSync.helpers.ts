import type { StoreBrandingAssets } from '../features/store/types';

export function getHeadAssetMimeType(url: string, fallback = 'image/png') {
  const pathname = url.split(/[?#]/, 1)[0]?.toLowerCase() ?? '';
  if (pathname.endsWith('.ico')) return 'image/x-icon';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  if (pathname.endsWith('.png')) return 'image/png';
  return fallback;
}

export function buildBrandingManifest(branding: StoreBrandingAssets | null) {
  if (!branding) return null;
  const siteTitle = (branding.siteTitle ?? 'NicoReparaciones').trim() || 'NicoReparaciones';
  const shortName = siteTitle.length > 12 ? siteTitle.slice(0, 12) : siteTitle;
  const icons = [
    branding.favicons.android192
      ? {
          src: branding.favicons.android192,
          sizes: '192x192',
          type: getHeadAssetMimeType(branding.favicons.android192),
        }
      : null,
    branding.favicons.android512
      ? {
          src: branding.favicons.android512,
          sizes: '512x512',
          type: getHeadAssetMimeType(branding.favicons.android512),
        }
      : null,
  ].filter(Boolean);

  return {
    name: siteTitle,
    short_name: shortName,
    icons,
    theme_color: '#0ea5e9',
    background_color: '#ffffff',
    display: 'standalone',
  };
}
