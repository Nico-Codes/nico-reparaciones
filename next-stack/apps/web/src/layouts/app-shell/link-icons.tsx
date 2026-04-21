import { Boxes, HelpCircle, MailCheck, Package, ReceiptText, Settings, ShoppingBag, User, Wrench, WrenchIcon } from 'lucide-react';
import { WarnIcon } from './primitives';

export function renderSidebarNavIcon(label: string) {
  switch (label) {
    case 'Tienda':
      return <Wrench className="h-4 w-4 text-sky-600" />;
    case 'Reparacion':
      return <WrenchIcon className="h-4 w-4 text-zinc-700" />;
    default:
      return <Settings className="h-4 w-4 text-zinc-500" />;
  }
}

export function renderAccountLinkIcon(label: string) {
  switch (label) {
    case 'Mis pedidos':
      return <Package className="h-4 w-4 text-blue-600" />;
    case 'Mis reparaciones':
      return <WrenchIcon className="h-4 w-4 text-zinc-700" />;
    case 'Ayuda':
      return <HelpCircle className="h-4 w-4 text-zinc-700" />;
    case 'Mi cuenta':
      return <User className="h-4 w-4 text-zinc-500" />;
    case 'Verificar correo':
      return <MailCheck className="h-4 w-4 text-amber-700" />;
    default:
      return <WarnIcon />;
  }
}

export function renderAdminLinkIcon(label: string) {
  switch (label) {
    case 'Panel admin':
      return <Settings className="h-4 w-4 text-zinc-500" />;
    case 'Pedidos':
      return <ShoppingBag className="h-4 w-4 text-zinc-500" />;
    case 'Reparaciones':
      return <WrenchIcon className="h-4 w-4 text-zinc-500" />;
    case 'Venta rapida':
      return <ReceiptText className="h-4 w-4 text-zinc-500" />;
    case 'Productos':
      return <Boxes className="h-4 w-4 text-zinc-500" />;
    default:
      return <Wrench className="h-4 w-4 text-zinc-500" />;
  }
}
