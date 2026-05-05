import { describe, expect, it } from 'vitest';
import { buildBrandingManifest, getHeadAssetMimeType } from './BrandingHeadSync.helpers';
import type { StoreBrandingAssets } from '@/features/store/types';

function makeBranding(overrides: Partial<StoreBrandingAssets> = {}): StoreBrandingAssets {
  return {
    siteTitle: 'Nico Reparaciones',
    logoPrincipal: '',
    authPanelImages: {
      desktop: null,
      mobile: null,
    },
    authPanelContent: {
      eyebrow: '',
      title: '',
      description: '',
      eyebrowColor: '#fff',
      titleColor: '#fff',
      descriptionColor: '#fff',
    },
    icons: {
      settings: null,
      carrito: null,
      logout: null,
      consultarReparacion: null,
      misPedidos: null,
      misReparaciones: null,
      dashboard: null,
      tienda: null,
      ayuda: null,
      miCuenta: null,
      verificarCorreo: null,
      adminPedidos: null,
      adminReparaciones: null,
      adminVentaRapida: null,
      adminProductos: null,
    },
    iconsBySlot: {},
    favicons: {
      faviconIco: null,
      favicon16: null,
      favicon32: null,
      android192: 'http://127.0.0.1:3001/brand-assets/identity/android_192/custom.webp?v=123',
      android512: 'http://127.0.0.1:3001/brand-assets/identity/android_512/custom.png?v=456',
      appleTouch: null,
      manifest: null,
    },
    ...overrides,
  };
}

describe('BrandingHeadSync helpers', () => {
  it('detects asset mime type from versioned URLs', () => {
    expect(getHeadAssetMimeType('/favicon.ico?v=1')).toBe('image/x-icon');
    expect(getHeadAssetMimeType('/icon.svg?version=1')).toBe('image/svg+xml');
    expect(getHeadAssetMimeType('/icon.webp#hash')).toBe('image/webp');
    expect(getHeadAssetMimeType('/icon.jpeg')).toBe('image/jpeg');
    expect(getHeadAssetMimeType('/icon.unknown', 'image/png')).toBe('image/png');
  });

  it('builds a web manifest from editable app icons', () => {
    const manifest = buildBrandingManifest(makeBranding());

    expect(manifest).toMatchObject({
      name: 'Nico Reparaciones',
      short_name: 'Nico Reparac',
      display: 'standalone',
    });
    expect(manifest?.icons).toEqual([
      {
        src: 'http://127.0.0.1:3001/brand-assets/identity/android_192/custom.webp?v=123',
        sizes: '192x192',
        type: 'image/webp',
      },
      {
        src: 'http://127.0.0.1:3001/brand-assets/identity/android_512/custom.png?v=456',
        sizes: '512x512',
        type: 'image/png',
      },
    ]);
  });
});
