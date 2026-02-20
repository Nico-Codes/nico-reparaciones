import { useEffect, useMemo, useRef, useState } from 'react';
import { lockScroll, unlockScroll } from '../shared/scrollLock';

type LinkItem = {
  label: string;
  href: string;
  active?: boolean;
  icon?: string | null;
  highlight?: 'warning' | null;
  badgeCount?: number;
};

type ShellHeaderData = {
  brandHref: string;
  logoUrl: string;
  isAuth: boolean;
  isAdmin: boolean;
  emailUnverified: boolean;
  emailStatusText: string;
  userName: string;
  userEmail: string;
  userInitial: string;
  cartCount: number;
  urls: {
    cart: string | null;
    login: string | null;
    register: string | null;
    logout: string | null;
    verificationNotice: string | null;
  };
  desktopLinks: LinkItem[];
  accountLinks: LinkItem[];
  adminLinks: LinkItem[];
  sidebarNavLinks: LinkItem[];
  sidebarAccountLinks: LinkItem[];
  csrfToken: string;
};

type Props = {
  data: ShellHeaderData;
};

function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

function LinkBadge({ count }: { count?: number }) {
  if (!count || count <= 0) return null;
  const safeCount = count > 99 ? '99+' : String(count);
  return (
    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-sky-600 px-1.5 text-[10px] font-black leading-none text-white">
      {safeCount}
    </span>
  );
}

