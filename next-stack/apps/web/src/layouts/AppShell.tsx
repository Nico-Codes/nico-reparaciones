import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, User, Wrench, Store, HelpCircle, LogOut, Settings, Shield } from 'lucide-react';
import { useCartCount } from '@/features/cart/useCart';
import { authStorage } from '@/features/auth/storage';
import type { AuthUser } from '@/features/auth/types';

type AppShellProps = {
  children: ReactNode;
};

function isActiveGroup(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

function NavPill({ to, label, active }: { to: string; label: string; active?: boolean }) {
  return (
    <NavLink
      to={to}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200' : 'text-zinc-700 hover:bg-zinc-100'
      }`}
    >
      {label}
    </NavLink>
  );
}

function AccountMenu({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
          <User className="h-4 w-4" />
        </span>
        <span className="max-w-[120px] truncate">{user.name}</span>
        <span className="text-xs">▼</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            <div className="truncate text-sm font-bold text-zinc-900">{user.name}</div>
            <div className="truncate text-xs text-zinc-500">{user.email}</div>
            <div className="mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold">
              {user.emailVerified ? 'Email verificado' : 'Correo sin verificar'}
            </div>
          </div>

          <div className="my-2 h-px bg-zinc-100" />

          <div className="grid gap-1">
            <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-zinc-100" to="/orders">Mis pedidos</Link>
            <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-zinc-100" to="/repairs">Mis reparaciones</Link>
            <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-zinc-100" to="/help">Ayuda</Link>
            {user.role === 'ADMIN' ? (
              <>
                <div className="my-1 h-px bg-zinc-100" />
                <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-zinc-100" to="/admin">Panel admin</Link>
                <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-zinc-100" to="/admin/repairs">Reparaciones</Link>
                <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-zinc-100" to="/admin/orders">Pedidos</Link>
                <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-zinc-100" to="/admin/settings">Configuración</Link>
              </>
            ) : null}
            <div className="my-1 h-px bg-zinc-100" />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
              onClick={() => {
                onLogout();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const cartCount = useCartCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => authStorage.getUser());

  useEffect(() => {
    const sync = () => setAuthUser(authStorage.getUser());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAuthUser(authStorage.getUser());
  }, [location.pathname]);

  const isAdmin = authUser?.role === 'ADMIN';

  const desktopLinks = useMemo(
    () => [
      { to: '/store', label: 'Tienda', active: isActiveGroup(location.pathname, ['/store']) || location.pathname === '/' },
      { to: '/reparacion', label: 'Reparación', active: isActiveGroup(location.pathname, ['/reparacion', '/repair-lookup']) },
      ...(isAdmin ? [{ to: '/admin', label: 'Admin', active: isActiveGroup(location.pathname, ['/admin']) }] : []),
    ],
    [location.pathname, isAdmin],
  );

  const logout = () => {
    authStorage.clear();
    setAuthUser(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to={isAdmin ? '/admin' : '/store'} className="flex min-w-0 items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-sky-600 shadow-sm">
                <Wrench className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-black leading-none tracking-tight">
                  Nico<span className="text-sky-600">Reparaciones</span>
                </div>
                <div className="hidden truncate text-[11px] leading-none text-zinc-500 sm:block">
                  Servicio Técnico Profesional y Tienda de Electrónica
                </div>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center rounded-full border border-zinc-200 bg-zinc-50 p-1 md:flex">
            {desktopLinks.map((link) => (
              <NavPill key={link.to} to={link.to} label={link.label} active={link.active} />
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100"
              aria-label="Carrito"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1 text-[11px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>

            {authUser ? (
              <AccountMenu user={authUser} onLogout={logout} />
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
                <Link className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100" to="/auth/login">Ingresar</Link>
                <Link className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700" to="/auth/register">Crear cuenta</Link>
              </div>
            )}
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-zinc-200 bg-white md:hidden">
            <div className="mx-auto grid max-w-[1100px] gap-2 px-4 py-3">
              {desktopLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    link.active ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' : 'hover:bg-zinc-100'
                  }`}
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink to="/help" className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-zinc-100">Ayuda</NavLink>
              {authUser ? (
                <>
                  <NavLink to="/orders" className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-zinc-100">Mis pedidos</NavLink>
                  <NavLink to="/repairs" className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-zinc-100">Mis reparaciones</NavLink>
                  {isAdmin ? (
                    <>
                      <div className="mt-1 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                        <div className="mb-1 px-1 text-xs font-black uppercase tracking-wide text-zinc-500">Admin</div>
                        <div className="grid gap-1">
                          <NavLink to="/admin" className="rounded-lg px-2 py-2 text-sm font-semibold hover:bg-white">Panel</NavLink>
                          <NavLink to="/admin/repairs" className="rounded-lg px-2 py-2 text-sm font-semibold hover:bg-white">Reparaciones</NavLink>
                          <NavLink to="/admin/orders" className="rounded-lg px-2 py-2 text-sm font-semibold hover:bg-white">Pedidos</NavLink>
                          <NavLink to="/admin/products" className="rounded-lg px-2 py-2 text-sm font-semibold hover:bg-white">Productos</NavLink>
                          <NavLink to="/admin/settings" className="rounded-lg px-2 py-2 text-sm font-semibold hover:bg-white">Configuración</NavLink>
                        </div>
                      </div>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <div className="grid gap-2 pt-1">
                  <Link className="rounded-xl border border-zinc-200 px-3 py-2 text-center text-sm font-semibold" to="/auth/login">Ingresar</Link>
                  <Link className="rounded-xl bg-sky-600 px-3 py-2 text-center text-sm font-semibold text-white" to="/auth/register">Crear cuenta</Link>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 py-6">{children}</main>

      <footer className="mt-8 border-t border-zinc-100 bg-white">
        <div className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 py-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-sky-600 shadow-sm">
                <Wrench className="h-5 w-5" />
              </div>
              <div className="font-black tracking-tight">Nico<span className="text-sky-600">Reparaciones</span></div>
            </div>
            <p className="mt-2 text-sm text-zinc-500">Tienda simple + consulta de reparaciones.</p>
          </div>

          <div className="text-sm">
            <div className="mb-2 font-black text-zinc-900">Accesos</div>
            <div className="grid gap-1 text-zinc-700">
              <Link to="/store" className="hover:text-zinc-900">Tienda</Link>
              <Link to="/cart" className="hover:text-zinc-900">Carrito</Link>
              <Link to="/reparacion" className="hover:text-zinc-900">Consultar reparación</Link>
            </div>
          </div>

          <div className="text-sm">
            <div className="mb-2 font-black text-zinc-900">Cuenta</div>
            <div className="grid gap-1 text-zinc-700">
              {authUser ? (
                <>
                  <Link to="/orders" className="hover:text-zinc-900">Mis pedidos</Link>
                  <Link to="/repairs" className="hover:text-zinc-900">Mis reparaciones</Link>
                  <Link to="/help" className="hover:text-zinc-900">Ayuda</Link>
                  {isAdmin ? <Link to="/admin" className="hover:text-zinc-900">Panel admin</Link> : null}
                  <button type="button" className="text-left font-bold text-rose-700 hover:text-rose-800" onClick={logout}>
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link to="/help" className="hover:text-zinc-900">Ayuda</Link>
                  <Link to="/auth/login" className="hover:text-zinc-900">Ingresar</Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-2 px-4 pb-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} NicoReparaciones</div>
          <div className="text-zinc-400">Hecho con React + NestJS</div>
        </div>
      </footer>
    </div>
  );
}

