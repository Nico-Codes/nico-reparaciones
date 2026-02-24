import { Body, Controller, Get, Inject, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
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

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

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
      return { message: 'Validación inválida', errors: parsed.error.issues };
    }
    return this.adminService.updateUserRole(id, parsed.data.role, user?.id ?? null);
  }

  @Get('settings')
  settings() {
    return this.adminService.settings();
  }

  @Patch('settings')
  upsertSettings(@Body() body: unknown) {
    const parsed = upsertSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return { message: 'Validación inválida', errors: parsed.error.issues };
    }
    return this.adminService.upsertSettings(parsed.data.items);
  }

  @Get('mail-templates')
  mailTemplates() {
    return this.adminService.mailTemplates();
  }

  @Patch('mail-templates')
  upsertMailTemplates(@Body() body: unknown) {
    const parsed = upsertMailTemplatesSchema.safeParse(body);
    if (!parsed.success) {
      return { message: 'Validación inválida', errors: parsed.error.issues };
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
      return { message: 'Validación inválida', errors: parsed.error.issues };
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
      return { message: 'Validación inválida', errors: parsed.error.issues };
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
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return this.adminService.helpFaqCreate(parsed.data);
  }

  @Patch('help-faq/:id')
  helpFaqUpdate(@Param('id') id: string, @Body() body: unknown) {
    const parsed = helpFaqPatchSchema.safeParse(body);
    if (!parsed.success) return { message: 'Validación inválida', errors: parsed.error.issues };
    return this.adminService.helpFaqUpdate(id, parsed.data);
  }
}
