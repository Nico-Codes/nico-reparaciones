import { BadRequestException, Body, Controller, Get, Inject, Patch, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { AuthService } from '../auth/auth.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { AdminService } from './admin.service.js';
import { z } from 'zod';

const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

const upsertSettingsSchema = z.object({
  items: z.array(
    z.object({
      key: z.string().trim().min(1).max(190),
      value: z.string().optional().nullable(),
      group: z.string().trim().max(120).optional(),
      label: z.string().trim().max(190).optional().nullable(),
      type: z.string().trim().max(40).optional().nullable(),
    }),
  ).min(1).max(200),
});

const upsertMailTemplatesSchema = z.object({
  items: z.array(
    z.object({
      templateKey: z.string().trim().min(1).max(120),
      subject: z.string().max(300),
      body: z.string().max(20000),
      enabled: z.boolean().optional(),
    }),
  ).min(1).max(50),
});

const upsertWhatsappTemplatesSchema = z.object({
  channel: z.enum(['repairs', 'orders']).optional(),
  items: z.array(
    z.object({
      templateKey: z.string().trim().min(1).max(120),
      body: z.string().max(20000),
      enabled: z.boolean().optional(),
      channel: z.enum(['repairs', 'orders']).optional(),
    }),
  ).min(1).max(50),
});

const createWhatsappLogSchema = z.object({
  channel: z.string().trim().max(60).optional(),
  templateKey: z.string().trim().max(120).optional().nullable(),
  targetType: z.string().trim().max(60).optional().nullable(),
  targetId: z.string().trim().max(191).optional().nullable(),
  phone: z.string().trim().max(60).optional().nullable(),
  recipient: z.string().trim().max(190).optional().nullable(),
  status: z.string().trim().max(60).optional(),
  message: z.string().trim().max(4000).optional().nullable(),
  meta: z.record(z.string(), z.any()).optional().nullable(),
});

const helpFaqCreateSchema = z.object({
  question: z.string().trim().min(3).max(500),
  answer: z.string().trim().min(3).max(10000),
  category: z.string().trim().max(120).optional().nullable(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
});

const helpFaqPatchSchema = helpFaqCreateSchema.partial();
const twoFactorCodeSchema = z.object({
  code: z.string().trim().min(6).max(12),
});
const sendWeeklyReportNowSchema = z.object({
  rangeDays: z.union([z.literal(7), z.literal(30), z.literal(90)]).optional(),
});
const smtpTestSchema = z.object({
  email: z.string().trim().email().max(190),
});
const deviceTypeCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  active: z.boolean().optional(),
});
const deviceTypeUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  active: z.boolean().optional(),
});
const modelGroupCreateSchema = z.object({
  deviceBrandId: z.string().trim().min(1).max(191),
  name: z.string().trim().min(2).max(100),
  active: z.boolean().optional(),
});
const modelGroupUpdateSchema = z.object({
  deviceBrandId: z.string().trim().min(1).max(191),
  name: z.string().trim().min(2).max(100).optional(),
  active: z.boolean().optional(),
});
const modelGroupAssignSchema = z.object({
  deviceBrandId: z.string().trim().min(1).max(191),
  deviceModelGroupId: z.string().trim().max(191).optional().nullable(),
});
const providerCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(60).optional().nullable(),
  notes: z.string().trim().max(1500).optional().nullable(),
  searchPriority: z.number().int().min(1).max(99999).optional(),
  searchEnabled: z.boolean().optional(),
  searchMode: z.enum(['json', 'html']).optional(),
  searchEndpoint: z.string().trim().max(500).optional().nullable(),
  searchConfigJson: z.string().max(8000).optional().nullable(),
  active: z.boolean().optional(),
});
const providerUpdateSchema = providerCreateSchema.partial();
const providerReorderSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1).max(191)).min(1).max(500),
});
const providerProbeSchema = z.object({
  q: z.string().trim().min(2).max(120).optional(),
});
const createWarrantyIncidentSchema = z.object({
  sourceType: z.enum(['repair', 'product']),
  title: z.string().trim().min(3).max(120),
  reason: z.string().trim().max(255).optional().nullable(),
  repairId: z.string().trim().max(191).optional().nullable(),
  productId: z.string().trim().max(191).optional().nullable(),
  orderId: z.string().trim().max(191).optional().nullable(),
  supplierId: z.string().trim().max(191).optional().nullable(),
  quantity: z.number().int().min(1).max(999),
  unitCost: z.number().min(0).optional().nullable(),
  costOrigin: z.enum(['manual', 'repair', 'product']).optional(),
  extraCost: z.number().min(0).optional(),
  recoveredAmount: z.number().min(0).optional(),
  happenedAt: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

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
    if (!parsed.success) {
      return { message: 'Validacion invalida', errors: parsed.error.issues };
    }
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
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
    return this.adminService.sendSmtpTestEmail(parsed.data.email);
  }

  @Get('device-types')
  deviceTypes() {
    return this.adminService.deviceTypes();
  }

  @Post('device-types')
  createDeviceType(@Body() body: unknown) {
    const parsed = deviceTypeCreateSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
    return this.adminService.createDeviceType(parsed.data);
  }

  @Patch('device-types/:id')
  updateDeviceType(@Param('id') id: string, @Body() body: unknown) {
    const parsed = deviceTypeUpdateSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
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
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
    return this.adminService.createProvider(parsed.data);
  }

  @Patch('providers/:id')
  updateProvider(@Param('id') id: string, @Body() body: unknown) {
    const parsed = providerUpdateSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
    return this.adminService.updateProvider(id, parsed.data);
  }

  @Post('providers/import-defaults')
  importDefaultProviders() {
    return this.adminService.importDefaultProviders();
  }

  @Post('providers/reorder')
  reorderProviders(@Body() body: unknown) {
    const parsed = providerReorderSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
    return this.adminService.reorderProviders(parsed.data.orderedIds);
  }

  @Post('providers/:id/toggle')
  toggleProvider(@Param('id') id: string) {
    return this.adminService.toggleProvider(id);
  }

  @Post('providers/:id/probe')
  probeProvider(@Param('id') id: string, @Body() body: unknown) {
    const parsed = providerProbeSchema.safeParse(body ?? {});
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
    return this.adminService.probeProvider(id, parsed.data.q ?? '');
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
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
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
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
    return this.adminService.createModelGroup(parsed.data);
  }

  @Patch('model-groups/:id')
  updateModelGroup(@Param('id') id: string, @Body() body: unknown) {
    const parsed = modelGroupUpdateSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
    return this.adminService.updateModelGroup(id, parsed.data);
  }

  @Patch('model-groups/models/:modelId')
  assignModelGroup(@Param('modelId') modelId: string, @Body() body: unknown) {
    const parsed = modelGroupAssignSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
    return this.adminService.assignModelGroup(modelId, parsed.data);
  }

  @Patch('settings')
  upsertSettings(@Body() body: unknown) {
    const parsed = upsertSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return { message: 'Validacion invalida', errors: parsed.error.issues };
    }
    return this.adminService.upsertSettings(parsed.data.items);
  }

  @Post('reports/weekly/send')
  sendWeeklyReportNow(@Body() body: unknown) {
    const parsed = sendWeeklyReportNowSchema.safeParse(body ?? {});
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
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
    if (!parsed.success) {
      return { message: 'Validacion invalida', errors: parsed.error.issues };
    }
    return this.adminService.upsertMailTemplates(parsed.data.items);
  }

  @Get('whatsapp-templates')
  whatsappTemplates(@Query('channel') channel?: string) {
    return this.adminService.whatsappTemplates({ channel });
  }

  @Patch('whatsapp-templates')
  upsertWhatsappTemplates(@Body() body: unknown) {
    const parsed = upsertWhatsappTemplatesSchema.safeParse(body);
    if (!parsed.success) {
      return { message: 'Validacion invalida', errors: parsed.error.issues };
    }
    return this.adminService.upsertWhatsappTemplates(parsed.data);
  }

  @Get('whatsapp-logs')
  whatsappLogs(@Query('channel') channel?: string, @Query('status') status?: string, @Query('q') q?: string) {
    return this.adminService.whatsappLogs({ channel, status, q });
  }

  @Patch('whatsapp-logs')
  createWhatsappLog(@Body() body: unknown) {
    const parsed = createWhatsappLogSchema.safeParse(body);
    if (!parsed.success) {
      return { message: 'Validacion invalida', errors: parsed.error.issues };
    }
    return this.adminService.createWhatsappLog(parsed.data);
  }

  @Get('help-faq')
  helpFaqList(@Query('q') q?: string, @Query('active') active?: string, @Query('category') category?: string) {
    return this.adminService.helpFaqList({ q, active, category });
  }

  @Patch('help-faq')
  helpFaqCreate(@Body() body: unknown) {
    const parsed = helpFaqCreateSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
    return this.adminService.helpFaqCreate(parsed.data);
  }

  @Patch('help-faq/:id')
  helpFaqUpdate(@Param('id') id: string, @Body() body: unknown) {
    const parsed = helpFaqPatchSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
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
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
    return this.authService.enableAdminTwoFactor(user.id, parsed.data.code);
  }

  @Post('security/2fa/disable')
  twoFactorDisable(@CurrentUser() user: AuthenticatedUser | null, @Body() body: unknown) {
    if (!user) throw new BadRequestException('Usuario no autenticado');
    const parsed = z.object({ code: z.string().trim().min(6).max(12).optional() }).safeParse(body ?? {});
    if (!parsed.success) return { message: 'Validacion invalida', errors: parsed.error.issues };
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

