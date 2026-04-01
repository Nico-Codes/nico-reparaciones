import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  ADMIN_SETTINGS_SECTIONS,
  type ConfigCard,
  type ConfigSectionDef,
  resolveConfigCardToneClass,
} from './admin-settings-hub.helpers';

export function AdminSettingsHubLayout() {
  return (
    <PageShell context="admin">
      <PageHeader
        context="admin"
        eyebrow="Configuracion"
        title="Centro de configuracion"
        subtitle="Ajustes operativos, visuales y de comunicacion para todo el sistema."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin">Volver al panel</Link>
          </Button>
        }
      />
      {ADMIN_SETTINGS_SECTIONS.map((section) => (
        <AdminSettingsHubSection key={section.title} section={section} />
      ))}
    </PageShell>
  );
}

function AdminSettingsHubSection({ section }: { section: ConfigSectionDef }) {
  return (
    <SectionCard title={section.title} description={section.description}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {section.cards.map((card) => (
          <AdminSettingsModuleCard key={card.title} card={card} sectionTone={section.tone} />
        ))}
      </div>
    </SectionCard>
  );
}

function AdminSettingsModuleCard({
  card,
  sectionTone,
}: {
  card: ConfigCard;
  sectionTone: 'accent' | 'info';
}) {
  const Icon = card.icon;
  const tone = card.tone ?? sectionTone;
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-100 bg-white text-zinc-700 shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
            <StatusBadge tone={tone === 'info' ? 'info' : 'accent'} size="sm" label={card.tag} />
          </div>
          <div className="text-lg font-extrabold tracking-tight text-zinc-950">{card.title}</div>
          <p className="text-sm leading-6 text-zinc-600">{card.description}</p>
        </div>
      </div>
      <div className="mt-5 text-sm font-bold text-sky-700">Abrir modulo</div>
    </>
  );

  if (!card.to) {
    return (
      <div className={`section-card ${resolveConfigCardToneClass(tone)}`}>
        <div className="section-card__body">{content}</div>
      </div>
    );
  }

  return (
    <Link
      to={card.to}
      className={`section-card block transition duration-150 hover:-translate-y-0.5 hover:border-zinc-200 hover:shadow-[0_20px_40px_-28px_rgba(15,23,42,0.35)] ${resolveConfigCardToneClass(tone)}`}
    >
      <div className="section-card__body">{content}</div>
    </Link>
  );
}
