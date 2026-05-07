import { Controller, Get, Header, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SeoService } from './seo.service.js';

@Controller('seo')
@SkipThrottle()
export class SeoController {
  constructor(@Inject(SeoService) private readonly seoService: SeoService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300, must-revalidate')
  sitemap() {
    return this.seoService.sitemapXml();
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300, must-revalidate')
  robots() {
    return this.seoService.robotsTxt();
  }
}
