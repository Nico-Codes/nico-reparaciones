import { Suspense, type ReactNode } from 'react';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { AppShell } from '@/layouts/AppShell';

function ShellRouteFallback() {
  return (
    <div className="container-page py-8 md:py-10">
      <SectionCard title="Cargando vista" description="Preparando la pantalla.">
        <LoadingBlock lines={4} />
      </SectionCard>
    </div>
  );
}

function StandaloneRouteFallback() {
  return (
    <div className="container-page py-8 md:py-10">
      <SectionCard title="Cargando vista" description="Preparando la pantalla.">
        <LoadingBlock lines={4} />
      </SectionCard>
    </div>
  );
}

export function withShell(element: ReactNode) {
  return <AppShell>{element}</AppShell>;
}

export function withShellSuspense(element: ReactNode) {
  return (
    <AppShell>
      <Suspense fallback={<ShellRouteFallback />}>{element}</Suspense>
    </AppShell>
  );
}

export function withSuspense(element: ReactNode) {
  return <Suspense fallback={<StandaloneRouteFallback />}>{element}</Suspense>;
}
