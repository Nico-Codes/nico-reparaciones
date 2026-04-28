export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parentSlug?: string | null;
  parentName?: string | null;
  productsCount: number;
  children: StoreCategory[];
};

export type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  price: number;
  stock: number;
  fulfillmentMode: 'INVENTORY' | 'SPECIAL_ORDER';
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  hasColorOptions: boolean;
  requiresColorSelection: boolean;
  colorOptions: Array<{
    id: string;
    label: string;
    supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
    active: boolean;
  }>;
  featured: boolean;
  active: boolean;
  sku: string | null;
  barcode: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parent: { id: string; name: string; slug: string } | null;
    pathLabel: string;
  } | null;
  createdAt: string;
};

export type StoreProductsResponse = {
  items: StoreProduct[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    q: string;
    category: string | null;
    sort: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name_asc' | 'name_desc' | 'stock_desc';
  };
};

export type StoreHomeResponse = {
  hero: StoreHeroConfig;
  branding: StoreBrandingAssets;
  categories: StoreCategory[];
  products: StoreProductsResponse;
};

export type StoreHeroConfig = {
  imageDesktop: string;
  imageMobile: string;
  fadeRgbDesktop: string;
  fadeRgbMobile: string;
  fadeIntensity: number;
  fadeSize: number;
  fadeHold: number;
  fadeMidAlpha: string;
  title?: string;
  subtitle?: string;
};

export type StoreBrandingAssets = {
  siteTitle: string;
  logoPrincipal: string;
  authPanelImages?: {
    desktop: string | null;
    mobile: string | null;
  };
  authPanelContent?: {
    eyebrow: string;
    title: string;
    description: string;
    eyebrowColor: string;
    titleColor: string;
    descriptionColor: string;
  };
  icons: {
    settings: string | null;
    carrito: string | null;
    logout: string | null;
    consultarReparacion: string | null;
    misPedidos: string | null;
    misReparaciones: string | null;
    dashboard: string | null;
    tienda: string | null;
    ayuda: string | null;
    miCuenta: string | null;
    verificarCorreo: string | null;
    adminPedidos: string | null;
    adminReparaciones: string | null;
    adminVentaRapida: string | null;
    adminProductos: string | null;
  };
  favicons: {
    faviconIco: string | null;
    favicon16: string | null;
    favicon32: string | null;
    android192: string | null;
    android512: string | null;
    appleTouch: string | null;
    manifest: string | null;
  };
};
