import { Boxes, HelpCircle, Package, ReceiptText, Settings, ShoppingBag, User, Wrench, WrenchIcon } from 'lucide-react';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { WarnIcon } from './primitives';

export function renderSidebarNavIcon(label: string) {
  switch (label) {
    case 'Tienda':
      return <BrandIcon slot="icon_tienda" className="h-4 w-4 text-sky-600" fallback={<Wrench className="h-4 w-4 text-sky-600" />} />;
    case 'Reparacion':
      return (
        <BrandIcon
          slot="icon_consultar_reparacion"
          className="h-4 w-4 text-zinc-700"
          fallback={<WrenchIcon className="h-4 w-4 text-zinc-700" />}
        />
      );
    default:
      return <BrandIcon slot="icon_settings" className="h-4 w-4 text-zinc-500" fallback={<Settings className="h-4 w-4 text-zinc-500" />} />;
  }
}

export function renderAccountLinkIcon(label: string) {
  switch (label) {
    case 'Mis pedidos':
      return <BrandIcon slot="icon_mis_pedidos" className="h-4 w-4 text-blue-600" fallback={<Package className="h-4 w-4 text-blue-600" />} />;
    case 'Mis reparaciones':
      return (
        <BrandIcon
          slot="icon_mis_reparaciones"
          className="h-4 w-4 text-zinc-700"
          fallback={<WrenchIcon className="h-4 w-4 text-zinc-700" />}
        />
      );
    case 'Ayuda':
      return <BrandIcon slot="icon_ayuda" className="h-4 w-4 text-zinc-700" fallback={<HelpCircle className="h-4 w-4 text-zinc-700" />} />;
    case 'Mi cuenta':
      return <BrandIcon slot="icon_mi_cuenta" className="h-4 w-4 text-zinc-500" fallback={<User className="h-4 w-4 text-zinc-500" />} />;
    case 'Verificar correo':
      return <BrandIcon slot="icon_verificar_correo" className="h-5 w-5 text-amber-700" fallback={<WarnIcon />} />;
    default:
      return <BrandIcon slot="icon_alert" className="h-5 w-5 text-amber-700" fallback={<WarnIcon />} />;
  }
}

export function renderAdminLinkIcon(label: string) {
  switch (label) {
    case 'Panel admin':
      return <BrandIcon slot="icon_dashboard" className="h-4 w-4 text-zinc-500" fallback={<Settings className="h-4 w-4 text-zinc-500" />} />;
    case 'Pedidos':
      return (
        <BrandIcon
          slot="icon_admin_pedidos"
          className="h-4 w-4 text-zinc-500"
          fallback={<ShoppingBag className="h-4 w-4 text-zinc-500" />}
        />
      );
    case 'Reparaciones':
      return (
        <BrandIcon
          slot="icon_admin_reparaciones"
          className="h-4 w-4 text-zinc-500"
          fallback={<WrenchIcon className="h-4 w-4 text-zinc-500" />}
        />
      );
    case 'Venta rapida':
      return (
        <BrandIcon
          slot="icon_admin_venta_rapida"
          className="h-4 w-4 text-zinc-500"
          fallback={<ReceiptText className="h-4 w-4 text-zinc-500" />}
        />
      );
    case 'Productos':
      return (
        <BrandIcon
          slot="icon_admin_productos"
          className="h-4 w-4 text-zinc-500"
          fallback={<Boxes className="h-4 w-4 text-zinc-500" />}
        />
      );
    default:
      return <BrandIcon slot="icon_settings" className="h-4 w-4 text-zinc-500" fallback={<Wrench className="h-4 w-4 text-zinc-500" />} />;
  }
}
