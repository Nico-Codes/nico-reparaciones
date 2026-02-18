import { useMemo, useState } from 'react';

type TabItem = {
  key: string;
  label: string;
  href: string;
  active: boolean;
  count: number;
};

type Props = {
  title: string;
  subtitle: string;
  createHref: string;
  createLabel: string;
  tabsTitle: string;
  tabs: TabItem[];
};

export default function AdminRepairsHeader({
  title,
  subtitle,
  createHref,
  createLabel,
  tabsTitle,
  tabs,
}: Props) {
  const [tabsOpen, setTabsOpen] = useState(false);
  const hasActiveTab = useMemo(() => tabs.some((tab) => tab.active), [tabs]);

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
      <div className="page-head mb-0">
        <div className="page-title">{title}</div>
        <div className="page-subtitle">{subtitle}</div>
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-zinc-900">{tabsTitle}</div>
          <button
            type="button"
            className="btn-ghost btn-sm h-10"
            aria-expanded={tabsOpen ? 'true' : 'false'}
            onClick={() => setTabsOpen((prev) => !prev)}>
            {tabsOpen ? 'Ocultar estados' : 'Ver estados'}
          </button>
        </div>

        <div className={`mt-2 flex items-center gap-2 overflow-x-auto pb-1 snap-x ${tabsOpen ? '' : 'hidden'}`}>
          {tabs.map((tab) => (
            <a
              key={tab.key}
              href={tab.href}
              className={`nav-pill whitespace-nowrap ${tab.active ? 'nav-pill-active' : ''}`}
              aria-current={tab.active ? 'page' : undefined}>
              <span>{tab.label}</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-black ring-1 ring-zinc-200 bg-white/70 text-zinc-700">
                {tab.count}
              </span>
            </a>
          ))}
        </div>
        {!tabsOpen && hasActiveTab ? (
          <div className="mt-2 text-xs font-semibold text-zinc-500">Filtro activo aplicado.</div>
        ) : null}
      </div>

      <div className="flex w-full gap-2 flex-wrap sm:w-auto">
        <a className="btn-primary h-11 w-full justify-center sm:w-auto" href={createHref}>
          {createLabel}
        </a>
      </div>
    </div>
  );
}

