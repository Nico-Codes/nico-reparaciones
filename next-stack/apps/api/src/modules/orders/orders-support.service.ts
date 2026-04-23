import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PublicAssetStorageService, type BufferedUploadFile } from '../../common/storage/public-asset-storage.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ORDER_CHECKOUT_PAYMENT_METHODS, ORDER_WALKIN_EMAIL } from './orders.helpers.js';
import type { CheckoutConfig, CheckoutPaymentMethodKey, SerializableOrder } from './orders.types.js';

@Injectable()
export class OrdersSupportService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PublicAssetStorageService) private readonly assetStorage: PublicAssetStorageService,
  ) {}

  async getCheckoutConfig(): Promise<CheckoutConfig> {
    const keys = [
      'brand_asset.checkout_payment_local.path',
      'brand_asset.checkout_payment_transfer.path',
      'checkout_transfer_title',
      'checkout_transfer_description',
      'checkout_transfer_holder_label',
      'checkout_transfer_holder_value',
      'checkout_transfer_bank_label',
      'checkout_transfer_bank_value',
      'checkout_transfer_alias_label',
      'checkout_transfer_alias_value',
      'checkout_transfer_cvu_label',
      'checkout_transfer_cvu_value',
      'checkout_transfer_tax_id_label',
      'checkout_transfer_tax_id_value',
      'checkout_transfer_extra_label',
      'checkout_transfer_extra_value',
      'checkout_transfer_note',
      'shop_phone',
    ] as const;

    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: [...keys] } },
      select: { key: true, value: true, updatedAt: true },
    });

    const map = new Map(rows.map((row) => [row.key, row.value ?? '']));
    const rowsByKey = new Map(rows.map((row) => [row.key, row]));

    const paymentMethods: CheckoutConfig['paymentMethods'] = [
      this.buildCheckoutPaymentMethod(
        'efectivo',
        ORDER_CHECKOUT_PAYMENT_METHODS.efectivo,
        'Pagas al retirar en el local.',
        map.get('brand_asset.checkout_payment_local.path'),
        rowsByKey.get('brand_asset.checkout_payment_local.path')?.updatedAt,
      ),
      this.buildCheckoutPaymentMethod(
        'transferencia',
        ORDER_CHECKOUT_PAYMENT_METHODS.transferencia,
        'Confirmas el pedido y luego veras los datos para pagar.',
        map.get('brand_asset.checkout_payment_transfer.path'),
        rowsByKey.get('brand_asset.checkout_payment_transfer.path')?.updatedAt,
      ),
    ];

    const fields = [
      this.buildCheckoutTransferField('holder', map.get('checkout_transfer_holder_label'), map.get('checkout_transfer_holder_value'), 'Titular'),
      this.buildCheckoutTransferField('bank', map.get('checkout_transfer_bank_label'), map.get('checkout_transfer_bank_value'), 'Banco'),
      this.buildCheckoutTransferField('alias', map.get('checkout_transfer_alias_label'), map.get('checkout_transfer_alias_value'), 'Alias'),
      this.buildCheckoutTransferField('cvu', map.get('checkout_transfer_cvu_label'), map.get('checkout_transfer_cvu_value'), 'CVU / CBU'),
      this.buildCheckoutTransferField('taxId', map.get('checkout_transfer_tax_id_label'), map.get('checkout_transfer_tax_id_value'), 'CUIT / CUIL'),
      this.buildCheckoutTransferField('extra', map.get('checkout_transfer_extra_label'), map.get('checkout_transfer_extra_value'), 'Referencia'),
    ].filter((item) => item.value.trim().length > 0);

    return {
      paymentMethods,
      transferDetails: {
        title: (map.get('checkout_transfer_title') || 'Datos para transferencia').trim() || 'Datos para transferencia',
        description:
          (map.get('checkout_transfer_description') || 'Si eliges transferencia, usa estos datos y conserva el comprobante para presentarlo al retirar.').trim() ||
          'Si eliges transferencia, usa estos datos y conserva el comprobante para presentarlo al retirar.',
        note:
          (map.get('checkout_transfer_note') || 'Si tienes dudas, contactanos antes de confirmar el pago.').trim() ||
          'Si tienes dudas, contactanos antes de confirmar el pago.',
        fields,
        available: fields.length > 0,
        supportWhatsappPhone: (map.get('shop_phone') || '').trim() || null,
      },
    };
  }

  serializeOrder(order: SerializableOrder) {
    return {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      transferProofUrl: this.assetStorage.toPublicUrl(order.transferProofPath),
      transferProofUploadedAt: order.transferProofUploadedAt?.toISOString() ?? null,
      isQuickSale: order.isQuickSale,
      quickSaleAdminId: order.quickSaleAdminId,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      user: order.user
        ? {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
          }
        : null,
      items: (order.items ?? []).map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.nameSnapshot,
        fulfillmentMode: item.fulfillmentModeSnapshot,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
      })),
    };
  }

  async replaceTransferProof(
    orderId: string,
    currentPath: string | null | undefined,
    file: BufferedUploadFile,
  ) {
    const { ext, buffer } = this.assetStorage.validateUpload(
      file,
      ['png', 'jpg', 'jpeg', 'webp', 'pdf'],
      6144,
    );
    const nextPath = `order-transfer-proofs/${orderId}-${Date.now().toString(36)}.${ext}`;
    await this.assetStorage.writePublicAsset(nextPath, buffer);
    if (currentPath && currentPath !== nextPath) {
      await this.assetStorage.deletePublicAsset(currentPath);
    }
    return nextPath;
  }

  async getOrCreateWalkinUser() {
    const existing = await this.prisma.user.findUnique({
      where: { email: ORDER_WALKIN_EMAIL },
      select: { id: true, name: true, email: true },
    });
    if (existing) return existing;
    return this.prisma.user.create({
      data: {
        name: 'Venta mostrador',
        email: ORDER_WALKIN_EMAIL,
        role: 'USER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, name: true, email: true },
    });
  }

  async decrementProductStockOrThrow(
    tx: Prisma.TransactionClient,
    input: { productId: string; quantity: number; name: string; fulfillmentMode?: 'INVENTORY' | 'SPECIAL_ORDER' },
  ) {
    if (input.fulfillmentMode === 'SPECIAL_ORDER') return;

    const updated = await tx.product.updateMany({
      where: {
        id: input.productId,
        active: true,
        stock: { gte: input.quantity },
      },
      data: {
        stock: { decrement: input.quantity },
      },
    });
    if (updated.count !== 1) {
      throw new BadRequestException(`Stock insuficiente para ${input.name}`);
    }
  }

  async assertQuickSaleMarginGuard(lines: Array<{ productId: string }>) {
    if (!lines.length) return;
    const blockNegative = await this.isNegativeMarginBlocked();
    if (!blockNegative) return;
    const products = await this.prisma.product.findMany({
      where: { id: { in: lines.map((line) => line.productId) } },
      select: { id: true, name: true, costPrice: true, price: true },
    });
    for (const product of products) {
      const costPrice = Number(product.costPrice ?? 0);
      const salePrice = Number(product.price ?? 0);
      if (costPrice > 0 && salePrice < costPrice) {
        throw new BadRequestException(`No se puede confirmar: ${product.name} tiene margen negativo (guard activo).`);
      }
    }
  }

  private async isNegativeMarginBlocked() {
    const keys = ['product_prevent_negative_margin', 'product_pricing.block_negative_margin'];
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    });
    const map = new Map(rows.map((row) => [row.key, (row.value ?? '').trim()]));
    const direct = map.get('product_prevent_negative_margin');
    if (direct) return direct !== '0';
    const legacy = map.get('product_pricing.block_negative_margin');
    if (legacy) return legacy !== '0';
    return true;
  }

  private buildCheckoutPaymentMethod(
    value: CheckoutPaymentMethodKey,
    title: string,
    subtitle: string,
    iconPath?: string | null,
    updatedAt?: Date | null,
  ) {
    const defaultPaths: Record<CheckoutPaymentMethodKey, string> = {
      efectivo: 'icons/payment-local.svg',
      transferencia: 'icons/payment-transfer.svg',
    };

    return {
      value,
      title,
      subtitle,
      iconUrl: this.resolvePublicAssetUrl(iconPath || defaultPaths[value], updatedAt),
    };
  }

  private buildCheckoutTransferField(key: string, labelRaw: string | undefined, valueRaw: string | undefined, fallbackLabel: string) {
    return {
      key,
      label: (labelRaw || fallbackLabel).trim() || fallbackLabel,
      value: (valueRaw || '').trim(),
    };
  }

  private resolvePublicAssetUrl(rawValue?: string | null, updatedAt?: Date | string | null) {
    const raw = (rawValue ?? '').trim();
    if (!raw) return null;

    const normalizedUrl = /^https?:\/\//i.test(raw) ? raw : `/${raw.replace(/^\/+/, '')}`;
    const version = this.buildAssetVersion(updatedAt);
    if (!version) return normalizedUrl;
    return `${normalizedUrl}${normalizedUrl.includes('?') ? '&' : '?'}v=${version}`;
  }

  private buildAssetVersion(updatedAt?: Date | string | null) {
    if (!updatedAt) return null;
    if (updatedAt instanceof Date) return updatedAt.getTime();
    const parsed = Date.parse(updatedAt);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
