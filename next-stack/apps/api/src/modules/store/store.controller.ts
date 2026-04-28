import { Controller, Get, Header, Inject, NotFoundException, Param, Query } from '@nestjs/common';
import { StoreService } from './store.service.js';

@Controller('store')
export class StoreController {
  constructor(@Inject(StoreService) private readonly storeService: StoreService) {}

  @Get('categories')
  async categories() {
    const items = await this.storeService.listCategories();
    return { items };
  }

  @Get('hero')
  @Header('Cache-Control', 'no-store')
  async hero() {
    return this.storeService.getHeroConfig();
  }

  @Get('branding')
  @Header('Cache-Control', 'no-store')
  async branding() {
    return this.storeService.getBrandingAssets();
  }

  @Get('home')
  @Header('Cache-Control', 'no-store')
  async home() {
    return this.storeService.getHome();
  }

  @Get('products')
  async products(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ) {
    const page = pageRaw ? Number(pageRaw) : 1;
    const pageSize = pageSizeRaw ? Number(pageSizeRaw) : 24;
    return this.storeService.listProducts({
      q,
      category,
      sort: this.normalizeSort(sort),
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 24,
    });
  }

  @Get('products/:slug')
  async productDetail(@Param('slug') slug: string) {
    const product = await this.storeService.getProductBySlug(slug);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return { item: product };
  }

  private normalizeSort(sort?: string): 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name_asc' | 'name_desc' | 'stock_desc' {
    if (sort === 'price_asc' || sort === 'price_desc' || sort === 'newest' || sort === 'name_asc' || sort === 'name_desc' || sort === 'stock_desc') return sort;
    return 'relevance';
  }
}
