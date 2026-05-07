import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreBranding } from '@/features/store/branding-cache';

type SeoHeadProps = {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  type?: 'website' | 'product';
  noindex?: boolean;
};

function upsertMeta(selector: string, createAttrs: Record<string, string>, content: string | null) {
  let node = document.head.querySelector<HTMLMetaElement>(selector);
  if (!content) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement('meta');
    for (const [key, value] of Object.entries(createAttrs)) node.setAttribute(key, value);
    document.head.appendChild(node);
  }
  node.content = content;
}

function upsertCanonical(href: string) {
  let node = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!node) {
    node = document.createElement('link');
    node.rel = 'canonical';
    document.head.appendChild(node);
  }
  node.href = href;
}

function absoluteUrl(pathname: string, search = '') {
  const origin = window.location.origin;
  return `${origin}${pathname}${search}`;
}

export function SeoHead({ title, description, imageUrl, type = 'website', noindex = false }: SeoHeadProps) {
  const location = useLocation();
  const branding = useStoreBranding();

  useEffect(() => {
    const siteTitle = (branding?.siteTitle ?? 'NicoReparaciones').trim() || 'NicoReparaciones';
    const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;
    const canonical = absoluteUrl(location.pathname, location.search);
    const resolvedDescription =
      description?.trim() || 'Tienda y servicio tecnico NicoReparaciones: productos, pedidos y seguimiento de reparaciones.';
    const resolvedImage = imageUrl || branding?.logoPrincipal || null;

    document.title = fullTitle;
    upsertCanonical(canonical);
    upsertMeta('meta[name="description"]', { name: 'description' }, resolvedDescription);
    upsertMeta('meta[name="robots"]', { name: 'robots' }, noindex ? 'noindex,nofollow' : 'index,follow');
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, fullTitle);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, resolvedDescription);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, type);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonical);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, resolvedImage);
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, resolvedImage ? 'summary_large_image' : 'summary');
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, fullTitle);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, resolvedDescription);
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, resolvedImage);
  }, [branding?.logoPrincipal, branding?.siteTitle, description, imageUrl, location.pathname, location.search, noindex, title, type]);

  return null;
}
