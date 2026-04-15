import { describe, expect, it } from 'vitest';
import { extractNormalizedParts } from './admin-provider-search.parsers.js';
import type { SupplierRegistryRow } from './admin-providers.types.js';

function createSupplierRow(
  overrides: Partial<SupplierRegistryRow> = {},
): SupplierRegistryRow {
  return {
    id: 'sup_test',
    name: 'Proveedor Demo',
    phone: null,
    notes: null,
    active: true,
    searchPriority: 10,
    searchEnabled: true,
    searchInRepairs: false,
    searchMode: 'html',
    searchEndpoint: 'https://supplier.test/?s={query}',
    searchConfigJson: null,
    lastProbeStatus: 'none',
    lastProbeQuery: null,
    lastProbeCount: 0,
    lastProbeError: null,
    lastProbeAt: null,
    createdAt: '2026-04-15T00:00:00.000Z',
    updatedAt: '2026-04-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('admin-provider-search parsers', () => {
  it('prioritizes the visible sale price for xstore search cards', () => {
    const row = createSupplierRow({
      name: 'Tienda Movil Rosario',
      searchEndpoint: 'https://tiendamovilrosario.com.ar/?s={query}&post_type=product',
      searchConfigJson:
        '{"profile":"xstore","candidate_paths":["/product/"],"exclude_paths":["/product-category/"],"context_window":2200}',
    });

    const html = `
      <ul class="products">
        <li class="product type-product post-123">
          <a href="https://tiendamovilrosario.com.ar/product/modulo-samsung-a13/">
            <h2 class="woocommerce-loop-product__title">MODULO SAMSUNG A13 ORIGINAL</h2>
          </a>
          <span class="price">
            <del aria-hidden="true"><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&#36;</span>&nbsp;13.978</bdi></span></del>
            <ins aria-hidden="true"><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&#36;</span>&nbsp;12.345</bdi></span></ins>
          </span>
        </li>
      </ul>
    `;

    const parts = extractNormalizedParts(
      html,
      row,
      'https://tiendamovilrosario.com.ar/?s=modulo+a13&post_type=product',
      5,
    );

    expect(parts).toHaveLength(1);
    expect(parts[0]?.price).toBe(12345);
    expect(parts[0]?.name).toMatch(/A13/i);
  });

  it('extracts single-product pages from JSON-LD when search redirects to product detail', () => {
    const row = createSupplierRow({
      name: 'Okey Rosario',
      searchEndpoint: 'https://okeyrosario.com.ar/?s={query}&post_type=product',
      searchConfigJson:
        '{"profile":"flatsome","candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/","add-to-cart="],"context_window":1800}',
    });

    const html = `
      <html>
        <head>
          <link rel="canonical" href="https://okeyrosario.com.ar/producto/modulo-samsung-a13-a135f/" />
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "MODULO SAMSUNG A13 A135F ORIGINAL",
              "sku": "A13-ORI",
              "url": "https://okeyrosario.com.ar/producto/modulo-samsung-a13-a135f/",
              "brand": { "@type": "Brand", "name": "Samsung" },
              "offers": {
                "@type": "Offer",
                "price": "15800",
                "availability": "https://schema.org/InStock"
              }
            }
          </script>
        </head>
        <body><h1 class="product_title entry-title">MODULO SAMSUNG A13 A135F ORIGINAL</h1></body>
      </html>
    `;

    const parts = extractNormalizedParts(
      html,
      row,
      'https://okeyrosario.com.ar/?s=modulo+a13&post_type=product',
      5,
    );

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      name: 'MODULO SAMSUNG A13 A135F ORIGINAL',
      sku: 'A13-ORI',
      brand: 'Samsung',
      price: 15800,
      availability: 'in_stock',
      url: 'https://okeyrosario.com.ar/producto/modulo-samsung-a13-a135f/',
    });
  });

  it('parses woodmart supplier cards for evophone', () => {
    const row = createSupplierRow({
      name: 'Evophone',
      searchEndpoint: 'https://www.evophone.com.ar/?s={query}&post_type=product&dgwt_wcas=1',
      searchConfigJson:
        '{"profile":"woodmart","candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/"],"context_window":2200}',
    });

    const html = `
      <ul class="products columns-4">
        <li class="product type-product post-321">
          <a href="https://www.evophone.com.ar/producto/modulo-samsung-a13-original/" class="product-image-link">
            <h3 class="wd-entities-title">MODULO SAMSUNG A13 ORIGINAL</h3>
          </a>
          <span class="price">
            <del><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&#36;</span>&nbsp;19.990</bdi></span></del>
            <ins><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&#36;</span>&nbsp;18.750</bdi></span></ins>
          </span>
        </li>
      </ul>
    `;

    const parts = extractNormalizedParts(
      html,
      row,
      'https://www.evophone.com.ar/?s=modulo+a13&post_type=product&dgwt_wcas=1',
      5,
    );

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      name: 'MODULO SAMSUNG A13 ORIGINAL',
      price: 18750,
      url: 'https://www.evophone.com.ar/producto/modulo-samsung-a13-original/',
    });
  });

  it('parses shoptimizer supplier cards for celuphone', () => {
    const row = createSupplierRow({
      name: 'Celuphone',
      searchEndpoint: 'https://celuphone.com.ar/?s={query}&post_type=product&dgwt_wcas=1',
      searchConfigJson:
        '{"profile":"shoptimizer","candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/"],"context_window":2200}',
    });

    const html = `
      <ul class="products">
        <li class="product type-product post-455">
          <a href="https://celuphone.com.ar/producto/modulo-samsung-a13-a135/" class="woocommerce-LoopProduct-link">
            <h2 class="woocommerce-loop-product__title">MODULO SAMSUNG A13 A135</h2>
          </a>
          <span class="price">
            <span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&#36;</span>&nbsp;16.500</bdi></span>
          </span>
        </li>
      </ul>
    `;

    const parts = extractNormalizedParts(
      html,
      row,
      'https://celuphone.com.ar/?s=modulo+a13&post_type=product&dgwt_wcas=1',
      5,
    );

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      name: 'MODULO SAMSUNG A13 A135',
      url: 'https://celuphone.com.ar/producto/modulo-samsung-a13-a135/',
    });
  });

  it('prioritizes the redirected single product page over related celuphone products', () => {
    const row = createSupplierRow({
      name: 'Celuphone',
      searchEndpoint: 'https://celuphone.com.ar/?s={query}&post_type=product&dgwt_wcas=1',
      searchConfigJson:
        '{"profile":"shoptimizer","candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/"],"context_window":2200}',
    });

    const html = `
      <html>
        <head>
          <link rel="canonical" href="https://celuphone.com.ar/producto/modulo-xiaomi-redmi-13c-negro-original/" />
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Modulo Xiaomi Redmi 13C/POCO C65 Negro Original",
              "sku": "REDMI-13C-ORI",
              "url": "https://celuphone.com.ar/producto/modulo-xiaomi-redmi-13c-negro-original/",
              "offers": {
                "@type": "Offer",
                "price": "32990",
                "availability": "https://schema.org/InStock"
              }
            }
          </script>
        </head>
        <body>
          <h1 class="product_title entry-title">Modulo Xiaomi Redmi 13C/POCO C65 Negro Original</h1>
          <ul class="products">
            <li class="product type-product post-455">
              <a href="https://celuphone.com.ar/producto/modulo-samsung-a13-a135/" class="woocommerce-LoopProduct-link">
                <h2 class="woocommerce-loop-product__title">MODULO SAMSUNG A13 A135</h2>
              </a>
              <span class="price">
                <span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&#36;</span>&nbsp;16.500</bdi></span>
              </span>
            </li>
          </ul>
        </body>
      </html>
    `;

    const parts = extractNormalizedParts(
      html,
      row,
      'https://celuphone.com.ar/?s=modulo+redmi+13c&post_type=product&dgwt_wcas=1',
      5,
    );

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      name: 'Modulo Xiaomi Redmi 13C/POCO C65 Negro Original',
      sku: 'REDMI-13C-ORI',
      price: 32990,
      url: 'https://celuphone.com.ar/producto/modulo-xiaomi-redmi-13c-negro-original/',
    });
  });

  it('ignores sku and discount numbers when electrostore exposes a sale product page', () => {
    const row = createSupplierRow({
      name: 'Electrostore',
      searchEndpoint: 'https://electrostore.com.ar/?s={query}&post_type=product',
      searchConfigJson:
        '{"profile":"flatsome","candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/","add-to-cart="],"context_window":1800}',
    });

    const html = `
      <html>
        <head>
          <link rel="canonical" href="https://electrostore.com.ar/producto/modulo-cvt-poco-x6-pro/" />
        </head>
        <body>
          <span class="onsale">SALE 5%</span>
          <h1 class="product_title entry-title">Modulo CVT POCO X6 PRO Original Premium Universal</h1>
          <span class="sku_wrapper">SKU: <span class="sku">3523</span></span>
          <span class="price">
            <del aria-hidden="true"><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&#36;</span>&nbsp;79.750</bdi></span></del>
            <ins aria-hidden="true"><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&#36;</span>&nbsp;75.763</bdi></span></ins>
          </span>
        </body>
      </html>
    `;

    const parts = extractNormalizedParts(
      html,
      row,
      'https://electrostore.com.ar/?s=modulo+poco+x6+pro&post_type=product',
      5,
    );

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      name: 'Modulo CVT POCO X6 PRO Original Premium Universal',
      sku: '3523',
      price: 75763,
      url: 'https://electrostore.com.ar/producto/modulo-cvt-poco-x6-pro/',
    });
  });

  it('filters json suppliers by the requested query before slicing', () => {
    const row = createSupplierRow({
      id: 'sup_json',
      name: 'El Reparador de PC',
      searchMode: 'json',
      searchEndpoint: 'https://api.elreparadordepc.com/api/web/tenant/www?in_stock=false&q={query}',
      searchConfigJson:
        '{"items_path":"productos","name_path":"nombre","sku_path":"sku","price_path":"precio","availability_path":"stock"}',
    });

    const payload = JSON.stringify({
      productos: [
        { id: 1, nombre: 'MOTOROLA G8 - MODULO', sku: 'M-G8', precio: 12000, stock: 10 },
        { id: 2, nombre: 'MODULO SAMSUNG A13 ORIGINAL', sku: 'A13-ORI', precio: 17500, stock: 3 },
        { id: 3, nombre: 'MODULO SAMSUNG A14', sku: 'A14', precio: 18200, stock: 2 },
      ],
    });

    const parts = extractNormalizedParts(
      payload,
      row,
      'https://api.elreparadordepc.com/api/web/tenant/www?in_stock=false&q=modulo+a13',
      1,
    );

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      name: 'MODULO SAMSUNG A13 ORIGINAL',
      sku: 'A13-ORI',
      price: 17500,
    });
  });

  it('returns no results cleanly when a json supplier responds with an empty list', () => {
    const row = createSupplierRow({
      id: 'sup_json_empty',
      name: 'El Reparador de PC',
      searchMode: 'json',
      searchEndpoint: 'https://api.elreparadordepc.com/api/web/tenant/www?in_stock=false&q={query}',
      searchConfigJson:
        '{"items_path":"productos","name_path":"nombre","sku_path":"sku","price_path":"precio","availability_path":"stock"}',
    });

    const parts = extractNormalizedParts(
      JSON.stringify({ productos: [] }),
      row,
      'https://api.elreparadordepc.com/api/web/tenant/www?in_stock=false&q=modulo+a13',
      5,
    );

    expect(parts).toEqual([]);
  });
});
