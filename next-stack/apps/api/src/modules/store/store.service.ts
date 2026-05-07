import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BRAND_ASSET_SLOTS } from '../admin/app-settings.registry.js';
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
        where: { active: true, parentId: null },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          _count: {
            select: {
              products: {
                where: this.buildPublicProductVisibilityWhere(),
              },
            },
          },
          children: {
            where: { active: true },
            orderBy: { name: 'asc' },
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              _count: {
                select: {
                  products: {
                    where: this.buildPublicProductVisibilityWhere(),
                  },
                },
              },
            },
          },
        },
      });

      return categories.map((category) => {
        const children = category.children.map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          parentId: child.parentId ?? null,
          parentSlug: category.slug,
          parentName: category.name,
          productsCount: child._count.products,
          children: [],
        }));

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parentId ?? null,
          parentSlug: null,
          parentName: null,
          productsCount: category._count.products + children.reduce((sum, child) => sum + child.productsCount, 0),
          children,
        };
      });
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
      const rowsByKey = new Map(settings.map((s) => [s.key, s]));

      const desktop =
        this.resolveSettingAssetUrl(map.get('store_hero_image_desktop') ?? '', rowsByKey.get('store_hero_image_desktop')?.updatedAt) ??
        this.resolveHeroAssetUrl('brand/logo.png') ??
        '/brand/logo.png';
      const mobile =
        this.resolveSettingAssetUrl(map.get('store_hero_image_mobile') ?? '', rowsByKey.get('store_hero_image_mobile')?.updatedAt) ??
        desktop;

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
      const brandAssetEntries = Object.entries(BRAND_ASSET_SLOTS);
      const iconSlotEntries = brandAssetEntries.filter(([slot]) => slot.startsWith('icon_') || slot.startsWith('checkout_'));
      const keys = [
        'business_name',
        'shop_name',
        'brand_asset.logo_principal.path',
        'brand_asset.auth_login_background.path',
        'brand_asset.auth_login_background_mobile.path',
        'auth_panel_eyebrow',
        'auth_panel_title',
        'auth_panel_description',
        'auth_panel_text_color',
        'auth_panel_eyebrow_color',
        'auth_panel_title_color',
        'auth_panel_description_color',
        'brand_asset.icon_settings.path',
        'brand_asset.icon_carrito.path',
        'brand_asset.icon_logout.path',
        'brand_asset.icon_consultar_reparacion.path',
        'brand_asset.icon_mis_pedidos.path',
        'brand_asset.icon_mis_reparaciones.path',
        'brand_asset.icon_dashboard.path',
        'brand_asset.icon_tienda.path',
        'brand_asset.icon_ayuda.path',
        'brand_asset.icon_mi_cuenta.path',
        'brand_asset.icon_verificar_correo.path',
        'brand_asset.icon_admin_pedidos.path',
        'brand_asset.icon_admin_reparaciones.path',
        'brand_asset.icon_admin_venta_rapida.path',
        'brand_asset.icon_admin_productos.path',
        'brand_asset.favicon_ico.path',
        'brand_asset.favicon_16.path',
        'brand_asset.favicon_32.path',
        'brand_asset.android_192.path',
        'brand_asset.android_512.path',
        'brand_asset.apple_touch.path',
        ...brandAssetEntries.map(([, spec]) => spec.settingKey),
      ] as const;

      const rows = await this.prisma.appSetting.findMany({ where: { key: { in: [...new Set(keys)] } } });
      const map = new Map(rows.map((r) => [r.key, r.value ?? '']));
      const rowsByKey = new Map(rows.map((row) => [row.key, row]));
      const legacyAuthTextColor = (map.get('auth_panel_text_color') || '#FFFFFF').trim() || '#FFFFFF';
      const raw = {
        siteTitle: map.get('business_name') || map.get('shop_name') || 'NicoReparaciones',
        logoPrincipal: map.get('brand_asset.logo_principal.path') || 'brand/logo.png',
        authPanelImageDesktop: map.get('brand_asset.auth_login_background.path') || 'brand/logo-bg.png',
        authPanelImageMobile: map.get('brand_asset.auth_login_background_mobile.path') || 'brand/logo-bg.png',
        iconSettings: map.get('brand_asset.icon_settings.path') || BRAND_ASSET_SLOTS.icon_settings.defaultPath,
        iconCarrito: map.get('brand_asset.icon_carrito.path') || BRAND_ASSET_SLOTS.icon_carrito.defaultPath,
        iconLogout: map.get('brand_asset.icon_logout.path') || BRAND_ASSET_SLOTS.icon_logout.defaultPath,
        iconConsultarReparacion: map.get('brand_asset.icon_consultar_reparacion.path') || BRAND_ASSET_SLOTS.icon_consultar_reparacion.defaultPath,
        iconMisPedidos: map.get('brand_asset.icon_mis_pedidos.path') || BRAND_ASSET_SLOTS.icon_mis_pedidos.defaultPath,
        iconMisReparaciones: map.get('brand_asset.icon_mis_reparaciones.path') || BRAND_ASSET_SLOTS.icon_mis_reparaciones.defaultPath,
        iconDashboard: map.get('brand_asset.icon_dashboard.path') || BRAND_ASSET_SLOTS.icon_dashboard.defaultPath,
        iconTienda: map.get('brand_asset.icon_tienda.path') || BRAND_ASSET_SLOTS.icon_tienda.defaultPath,
        iconAyuda: map.get('brand_asset.icon_ayuda.path') || BRAND_ASSET_SLOTS.icon_ayuda.defaultPath,
        iconMiCuenta: map.get('brand_asset.icon_mi_cuenta.path') || BRAND_ASSET_SLOTS.icon_mi_cuenta.defaultPath,
        iconVerificarCorreo: map.get('brand_asset.icon_verificar_correo.path') || BRAND_ASSET_SLOTS.icon_verificar_correo.defaultPath,
        iconAdminPedidos: map.get('brand_asset.icon_admin_pedidos.path') || BRAND_ASSET_SLOTS.icon_admin_pedidos.defaultPath,
        iconAdminReparaciones: map.get('brand_asset.icon_admin_reparaciones.path') || BRAND_ASSET_SLOTS.icon_admin_reparaciones.defaultPath,
        iconAdminVentaRapida: map.get('brand_asset.icon_admin_venta_rapida.path') || BRAND_ASSET_SLOTS.icon_admin_venta_rapida.defaultPath,
        iconAdminProductos: map.get('brand_asset.icon_admin_productos.path') || BRAND_ASSET_SLOTS.icon_admin_productos.defaultPath,
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
        logoPrincipal: this.resolveSettingAssetUrl(raw.logoPrincipal, rowsByKey.get('brand_asset.logo_principal.path')?.updatedAt) ?? '/brand/logo.png',
        authPanelImages: {
          desktop: this.resolveSettingAssetUrl(raw.authPanelImageDesktop, rowsByKey.get('brand_asset.auth_login_background.path')?.updatedAt),
          mobile: this.resolveSettingAssetUrl(raw.authPanelImageMobile, rowsByKey.get('brand_asset.auth_login_background_mobile.path')?.updatedAt),
        },
        authPanelContent: {
          eyebrow: (map.get('auth_panel_eyebrow') || 'Cuenta web').trim() || 'Cuenta web',
          title: (map.get('auth_panel_title') || 'Acceso claro y ordenado.').trim() || 'Acceso claro y ordenado.',
          description:
            (map.get('auth_panel_description') || 'Tu cuenta Nico para entrar, seguir pedidos y consultar reparaciones sin friccion.').trim() ||
            'Tu cuenta Nico para entrar, seguir pedidos y consultar reparaciones sin friccion.',
          eyebrowColor: (map.get('auth_panel_eyebrow_color') || legacyAuthTextColor).trim() || '#FFFFFF',
          titleColor: (map.get('auth_panel_title_color') || legacyAuthTextColor).trim() || '#FFFFFF',
          descriptionColor: (map.get('auth_panel_description_color') || legacyAuthTextColor).trim() || '#FFFFFF',
        },
        icons: {
          settings: this.resolveSettingAssetUrl(raw.iconSettings, rowsByKey.get('brand_asset.icon_settings.path')?.updatedAt),
          carrito: this.resolveSettingAssetUrl(raw.iconCarrito, rowsByKey.get('brand_asset.icon_carrito.path')?.updatedAt),
          logout: this.resolveSettingAssetUrl(raw.iconLogout, rowsByKey.get('brand_asset.icon_logout.path')?.updatedAt),
          consultarReparacion: this.resolveSettingAssetUrl(raw.iconConsultarReparacion, rowsByKey.get('brand_asset.icon_consultar_reparacion.path')?.updatedAt),
          misPedidos: this.resolveSettingAssetUrl(raw.iconMisPedidos, rowsByKey.get('brand_asset.icon_mis_pedidos.path')?.updatedAt),
          misReparaciones: this.resolveSettingAssetUrl(raw.iconMisReparaciones, rowsByKey.get('brand_asset.icon_mis_reparaciones.path')?.updatedAt),
          dashboard: this.resolveSettingAssetUrl(raw.iconDashboard, rowsByKey.get('brand_asset.icon_dashboard.path')?.updatedAt),
          tienda: this.resolveSettingAssetUrl(raw.iconTienda, rowsByKey.get('brand_asset.icon_tienda.path')?.updatedAt),
          ayuda: this.resolveSettingAssetUrl(raw.iconAyuda, rowsByKey.get('brand_asset.icon_ayuda.path')?.updatedAt),
          miCuenta: this.resolveSettingAssetUrl(raw.iconMiCuenta, rowsByKey.get('brand_asset.icon_mi_cuenta.path')?.updatedAt),
          verificarCorreo: this.resolveSettingAssetUrl(raw.iconVerificarCorreo, rowsByKey.get('brand_asset.icon_verificar_correo.path')?.updatedAt),
          adminPedidos: this.resolveSettingAssetUrl(raw.iconAdminPedidos, rowsByKey.get('brand_asset.icon_admin_pedidos.path')?.updatedAt),
          adminReparaciones: this.resolveSettingAssetUrl(raw.iconAdminReparaciones, rowsByKey.get('brand_asset.icon_admin_reparaciones.path')?.updatedAt),
          adminVentaRapida: this.resolveSettingAssetUrl(raw.iconAdminVentaRapida, rowsByKey.get('brand_asset.icon_admin_venta_rapida.path')?.updatedAt),
          adminProductos: this.resolveSettingAssetUrl(raw.iconAdminProductos, rowsByKey.get('brand_asset.icon_admin_productos.path')?.updatedAt),
        },
        iconsBySlot: Object.fromEntries(
          iconSlotEntries.map(([slot, spec]) => [
            slot,
            this.resolveSettingAssetUrl(map.get(spec.settingKey) || spec.defaultPath || '', rowsByKey.get(spec.settingKey)?.updatedAt),
          ]),
        ),
        favicons: {
          faviconIco: this.resolveSettingAssetUrl(raw.faviconIco, rowsByKey.get('brand_asset.favicon_ico.path')?.updatedAt),
          favicon16: this.resolveSettingAssetUrl(raw.favicon16, rowsByKey.get('brand_asset.favicon_16.path')?.updatedAt),
          favicon32: this.resolveSettingAssetUrl(raw.favicon32, rowsByKey.get('brand_asset.favicon_32.path')?.updatedAt),
          android192: this.resolveSettingAssetUrl(raw.android192, rowsByKey.get('brand_asset.android_192.path')?.updatedAt),
          android512: this.resolveSettingAssetUrl(raw.android512, rowsByKey.get('brand_asset.android_512.path')?.updatedAt),
          appleTouch: this.resolveSettingAssetUrl(raw.appleTouch, rowsByKey.get('brand_asset.apple_touch.path')?.updatedAt),
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
        authPanelContent: {
          eyebrow: 'Cuenta web',
          title: 'Acceso claro y ordenado.',
          description: 'Tu cuenta Nico para entrar, seguir pedidos y consultar reparaciones sin friccion.',
          eyebrowColor: '#FFFFFF',
          titleColor: '#FFFFFF',
          descriptionColor: '#FFFFFF',
        },
        icons: {
          settings: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_settings.defaultPath),
          carrito: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_carrito.defaultPath),
          logout: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_logout.defaultPath),
          consultarReparacion: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_consultar_reparacion.defaultPath),
          misPedidos: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_mis_pedidos.defaultPath),
          misReparaciones: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_mis_reparaciones.defaultPath),
          dashboard: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_dashboard.defaultPath),
          tienda: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_tienda.defaultPath),
          ayuda: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_ayuda.defaultPath),
          miCuenta: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_mi_cuenta.defaultPath),
          verificarCorreo: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_verificar_correo.defaultPath),
          adminPedidos: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_admin_pedidos.defaultPath),
          adminReparaciones: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_admin_reparaciones.defaultPath),
          adminVentaRapida: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_admin_venta_rapida.defaultPath),
          adminProductos: this.resolveHeroAssetUrl(BRAND_ASSET_SLOTS.icon_admin_productos.defaultPath),
        },
        iconsBySlot: {},
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

  async getHome() {
    const [hero, branding, categories, products] = await Promise.all([
      this.getHeroConfig(),
      this.getBrandingAssets(),
      this.listCategories(),
      this.listProducts({ page: 1, pageSize: 24, sort: 'relevance' }),
    ]);

    return {
      hero,
      branding,
      categories,
      products,
    };
  }

  async listSeoProducts() {
    try {
      return this.prisma.product.findMany({
        where: this.buildPublicProductVisibilityWhere(),
        orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
        take: 5000,
        select: {
          slug: true,
          featured: true,
          updatedAt: true,
        },
      });
    } catch {
      return [];
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
      const categoryFilter = categorySlug ? await this.buildStoreCategoryFilter(categorySlug) : null;
      const where: Prisma.ProductWhereInput = {
        ...this.buildPublicProductVisibilityWhere(),
        ...(categoryFilter ?? {}),
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
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                parent: { select: { id: true, name: true, slug: true } },
              },
            },
            colorVariants: {
              where: { active: true },
              orderBy: [{ supplierAvailability: 'asc' }, { label: 'asc' }],
              select: {
                id: true,
                label: true,
                supplierAvailability: true,
                active: true,
              },
            },
            specialOrderProfile: { select: { id: true, requiresColorVariants: true } },
          },
          orderBy: this.orderBy(sort),
        }),
        this.prisma.product.count({ where }),
      ]);

      let items = itemsRaw.map((p) => {
        const hasColorOptions = p.colorVariants.length > 0;
        const requiresColorSelection =
          p.fulfillmentMode === 'SPECIAL_ORDER' && (p.specialOrderProfile?.requiresColorVariants ?? true);
        const effectiveSupplierAvailability = hasColorOptions
          ? p.colorVariants.some((variant) => variant.supplierAvailability === 'IN_STOCK')
            ? 'IN_STOCK'
            : 'OUT_OF_STOCK'
          : p.supplierAvailability;
        return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        imagePath: p.imagePath,
        imageUrl: this.resolveProductImageUrl(p.imagePath, p.imageLegacy),
        price: Number(p.price),
        stock: p.stock,
        fulfillmentMode: p.fulfillmentMode,
        supplierAvailability: effectiveSupplierAvailability,
        hasColorOptions,
        requiresColorSelection,
        colorOptions: p.colorVariants.map((variant) => ({
          id: variant.id,
          label: variant.label,
          supplierAvailability: variant.supplierAvailability,
          active: variant.active,
        })),
        featured: p.featured,
        active: p.active,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category
          ? {
              id: p.category.id,
              name: p.category.name,
              slug: p.category.slug,
              parentId: p.category.parentId ?? null,
              parent: p.category.parent
                ? {
                    id: p.category.parent.id,
                    name: p.category.parent.name,
                    slug: p.category.parent.slug,
                  }
                : null,
              pathLabel: p.category.parent ? `${p.category.parent.name} / ${p.category.name}` : p.category.name,
            }
          : null,
        createdAt: p.createdAt.toISOString(),
        };
      });

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
          ...this.buildPublicProductVisibilityWhere(),
          ...(slug ? {} : { id: '__never__' }),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              parent: { select: { id: true, name: true, slug: true } },
            },
          },
          colorVariants: {
            where: { active: true },
            orderBy: [{ supplierAvailability: 'asc' }, { label: 'asc' }],
            select: {
              id: true,
              label: true,
              supplierAvailability: true,
              active: true,
            },
          },
          specialOrderProfile: { select: { id: true, requiresColorVariants: true } },
        },
      });

      if (!p) return null;

      const hasColorOptions = p.colorVariants.length > 0;
      const requiresColorSelection =
        p.fulfillmentMode === 'SPECIAL_ORDER' && (p.specialOrderProfile?.requiresColorVariants ?? true);
      const effectiveSupplierAvailability = hasColorOptions
        ? p.colorVariants.some((variant) => variant.supplierAvailability === 'IN_STOCK')
          ? 'IN_STOCK'
          : 'OUT_OF_STOCK'
        : p.supplierAvailability;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        imagePath: p.imagePath,
        imageUrl: this.resolveProductImageUrl(p.imagePath, p.imageLegacy),
        price: Number(p.price),
        stock: p.stock,
        fulfillmentMode: p.fulfillmentMode,
        supplierAvailability: effectiveSupplierAvailability,
        hasColorOptions,
        requiresColorSelection,
        colorOptions: p.colorVariants.map((variant) => ({
          id: variant.id,
          label: variant.label,
          supplierAvailability: variant.supplierAvailability,
          active: variant.active,
        })),
        featured: p.featured,
        active: p.active,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category
          ? {
              id: p.category.id,
              name: p.category.name,
              slug: p.category.slug,
              parentId: p.category.parentId ?? null,
              parent: p.category.parent
                ? {
                    id: p.category.parent.id,
                    name: p.category.parent.name,
                    slug: p.category.parent.slug,
                  }
                : null,
              pathLabel: p.category.parent ? `${p.category.parent.name} / ${p.category.name}` : p.category.name,
            }
          : null,
        createdAt: p.createdAt.toISOString(),
      };
    } catch {
      return null;
    }
  }

  private resolveProductImageUrl(imagePath?: string | null, imageLegacy?: string | null) {
    const fromPath = imagePath && imagePath.trim() !== '' ? imagePath.trim() : null;
    if (fromPath) {
      return this.resolveStorageAssetUrl(fromPath, this.runtimeStorageBaseUrl());
    }

    if (imageLegacy && imageLegacy.trim() !== '') {
      const legacy = imageLegacy.trim();
      return this.resolveStorageAssetUrl(legacy.includes('/') ? legacy : `products/${legacy}`, this.legacyStorageBaseUrl());
    }

    return null;
  }

  private resolveStorageAssetUrl(rawPath: string, base: string) {
    const raw = rawPath.trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;

    let path = raw.replace(/^\/+/, '');
    if (path.startsWith('storage/')) path = path.slice('storage/'.length);
    const urlPath = `/storage/${path}`;
    return base ? `${base}${urlPath}` : urlPath;
  }

  private runtimeStorageBaseUrl() {
    return (process.env.API_URL ?? '').trim().replace(/\/+$/, '');
  }

  private legacyStorageBaseUrl() {
    return (process.env.STORE_IMAGE_BASE_URL ?? process.env.API_URL ?? '').trim().replace(/\/+$/, '');
  }

  private resolveHeroAssetUrl(rawValue?: string | null) {
    const raw = (rawValue ?? '').trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;

    const normalized = `/${raw.replace(/^\/+/, '')}`;
    if (normalized.startsWith('/brand-assets/')) {
      const base = (process.env.API_URL ?? '').trim().replace(/\/+$/, '');
      return base ? `${base}${normalized}` : normalized;
    }

    if (normalized.startsWith('/storage/')) {
      const base = (process.env.STORE_IMAGE_BASE_URL ?? '').trim().replace(/\/+$/, '');
      return base ? `${base}${normalized}` : normalized;
    }

    return normalized;
  }

  private resolveSettingAssetUrl(rawValue?: string | null, updatedAt?: Date | string | null) {
    const resolvedUrl = this.resolveHeroAssetUrl(rawValue);
    if (!resolvedUrl) return null;

    const version = this.buildAssetVersion(updatedAt);
    if (!version) return resolvedUrl;

    return `${resolvedUrl}${resolvedUrl.includes('?') ? '&' : '?'}v=${version}`;
  }

  private buildAssetVersion(updatedAt?: Date | string | null) {
    if (!updatedAt) return null;
    if (updatedAt instanceof Date) return updatedAt.getTime();

    const parsed = Date.parse(updatedAt);
    return Number.isFinite(parsed) ? parsed : null;
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

  private buildPublicProductVisibilityWhere(): Prisma.ProductWhereInput {
    return {
      active: true,
      OR: [
        {
          fulfillmentMode: 'INVENTORY',
          stock: { gt: 0 },
        },
        {
          fulfillmentMode: 'SPECIAL_ORDER',
          OR: [
            {
              AND: [
                {
                  specialOrderProfile: { is: { requiresColorVariants: true } },
                },
                {
                  colorVariants: {
                    some: {
                      active: true,
                      supplierAvailability: 'IN_STOCK',
                    },
                  },
                },
              ],
            },
            {
              AND: [
                {
                  OR: [
                    { specialOrderProfile: { is: null } },
                    { specialOrderProfile: { is: { requiresColorVariants: false } } },
                  ],
                },
                {
                  OR: [
                    {
                      colorVariants: {
                        some: {
                          active: true,
                          supplierAvailability: 'IN_STOCK',
                        },
                      },
                    },
                    {
                      colorVariants: {
                        none: {
                          active: true,
                        },
                      },
                      supplierAvailability: { not: 'OUT_OF_STOCK' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  private async buildStoreCategoryFilter(categorySlug: string): Promise<Prisma.ProductWhereInput> {
    const category = await this.prisma.category.findFirst({
      where: { slug: categorySlug, active: true },
      select: {
        id: true,
        slug: true,
        parentId: true,
        children: {
          where: { active: true },
          select: { id: true },
        },
      },
    });

    if (!category) {
      return {
        category: {
          is: {
            slug: '__missing__',
          },
        },
      };
    }

    if (category.parentId) {
      return {
        category: {
          is: {
            id: category.id,
            active: true,
          },
        },
      };
    }

    return {
      category: {
        is: {
          active: true,
        },
      },
      categoryId: {
        in: [category.id, ...category.children.map((child) => child.id)],
      },
    };
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

