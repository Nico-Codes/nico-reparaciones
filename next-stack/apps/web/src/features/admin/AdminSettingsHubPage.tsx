import { Link } from 'react-router-dom';

type ConfigCard = {
  title: string;
  description: string;
  tag: string;
  to?: string;
  icon?: string;
  tone?: 'sky' | 'zinc';
};

const DAILY_CARDS: ConfigCard[] = [
  {
    title: 'Correo SMTP',
    description: 'Estado de mail y prueba de envio al instante.',
    tag: 'Listo',
    to: '/admin/configuracion/mail',
    icon: '⚙',
    tone: 'sky',
  },
  {
    title: 'Reportes automaticos',
    description: 'Destinatarios, dia/hora y envio manual de KPIs.',
    tag: 'Activo',
    to: '/admin/configuracion/reportes',
    icon: '📊',
    tone: 'sky',
  },
  {
    title: 'Datos del negocio',
    description: 'Telefono, direccion y horarios usados por toda la web.',
    tag: 'Basico',
    to: '/admin/configuracion/negocio',
    icon: '⚙',
    tone: 'sky',
  },
  {
    title: 'Reglas de calculo',
    description: 'Productos y reparaciones con calculo automatico editable.',
    tag: 'Modulo',
    to: '/admin/calculos',
    icon: '⚙',
    tone: 'sky',
  },
];

const ADVANCED_CARDS: ConfigCard[] = [
  {
    title: 'Plantillas de correo',
    description: 'Textos de verificacion, recuperacion y confirmacion.',
    tag: 'Por defecto',
    to: '/admin/mail-templates',
    icon: '⚙',
  },
  {
    title: 'Centro de ayuda',
    description: 'Problemas y respuestas editables para usuarios y admin.',
    tag: 'Modulo',
    to: '/admin/help',
    icon: '⚙',
  },
  {
    title: 'Identidad visual',
    description: 'Logos, iconos y recursos visuales editables.',
    tag: 'Modulo',
    to: '/admin/configuracion/identidadvisual',
    icon: '🏛',
  },
  {
    title: 'Portada tienda',
    description: 'Cambia la imagen de fondo principal sin tocar codigo.',
    tag: 'Modulo',
    to: '/admin/configuracion/portadatienda',
    icon: '🏛',
  },
  {
    title: 'Seguridad 2FA',
    description: 'Gestion de segundo factor para acceso admin.',
    tag: 'Modulo',
    to: '/admin/seguridad/2fa',
    icon: '⚙',
  },
  {
    title: 'Plantillas WhatsApp',
    description: 'Mensajes de seguimiento para reparaciones.',
    tag: 'Modulo',
    to: '/admin/whatsapp',
    icon: '📦',
  },
  {
    title: 'WhatsApp pedidos',
    description: 'Mensajes por estado para comunicacion de pedidos.',
    tag: 'Modulo',
    to: '/admin/whatsapppedidos',
    icon: '📦',
  },
];

export function AdminSettingsHubPage() {
  return (
    <div className="store-shell space-y-6">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Configuracion</h1>
            <p className="mt-1 text-sm text-zinc-600">Centro de control para ajustes del sistema.</p>
          </div>
          <Link to="/admin" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Volver al panel</Link>
        </div>
      </section>

      <ConfigSection title="USO DIARIO" cards={DAILY_CARDS} tone="sky" />
      <ConfigSection title="CONFIGURACION AVANZADA" cards={ADVANCED_CARDS} tone="zinc" />
    </div>
  );
}

function ConfigSection({ title, cards, tone }: { title: string; cards: ConfigCard[]; tone: 'sky' | 'zinc' }) {
  return (
    <section className="space-y-3">
      <div className="text-sm font-black uppercase tracking-wide text-zinc-500">{title}</div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <ConfigModuleCard key={card.title} card={card} sectionTone={tone} />
        ))}
      </div>
    </section>
  );
}

function ConfigModuleCard({ card, sectionTone }: { card: ConfigCard; sectionTone: 'sky' | 'zinc' }) {
  const tone = card.tone ?? sectionTone;
  const cardTone = tone === 'sky'
    ? 'border-sky-100 bg-gradient-to-r from-white to-sky-50/70'
    : 'border-zinc-100 bg-white';

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-black tracking-tight text-zinc-900">{card.title}</div>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{card.description}</p>
        </div>
        <div className="text-lg text-zinc-400">{card.icon ?? '⚙'}</div>
      </div>
      <div className="mt-4 space-y-2">
        <span className="inline-flex h-7 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-700">
          {card.tag}
        </span>
        <div className="block text-sm font-black text-sky-700">Abrir modulo</div>
      </div>
    </>
  );

  if (!card.to) {
    return <div className={`card ${cardTone}`}><div className="card-body p-4">{content}</div></div>;
  }

  return (
    <Link to={card.to} className={`card block transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-24px_#0f172a33] ${cardTone}`}>
      <div className="card-body p-4">{content}</div>
    </Link>
  );
}
