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
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="font-black tracking-tight text-zinc-900">
            Nico<span className="text-sky-600">Reparaciones</span> <span className="text-zinc-400">Next</span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900">Inicio</Link>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-black tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-zinc-600">{subtitle}</p> : null}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
