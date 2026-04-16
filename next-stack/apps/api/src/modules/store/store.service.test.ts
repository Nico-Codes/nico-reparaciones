import { afterEach, describe, expect, it, vi } from 'vitest';
import { StoreService } from './store.service.js';

describe('StoreService', () => {
  const originalStoreImageBaseUrl = process.env.STORE_IMAGE_BASE_URL;

  afterEach(() => {
    if (originalStoreImageBaseUrl === undefined) delete process.env.STORE_IMAGE_BASE_URL;
    else process.env.STORE_IMAGE_BASE_URL = originalStoreImageBaseUrl;
  });

  it('returns branding and hero assets as web-public paths instead of storage base URLs', async () => {
    process.env.STORE_IMAGE_BASE_URL = 'http://127.0.0.1:8000';

    const prisma = {
      appSetting: {
        findMany: vi.fn().mockResolvedValue([
          { key: 'brand_asset.auth_login_background.path', value: 'brand-assets/identity/auth-login-background.png' },
          { key: 'brand_asset.auth_login_background_mobile.path', value: 'brand-assets/identity/auth-login-background-mobile.png' },
          { key: 'store_hero_image_desktop', value: 'brand-assets/identity/store-hero-desktop.png' },
          { key: 'store_hero_image_mobile', value: 'brand-assets/identity/store-hero-mobile.png' },
        ]),
      },
    };

    const service = new StoreService(prisma as any);

    await expect(service.getBrandingAssets()).resolves.toMatchObject({
      authPanelImages: {
        desktop: '/brand-assets/identity/auth-login-background.png',
        mobile: '/brand-assets/identity/auth-login-background-mobile.png',
      },
    });

    await expect(service.getHeroConfig()).resolves.toMatchObject({
      imageDesktop: '/brand-assets/identity/store-hero-desktop.png',
      imageMobile: '/brand-assets/identity/store-hero-mobile.png',
    });
  });
});
