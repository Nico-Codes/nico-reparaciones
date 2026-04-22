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
        tone: 'info',
      },
      {
        title: 'Reportes automaticos',
        description: 'Destinatarios, frecuencia y disparo manual de reportes operativos.',
        tag: 'Activo',
        to: '/admin/configuracion/reportes',
        icon: BarChart3,
        tone: 'info',
      },
      {
        title: 'Datos del negocio',
        description: 'Telefono, direccion y horarios compartidos con la web publica.',
        tag: 'Base',
        to: '/admin/configuracion/negocio',
        icon: Building2,
        tone: 'info',
      },
      {
        title: 'Checkout y pagos',
        description: 'Datos de transferencia y presentacion de medios de pago en el checkout.',
        tag: 'Modulo',
        to: '/admin/configuracion/checkoutpagos',
        icon: Landmark,
        tone: 'info',
      },
      {
        title: 'Reglas de calculo',
        description: 'Parametros de productos y reparaciones con calculo automatico.',
        tag: 'Modulo',
        to: '/admin/calculos',
        icon: Calculator,
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
      },
      {
        title: 'Centro de ayuda',
        description: 'Preguntas y respuestas visibles para usuarios y equipo interno.',
        tag: 'Modulo',
        to: '/admin/help',
        icon: HelpCircle,
      },
      {
        title: 'Identidad visual',
        description: 'Logos, favicons, iconos y recursos visuales del sistema.',
        tag: 'Modulo',
        to: '/admin/configuracion/identidadvisual',
        icon: Palette,
      },
      {
        title: 'Portada de tienda',
        description: 'Imagen principal y configuracion visual de la home comercial.',
        tag: 'Modulo',
        to: '/admin/configuracion/portadatienda',
        icon: ImageIcon,
      },
      {
        title: 'Seguridad 2FA',
        description: 'Segundo factor para reforzar el acceso al panel administrativo.',
        tag: 'Seguridad',
        to: '/admin/seguridad/2fa',
        icon: ShieldCheck,
      },
      {
        title: 'Plantillas WhatsApp',
        description: 'Mensajes por estado para reparaciones y seguimiento al cliente.',
        tag: 'Modulo',
        to: '/admin/whatsapp',
        icon: MessageSquare,
      },
      {
        title: 'WhatsApp pedidos',
        description: 'Mensajes por estado para confirmacion y retiro de pedidos.',
        tag: 'Modulo',
        to: '/admin/whatsapppedidos',
        icon: MessageSquare,
      },
    ],
  },
];

export function resolveConfigCardToneClass(tone: 'accent' | 'info') {
  return tone === 'info'
    ? 'border-sky-100 bg-gradient-to-br from-white to-sky-50/75'
    : 'border-indigo-100 bg-gradient-to-br from-white to-indigo-50/75';
}
