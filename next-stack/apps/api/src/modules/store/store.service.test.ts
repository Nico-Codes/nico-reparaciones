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
    const updatedAt = new Date('2026-04-16T17:40:00.000Z');

    const prisma = {
      appSetting: {
        findMany: vi.fn().mockResolvedValue([
          { key: 'brand_asset.auth_login_background.path', value: 'brand-assets/identity/auth-login-background.png', updatedAt },
          { key: 'brand_asset.auth_login_background_mobile.path', value: 'brand-assets/identity/auth-login-background-mobile.png', updatedAt },
          { key: 'auth_panel_eyebrow', value: 'Ingresa', updatedAt },
          { key: 'auth_panel_title', value: 'Todo en orden', updatedAt },
          { key: 'auth_panel_description', value: 'Descripcion de prueba', updatedAt },
          { key: 'auth_panel_eyebrow_color', value: '#ABCDEF', updatedAt },
          { key: 'auth_panel_title_color', value: '#FEDCBA', updatedAt },
          { key: 'auth_panel_description_color', value: '#CCDDEE', updatedAt },
          { key: 'store_hero_image_desktop', value: 'brand-assets/identity/store-hero-desktop.png', updatedAt },
          { key: 'store_hero_image_mobile', value: 'brand-assets/identity/store-hero-mobile.png', updatedAt },
        ]),
      },
    };

    const service = new StoreService(prisma as any);

    await expect(service.getBrandingAssets()).resolves.toMatchObject({
      authPanelImages: {
        desktop: `/brand-assets/identity/auth-login-background.png?v=${updatedAt.getTime()}`,
        mobile: `/brand-assets/identity/auth-login-background-mobile.png?v=${updatedAt.getTime()}`,
      },
      authPanelContent: {
        eyebrow: 'Ingresa',
        title: 'Todo en orden',
        description: 'Descripcion de prueba',
        eyebrowColor: '#ABCDEF',
        titleColor: '#FEDCBA',
        descriptionColor: '#CCDDEE',
      },
    });

    await expect(service.getHeroConfig()).resolves.toMatchObject({
      imageDesktop: `/brand-assets/identity/store-hero-desktop.png?v=${updatedAt.getTime()}`,
      imageMobile: `/brand-assets/identity/store-hero-mobile.png?v=${updatedAt.getTime()}`,
    });
  });

  it('counts only categories with public products in stock', async () => {
    const prisma = {
      category: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const service = new StoreService(prisma as any);

    await service.listCategories();

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: {
            select: {
              products: {
                where: { active: true, stock: { gt: 0 } },
              },
            },
          },
        }),
      }),
    );
  });

  it('builds store home with hero, branding, categories and default first product page', async () => {
    const service = new StoreService({} as any);
    const hero = { imageDesktop: '/hero.jpg', imageMobile: '/hero-mobile.jpg' };
    const branding = { siteTitle: 'NicoReparaciones' };
    const categories = [{ id: 'cat_1', name: 'Cables', slug: 'cables', productsCount: 2 }];
    const products = { items: [], meta: { total: 0, page: 1, pageSize: 24, totalPages: 1, q: '', category: null, sort: 'relevance' } };

    const heroSpy = vi.spyOn(service, 'getHeroConfig').mockResolvedValue(hero as any);
    const brandingSpy = vi.spyOn(service, 'getBrandingAssets').mockResolvedValue(branding as any);
    const categoriesSpy = vi.spyOn(service, 'listCategories').mockResolvedValue(categories as any);
    const productsSpy = vi.spyOn(service, 'listProducts').mockResolvedValue(products as any);

    await expect(service.getHome()).resolves.toEqual({
      hero,
      branding,
      categories,
      products,
    });

    expect(heroSpy).toHaveBeenCalledOnce();
    expect(brandingSpy).toHaveBeenCalledOnce();
    expect(categoriesSpy).toHaveBeenCalledOnce();
    expect(productsSpy).toHaveBeenCalledWith({ page: 1, pageSize: 24, sort: 'relevance' });
  });

  it('hides out-of-stock products from public listing and detail lookups', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    const service = new StoreService(prisma as any);

    await service.listProducts({});

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          active: true,
          stock: { gt: 0 },
        }),
      }),
    );
    expect(prisma.product.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        active: true,
        stock: { gt: 0 },
      }),
    });

    await service.getProductBySlug('producto-agotado');

    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: 'producto-agotado',
          active: true,
          stock: { gt: 0 },
        }),
      }),
    );
  });

  it('falls back to the default login background when no auth branding is configured', async () => {
    const prisma = {
      appSetting: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const service = new StoreService(prisma as any);

    await expect(service.getBrandingAssets()).resolves.toMatchObject({
      authPanelImages: {
        desktop: '/brand/logo-bg.png',
        mobile: '/brand/logo-bg.png',
      },
      authPanelContent: {
        eyebrow: 'Cuenta web',
        title: 'Acceso claro y ordenado.',
        description: 'Tu cuenta Nico para entrar, seguir pedidos y consultar reparaciones sin friccion.',
        eyebrowColor: '#FFFFFF',
        titleColor: '#FFFFFF',
        descriptionColor: '#FFFFFF',
      },
    });
  });

  it('falls back to the legacy single auth text color when separate colors are not configured', async () => {
    const prisma = {
      appSetting: {
        findMany: vi.fn().mockResolvedValue([
          { key: 'auth_panel_text_color', value: '#AB12CD', updatedAt: new Date('2026-04-20T12:00:00.000Z') },
        ]),
      },
    };

    const service = new StoreService(prisma as any);

    await expect(service.getBrandingAssets()).resolves.toMatchObject({
      authPanelContent: {
        eyebrowColor: '#AB12CD',
        titleColor: '#AB12CD',
        descriptionColor: '#AB12CD',
      },
    });
  });
});
