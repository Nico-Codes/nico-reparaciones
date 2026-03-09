import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FilterBar({
  children,
  actions,
  className,
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('filter-bar', className)} data-reveal>
      <div className="filter-bar__body">{children}</div>
      {actions ? <div className="filter-bar__actions">{actions}</div> : null}
    </section>
  );
}
