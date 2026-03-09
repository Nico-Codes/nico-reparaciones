import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  headerClassName,
  tone = 'default',
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  tone?: 'default' | 'muted' | 'info';
}) {
  return (
    <section className={cn('section-card', `section-card--${tone}`, className)} data-reveal>
      {title || description || actions ? (
        <div className={cn('section-card__header', headerClassName)}>
          <div className="section-card__heading">
            {title ? <h2 className="section-card__title">{title}</h2> : null}
            {description ? <p className="section-card__description">{description}</p> : null}
          </div>
          {actions ? <div className="section-card__actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn('section-card__body', bodyClassName)}>{children}</div>
    </section>
  );
}
