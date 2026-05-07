import { Inject, Injectable } from '@nestjs/common';
import { StoreService } from '../store/store.service.js';
import {
  buildAbsolutePublicUrl,
  buildRobotsTxt,
  buildSitemapXml,
  normalizePublicBaseUrl,
  type SeoUrlEntry,
} from './seo.helpers.js';

@Injectable()
export class SeoService {
  constructor(@Inject(StoreService) private readonly storeService: StoreService) {}

  async sitemapXml() {
    const baseUrl = this.publicBaseUrl();
    const [categories, products] = await Promise.all([
      this.storeService.listCategories(),
      this.storeService.listSeoProducts(),
    ]);

    const entries: SeoUrlEntry[] = [
      { loc: buildAbsolutePublicUrl(baseUrl, '/store'), changefreq: 'daily', priority: 1 },
      { loc: buildAbsolutePublicUrl(baseUrl, '/help'), changefreq: 'monthly', priority: 0.4 },
      { loc: buildAbsolutePublicUrl(baseUrl, '/reparacion'), changefreq: 'monthly', priority: 0.5 },
    ];

    for (const category of categories) {
      entries.push({
        loc: buildAbsolutePublicUrl(baseUrl, `/store?category=${encodeURIComponent(category.slug)}`),
        changefreq: 'weekly',
        priority: 0.7,
      });
      for (const child of category.children ?? []) {
        entries.push({
          loc: buildAbsolutePublicUrl(baseUrl, `/store?category=${encodeURIComponent(child.slug)}`),
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
    }

    for (const product of products) {
      entries.push({
        loc: buildAbsolutePublicUrl(baseUrl, `/store/${encodeURIComponent(product.slug)}`),
        lastmod: product.updatedAt,
        changefreq: 'weekly',
        priority: product.featured ? 0.9 : 0.8,
      });
    }

    return buildSitemapXml(entries);
  }

  robotsTxt() {
    return buildRobotsTxt(this.publicBaseUrl());
  }

  private publicBaseUrl() {
    return normalizePublicBaseUrl(process.env.WEB_URL);
  }
}
