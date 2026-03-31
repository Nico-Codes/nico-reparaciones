import { Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AuthUser } from '@/features/auth/types';

type AppShellFooterProps = {
  authUser: AuthUser | null;
  brandLogoUrl: string | null;
  brandTitle: string;
  isAdmin: boolean;
  onLogout: () => void;
};

export function AppShellFooter({ authUser, brandLogoUrl, brandTitle, isAdmin, onLogout }: AppShellFooterProps) {
  return (
    <footer className="shell-footer mt-8 border-t bg-white">
      <div className="container-page grid gap-6 py-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-sky-600 shadow-sm">
              {brandLogoUrl ? <img src={brandLogoUrl} alt="" className="h-6 w-6 object-contain" /> : <Wrench className="h-5 w-5" />}
            </div>
            <div className="font-black tracking-tight">{brandTitle}</div>
          </div>
          <p className="mt-2 text-sm text-zinc-500">Tienda, seguimiento de reparaciones y panel administrativo en una sola plataforma.</p>
        </div>

        <div className="text-sm">
          <div className="mb-2 font-black text-zinc-900">Accesos</div>
          <div className="grid gap-1 text-zinc-700">
            <Link to="/store" className="hover:text-zinc-900">
              Tienda
            </Link>
            <Link to="/cart" className="hover:text-zinc-900">
              Carrito
            </Link>
            <Link to="/reparacion" className="hover:text-zinc-900">
              Consultar reparacion
            </Link>
          </div>
        </div>

        <div className="text-sm">
          <div className="mb-2 font-black text-zinc-900">Cuenta</div>
          <div className="grid gap-1 text-zinc-700">
            {authUser ? (
              <>
                <Link to="/orders" className="hover:text-zinc-900">
                  Mis pedidos
                </Link>
                <Link to="/repairs" className="hover:text-zinc-900">
                  Mis reparaciones
                </Link>
                <Link to="/help" className="hover:text-zinc-900">
                  Ayuda
                </Link>
                {isAdmin ? (
                  <Link to="/admin" className="hover:text-zinc-900">
                    Panel admin
                  </Link>
                ) : null}
                <button type="button" className="text-left font-bold text-rose-700 hover:text-rose-800" onClick={onLogout}>
                  Cerrar sesion
                </button>
              </>
            ) : (
              <>
                <Link to="/help" className="hover:text-zinc-900">
                  Ayuda
                </Link>
                <Link to="/auth/login" className="hover:text-zinc-900">
                  Ingresar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container-page flex flex-col gap-2 pb-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <div>(c) {new Date().getFullYear()} {brandTitle}</div>
        <div className="text-zinc-400">Hecho con React + NestJS</div>
      </div>
    </footer>
  );
}
