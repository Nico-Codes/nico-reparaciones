import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Wrench } from 'lucide-react';
import { CartAddedPopup } from '@/features/cart/CartAddedPopup';
import { AccountMenu } from '@/layouts/app-shell/account-menu';
import { AppShellFooter } from '@/layouts/app-shell/footer';
import { MobileSidebar } from '@/layouts/app-shell/mobile-sidebar';
import { useAppShell } from '@/layouts/app-shell/use-app-shell';
import { BrandWordmark, CartGlyph, WarnIcon } from '@/layouts/app-shell/primitives';
import { cn } from '@/lib/utils';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const {
    shellContext,
    cartCount,
    sidebarOpen,
    accountOpen,
    isDesktop,
    authUser,
    isAdmin,
    brandLogoUrl,
    brandTitle,
    brandHomeTo,
    iconCartUrl,
    iconLogoutUrl,
    emailStatusText,
    userInitial,
    needsEmailVerification,
    accountRef,
    accountButtonRef,
    accountMenuRef,
    desktopLinks,
    accountLinks,
    adminLinks,
    sidebarNavLinks,
    adminSectionOpen,
    logout,
    closeAccount,
    openAccount,
    closeSidebar,
    toggleSidebar,
    toggleAccount,
    toggleAdminSection,
    handleAccountButtonKeyDown,
    handleAccountMenuKeyDown,
  } = useAppShell();

  return (
    <div className="app-shell text-zinc-900" data-shell-context={shellContext}>
      <header className="shell-header sticky top-0 z-[140] border-b shadow-sm">
        <div className="container-page">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {!isDesktop ? (
                <button
                  className="icon-btn"
                  aria-label="Abrir menu"
                  aria-expanded={sidebarOpen ? 'true' : 'false'}
                  type="button"
                  onClick={toggleSidebar}
                >
                  <Menu className="h-5 w-5" />
                </button>
              ) : null}

              <Link to={brandHomeTo} className="flex min-w-0 items-center gap-2">
                {brandLogoUrl ? (
                  <img src={brandLogoUrl} className="h-9 w-9 object-contain" alt="NicoReparaciones" />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-100 bg-white text-sky-600 ring-1 ring-zinc-100">
                    <Wrench className="h-4.5 w-4.5" />
                  </div>
                )}
                <div className="min-w-0 leading-tight">
                  <BrandWordmark title={brandTitle} />
                  <div className="hidden truncate text-[11px] text-zinc-500 sm:block">Servicio tecnico profesional y tienda de electronica</div>
                </div>
              </Link>
            </div>

            <nav className="hidden items-center gap-1 rounded-full bg-zinc-100/80 p-1 ring-1 ring-zinc-200 md:flex">
              {desktopLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold transition ${
                    link.active
                      ? 'bg-white text-sky-700 shadow-sm ring-1 ring-sky-200'
                      : 'text-zinc-700 hover:bg-white/70 hover:text-zinc-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {needsEmailVerification ? (
                <>
                  <Link
                    to="/auth/verify-email"
                    className="hidden h-9 items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-800 transition hover:bg-amber-100 sm:inline-flex"
                    aria-label="Correo sin verificar"
                  >
                    Correo sin verificar
                  </Link>
                  <Link to="/auth/verify-email" className="icon-btn text-amber-700 sm:hidden" aria-label="Correo sin verificar" title="Correo sin verificar">
                    <WarnIcon />
                  </Link>
                </>
              ) : null}

              <Link
                to="/cart"
                className="relative mr-2 inline-flex items-center justify-center rounded-none border-0 bg-transparent p-0 text-zinc-800 transition-colors hover:bg-transparent hover:text-sky-700"
                aria-label="Carrito"
              >
                {iconCartUrl ? <img src={iconCartUrl} alt="" className="h-7 w-7 object-contain" /> : <CartGlyph />}
                {cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-black leading-4 text-white ring-2 ring-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
              </Link>

              {!authUser ? (
                <>
                  <Link to="/auth/login" className="btn-outline hidden sm:inline-flex">
                    Ingresar
                  </Link>
                  <Link to="/auth/login" className="btn-primary sm:hidden">
                    Ingresar
                  </Link>
                </>
              ) : (
                <AccountMenu
                  authUser={authUser}
                  isDesktop={isDesktop}
                  accountOpen={accountOpen}
                  accountRef={accountRef}
                  accountButtonRef={accountButtonRef}
                  accountMenuRef={accountMenuRef}
                  accountLinks={accountLinks}
                  emailStatusText={emailStatusText}
                  iconLogoutUrl={iconLogoutUrl}
                  onButtonClick={toggleAccount}
                  onButtonKeyDown={handleAccountButtonKeyDown}
                  onMenuKeyDown={handleAccountMenuKeyDown}
                  onOpen={openAccount}
                  onClose={closeAccount}
                  onLinkClick={closeAccount}
                  onLogout={logout}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <MobileSidebar
        open={sidebarOpen}
        isDesktop={isDesktop}
        authUser={authUser}
        brandLogoUrl={brandLogoUrl}
        isAdmin={isAdmin}
        userInitial={userInitial}
        sidebarNavLinks={sidebarNavLinks}
        accountLinks={accountLinks}
        adminLinks={adminLinks}
        adminSectionOpen={adminSectionOpen}
        iconLogoutUrl={iconLogoutUrl}
        onClose={closeSidebar}
        onLogout={logout}
        onToggleAdminSection={toggleAdminSection}
      />

      <main className={cn('shell-main container-page')}>{children}</main>

      <AppShellFooter authUser={authUser} brandLogoUrl={brandLogoUrl} brandTitle={brandTitle} isAdmin={isAdmin} onLogout={logout} />

      <CartAddedPopup />
    </div>
  );
}
