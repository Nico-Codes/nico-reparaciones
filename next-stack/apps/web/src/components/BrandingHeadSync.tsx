import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreBranding } from '@/features/store/branding-cache';
import type { StoreBrandingAssets } from '@/features/store/types';
import { buildBrandingManifest, getHeadAssetMimeType } from './BrandingHeadSync.helpers';

function upsertLink(id: string, rel: string, href: string, attrs?: Record<string, string>) {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    document.head.appendChild(link);
  }
  link.rel = rel;
  link.href = href;
  link.setAttribute('data-branding-head', 'true');
  for (const key of ['sizes', 'type']) {
    link.removeAttribute(key);
  }
  for (const [key, value] of Object.entries(attrs ?? {})) {
    link.setAttribute(key, value);
  }
}

function removeLink(id: string) {
  const node = document.getElementById(id);
  if (node?.parentNode) {
    node.parentNode.removeChild(node);
  }
}

function removeStaticHeadAssetLinks() {
  const selectors = [
    'link[rel="icon"]:not([data-branding-head])',
    'link[rel="shortcut icon"]:not([data-branding-head])',
    'link[rel="apple-touch-icon"]:not([data-branding-head])',
    'link[rel="manifest"]:not([data-branding-head])',
  ];
  document.querySelectorAll<HTMLLinkElement>(selectors.join(',')).forEach((node) => node.parentNode?.removeChild(node));
}

function createBrandingManifestUrl(branding: StoreBrandingAssets | null) {
  const manifest = buildBrandingManifest(branding);
  if (!manifest) return null;
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  return URL.createObjectURL(blob);
}

export function BrandingHeadSync() {
  const location = useLocation();
  const branding = useStoreBranding();

  useEffect(() => {
    let manifestObjectUrl: string | null = null;
    const siteTitle = (branding?.siteTitle ?? 'NicoReparaciones').trim() || 'NicoReparaciones';
    const path = location.pathname.toLowerCase();
    const section = path.startsWith('/admin')
      ? 'Admin'
      : path.startsWith('/auth')
        ? 'Cuenta'
        : path.startsWith('/reparacion') || path.startsWith('/repair-lookup')
          ? 'Reparación'
          : path.startsWith('/store')
            ? 'Tienda'
            : '';

    document.title = section ? `${siteTitle} | ${section}` : siteTitle;
    removeStaticHeadAssetLinks();

    const favicons = branding?.favicons;
    const faviconIco = favicons?.faviconIco ?? '/favicon.ico';
    const favicon16 = favicons?.favicon16 ?? '/favicon-16x16.png';
    const favicon32 = favicons?.favicon32 ?? '/favicon-32x32.png';
    const appleTouch = favicons?.appleTouch ?? '/apple-touch-icon.png';
    const manifest = createBrandingManifestUrl(branding) ?? favicons?.manifest ?? '/site.webmanifest';
    manifestObjectUrl = manifest.startsWith('blob:') ? manifest : null;

    if (faviconIco) {
      upsertLink('app-favicon-ico', 'icon', faviconIco, { type: getHeadAssetMimeType(faviconIco, 'image/x-icon') });
      upsertLink('app-shortcut-icon', 'shortcut icon', faviconIco, { type: getHeadAssetMimeType(faviconIco, 'image/x-icon') });
    } else {
      removeLink('app-favicon-ico');
      removeLink('app-shortcut-icon');
    }

    if (favicon16) upsertLink('app-favicon-16', 'icon', favicon16, { sizes: '16x16', type: getHeadAssetMimeType(favicon16) });
    else removeLink('app-favicon-16');

    if (favicon32) upsertLink('app-favicon-32', 'icon', favicon32, { sizes: '32x32', type: getHeadAssetMimeType(favicon32) });
    else removeLink('app-favicon-32');

    if (appleTouch) upsertLink('app-apple-touch-icon', 'apple-touch-icon', appleTouch);
    else removeLink('app-apple-touch-icon');

    if (manifest) upsertLink('app-manifest', 'manifest', manifest);
    else removeLink('app-manifest');

    return () => {
      if (manifestObjectUrl) URL.revokeObjectURL(manifestObjectUrl);
    };
  }, [branding, location.pathname]);

  return null;
}
