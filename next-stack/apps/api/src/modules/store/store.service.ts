import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type ListProductsParams = {
  q?: string;
  category?: string;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name_asc' | 'name_desc' | 'stock_desc';
  page?: number;
  pageSize?: number;
};

@Injectable()
export class StoreService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listCategories() {
    try {
      const categories = await this.prisma.category.findMany({
        where: { active: true },
        orderBy: [{ name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              products: {
                where: { active: true },
              },
            },
          },
        },
      });

      return categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productsCount: c._count.products,
      }));
    } catch {
      return [];
    }
  }

  async getHeroConfig() {
    try {
      const keys = [
        'store_hero_image_desktop',
        'store_hero_image_mobile',
        'store_hero_fade_rgb_desktop',
        'store_hero_fade_rgb_mobile',
        'store_hero_fade_intensity',
        'store_hero_fade_size',
        'store_hero_fade_hold',
        'store_hero_fade_mid_alpha',
        'store_hero_title',
        'store_hero_subtitle',
      ] as const;

      const settings = await this.prisma.appSetting.findMany({
        where: { key: { in: [...keys] } },
      });
      const map = new Map(settings.map((s) => [s.key, s.value ?? '']));

      const desktop =
        this.resolveHeroAssetUrl(map.get('store_hero_image_desktop') ?? '') ??
        this.resolveHeroAssetUrl('brand/logo.png') ??
        '/brand/logo.png';
      const mobile = this.resolveHeroAssetUrl(map.get('store_hero_image_mobile') ?? '') ?? desktop;

      return {
        imageDesktop: desktop,
        imageMobile: mobile,
        fadeRgbDesktop: (map.get('store_hero_fade_rgb_desktop') || '14, 165, 233').trim(),
        fadeRgbMobile: (map.get('store_hero_fade_rgb_mobile') || map.get('store_hero_fade_rgb_desktop') || '14, 165, 233').trim(),
        fadeIntensity: this.parseIntSetting(map.get('store_hero_fade_intensity'), 42),
        fadeSize: this.parseIntSetting(map.get('store_hero_fade_size'), 96),
        fadeHold: this.parseIntSetting(map.get('store_hero_fade_hold'), 12),
        fadeMidAlpha: this.parseAlphaSetting(map.get('store_hero_fade_mid_alpha'), '0.58'),
        title: (map.get('store_hero_title') || '').trim(),
        subtitle: (map.get('store_hero_subtitle') || '').trim(),
      };
    } catch {
      return {
        imageDesktop: this.resolveHeroAssetUrl('brand/logo.png') ?? '/brand/logo.png',
        imageMobile: this.resolveHeroAssetUrl('brand/logo.png') ?? '/brand/logo.png',
        fadeRgbDesktop: '14, 165, 233',
        fadeRgbMobile: '14, 165, 233',
        fadeIntensity: 42,
        fadeSize: 96,
        fadeHold: 12,
        fadeMidAlpha: '0.58',
        title: '',
        subtitle: '',
      };
    }
  }

  async getBrandingAssets() {
    try {
      const keys = [
        'business_name',
        'shop_name',
        'brand_asset.logo_principal.path',
        'brand_asset.auth_login_background.path',
        'brand_asset.auth_login_background_mobile.path',
        'brand_asset.icon_settings.path',
        'brand_asset.icon_carrito.path',
        'brand_asset.icon_logout.path',
        'brand_asset.icon_consultar_reparacion.path',
        'brand_asset.icon_mis_pedidos.path',
        'brand_asset.icon_mis_reparaciones.path',
        'brand_asset.icon_dashboard.path',
        'brand_asset.icon_tienda.path',
        'brand_asset.favicon_ico.path',
        'brand_asset.favicon_16.path',
        'brand_asset.favicon_32.path',
        'brand_asset.android_192.path',
        'brand_asset.android_512.path',
        'brand_asset.apple_touch.path',
      ] as const;

      const rows = await this.prisma.appSetting.findMany({ where: { key: { in: [...keys] } } });
      const map = new Map(rows.map((r) => [r.key, r.value ?? '']));
      const raw = {
        siteTitle: map.get('business_name') || map.get('shop_name') || 'NicoReparaciones',
        logoPrincipal: map.get('brand_asset.logo_principal.path') || 'brand/logo.png',
        authPanelImageDesktop: map.get('brand_asset.auth_login_background.path') || 'brand/logo-bg.png',
        authPanelImageMobile: map.get('brand_asset.auth_login_background_mobile.path') || 'brand/logo-bg.png',
        iconSettings: map.get('brand_asset.icon_settings.path') || 'icons/settings.svg',
        iconCarrito: map.get('brand_asset.icon_carrito.path') || 'icons/carrito.svg',
        iconLogout: map.get('brand_asset.icon_logout.path') || 'icons/logout.svg',
        iconConsultarReparacion: map.get('brand_asset.icon_consultar_reparacion.path') || 'icons/consultar-reparacion.svg',
        iconMisPedidos: map.get('brand_asset.icon_mis_pedidos.path') || 'icons/mis-pedidos.svg',
        iconMisReparaciones: map.get('brand_asset.icon_mis_reparaciones.path') || 'icons/mis-reparaciones.svg',
        iconDashboard: map.get('brand_asset.icon_dashboard.path') || 'icons/dashboard.svg',
        iconTienda: map.get('brand_asset.icon_tienda.path') || 'icons/tienda.svg',
        faviconIco: map.get('brand_asset.favicon_ico.path') || 'favicon.ico',
        favicon16: map.get('brand_asset.favicon_16.path') || 'favicon-16x16.png',
        favicon32: map.get('brand_asset.favicon_32.path') || 'favicon-32x32.png',
        android192: map.get('brand_asset.android_192.path') || 'android-chrome-192x192.png',
        android512: map.get('brand_asset.android_512.path') || 'android-chrome-512x512.png',
        appleTouch: map.get('brand_asset.apple_touch.path') || 'apple-touch-icon.png',
        manifest: 'site.webmanifest',
      };

      return {
        siteTitle: raw.siteTitle.trim() || 'NicoReparaciones',
        logoPrincipal: this.resolveHeroAssetUrl(raw.logoPrincipal) ?? '/brand/logo.png',
        authPanelImages: {
          desktop: this.resolveHeroAssetUrl(raw.authPanelImageDesktop),
          mobile: this.resolveHeroAssetUrl(raw.authPanelImageMobile),
        },
        icons: {
          settings: this.resolveHeroAssetUrl(raw.iconSettings),
          carrito: this.resolveHeroAssetUrl(raw.iconCarrito),
          logout: this.resolveHeroAssetUrl(raw.iconLogout),
          consultarReparacion: this.resolveHeroAssetUrl(raw.iconConsultarReparacion),
          misPedidos: this.resolveHeroAssetUrl(raw.iconMisPedidos),
          misReparaciones: this.resolveHeroAssetUrl(raw.iconMisReparaciones),
          dashboard: this.resolveHeroAssetUrl(raw.iconDashboard),
          tienda: this.resolveHeroAssetUrl(raw.iconTienda),
        },
        favicons: {
          faviconIco: this.resolveHeroAssetUrl(raw.faviconIco),
          favicon16: this.resolveHeroAssetUrl(raw.favicon16),
          favicon32: this.resolveHeroAssetUrl(raw.favicon32),
          android192: this.resolveHeroAssetUrl(raw.android192),
          android512: this.resolveHeroAssetUrl(raw.android512),
          appleTouch: this.resolveHeroAssetUrl(raw.appleTouch),
          manifest: this.resolveHeroAssetUrl(raw.manifest),
        },
      };
    } catch {
      return {
        siteTitle: 'NicoReparaciones',
        logoPrincipal: this.resolveHeroAssetUrl('brand/logo.png') ?? '/brand/logo.png',
        authPanelImages: {
          desktop: this.resolveHeroAssetUrl('brand/logo-bg.png') ?? '/brand/logo-bg.png',
          mobile: this.resolveHeroAssetUrl('brand/logo-bg.png') ?? '/brand/logo-bg.png',
        },
        icons: {
          settings: this.resolveHeroAssetUrl('icons/settings.svg'),
          carrito: this.resolveHeroAssetUrl('icons/carrito.svg'),
          logout: this.resolveHeroAssetUrl('icons/logout.svg'),
          consultarReparacion: this.resolveHeroAssetUrl('icons/consultar-reparacion.svg'),
          misPedidos: this.resolveHeroAssetUrl('icons/mis-pedidos.svg'),
          misReparaciones: this.resolveHeroAssetUrl('icons/mis-reparaciones.svg'),
          dashboard: this.resolveHeroAssetUrl('icons/dashboard.svg'),
          tienda: this.resolveHeroAssetUrl('icons/tienda.svg'),
        },
        favicons: {
          faviconIco: this.resolveHeroAssetUrl('favicon.ico') ?? '/favicon.ico',
          favicon16: this.resolveHeroAssetUrl('favicon-16x16.png') ?? '/favicon-16x16.png',
          favicon32: this.resolveHeroAssetUrl('favicon-32x32.png') ?? '/favicon-32x32.png',
          android192: this.resolveHeroAssetUrl('android-chrome-192x192.png') ?? '/android-chrome-192x192.png',
          android512: this.resolveHeroAssetUrl('android-chrome-512x512.png') ?? '/android-chrome-512x512.png',
          appleTouch: this.resolveHeroAssetUrl('apple-touch-icon.png') ?? '/apple-touch-icon.png',
          manifest: this.resolveHeroAssetUrl('site.webmanifest') ?? '/site.webmanifest',
        },
      };
    }
  }

  async listProducts(params: ListProductsParams) {
    const q = (params.q ?? '').trim();
    const categorySlug = (params.category ?? '').trim();
    const sort = params.sort ?? 'relevance';
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 24));
    const skip = (page - 1) * pageSize;

    try {
      const where = {
        active: true,
        ...(categorySlug
          ? {
              category: {
                is: {
                  slug: categorySlug,
                  active: true,
                },
              },
            }
          : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' as const } },
                { slug: { contains: q, mode: 'insensitive' as const } },
                { description: { contains: q, mode: 'insensitive' as const } },
                { sku: { contains: q, mode: 'insensitive' as const } },
                { barcode: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };

      const [itemsRaw, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: this.orderBy(sort),
        }),
        this.prisma.product.count({ where }),
      ]);

      let items = itemsRaw.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        imagePath: p.imagePath,
        imageUrl: this.resolveProductImageUrl(p.imagePath, p.imageLegacy),
        price: Number(p.price),
        stock: p.stock,
        featured: p.featured,
        active: p.active,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category,
        createdAt: p.createdAt.toISOString(),
      }));

      // Relevancia basica por texto para UX mas natural (sin full-text todavia).
      if (sort === 'relevance' && q) {
        const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
        items = items
          .map((item) => ({
            ...item,
            _score: this.relevanceScore(item, terms),
            _featuredWeight: item.featured ? 5 : 0,
          }))
          .sort((a, b) => b._score - a._score || b._featuredWeight - a._featuredWeight || a.price - b.price)
          .map(({ _score: _s, _featuredWeight: _fw, ...rest }) => rest);
      }

      return {
        items,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          q,
          category: categorySlug || null,
          sort,
        },
      };
    } catch {
      return {
        items: [],
        meta: {
          total: 0,
          page,
          pageSize,
          totalPages: 1,
          q,
          category: categorySlug || null,
          sort,
        },
      };
    }
  }

  async getProductBySlug(slug: string) {
    try {
      const p = await this.prisma.product.findFirst({
        where: {
          slug,
          active: true,
          ...(slug ? {} : { id: '__never__' }),
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!p) return null;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        imagePath: p.imagePath,
        imageUrl: this.resolveProductImageUrl(p.imagePath, p.imageLegacy),
        price: Number(p.price),
        stock: p.stock,
        featured: p.featured,
        active: p.active,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category,
        createdAt: p.createdAt.toISOString(),
      };
    } catch {
      return null;
    }
  }

  private resolveProductImageUrl(imagePath?: string | null, imageLegacy?: string | null) {
    const base = (process.env.STORE_IMAGE_BASE_URL ?? '').trim().replace(/\/+$/, '');

    const fromPath = imagePath && imagePath.trim() !== '' ? imagePath.trim() : null;
    let raw = fromPath;
    if (!raw && imageLegacy && imageLegacy.trim() !== '') {
      const legacy = imageLegacy.trim();
      raw = legacy.includes('/') ? legacy : `products/${legacy}`;
    }

    if (raw) {
      if (/^https?:\/\//i.test(raw)) return raw;
      if (raw.startsWith('/')) return base ? `${base}${raw}` : raw;
      const path = raw.replace(/^\/+/, '');
      return base ? `${base}/storage/${path}` : `/storage/${path}`;
    }

    return null;
  }

  private resolveHeroAssetUrl(rawValue?: string | null) {
    const raw = (rawValue ?? '').trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;

    const normalized = `/${raw.replace(/^\/+/, '')}`;
    if (normalized.startsWith('/storage/')) {
      const base = (process.env.STORE_IMAGE_BASE_URL ?? '').trim().replace(/\/+$/, '');
      return base ? `${base}${normalized}` : normalized;
    }

    return normalized;
  }
  private parseIntSetting(value: string | undefined, fallback: number) {
    const n = Number((value ?? '').trim());
    return Number.isFinite(n) ? Math.round(n) : fallback;
  }

  private parseAlphaSetting(value: string | undefined, fallback: string) {
    const raw = (value ?? '').trim();
    if (!raw) return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return String(Math.max(0, Math.min(1, n)));
  }

  private orderBy(sort: NonNullable<ListProductsParams['sort']>) {
    if (sort === 'price_asc') return [{ price: 'asc' as const }, { createdAt: 'desc' as const }];
    if (sort === 'price_desc') return [{ price: 'desc' as const }, { createdAt: 'desc' as const }];
    if (sort === 'newest') return [{ createdAt: 'desc' as const }];
    if (sort === 'name_asc') return [{ name: 'asc' as const }, { createdAt: 'desc' as const }];
    if (sort === 'name_desc') return [{ name: 'desc' as const }, { createdAt: 'desc' as const }];
    if (sort === 'stock_desc') return [{ stock: 'desc' as const }, { featured: 'desc' as const }, { createdAt: 'desc' as const }];
    return [{ featured: 'desc' as const }, { createdAt: 'desc' as const }];
  }

  private relevanceScore(
    item: {
      name: string;
      slug: string;
      description: string | null;
      sku: string | null;
      barcode: string | null;
      featured: boolean;
      price: number;
    },
    terms: string[],
  ) {
    const name = item.name.toLowerCase();
    const slug = item.slug.toLowerCase();
    const description = (item.description ?? '').toLowerCase();
    const sku = (item.sku ?? '').toLowerCase();
    const barcode = (item.barcode ?? '').toLowerCase();

    let score = 0;
    for (const t of terms) {
      if (name === t) score += 50;
      if (name.includes(t)) score += 20;
      if (slug.includes(t)) score += 12;
      if (description.includes(t)) score += 6;
      if (sku.includes(t)) score += 15;
      if (barcode.includes(t)) score += 15;
    }

    const featuredWeight = item.featured ? 5 : 0;
    return score + featuredWeight;
  }
}

