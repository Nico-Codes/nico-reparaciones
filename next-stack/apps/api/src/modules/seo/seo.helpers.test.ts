import { describe, expect, it } from 'vitest';
import { buildRobotsTxt, buildSitemapXml, escapeXml, normalizePublicBaseUrl } from './seo.helpers.js';

describe('seo helpers', () => {
  it('normalizes public base URL with fallback', () => {
    expect(normalizePublicBaseUrl('https://nico.example.com/')).toBe('https://nico.example.com');
    expect(normalizePublicBaseUrl('')).toBe('http://localhost:5174');
  });

  it('escapes XML entities in sitemap URLs', () => {
    expect(escapeXml('https://site.test/store?category=cables&sort=price_asc')).toBe(
      'https://site.test/store?category=cables&amp;sort=price_asc',
    );
  });

  it('builds robots pointing to the public sitemap', () => {
    expect(buildRobotsTxt('https://nico.example.com')).toContain('Sitemap: https://nico.example.com/sitemap.xml');
  });

  it('builds a valid sitemap document', () => {
    const xml = buildSitemapXml([
      {
        loc: 'https://nico.example.com/store',
        lastmod: new Date('2026-01-01T00:00:00.000Z'),
        changefreq: 'daily',
        priority: 1,
      },
    ]);

    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://nico.example.com/store</loc>');
    expect(xml).toContain('<lastmod>2026-01-01T00:00:00.000Z</lastmod>');
    expect(xml).toContain('<priority>1.0</priority>');
  });
});
