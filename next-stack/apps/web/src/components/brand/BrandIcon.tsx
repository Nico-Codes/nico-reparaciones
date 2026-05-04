import type { ReactNode } from 'react';
import { useStoreBranding } from '@/features/store/branding-cache';
import type { StoreBrandingAssets } from '@/features/store/types';
import { cn } from '@/lib/utils';

const LEGACY_ICON_SLOT_MAP: Record<string, keyof StoreBrandingAssets['icons']> = {
  icon_settings: 'settings',
  icon_carrito: 'carrito',
  icon_logout: 'logout',
  icon_consultar_reparacion: 'consultarReparacion',
  icon_mis_pedidos: 'misPedidos',
  icon_mis_reparaciones: 'misReparaciones',
  icon_dashboard: 'dashboard',
  icon_tienda: 'tienda',
  icon_ayuda: 'ayuda',
  icon_mi_cuenta: 'miCuenta',
  icon_verificar_correo: 'verificarCorreo',
  icon_admin_pedidos: 'adminPedidos',
  icon_admin_reparaciones: 'adminReparaciones',
  icon_admin_venta_rapida: 'adminVentaRapida',
  icon_admin_productos: 'adminProductos',
};

export function resolveBrandIconUrl(branding: StoreBrandingAssets | null, slot: string) {
  const slotUrl = branding?.iconsBySlot?.[slot];
  if (slotUrl) return slotUrl;

  const legacyKey = LEGACY_ICON_SLOT_MAP[slot];
  return legacyKey ? branding?.icons?.[legacyKey] ?? null : null;
}

export function BrandIcon({
  slot,
  fallback,
  className,
  imgClassName,
  alt = '',
}: {
  slot: string;
  fallback: ReactNode;
  className?: string;
  imgClassName?: string;
  alt?: string;
}) {
  const branding = useStoreBranding();
  const url = resolveBrandIconUrl(branding, slot);

  if (url) {
    return <img src={url} alt={alt} className={cn('h-full w-full object-contain', className, imgClassName)} />;
  }

  return <span className={cn('inline-flex items-center justify-center', className)}>{fallback}</span>;
}
