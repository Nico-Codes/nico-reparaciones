import { afterEach, describe, expect, it, vi } from 'vitest';
import { MailService } from './mail.service.js';

function createPrismaMock(settings: Record<string, string> = {}) {
  return {
    appSetting: {
      findMany: vi.fn().mockImplementation(({ where }: { where?: { key?: { in?: string[] } } }) => {
        const keys = where?.key?.in ?? [];
        return Promise.resolve(
          keys
            .filter((key) => settings[key] !== undefined)
            .map((key) => ({ key, value: settings[key] })),
        );
      }),
      findUnique: vi.fn().mockImplementation(({ where }: { where: { key: string } }) => {
        const value = settings[where.key];
        return Promise.resolve(value === undefined ? null : { key: where.key, value });
      }),
    },
  };
}

describe('MailService', () => {
  const originalEnv = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_SECURE: process.env.SMTP_SECURE,
  };

  afterEach(() => {
    vi.restoreAllMocks();
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('renders enabled templates and falls back to simulated delivery without SMTP', async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    const prisma = createPrismaMock({
      business_name: 'Nico Test',
      mail_from_name: 'Equipo Nico',
      mail_from_address: '',
      'mail_template.verify_email.subject': 'Hola {{user_name}} - {{business_name}}',
      'mail_template.verify_email.body': 'Verifica aca: {{verify_url}}',
      'mail_template.verify_email.enabled': '1',
    });
    const service = new MailService(prisma as never);

    await expect(
      service.sendTemplate({
        templateKey: 'verify_email',
        to: 'cliente@example.com',
        vars: { user_name: 'Cliente', verify_url: 'https://site.test/verify' },
      }),
    ).resolves.toMatchObject({
      ok: true,
      simulated: true,
      subject: 'Hola Cliente - Nico Test',
    });
  });

  it('skips disabled templates before trying transport configuration', async () => {
    const prisma = createPrismaMock({
      'mail_template.reset_password.enabled': '0',
    });
    const service = new MailService(prisma as never);

    await expect(
      service.sendTemplate({
        templateKey: 'reset_password',
        to: 'cliente@example.com',
        vars: { user_name: 'Cliente', reset_url: 'https://site.test/reset' },
      }),
    ).resolves.toEqual({ ok: true, skipped: true, reason: 'template_disabled' });
  });

  it('rejects raw text sends without recipients', async () => {
    const service = new MailService(createPrismaMock() as never);

    await expect(service.sendText({ to: [' ', ''], subject: 'Test', text: 'Body' })).resolves.toEqual({
      ok: false,
      skipped: true,
      reason: 'no_recipients',
    });
  });

  it('reports SMTP health issues clearly when configuration is incomplete', async () => {
    process.env.SMTP_HOST = 'smtp.example.test';
    delete process.env.SMTP_PORT;
    const service = new MailService(createPrismaMock({ mail_from_name: 'Nico', mail_from_address: '' }) as never);

    await expect(service.smtpHealth()).resolves.toMatchObject({
      status: 'warning',
      label: 'Incompleto',
      mailer: 'log',
      host: 'smtp.example.test',
      port: null,
      issues: expect.arrayContaining(['Falta SMTP_PORT', 'Falta mail_from_address en configuración']),
    });
  });
});
