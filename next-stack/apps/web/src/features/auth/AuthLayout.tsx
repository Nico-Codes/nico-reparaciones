import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

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
          <Link to="/" className="btn-ghost btn-sm h-9 shrink-0 justify-center px-3">
            Inicio
          </Link>
        </div>
      </div>

      <div className="card rounded-3xl p-5 sm:p-6">
        <div className="mb-5">
          <div className="text-xs font-black uppercase tracking-wide text-sky-700">Cuenta</div>
          <div className="text-lg font-black tracking-tight text-zinc-900">{title}</div>
          <div className="mt-1 text-sm text-zinc-600">Accede con tu cuenta del nuevo stack.</div>
        </div>
        <div>{children}</div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link to="/store" className="btn-ghost h-10 w-full justify-center">Ir a la tienda</Link>
        <Link to="/reparacion" className="btn-ghost h-10 w-full justify-center">Consultar reparación</Link>
      </div>
    </div>
  );
}
