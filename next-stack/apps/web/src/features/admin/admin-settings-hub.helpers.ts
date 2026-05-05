import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  Calculator,
  FileText,
  HelpCircle,
  ImageIcon,
  Landmark,
  Mail,
  MessageSquare,
  Palette,
  ShieldCheck,
} from 'lucide-react';

export type ConfigCard = {
  title: string;
  description: string;
  tag: string;
  to?: string;
  icon: LucideIcon;
  iconSlot: string;
  tone?: 'accent' | 'info';
};

export type ConfigSectionDef = {
  title: string;
  description: string;
  tone: 'accent' | 'info';
  cards: ConfigCard[];
};

export const ADMIN_SETTINGS_SECTIONS: ConfigSectionDef[] = [
  {
    title: 'Operacion diaria',
    description: 'Configuraciones que impactan el funcionamiento diario del negocio.',
    tone: 'info',
    cards: [
      {
        title: 'Correo SMTP',
        description: 'Estado del correo y prueba de envio inmediata desde el panel.',
        tag: 'Listo',
        to: '/admin/configuracion/mail',
        icon: Mail,
        iconSlot: 'icon_settings_hub_mail',
        tone: 'info',
      },
      {
        title: 'Reportes automaticos',
        description: 'Destinatarios, frecuencia y disparo manual de reportes operativos.',
        tag: 'Activo',
        to: '/admin/configuracion/reportes',
        icon: BarChart3,
        iconSlot: 'icon_settings_hub_reports',
        tone: 'info',
      },
      {
        title: 'Datos del negocio',
        description: 'Telefono, direccion y horarios compartidos con la web publica.',
        tag: 'Base',
        to: '/admin/configuracion/negocio',
        icon: Building2,
        iconSlot: 'icon_settings_hub_business',
        tone: 'info',
      },
      {
        title: 'Checkout y pagos',
        description: 'Datos de transferencia y presentacion de medios de pago en el checkout.',
        tag: 'Modulo',
        to: '/admin/configuracion/checkoutpagos',
        icon: Landmark,
        iconSlot: 'icon_settings_hub_checkout',
        tone: 'info',
      },
      {
        title: 'Reglas de calculo',
        description: 'Parametros de productos y reparaciones con calculo automatico.',
        tag: 'Modulo',
        to: '/admin/calculos',
        icon: Calculator,
        iconSlot: 'icon_settings_hub_calculations',
        tone: 'info',
      },
    ],
  },
  {
    title: 'Configuracion avanzada',
    description: 'Modulos visuales, seguridad y automatizaciones que complementan la operacion.',
    tone: 'accent',
    cards: [
      {
        title: 'Plantillas de correo',
        description: 'Verificacion, recuperacion y confirmaciones editables.',
        tag: 'Predeterminado',
        to: '/admin/mail-templates',
        icon: FileText,
        iconSlot: 'icon_settings_hub_mail_templates',
      },
      {
        title: 'Centro de ayuda',
        description: 'Preguntas y respuestas visibles para usuarios y equipo interno.',
        tag: 'Modulo',
        to: '/admin/help',
        icon: HelpCircle,
        iconSlot: 'icon_settings_hub_help',
      },
      {
        title: 'Identidad visual',
        description: 'Logos, favicons, iconos y recursos visuales del sistema.',
        tag: 'Modulo',
        to: '/admin/configuracion/identidadvisual',
        icon: Palette,
        iconSlot: 'icon_settings_hub_identity',
      },
      {
        title: 'Portada de tienda',
        description: 'Imagen principal y configuracion visual de la home comercial.',
        tag: 'Modulo',
        to: '/admin/configuracion/portadatienda',
        icon: ImageIcon,
        iconSlot: 'icon_settings_hub_store_hero',
      },
      {
        title: 'Seguridad 2FA',
        description: 'Segundo factor para reforzar el acceso al panel administrativo.',
        tag: 'Seguridad',
        to: '/admin/seguridad/2fa',
        icon: ShieldCheck,
        iconSlot: 'icon_settings_hub_security',
      },
      {
        title: 'Plantillas WhatsApp',
        description: 'Mensajes por estado para reparaciones y seguimiento al cliente.',
        tag: 'Modulo',
        to: '/admin/whatsapp',
        icon: MessageSquare,
        iconSlot: 'icon_settings_hub_whatsapp_repairs',
      },
      {
        title: 'WhatsApp pedidos',
        description: 'Mensajes por estado para confirmacion y retiro de pedidos.',
        tag: 'Modulo',
        to: '/admin/whatsapppedidos',
        icon: MessageSquare,
        iconSlot: 'icon_settings_hub_whatsapp_orders',
      },
    ],
  },
];

export function resolveConfigCardToneClass(tone: 'accent' | 'info') {
  return tone === 'info'
    ? 'border-sky-100 bg-gradient-to-br from-white to-sky-50/75'
    : 'border-indigo-100 bg-gradient-to-br from-white to-indigo-50/75';
}
