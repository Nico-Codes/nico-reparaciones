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
  items: z.array(
    z.object({
      templateKey: z.string().trim().min(1).max(120),
      body: z.string().max(20000),
      enabled: z.boolean().optional(),
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
      return { message: 'ValidaciÃ³n invÃ¡lida', errors: parsed.error.issues };
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

  @Patch('settings')
  upsertSettings(@Body() body: unknown) {
    const parsed = upsertSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return { message: 'ValidaciÃ³n invÃ¡lida', errors: parsed.error.issues };
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
      return { message: 'ValidaciÃ³n invÃ¡lida', errors: parsed.error.issues };
    }
    return this.adminService.upsertMailTemplates(parsed.data.items);
  }

  @Get('whatsapp-templates')
  whatsappTemplates() {
    return this.adminService.whatsappTemplates();
  }

  @Patch('whatsapp-templates')
  upsertWhatsappTemplates(@Body() body: unknown) {
    const parsed = upsertWhatsappTemplatesSchema.safeParse(body);
    if (!parsed.success) {
      return { message: 'ValidaciÃ³n invÃ¡lida', errors: parsed.error.issues };
    }
    return this.adminService.upsertWhatsappTemplates(parsed.data.items);
  }

  @Get('whatsapp-logs')
  whatsappLogs(@Query('channel') channel?: string, @Query('status') status?: string, @Query('q') q?: string) {
    return this.adminService.whatsappLogs({ channel, status, q });
  }

  @Patch('whatsapp-logs')
  createWhatsappLog(@Body() body: unknown) {
    const parsed = createWhatsappLogSchema.safeParse(body);
    if (!parsed.success) {
      return { message: 'ValidaciÃ³n invÃ¡lida', errors: parsed.error.issues };
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
    if (!parsed.success) return { message: 'ValidaciÃ³n invÃ¡lida', errors: parsed.error.issues };
    return this.adminService.helpFaqCreate(parsed.data);
  }

  @Patch('help-faq/:id')
  helpFaqUpdate(@Param('id') id: string, @Body() body: unknown) {
    const parsed = helpFaqPatchSchema.safeParse(body);
    if (!parsed.success) return { message: 'ValidaciÃ³n invÃ¡lida', errors: parsed.error.issues };
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

