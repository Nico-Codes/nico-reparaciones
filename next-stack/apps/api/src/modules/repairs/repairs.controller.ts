import { BadRequestException, Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { RepairsService } from './repairs.service.js';

const createRepairSchema = z.object({
  customerName: z.string().trim().min(2).max(190),
  customerPhone: z.string().trim().max(60).optional().nullable(),
  deviceTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrandId: z.string().trim().max(191).optional().nullable(),
  deviceModelId: z.string().trim().max(191).optional().nullable(),
  deviceIssueTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrand: z.string().trim().max(120).optional().nullable(),
  deviceModel: z.string().trim().max(120).optional().nullable(),
  issueLabel: z.string().trim().max(190).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  quotedPrice: z.number().nonnegative().optional().nullable(),
  finalPrice: z.number().nonnegative().optional().nullable(),
  userId: z.string().optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.string().min(1),
  finalPrice: z.number().nonnegative().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const updateRepairSchema = z.object({
  customerName: z.string().trim().min(2).max(190).optional(),
  customerPhone: z.string().trim().max(60).optional().nullable(),
  deviceTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrandId: z.string().trim().max(191).optional().nullable(),
  deviceModelId: z.string().trim().max(191).optional().nullable(),
  deviceIssueTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrand: z.string().trim().max(120).optional().nullable(),
  deviceModel: z.string().trim().max(120).optional().nullable(),
  issueLabel: z.string().trim().max(190).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  quotedPrice: z.number().nonnegative().optional().nullable(),
  finalPrice: z.number().nonnegative().optional().nullable(),
  status: z.string().min(1).optional(),
});

const publicLookupSchema = z.object({
  repairId: z.string().trim().min(6).max(191),
  customerPhone: z.string().trim().min(6).max(60),
});

function zodBadRequest(parsed: z.SafeParseError<unknown>) {
  return new BadRequestException({
    message: 'Validacion invalida',
    errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  });
}

@Controller('repairs')
export class RepairsController {
  constructor(@Inject(RepairsService) private readonly repairsService: RepairsService) {}

  @Post('lookup')
  publicLookup(@Body() body: unknown) {
    const parsed = publicLookupSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.publicLookup(parsed.data.repairId, parsed.data.customerPhone);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  myRepairs(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) return { items: [] };
    return this.repairsService.myRepairs(user.id);
  }

  @Get('my/:id')
  @UseGuards(JwtAuthGuard)
  myRepairDetail(@CurrentUser() user: AuthenticatedUser | null, @Param('id') id: string) {
    if (!user) return { item: null };
    return this.repairsService.myRepairDetail(user.id, id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminList(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.repairsService.adminList({ status, q, from, to });
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminStats() {
    return this.repairsService.adminStats();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminDetail(@Param('id') id: string) {
    return this.repairsService.adminDetail(id);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminCreate(@Body() body: unknown) {
    const parsed = createRepairSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.create(parsed.data);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminUpdateStatus(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.adminUpdateStatus(id, parsed.data.status, parsed.data.finalPrice, parsed.data.notes);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminUpdate(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateRepairSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.adminUpdate(id, parsed.data);
  }
}
