import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { zodBadRequest, zodErrorBody } from '../../common/http/zod-bad-request.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { AuthService } from '../auth/auth.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  createWarrantyIncidentSchema,
  createWhatsappLogSchema,
  deviceTypeCreateSchema,
  deviceTypeUpdateSchema,
  helpFaqCreateSchema,
  helpFaqPatchSchema,
  modelGroupAssignSchema,
  modelGroupCreateSchema,
  modelGroupUpdateSchema,
  providerAggregateSearchPartsSchema,
  providerCreateSchema,
  providerProbeSchema,
  providerReorderSchema,
  providerSearchPartsSchema,
  providerUpdateSchema,
  sendWeeklyReportNowSchema,
  smtpTestSchema,
  twoFactorCodeSchema,
  twoFactorDisableSchema,
  updateUserRoleSchema,
  upsertMailTemplatesSchema,
  upsertSettingsSchema,
  upsertWhatsappTemplatesSchema,
} from './admin.schemas.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly adminService: AdminService,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  @Get('ping')
  ping(@CurrentUser() user: AuthenticatedUser | null) {
    return {
      ok: true,
      area: 'admin',
      user,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('users')
  users(@Query('q') q?: string, @Query('role') role?: string) {
    return this.adminService.users({ q, role });
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser | null, @Body() body: unknown) {
    const parsed = updateUserRoleSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.updateUserRole(id, parsed.data.role, user?.id ?? null);
  }

  @Get('settings')
  settings() {
    return this.adminService.settings();
  }

  @Get('smtp/status')
  smtpStatus(@CurrentUser() user: AuthenticatedUser | null) {
    return this.adminService.smtpStatus(user?.email ?? null);
  }

  @Post('smtp/test')
  smtpTest(@Body() body: unknown) {
    const parsed = smtpTestSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.sendSmtpTestEmail(parsed.data.email);
  }

  @Get('device-types')
  deviceTypes() {
    return this.adminService.deviceTypes();
  }

  @Post('device-types')
  createDeviceType(@Body() body: unknown) {
    const parsed = deviceTypeCreateSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.createDeviceType(parsed.data);
  }

  @Patch('device-types/:id')
  updateDeviceType(@Param('id') id: string, @Body() body: unknown) {
    const parsed = deviceTypeUpdateSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.updateDeviceType(id, parsed.data);
  }

  @Get('model-groups')
  modelGroups(@Query('deviceBrandId') deviceBrandId?: string) {
    return this.adminService.modelGroups(deviceBrandId ?? '');
  }

  @Get('providers')
  providers(@Query('q') q?: string, @Query('active') active?: string) {
    return this.adminService.providers({ q, active });
  }

  @Post('providers')
  createProvider(@Body() body: unknown) {
    const parsed = providerCreateSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.createProvider(parsed.data);
  }

  @Patch('providers/:id')
  updateProvider(@Param('id') id: string, @Body() body: unknown) {
    const parsed = providerUpdateSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.updateProvider(id, parsed.data);
  }

  @Post('providers/import-defaults')
  importDefaultProviders() {
    return this.adminService.importDefaultProviders();
  }

  @Post('providers/reorder')
  reorderProviders(@Body() body: unknown) {
    const parsed = providerReorderSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.reorderProviders(parsed.data.orderedIds);
  }

  @Post('providers/:id/toggle')
  toggleProvider(@Param('id') id: string) {
    return this.adminService.toggleProvider(id);
  }

  @Post('providers/:id/probe')
  probeProvider(@Param('id') id: string, @Body() body: unknown) {
    const parsed = providerProbeSchema.safeParse(body ?? {});
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.probeProvider(id, parsed.data.q ?? '');
  }

  @Post('providers/:id/search-parts')
  searchProviderParts(@Param('id') id: string, @Body() body: unknown) {
    const parsed = providerSearchPartsSchema.safeParse(body ?? {});
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.adminService.searchProviderParts(id, parsed.data);
  }

  @Post('providers/search-parts')
  searchPartsAcrossProviders(@Body() body: unknown) {
    const parsed = providerAggregateSearchPartsSchema.safeParse(body ?? {});
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.adminService.searchPartsAcrossProviders(parsed.data);
  }

  @Get('warranties')
  warranties(
    @Query('q') q?: string,
    @Query('sourceType') sourceType?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.warranties({ q, sourceType, status, from, to });
  }

  @Post('warranties')
  createWarranty(@CurrentUser() user: AuthenticatedUser | null, @Body() body: unknown) {
    const parsed = createWarrantyIncidentSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.createWarranty(parsed.data, user?.id ?? null);
  }

  @Patch('warranties/:id/close')
  closeWarranty(@Param('id') id: string) {
    return this.adminService.closeWarranty(id);
  }

  @Get('accounting')
  accounting(
    @Query('q') q?: string,
    @Query('direction') direction?: string,
    @Query('category') category?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.accounting({ q, direction, category, from, to });
  }

  @Post('model-groups')
  createModelGroup(@Body() body: unknown) {
    const parsed = modelGroupCreateSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.createModelGroup(parsed.data);
  }

  @Patch('model-groups/:id')
  updateModelGroup(@Param('id') id: string, @Body() body: unknown) {
    const parsed = modelGroupUpdateSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.updateModelGroup(id, parsed.data);
  }

  @Patch('model-groups/models/:modelId')
  assignModelGroup(@Param('modelId') modelId: string, @Body() body: unknown) {
    const parsed = modelGroupAssignSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.assignModelGroup(modelId, parsed.data);
  }

  @Patch('settings')
  upsertSettings(@Body() body: unknown) {
    const parsed = upsertSettingsSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.upsertSettings(parsed.data.items);
  }

  @Post('reports/weekly/send')
  sendWeeklyReportNow(@Body() body: unknown) {
    const parsed = sendWeeklyReportNowSchema.safeParse(body ?? {});
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.sendWeeklyDashboardReportNow(parsed.data.rangeDays ?? null);
  }

  @Post('reports/operational-alerts/send')
  sendOperationalAlertsNow() {
    return this.adminService.sendOperationalAlertsNow();
  }

  @Get('mail-templates')
  mailTemplates() {
    return this.adminService.mailTemplates();
  }

  @Patch('mail-templates')
  upsertMailTemplates(@Body() body: unknown) {
    const parsed = upsertMailTemplatesSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.upsertMailTemplates(parsed.data.items);
  }

  @Get('whatsapp-templates')
  whatsappTemplates(@Query('channel') channel?: string) {
    return this.adminService.whatsappTemplates({ channel });
  }

  @Patch('whatsapp-templates')
  upsertWhatsappTemplates(@Body() body: unknown) {
    const parsed = upsertWhatsappTemplatesSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.upsertWhatsappTemplates(parsed.data);
  }

  @Get('whatsapp-logs')
  whatsappLogs(@Query('channel') channel?: string, @Query('status') status?: string, @Query('q') q?: string) {
    return this.adminService.whatsappLogs({ channel, status, q });
  }

  @Patch('whatsapp-logs')
  createWhatsappLog(@Body() body: unknown) {
    const parsed = createWhatsappLogSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.createWhatsappLog(parsed.data);
  }

  @Get('help-faq')
  helpFaqList(@Query('q') q?: string, @Query('active') active?: string, @Query('category') category?: string) {
    return this.adminService.helpFaqList({ q, active, category });
  }

  @Post('help-faq')
  helpFaqCreatePost(@Body() body: unknown) {
    const parsed = helpFaqCreateSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.helpFaqCreate(parsed.data);
  }

  @Patch('help-faq')
  helpFaqCreateLegacy(@Body() body: unknown) {
    const parsed = helpFaqCreateSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.helpFaqCreate(parsed.data);
  }

  @Patch('help-faq/:id')
  helpFaqUpdate(@Param('id') id: string, @Body() body: unknown) {
    const parsed = helpFaqPatchSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.adminService.helpFaqUpdate(id, parsed.data);
  }

  @Get('security/2fa')
  twoFactorStatus(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) throw new BadRequestException('Usuario no autenticado');
    return this.authService.getAdminTwoFactorStatus(user.id);
  }

  @Post('security/2fa/generate')
  twoFactorGenerate(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) throw new BadRequestException('Usuario no autenticado');
    return this.authService.generateAdminTwoFactorSecret(user.id);
  }

  @Post('security/2fa/enable')
  twoFactorEnable(@CurrentUser() user: AuthenticatedUser | null, @Body() body: unknown) {
    if (!user) throw new BadRequestException('Usuario no autenticado');
    const parsed = twoFactorCodeSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
    return this.authService.enableAdminTwoFactor(user.id, parsed.data.code);
  }

  @Post('security/2fa/disable')
  twoFactorDisable(@CurrentUser() user: AuthenticatedUser | null, @Body() body: unknown) {
    if (!user) throw new BadRequestException('Usuario no autenticado');
    const parsed = twoFactorDisableSchema.safeParse(body ?? {});
    if (!parsed.success) return zodErrorBody(parsed);
    return this.authService.disableAdminTwoFactor(user.id, parsed.data.code ?? null);
  }

  @Post('brand-assets/upload/:slot')
  @UseInterceptors(FileInterceptor('file'))
  uploadBrandAsset(
    @Param('slot') slot: string,
    @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer?: Buffer },
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    return this.adminService.uploadBrandAsset(slot, file);
  }

  @Patch('brand-assets/reset/:slot')
  resetBrandAsset(@Param('slot') slot: string) {
    return this.adminService.resetBrandAsset(slot);
  }
}
