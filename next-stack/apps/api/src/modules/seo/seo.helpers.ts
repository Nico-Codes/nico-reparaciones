export type SeoUrlEntry = {
  loc: string;
  lastmod?: Date | string | null;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: number;
};

export function normalizePublicBaseUrl(value?: string | null) {
  const raw = (value ?? '').trim().replace(/\/+$/, '');
  if (!raw) return 'http://localhost:5174';
  return raw;
}

export function buildAbsolutePublicUrl(baseUrl: string, path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizePublicBaseUrl(baseUrl)}${normalizedPath}`;
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatSitemapDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function buildSitemapXml(entries: SeoUrlEntry[]) {
  const urls = entries
    .map((entry) => {
      const lastmod = formatSitemapDate(entry.lastmod);
      const priority = typeof entry.priority === 'number' ? Math.max(0, Math.min(1, entry.priority)).toFixed(1) : null;

      return [
        '  <url>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
        priority ? `    <priority>${priority}</priority>` : null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildRobotsTxt(baseUrl: string) {
  const publicBaseUrl = normalizePublicBaseUrl(baseUrl);
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /auth',
    'Disallow: /checkout',
    'Disallow: /cart',
    'Disallow: /orders',
    `Sitemap: ${publicBaseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}
