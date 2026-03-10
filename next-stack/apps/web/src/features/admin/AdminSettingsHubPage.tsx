import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  Calculator,
  FileText,
  HelpCircle,
  ImageIcon,
  Mail,
  MessageSquare,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';

type ConfigCard = {
  title: string;
  description: string;
  tag: string;
  to?: string;
  icon: LucideIcon;
  tone?: 'accent' | 'info';
};

const DAILY_CARDS: ConfigCard[] = [
  {
    title: 'Correo SMTP',
    description: 'Estado del correo y prueba de envío inmediata desde el panel.',
    tag: 'Listo',
    to: '/admin/configuracion/mail',
    icon: Mail,
    tone: 'info',
  },
  {
    title: 'Reportes automáticos',
    description: 'Destinatarios, frecuencia y disparo manual de reportes operativos.',
    tag: 'Activo',
    to: '/admin/configuracion/reportes',
    icon: BarChart3,
    tone: 'info',
  },
  {
    title: 'Datos del negocio',
    description: 'Teléfono, dirección y horarios compartidos con la web pública.',
    tag: 'Base',
    to: '/admin/configuracion/negocio',
    icon: Building2,
    tone: 'info',
  },
  {
    title: 'Reglas de cálculo',
    description: 'Parámetros de productos y reparaciones con cálculo automático.',
    tag: 'Módulo',
    to: '/admin/calculos',
    icon: Calculator,
    tone: 'info',
  },
];

const ADVANCED_CARDS: ConfigCard[] = [
  {
    title: 'Plantillas de correo',
    description: 'Verificación, recuperación y confirmaciones editables.',
    tag: 'Predeterminado',
    to: '/admin/mail-templates',
    icon: FileText,
  },
  {
    title: 'Centro de ayuda',
    description: 'Preguntas y respuestas visibles para usuarios y equipo interno.',
    tag: 'Módulo',
    to: '/admin/help',
    icon: HelpCircle,
  },
  {
    title: 'Identidad visual',
    description: 'Logos, favicons, iconos y recursos visuales del sistema.',
    tag: 'Módulo',
    to: '/admin/configuracion/identidadvisual',
    icon: Palette,
  },
  {
    title: 'Portada de tienda',
    description: 'Imagen principal y configuración visual de la home comercial.',
    tag: 'Módulo',
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
    tag: 'Módulo',
    to: '/admin/whatsapp',
    icon: MessageSquare,
  },
  {
    title: 'WhatsApp pedidos',
    description: 'Mensajes por estado para confirmación y retiro de pedidos.',
    tag: 'Módulo',
    to: '/admin/whatsapppedidos',
    icon: MessageSquare,
  },
];

export function AdminSettingsHubPage() {
  return (
    <PageShell context="admin">
      <PageHeader
        context="admin"
        eyebrow="Configuración"
        title="Centro de configuración"
        subtitle="Ajustes operativos, visuales y de comunicación para todo el sistema."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin">Volver al panel</Link>
          </Button>
        }
      />

      <ConfigSection
        title="Operación diaria"
        description="Configuraciones que impactan el funcionamiento diario del negocio."
        cards={DAILY_CARDS}
        tone="info"
      />

      <ConfigSection
        title="Configuración avanzada"
        description="Módulos visuales, seguridad y automatizaciones que complementan la operación."
        cards={ADVANCED_CARDS}
        tone="accent"
      />
    </PageShell>
  );
}

function ConfigSection({
  title,
  description,
  cards,
  tone,
}: {
  title: string;
  description: string;
  cards: ConfigCard[];
  tone: 'accent' | 'info';
}) {
  return (
    <SectionCard title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <ConfigModuleCard key={card.title} card={card} sectionTone={tone} />
        ))}
      </div>
    </SectionCard>
  );
}

function ConfigModuleCard({
  card,
  sectionTone,
}: {
  card: ConfigCard;
  sectionTone: 'accent' | 'info';
}) {
  const Icon = card.icon;
  const tone = card.tone ?? sectionTone;
  const toneClass =
    tone === 'info'
      ? 'border-sky-100 bg-gradient-to-br from-white to-sky-50/75'
      : 'border-indigo-100 bg-gradient-to-br from-white to-indigo-50/75';

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-100 bg-white text-zinc-700 shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
            <StatusBadge
              tone={tone === 'info' ? 'info' : 'accent'}
              size="sm"
              label={card.tag}
            />
          </div>
          <div className="text-lg font-extrabold tracking-tight text-zinc-950">{card.title}</div>
          <p className="text-sm leading-6 text-zinc-600">{card.description}</p>
        </div>
      </div>
      <div className="mt-5 text-sm font-bold text-sky-700">Abrir módulo</div>
    </>
  );

  if (!card.to) {
    return (
      <div className={`section-card ${toneClass}`}>
        <div className="section-card__body">{content}</div>
      </div>
    );
  }

  return (
    <Link
      to={card.to}
      className={`section-card block transition duration-150 hover:-translate-y-0.5 hover:border-zinc-200 hover:shadow-[0_20px_40px_-28px_rgba(15,23,42,0.35)] ${toneClass}`}
    >
      <div className="section-card__body">{content}</div>
    </Link>
  );
}
