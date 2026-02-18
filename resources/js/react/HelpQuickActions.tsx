type HelpQuickActionsProps = {
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export default function HelpQuickActions({
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: HelpQuickActionsProps) {
  return (
    <div className="card">
      <div className="card-body flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-black text-zinc-900">{title}</div>
          <div className="text-sm text-zinc-600">{subtitle}</div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <a href={primaryHref} className="btn-outline h-11 w-full justify-center sm:w-auto">
            {primaryLabel}
          </a>
          <a href={secondaryHref} className="btn-primary h-11 w-full justify-center sm:w-auto">
            {secondaryLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
