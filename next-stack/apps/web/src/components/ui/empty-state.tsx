import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  actions,
  icon,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('empty-state', className)} data-reveal>
      <div className="empty-state__icon">{icon ?? <Inbox className="h-5 w-5" />}</div>
      <div className="empty-state__title">{title}</div>
      {description ? <p className="empty-state__description">{description}</p> : null}
      {actions ? <div className="empty-state__actions">{actions}</div> : null}
    </div>
  );
}
