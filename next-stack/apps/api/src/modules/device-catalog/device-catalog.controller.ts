import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { DeviceCatalogService } from './device-catalog.service.js';

const brandSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  active: z.boolean().optional(),
});

const modelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  active: z.boolean().optional(),
});

const issueSchema = z.object({
  name: z.string().trim().min(2).max(190),
  slug: z.string().trim().min(2).max(190),
  active: z.boolean().optional(),
});

@Controller('device-catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DeviceCatalogController {
  constructor(private readonly service: DeviceCatalogService) {}

  @Get('brands')
  brands() {
    return this.service.brands();
  }

  @Get('models')
  models(@Query('brandId') brandId?: string) {
    return this.service.models(brandId);
  }

  @Get('issues')
  issues() {
    return this.service.issues();
  }

  @Post('brands')
  async createBrand(@Body() body: unknown) {
    const parsed = brandSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return { item: await this.service.createBrand(parsed.data) };
  }

  @Post('models')
  async createModel(@Body() body: unknown) {
    const parsed = modelSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return { item: await this.service.createModel(parsed.data) };
  }

  @Post('issues')
  async createIssue(@Body() body: unknown) {
    const parsed = issueSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return { item: await this.service.createIssue(parsed.data) };
  }

  @Delete('brands/:id')
  deleteBrand(@Param('id') id: string) {
    return this.service.deleteBrand(id);
  }

  @Delete('models/:id')
  deleteModel(@Param('id') id: string) {
    return this.service.deleteModel(id);
  }

  @Delete('issues/:id')
  deleteIssue(@Param('id') id: string) {
    return this.service.deleteIssue(id);
  }
}