export default function ShellHeader({ data }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sidebarAdminOpen, setSidebarAdminOpen] = useState(data.isAdmin && data.adminLinks.some((link) => link.active));

  const accountRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuId = 'account-menu';
  const accountButtonId = 'account-menu-button';

  const hasAdminLinks = data.isAdmin && data.adminLinks.length > 0;

  const emailBadgeClass = data.emailUnverified
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  const desktopLinks = useMemo(() => data.desktopLinks.filter((link) => !!link.href), [data.desktopLinks]);

  useEffect(() => {
    if (sidebarOpen) lockScroll('sidebar');
    else unlockScroll('sidebar');

    return () => unlockScroll('sidebar');
  }, [sidebarOpen]);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setAccountOpen(false);
      setSidebarOpen(false);
      accountButtonRef.current?.focus();
    };

    const onClickOutside = (event: MouseEvent) => {
      if (!accountOpen || !accountRef.current) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('keydown', onEsc);
    document.addEventListener('mousedown', onClickOutside);

    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [accountOpen]);

  const openAccountMenu = () => setAccountOpen(true);
  const closeAccountMenu = () => setAccountOpen(false);
  const closeAccountMenuWithFocus = () => {
    setAccountOpen(false);
    accountButtonRef.current?.focus();
  };
  const toggleAccountMenu = () => setAccountOpen((prev) => !prev);

  const accountMenuItems = () => {
    if (!accountMenuRef.current) return [] as HTMLElement[];
    return Array.from(accountMenuRef.current.querySelectorAll<HTMLElement>('[data-account-menu-item]'));
  };

  const focusAccountItem = (index: number) => {
    const items = accountMenuItems();
    if (!items.length) return;
    const safeIndex = Math.max(0, Math.min(index, items.length - 1));
    items[safeIndex]?.focus();
  };

  const focusFirstAccountItem = () => focusAccountItem(0);

  return (
    <header className="sticky top-0 z-[80] bg-white border-b border-zinc-200 shadow-sm md:bg-white/90 md:backdrop-blur">
      <div className="container-page">
        <div className="h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="icon-btn md:hidden"
              aria-label="Abrir menu"
              aria-expanded={sidebarOpen ? 'true' : 'false'}
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <a href={data.brandHref} className="flex items-center gap-2 min-w-0">
              <img src={data.logoUrl} className="h-9 w-9 object-contain" alt="NicoReparaciones" />
              <div className="leading-tight min-w-0">
                <div className="hidden sm:block font-black tracking-tight text-zinc-900 truncate">
                  Nico<span className="text-sky-600">Reparaciones</span>
                </div>
                <div className="sm:hidden font-black tracking-tight leading-none flex flex-col gap-0">
                  <span className="text-[13px] text-zinc-900 leading-none block">Nico</span>
                  <span className="text-[13px] text-sky-600 leading-none block">Reparaciones</span>
                </div>
                <div className="hidden sm:block text-[11px] text-zinc-500 -mt-0.5 truncate">Servicio Tecnico Profesional y Tienda de Electronica</div>
              </div>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-1 rounded-full bg-zinc-100/80 p-1 ring-1 ring-zinc-200">
            {desktopLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold transition ${
                  link.active
                    ? 'bg-white text-sky-700 shadow-sm ring-1 ring-sky-200'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-white/70'
                }`}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {data.emailUnverified && data.urls.verificationNotice ? (
              <>
                <a href={data.urls.verificationNotice} className="hidden sm:inline-flex h-9 items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-800 transition hover:bg-amber-100" aria-label="Correo sin verificar">
                  Correo sin verificar
                </a>
                <a href={data.urls.verificationNotice} className="icon-btn sm:hidden text-amber-700" aria-label="Correo sin verificar" title="Correo sin verificar">
                  <WarnIcon />
                </a>
              </>
            ) : null}

            {data.urls.cart ? (
              <a href={data.urls.cart} className="relative inline-flex items-center justify-center bg-transparent border-0 p-0 rounded-none hover:bg-transparent text-zinc-800 hover:text-sky-700 transition-colors mr-2" aria-label="Carrito">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" aria-hidden="true">
                  <path d="M4.00488 16V4H2.00488V2H5.00488C5.55717 2 6.00488 2.44772 6.00488 3V15H18.4433L20.4433 7H8.00488V5H21.7241C22.2764 5 22.7241 5.44772 22.7241 6C22.7241 6.08176 22.7141 6.16322 22.6942 6.24254L20.1942 16.2425C20.083 16.6877 19.683 17 19.2241 17H5.00488C4.4526 17 4.00488 16.5523 4.00488 16ZM6.00488 23C4.90031 23 4.00488 22.1046 4.00488 21C4.00488 19.8954 4.90031 19 6.00488 19C7.10945 19 8.00488 19.8954 8.00488 21C8.00488 22.1046 7.10945 23 6.00488 23ZM18.0049 23C16.9003 23 16.0049 22.1046 16.0049 21C16.0049 19.8954 16.9003 19 18.0049 19C19.1095 19 20.0049 19.8954 20.0049 21C20.0049 22.1046 19.1095 23 18.0049 23Z" />
                </svg>
                {data.cartCount > 0 ? (
                  <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-sky-600 text-white text-[10px] leading-4 font-black flex items-center justify-center ring-2 ring-white">
                    {data.cartCount}
                  </span>
                ) : null}
              </a>
            ) : null}

            {!data.isAuth && data.urls.login ? (
              <>
                <a href={data.urls.login} className="btn-outline hidden sm:inline-flex">Ingresar</a>
                <a href={data.urls.login} className="btn-primary sm:hidden">Ingresar</a>
              </>
            ) : null}

            {data.isAuth ? (
              <div
                className="relative"
                ref={accountRef}
                onMouseEnter={openAccountMenu}
                onMouseLeave={closeAccountMenu}>
                <button
                  id={accountButtonId}
                  ref={accountButtonRef}
                  className="btn-ghost px-3 py-2"
                  aria-expanded={accountOpen ? 'true' : 'false'}
                  aria-haspopup="menu"
                  aria-controls={accountMenuId}
                  aria-label="Abrir menu de cuenta"
                  type="button"
                  onClick={toggleAccountMenu}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setAccountOpen(true);
                      window.setTimeout(() => focusFirstAccountItem(), 0);
                    }
                  }}>
                  <span className="sm:hidden">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span className="hidden sm:inline max-w-[12rem] truncate">{data.userName || 'Cuenta'}</span>
                  <span className="hidden sm:inline">▼</span>
                </button>
                <div className="absolute right-0 top-full h-2 w-64" aria-hidden="true" />

                <div
                  id={accountMenuId}
                  ref={accountMenuRef}
                  role="menu"
                  aria-labelledby={accountButtonId}
                  className={`dropdown-menu top-full ${accountOpen ? 'is-open' : 'hidden'}`}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      closeAccountMenuWithFocus();
                      return;
                    }

                    const items = accountMenuItems();
                    if (!items.length) return;

                    const currentIndex = items.findIndex((item) => item === document.activeElement);

                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % items.length : 0;
                      focusAccountItem(nextIndex);
                      return;
                    }

                    if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      const prevIndex = currentIndex >= 0 ? (currentIndex - 1 + items.length) % items.length : items.length - 1;
                      focusAccountItem(prevIndex);
                      return;
                    }

                    if (event.key === 'Home') {
                      event.preventDefault();
                      focusAccountItem(0);
                      return;
                    }

                    if (event.key === 'End') {
                      event.preventDefault();
                      focusAccountItem(items.length - 1);
                    }
                  }}
                  style={{ overflow: 'visible', maxHeight: 'none' }}>
                  <div className="px-3 py-2">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Estado de correo</div>
                    <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${emailBadgeClass}`}>
                      {data.emailStatusText}
                    </span>
                  </div>

                  <div className="my-2 border-t border-zinc-200" />

                  {data.accountLinks.map((link) => (
                    <a
                      key={link.label}
                      role="menuitem"
                      data-account-menu-item
                      className={`dropdown-item ${
                        link.active ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100' : ''
                      } ${link.highlight === 'warning' ? 'text-amber-700' : ''}`}
                      href={link.href}
                      onClick={() => setAccountOpen(false)}>
                      <span className="inline-flex items-center gap-2">
                        {link.icon ? <img src={link.icon} alt="" className="w-5 h-5" loading="lazy" decoding="async" /> : <WarnIcon />}
                        <span>{link.label}</span>
                      </span>
                    </a>
                  ))}

                  {data.urls.logout ? (
                    <>
                      <div className="my-2 border-t border-zinc-200" />
                      <form method="POST" action={data.urls.logout}>
                        <input type="hidden" name="_token" value={data.csrfToken} />
                        <button
                          type="submit"
                          role="menuitem"
                          data-account-menu-item
                          className="dropdown-item text-rose-700"
                          onClick={() => setAccountOpen(false)}>
                          Cerrar sesion
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[90] bg-zinc-950/40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
      />

      <aside
          className={`fixed left-0 top-0 z-[100] h-full w-[86%] max-w-xs transform bg-white shadow-xl transition-transform duration-200 ease-out md:hidden flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu">
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <img src={data.logoUrl} className="h-8 w-8 rounded-xl ring-1 ring-zinc-100 bg-white object-contain" alt="NicoReparaciones" />
            <div className="font-black text-zinc-900">Menu</div>
          </div>

          <button className="icon-btn" aria-label="Cerrar menu" type="button" onClick={() => setSidebarOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {data.isAuth ? (
            <div className="card">
              <div className="card-body flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 flex items-center justify-center font-black">{data.userInitial || 'U'}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-zinc-900 truncate">{data.userName}</div>
                  <div className="sidebar-sub truncate">{data.userEmail}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="sidebar-section space-y-2">
            <div className="sidebar-title">Navegacion</div>
            <div className="sidebar-links">
              {data.sidebarNavLinks.map((link) => (
                <a key={link.label} className={`sidebar-link ${link.active ? 'active' : ''}`} href={link.href} onClick={() => setSidebarOpen(false)}>
                  <span className="inline-flex items-center gap-2">
                    {link.icon ? <img src={link.icon} alt="" className="w-5 h-5" loading="lazy" decoding="async" /> : null}
                    <span>{link.label}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="sidebar-section space-y-2">
            <div className="sidebar-title">Cuenta</div>
            <div className="sidebar-links">
              {data.sidebarAccountLinks.map((link) => (
                <a key={link.label} className={`sidebar-link ${link.active ? 'active' : ''} ${link.highlight === 'warning' ? 'text-amber-700' : ''}`} href={link.href} onClick={() => setSidebarOpen(false)}>
                  <span className="inline-flex items-center gap-2">
                    {link.icon ? <img src={link.icon} alt="" className="w-5 h-5" loading="lazy" decoding="async" /> : <WarnIcon />}
                    <span>{link.label}</span>
                  </span>
                </a>
              ))}

              {hasAdminLinks ? (
                <>
                  <button
                    type="button"
                    className={`sidebar-link flex items-center justify-between gap-2 ${sidebarAdminOpen ? 'active' : ''}`}
                    onClick={() => setSidebarAdminOpen((prev) => !prev)}>
                    <span>Admin</span>
                    <span className={`transition-transform ${sidebarAdminOpen ? 'rotate-180' : ''}`}>⌄</span>
                  </button>
                  <div className={sidebarAdminOpen ? '' : 'hidden'}>
                    <div className="ml-2 pl-2 border-l border-zinc-200 grid gap-1">
                      {data.adminLinks.map((link) => (
                        <a key={link.label} className={`sidebar-link font-semibold text-zinc-700 ${link.active ? 'active' : ''}`} href={link.href} onClick={() => setSidebarOpen(false)}>
                          <span className="inline-flex items-center gap-2">
                            {link.icon ? <img src={link.icon} alt="" className="w-5 h-5" loading="lazy" decoding="async" /> : null}
                            <span>{link.label}</span>
                            <LinkBadge count={link.badgeCount} />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {data.isAuth && data.urls.logout ? (
                <form method="POST" action={data.urls.logout}>
                  <input type="hidden" name="_token" value={data.csrfToken} />
                  <button type="submit" className="sidebar-link text-rose-700">
                    <span>Cerrar sesion</span>
                  </button>
                </form>
              ) : null}

              {!data.isAuth && data.urls.login ? (
                <a className="sidebar-link" href={data.urls.login} onClick={() => setSidebarOpen(false)}>
                  <span>Iniciar sesion</span>
                </a>
              ) : null}
              {!data.isAuth && data.urls.register ? (
                <a className="sidebar-link" href={data.urls.register} onClick={() => setSidebarOpen(false)}>
                  <span>Crear cuenta</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </header>
  );
}
