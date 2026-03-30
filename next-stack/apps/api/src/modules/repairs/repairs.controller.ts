import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { zodBadRequest } from '../../common/http/zod-bad-request.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  createRepairSchema,
  publicLookupSchema,
  publicQuoteTokenSchema,
  updateRepairSchema,
  updateStatusSchema,
} from './repairs.schemas.js';
import { RepairsService } from './repairs.service.js';

@Controller('repairs')
export class RepairsController {
  constructor(@Inject(RepairsService) private readonly repairsService: RepairsService) {}

  @Post('lookup')
  publicLookup(@Body() body: unknown) {
    const parsed = publicLookupSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.publicLookup(parsed.data.repairId, parsed.data.customerPhone);
  }

  @Get(':id/quote-approval')
  publicQuoteApproval(@Param('id') id: string, @Query() query: unknown) {
    const parsed = publicQuoteTokenSchema.safeParse(query);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.publicQuoteApproval(id, parsed.data.token);
  }

  @Post(':id/quote-approval/approve')
  publicQuoteApprove(@Param('id') id: string, @Body() body: unknown) {
    const parsed = publicQuoteTokenSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.publicQuoteApprove(id, parsed.data.token);
  }

  @Post(':id/quote-approval/reject')
  publicQuoteReject(@Param('id') id: string, @Body() body: unknown) {
    const parsed = publicQuoteTokenSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.publicQuoteReject(id, parsed.data.token);
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
