import { BadRequestException, Body, Controller, Delete, Get, Inject, Patch, Post, Query, Param, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CatalogAdminService } from './catalog-admin.service.js';

const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  active: z.boolean().optional(),
});
const categoryPatchSchema = categoryCreateSchema.partial();

const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(190),
  slug: z.string().trim().min(2).max(190),
  description: z.string().trim().max(5000).optional().nullable(),
  price: z.number().nonnegative().optional().nullable(),
  costPrice: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().min(0).max(999999).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  sku: z.string().trim().max(120).optional().nullable(),
  barcode: z.string().trim().max(190).optional().nullable(),
  purchaseReference: z.string().trim().max(190).optional().nullable(),
  supplierId: z.string().trim().max(191).optional().nullable(),
  categoryId: z.string().trim().max(191).optional().nullable(),
});
const productPatchSchema = productCreateSchema.partial();

const productPricingSettingsSchema = z.object({
  defaultMarginPercent: z.number().min(0).max(500),
  preventNegativeMargin: z.boolean(),
});

const productPricingRuleSchema = z.object({
  name: z.string().trim().min(2).max(120),
  categoryId: z.string().trim().max(191).optional().nullable(),
  productId: z.string().trim().max(191).optional().nullable(),
  costMin: z.number().int().min(0).optional().nullable(),
  costMax: z.number().int().min(0).optional().nullable(),
  marginPercent: z.number().min(0).max(500),
  priority: z.number().int().min(-9999).max(9999).optional(),
  active: z.boolean().optional(),
});
const productPricingRulePatchSchema = productPricingRuleSchema.partial();

function zodBadRequest(parsed: z.SafeParseError<unknown>) {
  return new BadRequestException({
    message: 'Validacion invalida',
    errors: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
  });
}

@Controller('catalog-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CatalogAdminController {
  constructor(@Inject(CatalogAdminService) private readonly service: CatalogAdminService) {}

  @Get('categories')
  categories() {
    return this.service.categories();
  }

  @Post('categories')
  createCategory(@Body() body: unknown) {
    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.service.createCategory(parsed.data);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: unknown) {
    const parsed = categoryPatchSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.service.updateCategory(id, parsed.data);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  @Get('products')
  products(@Query('q') q?: string, @Query('categoryId') categoryId?: string, @Query('active') active?: string) {
    return this.service.products({ q, categoryId, active });
  }

  @Get('products/:id')
  product(@Param('id') id: string) {
    return this.service.product(id);
  }

  @Post('products')
  createProduct(@Body() body: unknown) {
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.service.createProduct(parsed.data);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: unknown) {
    const parsed = productPatchSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.service.updateProduct(id, parsed.data);
  }

  @Post('products/:id/image')
  @UseInterceptors(FileInterceptor('file'))
  uploadProductImage(
    @Param('id') id: string,
    @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer?: Buffer },
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    return this.service.uploadProductImage(id, file);
  }

  @Delete('products/:id/image')
  removeProductImage(@Param('id') id: string) {
    return this.service.removeProductImage(id);
  }

  @Get('product-pricing/settings')
  productPricingSettings() {
    return this.service.productPricingSettings();
  }

  @Patch('product-pricing/settings')
  updateProductPricingSettings(@Body() body: unknown) {
    const parsed = productPricingSettingsSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.service.updateProductPricingSettings(parsed.data);
  }

  @Get('product-pricing/rules')
  productPricingRules() {
    return this.service.productPricingRules();
  }

  @Post('product-pricing/rules')
  createProductPricingRule(@Body() body: unknown) {
    const parsed = productPricingRuleSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.service.createProductPricingRule(parsed.data);
  }

  @Patch('product-pricing/rules/:id')
  updateProductPricingRule(@Param('id') id: string, @Body() body: unknown) {
    const parsed = productPricingRulePatchSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.service.updateProductPricingRule(id, parsed.data);
  }

  @Delete('product-pricing/rules/:id')
  deleteProductPricingRule(@Param('id') id: string) {
    return this.service.deleteProductPricingRule(id);
  }

  @Get('product-pricing/resolve')
  resolveRecommendedPrice(@Query('categoryId') categoryId?: string, @Query('costPrice') costPrice?: string, @Query('productId') productId?: string) {
    const parsed = z.object({
      categoryId: z.string().trim().min(1).max(191),
      costPrice: z.coerce.number().int().min(0),
      productId: z.string().trim().max(191).optional().nullable(),
    }).safeParse({ categoryId, costPrice, productId });
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.service.resolveRecommendedProductPrice(parsed.data);
  }
}
