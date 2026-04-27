import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { cartStorage } from '@/features/cart/storage';
import { storeApi } from './api';
import { canPurchaseStoreProduct, clampStoreProductQuantity, isStoreProductSpecialOrder } from './store-product-detail.helpers';
import {
  StoreProductBreadcrumb,
  StoreProductEmptyState,
  StoreProductHeaderActions,
  StoreProductHelpSection,
  StoreProductLoadingState,
  StoreProductMediaSection,
  StoreProductMetaSection,
  StoreProductPurchaseSection,
} from './store-product-detail.sections';
import type { StoreProduct } from './types';
import { useParams } from 'react-router-dom';

export function StoreProductDetailPage() {
  const { slug = '' } = useParams();
  const [item, setItem] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    storeApi
      .product(slug)
      .then((response) => {
        if (!active) return;
        setItem(response.item);
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Producto no encontrado');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!item) return;
    setQty((current) => clampStoreProductQuantity(current, item.stock, item.fulfillmentMode));
    setSelectedColorId(null);
  }, [item?.id, item?.stock, item?.fulfillmentMode]);

  const canPurchase = canPurchaseStoreProduct(item);
  const maxQty = useMemo(
    () => (item?.fulfillmentMode === 'SPECIAL_ORDER' ? 999 : Math.max(1, item?.stock ?? 1)),
    [item?.fulfillmentMode, item?.stock],
  );

  function addToCart() {
    if (!item || !canPurchase) return;
    if (item.fulfillmentMode === 'SPECIAL_ORDER' && item.hasColorOptions && !selectedColorId) return;
    cartStorage.add(item.id, qty, { productName: item.name, variantId: selectedColorId });
  }

  if (loading) {
    return <StoreProductLoadingState message="Cargando producto" />;
  }

  if (error || !item) {
    return <StoreProductEmptyState message={error || 'Producto no encontrado'} />;
  }

  return (
    <PageShell context="store" className="space-y-5">
      <StoreProductBreadcrumb item={item} />

      <PageHeader
        context="store"
        eyebrow={item.category?.name || 'Producto'}
        title={item.name}
        subtitle={
          isStoreProductSpecialOrder(item)
            ? 'Disponible por encargue con confirmacion contra proveedor y retiro en local.'
            : 'Compra directa con retiro en local y stock validado desde el panel administrativo.'
        }
        actions={<StoreProductHeaderActions item={item} canPurchase={canPurchase} />}
      />

      <div className="commerce-layout commerce-layout--product">
        <StoreProductMediaSection item={item} />

        <div className="commerce-stack commerce-sticky">
          <StoreProductPurchaseSection
            item={item}
            canPurchase={canPurchase}
            qty={qty}
            maxQty={maxQty}
            selectedColorId={selectedColorId}
            onQtyChange={setQty}
            onSelectColor={setSelectedColorId}
            onAddToCart={addToCart}
          />
          <StoreProductMetaSection item={item} canPurchase={canPurchase} />
          <StoreProductHelpSection />
        </div>
      </div>
    </PageShell>
  );
}
