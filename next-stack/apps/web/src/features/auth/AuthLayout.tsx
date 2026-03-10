import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="store-shell mx-auto w-full max-w-md px-4">
      <div className="store-hero mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-zinc-900">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-zinc-600">{subtitle}</p> : null}
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Inicio</Link>
          </Button>
        </div>
      </div>

      <div className="card rounded-3xl p-5 sm:p-6">
        <div className="mb-5">
          <div className="text-xs font-black uppercase tracking-wide text-sky-700">Cuenta</div>
          <div className="text-lg font-black tracking-tight text-zinc-900">{title}</div>
          <div className="mt-1 text-sm text-zinc-600">Accedé con tu cuenta del sistema actual.</div>
        </div>
        <div>{children}</div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button asChild variant="ghost" className="w-full justify-center">
          <Link to="/store">Ir a la tienda</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full justify-center">
          <Link to="/reparacion">Consultar reparación</Link>
        </Button>
      </div>
    </div>
  );
}
