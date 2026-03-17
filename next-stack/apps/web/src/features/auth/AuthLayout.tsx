import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';

export function AuthLayout({
  eyebrow = 'Cuenta',
  statusLabel = 'Acceso',
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  statusLabel?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <PageShell context="account" className="min-h-screen px-4 py-4 md:py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          context="account"
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          actions={(
            <>
              <StatusBadge tone="info" label={statusLabel} />
              <Button asChild variant="outline" size="sm">
                <Link to="/store">Ir a la tienda</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/reparacion">Consultar reparación</Link>
              </Button>
            </>
          )}
        />

        <div className="mx-auto w-full max-w-2xl space-y-4">{children}</div>
      </div>
    </PageShell>
  );
}
