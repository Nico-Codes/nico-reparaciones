import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type CartQuoteItemInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

@Injectable()
export class CartService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async quote(items: CartQuoteItemInput[]) {
    if (!Array.isArray(items) || items.length === 0) {
      return { items: [], totals: { subtotal: 0, itemsCount: 0 } };
    }

    const normalized = items
      .map((item) => ({
        productId: String(item.productId ?? '').trim(),
        variantId: String(item.variantId ?? '').trim() || null,
        quantity: Math.max(1, Math.min(999, Number(item.quantity) || 1)),
      }))
      .filter((item) => item.productId)
      .reduce<Array<{ productId: string; variantId: string | null; quantity: number }>>((accumulator, item) => {
        const existing = accumulator.find(
          (entry) => entry.productId === item.productId && entry.variantId === item.variantId,
        );
        if (existing) {
          existing.quantity = Math.min(999, existing.quantity + item.quantity);
          return accumulator;
        }
        accumulator.push({ ...item });
        return accumulator;
      }, []);

    const ids = [...new Set(normalized.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        category: { select: { id: true, name: true, slug: true, active: true } },
        colorVariants: {
          orderBy: [{ active: 'desc' }, { label: 'asc' }],
          select: {
            id: true,
            label: true,
            supplierAvailability: true,
            active: true,
          },
        },
        specialOrderProfile: { select: { id: true, requiresColorVariants: true } },
      },
    });

    const byId = new Map(products.map((product) => [product.id, product]));

    let subtotal = 0;
    let itemsCount = 0;

    const lines = normalized.map((row) => {
      const product = byId.get(row.productId);

      if (!product) {
        return {
          productId: row.productId,
          variantId: row.variantId,
          quantity: row.quantity,
          requestedQuantity: row.quantity,
          valid: false,
          reason: 'Producto no existe',
          name: 'Producto no encontrado',
          selectedColorLabel: null,
          unitPrice: 0,
          lineTotal: 0,
          stockAvailable: 0,
          fulfillmentMode: 'INVENTORY' as const,
          supplierAvailability: 'UNKNOWN' as const,
          active: false,
          category: null,
          colorOptions: [],
          requiresColorSelection: false,
        };
      }

      const categoryActive = product.category ? product.category.active : true;
      const isSpecialOrder = product.fulfillmentMode === 'SPECIAL_ORDER';
      const activeColorOptions = product.colorVariants.filter((variant) => variant.active);
      const requiresColorSelection =
        isSpecialOrder && (product.specialOrderProfile?.requiresColorVariants ?? activeColorOptions.length > 0);
      const selectedVariant = row.variantId
        ? activeColorOptions.find((variant) => variant.id === row.variantId) ?? null
        : null;
      const hasAvailableColor = activeColorOptions.some((variant) => variant.supplierAvailability === 'IN_STOCK');
      const valid = isSpecialOrder
        ? product.active &&
          categoryActive &&
          (
            requiresColorSelection
              ? Boolean(selectedVariant && selectedVariant.supplierAvailability === 'IN_STOCK')
              : product.supplierAvailability !== 'OUT_OF_STOCK'
          )
        : product.active && categoryActive && product.stock > 0;

      const quantity = isSpecialOrder
        ? Math.max(1, Math.min(row.quantity, 999))
        : Math.max(1, Math.min(row.quantity, Math.max(1, product.stock)));
      const unitPrice = Number(product.price);
      const lineTotal = valid ? unitPrice * quantity : 0;

      if (valid) {
        subtotal += lineTotal;
        itemsCount += quantity;
      }

      const reason = !product.active
        ? 'Producto inactivo'
        : !categoryActive
          ? 'Categoria inactiva'
          : isSpecialOrder
            ? requiresColorSelection
              ? !hasAvailableColor
                ? 'No hay colores disponibles en proveedor'
                : !selectedVariant
                  ? 'Selecciona un color disponible'
                  : selectedVariant.supplierAvailability !== 'IN_STOCK'
                    ? 'El color elegido no esta disponible'
                    : null
              : product.supplierAvailability === 'OUT_OF_STOCK'
                ? 'Sin stock en proveedor'
                : null
            : product.stock <= 0
              ? 'Sin stock'
              : null;

      const effectiveSupplierAvailability = requiresColorSelection
        ? hasAvailableColor
          ? 'IN_STOCK'
          : 'OUT_OF_STOCK'
        : product.supplierAvailability;

      return {
        productId: product.id,
        variantId: selectedVariant?.id ?? row.variantId,
        quantity,
        requestedQuantity: row.quantity,
        valid,
        reason,
        name: product.name,
        slug: product.slug,
        selectedColorLabel: selectedVariant?.label ?? null,
        unitPrice,
        lineTotal,
        stockAvailable: isSpecialOrder ? 0 : product.stock,
        fulfillmentMode: product.fulfillmentMode,
        supplierAvailability: effectiveSupplierAvailability,
        active: product.active,
        category: product.category ? { id: product.category.id, name: product.category.name, slug: product.category.slug } : null,
        colorOptions: activeColorOptions.map((variant) => ({
          id: variant.id,
          label: variant.label,
          supplierAvailability: variant.supplierAvailability,
          active: variant.active,
        })),
        requiresColorSelection,
      };
    });

    return {
      items: lines,
      totals: {
        subtotal,
        itemsCount,
      },
    };
  }
}
