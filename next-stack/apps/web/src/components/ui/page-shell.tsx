import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageContext = 'admin' | 'store' | 'account';

export function PageShell({
  context,
  children,
  className,
}: {
  context: PageContext;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('page-shell', `page-shell--${context}`, className)} data-page-context={context}>
      {children}
    </div>
  );
}
