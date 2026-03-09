import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { PageContext } from './page-shell';

export function PageHeader({
  context,
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  context: PageContext;
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('page-header', `page-header--${context}`, className)} data-reveal>
      <div className="page-header__content">
        {eyebrow ? <div className="page-header__eyebrow">{eyebrow}</div> : null}
        <h1 className="page-header__title">{title}</h1>
        {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </section>
  );
}
