export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  productsCount: number;
};

export type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  imageLegacy?: string | null;
  price: number;
  stock: number;
  featured: boolean;
  active: boolean;
  sku: string | null;
  barcode: string | null;
  category: { id: string; name: string; slug: string } | null;
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
  logoPrincipal: string;
  icons: {
    settings: string | null;
    carrito: string | null;
    logout: string | null;
    consultarReparacion: string | null;
    misPedidos: string | null;
    misReparaciones: string | null;
    dashboard: string | null;
    tienda: string | null;
  };
};
