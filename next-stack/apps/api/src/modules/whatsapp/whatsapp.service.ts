import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, type WhatsAppLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateAndDispatchLogInput = {
  channel?: string | null;
  templateKey?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  phone?: string | null;
  recipient?: string | null;
  message?: string | null;
  meta?: Record<string, unknown> | null;
};

type CreateManualLogInput = CreateAndDispatchLogInput & {
  provider?: string | null;
  providerStatus?: string | null;
  status?: string | null;
};

type WebhookVerificationResult =
  | { ok: true; challenge: string }
  | { ok: false; error: 'not_configured' | 'invalid_request' | 'forbidden' };

type WebhookStatusEvent = {
  id: string;
  status: string;
  timestamp?: string;
  recipient_id?: string;
  conversation?: unknown;
  pricing?: unknown;
  errors?: unknown;
};

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createAndDispatchLog(input: CreateAndDispatchLogInput) {
    const row = await this.prisma.whatsAppLog.create({
      data: {
        channel: (input.channel ?? '').trim() || 'general',
        templateKey: this.cleanNullable(input.templateKey),
        targetType: this.cleanNullable(input.targetType),
        targetId: this.cleanNullable(input.targetId),
        phone: this.cleanNullable(input.phone),
        recipient: this.cleanNullable(input.recipient),
        provider: 'meta_cloud',
        status: 'PENDING',
        providerStatus: 'pending',
        message: this.cleanNullable(input.message),
        metaJson: input.meta ? JSON.stringify(input.meta) : null,
      },
    });

    const item = await this.dispatchLog(row.id);
    return { item };
  }

  async createManualLog(input: CreateManualLogInput) {
    const now = new Date();
    const row = await this.prisma.whatsAppLog.create({
      data: {
        channel: (input.channel ?? '').trim() || 'general',
        templateKey: this.cleanNullable(input.templateKey),
        targetType: this.cleanNullable(input.targetType),
        targetId: this.cleanNullable(input.targetId),
        phone: this.cleanNullable(input.phone),
        recipient: this.cleanNullable(input.recipient),
        provider: this.cleanNullable(input.provider) ?? 'manual_whatsapp',
        status: this.cleanNullable(input.status) ?? 'MANUAL',
        providerStatus: this.cleanNullable(input.providerStatus) ?? 'manual_opened',
        message: this.cleanNullable(input.message),
        metaJson: input.meta ? JSON.stringify(input.meta) : null,
        lastAttemptAt: now,
      },
    });

    return { item: this.serializeLog(row) };
  }

  isCloudConfigured() {
    return this.getCloudConfig().enabled;
  }

  async dispatchLog(logId: string) {
    const log = await this.prisma.whatsAppLog.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException('WhatsApp log no encontrado');

    const message = this.cleanNullable(log.message);
    const normalizedPhone = this.normalizeRecipientPhone(log.phone);
    const config = this.getCloudConfig();

    const attemptedAt = new Date();
    await this.prisma.whatsAppLog.update({
      where: { id: log.id },
      data: {
        provider: 'meta_cloud',
        lastAttemptAt: attemptedAt,
        errorMessage: null,
      },
    });

    if (!config.enabled) {
      return this.updateLogFailure(log.id, 'WhatsApp Cloud API no configurada.', {
        provider: 'meta_cloud',
        reason: 'cloud_api_not_configured',
      });
    }

    if (!normalizedPhone) {
      return this.updateLogFailure(log.id, 'No hay un telefono valido para enviar WhatsApp.', {
        provider: 'meta_cloud',
        reason: 'missing_or_invalid_phone',
      });
    }

    if (!message) {
      return this.updateLogFailure(log.id, 'No hay mensaje para enviar por WhatsApp.', {
        provider: 'meta_cloud',
        reason: 'missing_message',
      });
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    };

    const requestUrl = `${config.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const rawText = await response.text();
      const parsed = this.parseProviderJson(rawText);
      if (!response.ok) {
        const providerError = this.extractProviderError(parsed, rawText, response.status);
        return this.updateLogFailure(log.id, providerError.message, {
          provider: 'meta_cloud',
          providerStatus: `http_${response.status}`,
          requestUrl,
          responseStatus: response.status,
          responseBody: providerError.payload,
        });
      }

      const remoteMessageId = this.extractRemoteMessageId(parsed);
      const providerStatus = remoteMessageId ? 'accepted' : 'accepted_without_id';
      const now = new Date();
      const successMeta = {
        provider: 'meta_cloud',
        requestUrl,
        to: normalizedPhone,
        responseBody: parsed,
      };
      const updated = await this.updateSuccessfulSend(log, {
        remoteMessageId,
        providerStatus,
        sentAt: now,
        metaPatch: successMeta,
      });
      return this.serializeLog(updated);
    } catch (error) {
      clearTimeout(timeout);
      const messageText = error instanceof Error ? error.message : 'Error desconocido enviando WhatsApp';
      return this.updateLogFailure(log.id, messageText, {
        provider: 'meta_cloud',
        reason: error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network_error',
      });
    }
  }

  verifyWebhook(mode?: string, verifyToken?: string, challenge?: string): WebhookVerificationResult {
    const token = (this.getCloudConfig().verifyToken ?? '').trim();
    if (!token) return { ok: false, error: 'not_configured' };
    if ((mode ?? '').trim() !== 'subscribe' || !(challenge ?? '').trim()) {
      return { ok: false, error: 'invalid_request' };
    }
    if ((verifyToken ?? '').trim() !== token) {
      return { ok: false, error: 'forbidden' };
    }
    return { ok: true, challenge: (challenge ?? '').trim() };
  }

  async handleWebhook(body: unknown) {
    const statuses = this.extractWebhookStatuses(body);
    if (statuses.length === 0) {
      return { ok: true, processed: 0 };
    }

    let processed = 0;
    for (const status of statuses) {
      const log = await this.prisma.whatsAppLog.findUnique({ where: { remoteMessageId: status.id } });
      if (!log) continue;
      processed += 1;
      const normalized = (status.status ?? '').trim().toLowerCase();
      const eventAt = this.parseWebhookTimestamp(status.timestamp) ?? new Date();
      const nextStatus = normalized === 'failed' ? 'FAILED' : 'SENT';
      const nextProviderStatus = normalized || 'unknown';
      const nextErrorMessage = normalized === 'failed' ? this.extractWebhookError(status.errors) : null;
      await this.prisma.whatsAppLog.update({
        where: { id: log.id },
        data: {
          status: nextStatus,
          providerStatus: nextProviderStatus,
          errorMessage: nextErrorMessage,
          sentAt: nextStatus === 'SENT' ? log.sentAt ?? eventAt : log.sentAt,
          failedAt: nextStatus === 'FAILED' ? eventAt : null,
          metaJson: this.stringifyMeta(this.mergeMeta(log.metaJson, {
            provider: 'meta_cloud',
            webhookStatus: {
              id: status.id,
              status: normalized,
              timestamp: status.timestamp ?? null,
              recipientId: status.recipient_id ?? null,
              conversation: status.conversation ?? null,
              pricing: status.pricing ?? null,
              errors: status.errors ?? null,
            },
          })),
        },
      });
    }

    return { ok: true, processed };
  }

  serializeLog(log: WhatsAppLog) {
    return {
      id: log.id,
      channel: log.channel,
      templateKey: log.templateKey,
      targetType: log.targetType,
      targetId: log.targetId,
      phone: log.phone,
      recipient: log.recipient,
      provider: log.provider,
      remoteMessageId: log.remoteMessageId,
      providerStatus: log.providerStatus,
      errorMessage: log.errorMessage,
      status: log.status,
      message: log.message,
      meta: this.parseJson(log.metaJson),
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
      lastAttemptAt: log.lastAttemptAt?.toISOString() ?? null,
      sentAt: log.sentAt?.toISOString() ?? null,
      failedAt: log.failedAt?.toISOString() ?? null,
    };
  }

  private async updateLogFailure(logId: string, errorMessage: string, metaPatch: Record<string, unknown>) {
    const current = await this.prisma.whatsAppLog.findUnique({ where: { id: logId } });
    if (!current) throw new NotFoundException('WhatsApp log no encontrado');
    const updated = await this.prisma.whatsAppLog.update({
      where: { id: logId },
      data: {
        provider: 'meta_cloud',
        status: 'FAILED',
        providerStatus: 'failed',
        errorMessage,
        failedAt: new Date(),
        sentAt: null,
        metaJson: this.stringifyMeta(this.mergeMeta(current.metaJson, metaPatch)),
      },
    });
    this.logger.warn(`WhatsApp FAILED log=${updated.id} target=${updated.targetType ?? 'general'}:${updated.targetId ?? '-'} reason=${errorMessage}`);
    return this.serializeLog(updated);
  }

  private async updateSuccessfulSend(
    log: WhatsAppLog,
    input: {
      remoteMessageId: string | null;
      providerStatus: string;
      sentAt: Date;
      metaPatch: Record<string, unknown>;
    },
  ) {
    try {
      return await this.prisma.whatsAppLog.update({
        where: { id: log.id },
        data: {
          provider: 'meta_cloud',
          remoteMessageId: input.remoteMessageId,
          providerStatus: input.providerStatus,
          status: 'SENT',
          errorMessage: null,
          sentAt: input.sentAt,
          failedAt: null,
          metaJson: this.stringifyMeta(this.mergeMeta(log.metaJson, input.metaPatch)),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        input.remoteMessageId
      ) {
        this.logger.warn(
          `WhatsApp remoteMessageId duplicado (${input.remoteMessageId}) para log=${log.id}. Se guarda SENT sin id remoto.`,
        );
        return await this.prisma.whatsAppLog.update({
          where: { id: log.id },
          data: {
            provider: 'meta_cloud',
            remoteMessageId: null,
            providerStatus: 'accepted_duplicate_id',
            status: 'SENT',
            errorMessage: null,
            sentAt: input.sentAt,
            failedAt: null,
            metaJson: this.stringifyMeta(this.mergeMeta(log.metaJson, {
              ...input.metaPatch,
              duplicateRemoteMessageId: input.remoteMessageId,
            })),
          },
        });
      }
      throw error;
    }
  }

  private getCloudConfig() {
    const enabledRaw = (process.env.WHATSAPP_CLOUD_ENABLED ?? '0').trim();
    const accessToken = (process.env.WHATSAPP_CLOUD_ACCESS_TOKEN ?? '').trim();
    const phoneNumberId = (process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID ?? '').trim();
    const verifyToken = (process.env.WHATSAPP_CLOUD_VERIFY_TOKEN ?? '').trim();
    const apiVersion = (process.env.WHATSAPP_CLOUD_API_VERSION ?? 'v23.0').trim() || 'v23.0';
    const baseUrl = ((process.env.WHATSAPP_CLOUD_BASE_URL ?? 'https://graph.facebook.com').trim() || 'https://graph.facebook.com').replace(/\/+$/, '');
    const enabled = enabledRaw === '1' && accessToken.length > 0 && phoneNumberId.length > 0;
    return {
      enabled,
      accessToken,
      phoneNumberId,
      verifyToken,
      apiVersion,
      baseUrl,
    };
  }

  private normalizeRecipientPhone(value?: string | null) {
    const digits = (value ?? '').replace(/\D+/g, '');
    if (digits.length < 10 || digits.length > 18) return null;
    return digits;
  }

  private parseProviderJson(raw: string) {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return { raw };
    }
  }

  private extractProviderError(parsed: unknown, rawText: string, status: number) {
    if (parsed && typeof parsed === 'object') {
      const root = parsed as { error?: { message?: unknown; error_user_msg?: unknown } };
      const error = root.error;
      const userMessage = typeof error?.error_user_msg === 'string' ? error.error_user_msg.trim() : '';
      const message = typeof error?.message === 'string' ? error.message.trim() : '';
      if (userMessage) return { message: userMessage, payload: parsed };
      if (message) return { message, payload: parsed };
    }
    return {
      message: `Meta Cloud API respondió HTTP ${status}${rawText ? `: ${rawText.slice(0, 240)}` : ''}`,
      payload: parsed,
    };
  }

  private extractRemoteMessageId(parsed: unknown) {
    if (!parsed || typeof parsed !== 'object') return null;
    const root = parsed as { messages?: Array<{ id?: unknown }> };
    const id = root.messages?.[0]?.id;
    return typeof id === 'string' && id.trim() ? id.trim() : null;
  }

  private extractWebhookStatuses(body: unknown): WebhookStatusEvent[] {
    if (!body || typeof body !== 'object') return [];
    const root = body as { entry?: Array<{ changes?: Array<{ value?: { statuses?: unknown[] } }> }> };
    const entries = Array.isArray(root.entry) ? root.entry : [];
    const collected: WebhookStatusEvent[] = [];
    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const statuses = Array.isArray(change?.value?.statuses) ? change.value.statuses : [];
        for (const item of statuses) {
          if (!item || typeof item !== 'object') continue;
          const status = item as WebhookStatusEvent;
          if (typeof status.id !== 'string' || !status.id.trim()) continue;
          if (typeof status.status !== 'string' || !status.status.trim()) continue;
          collected.push(status);
        }
      }
    }
    return collected;
  }

  private parseWebhookTimestamp(value?: string) {
    const seconds = Number.parseInt((value ?? '').trim(), 10);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    return new Date(seconds * 1000);
  }

  private extractWebhookError(errors: unknown) {
    if (!Array.isArray(errors) || errors.length === 0) return 'Meta reportó fallo de entrega';
    const first = errors[0] as { title?: unknown; message?: unknown; code?: unknown };
    const message = typeof first?.message === 'string' ? first.message.trim() : '';
    const title = typeof first?.title === 'string' ? first.title.trim() : '';
    const code = typeof first?.code === 'number' || typeof first?.code === 'string' ? String(first.code) : '';
    if (message && code) return `${message} (code ${code})`;
    if (message) return message;
    if (title && code) return `${title} (code ${code})`;
    if (title) return title;
    return 'Meta reportó fallo de entrega';
  }

  private parseJson(value?: string | null) {
    if (!value) return null;
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return { raw: value };
    }
  }

  private mergeMeta(existingRaw: string | null, patch: Record<string, unknown>) {
    const existing = this.parseJson(existingRaw);
    return {
      ...(existing && typeof existing === 'object' ? existing : {}),
      ...patch,
    };
  }

  private stringifyMeta(value: Record<string, unknown>) {
    return JSON.stringify(value);
  }

  private cleanNullable(value?: string | null) {
    const cleaned = (value ?? '').trim();
    return cleaned || null;
  }
}


