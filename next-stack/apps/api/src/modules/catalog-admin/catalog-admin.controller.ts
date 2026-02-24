import { Body, Controller, Get, Patch, Post, Query, Param, UseGuards } from '@nestjs/common';
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
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().min(0).max(999999).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  sku: z.string().trim().max(120).optional().nullable(),
  barcode: z.string().trim().max(190).optional().nullable(),
  categoryId: z.string().trim().max(191).optional().nullable(),
});
const productPatchSchema = productCreateSchema.partial();

@Controller('catalog-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CatalogAdminController {
  constructor(private readonly service: CatalogAdminService) {}

  @Get('categories')
  categories() {
    return this.service.categories();
  }

  @Post('categories')
  createCategory(@Body() body: unknown) {
    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return this.service.createCategory(parsed.data);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: unknown) {
    const parsed = categoryPatchSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return this.service.updateCategory(id, parsed.data);
  }

  @Get('products')
  products(@Query('q') q?: string, @Query('categoryId') categoryId?: string, @Query('active') active?: string) {
    return this.service.products({ q, categoryId, active });
  }

  @Post('products')
  createProduct(@Body() body: unknown) {
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return this.service.createProduct(parsed.data);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: unknown) {
    const parsed = productPatchSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return this.service.updateProduct(id, parsed.data);
  }
}

