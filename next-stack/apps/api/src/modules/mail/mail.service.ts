import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AppSetting } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import nodemailer from 'nodemailer';

type TemplateKey = 'verify_email' | 'reset_password' | 'order_created';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporterPromise: Promise<any | null> | null = null;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async sendTemplate(input: {
    templateKey: TemplateKey;
    to: string;
    vars: Record<string, string | number | null | undefined>;
  }) {
    const template = await this.loadTemplate(input.templateKey);
    if (!template.enabled) {
      return { ok: true, skipped: true, reason: 'template_disabled' as const };
    }

    const businessName = await this.getSetting('business_name', 'NicoReparaciones');
    const fromName = await this.getSetting('mail_from_name', businessName);
    const fromAddress = await this.getSetting('mail_from_address', '');

    const vars = {
      business_name: businessName,
      ...Object.fromEntries(Object.entries(input.vars).map(([k, v]) => [k, v == null ? '' : String(v)])),
    };

    const subject = this.render(template.subject, vars);
    const text = this.render(template.body, vars);

    const transporter = await this.getTransporter();
    if (!transporter || !fromAddress) {
      // Dev/local fallback: simulate delivery in logs.
      this.logger.log(
        `[MAIL:FALLBACK] template=${input.templateKey} to=${input.to} subject="${subject}" body="${text.slice(0, 300)}"`,
      );
      return {
        ok: true,
        simulated: true,
        subject,
      };
    }

    await transporter.sendMail({
      from: `${fromName} <${fromAddress}>`,
      to: input.to,
      subject,
      text,
    });

    return { ok: true, simulated: false, subject };
  }

  private async loadTemplate(templateKey: TemplateKey) {
    const defaults: Record<TemplateKey, { subject: string; body: string; enabled: boolean }> = {
      verify_email: {
        subject: 'Verifica tu correo en {{business_name}}',
        body: 'Hola {{user_name}},\n\nUsa este enlace para verificar tu correo:\n{{verify_url}}\n',
        enabled: true,
      },
      reset_password: {
        subject: 'Recuperar contraseña en {{business_name}}',
        body: 'Hola {{user_name}},\n\nUsa este enlace para restablecer tu contraseña:\n{{reset_url}}\n',
        enabled: true,
      },
      order_created: {
        subject: 'Recibimos tu pedido {{order_id}}',
        body: 'Hola {{user_name}},\n\nTu pedido {{order_id}} fue recibido.\nTotal: {{order_total}}\n',
        enabled: true,
      },
    };

    const base = `mail_template.${templateKey}`;
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: [`${base}.subject`, `${base}.body`, `${base}.enabled`] } },
    });

    const map = new Map(rows.map((r: AppSetting) => [r.key, r.value ?? '']));
    return {
      subject: map.get(`${base}.subject`) || defaults[templateKey].subject,
      body: map.get(`${base}.body`) || defaults[templateKey].body,
      enabled: (map.get(`${base}.enabled`) || (defaults[templateKey].enabled ? '1' : '0')) !== '0',
    };
  }

  private render(template: string, vars: Record<string, string>) {
    let out = template;
    for (const [key, value] of Object.entries(vars)) {
      out = out.replaceAll(`{{${key}}}`, value);
    }
    return out;
  }

  private async getSetting(key: string, fallback = '') {
    const row = await this.prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? fallback;
  }

  private async getTransporter() {
    if (!this.transporterPromise) {
      this.transporterPromise = this.createTransporter();
    }
    return this.transporterPromise;
  }

  private async createTransporter() {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT || 0);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const secure = (process.env.SMTP_SECURE || '').trim() === '1' || Number(process.env.SMTP_PORT) === 465;

    if (!host || !port) return null;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: pass ?? '' } : undefined,
    });

    try {
      await transporter.verify();
      this.logger.log(`SMTP listo en ${host}:${port}`);
      return transporter;
    } catch (err) {
      this.logger.warn(`SMTP no disponible, usando fallback local: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }
}
