import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageContext = 'admin' | 'store' | 'account';

export function PageShell({
  context,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  context: PageContext;
  children: ReactNode;
}) {
  return (
    <div
      className={cn('page-shell', `page-shell--${context}`, className)}
      data-page-context={context}
      {...props}
    >
      {children}
    </div>
  );
}
