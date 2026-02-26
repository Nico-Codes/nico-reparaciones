import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { DeviceCatalogService } from './device-catalog.service.js';

const brandSchema = z.object({
  deviceTypeId: z.string().trim().max(191).optional().nullable(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  active: z.boolean().optional(),
});
const brandPatchSchema = brandSchema.partial();

const modelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  active: z.boolean().optional(),
});
const modelPatchSchema = modelSchema.partial();

const issueSchema = z.object({
  deviceTypeId: z.string().trim().max(191).optional().nullable(),
  name: z.string().trim().min(2).max(190),
  slug: z.string().trim().min(2).max(190),
  active: z.boolean().optional(),
});
const issuePatchSchema = issueSchema.partial();

@Controller('device-catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DeviceCatalogController {
  constructor(@Inject(DeviceCatalogService) private readonly service: DeviceCatalogService) {}

  @Get('brands')
  brands(@Query('deviceTypeId') deviceTypeId?: string) {
    return this.service.brands(deviceTypeId);
  }

  @Get('models')
  models(@Query('brandId') brandId?: string) {
    return this.service.models(brandId);
  }

  @Get('issues')
  issues(@Query('deviceTypeId') deviceTypeId?: string) {
    return this.service.issues(deviceTypeId);
  }

  @Post('brands')
  async createBrand(@Body() body: unknown) {
    const parsed = brandSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return { item: await this.service.createBrand(parsed.data) };
  }

  @Patch('brands/:id')
  async updateBrand(@Param('id') id: string, @Body() body: unknown) {
    const parsed = brandPatchSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return { item: await this.service.updateBrand(id, parsed.data) };
  }

  @Post('models')
  async createModel(@Body() body: unknown) {
    const parsed = modelSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return { item: await this.service.createModel(parsed.data) };
  }

  @Patch('models/:id')
  async updateModel(@Param('id') id: string, @Body() body: unknown) {
    const parsed = modelPatchSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return { item: await this.service.updateModel(id, parsed.data) };
  }

  @Post('issues')
  async createIssue(@Body() body: unknown) {
    const parsed = issueSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return { item: await this.service.createIssue(parsed.data) };
  }

  @Patch('issues/:id')
  async updateIssue(@Param('id') id: string, @Body() body: unknown) {
    const parsed = issuePatchSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return { item: await this.service.updateIssue(id, parsed.data) };
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
