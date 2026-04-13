import { createPortal } from 'react-dom';
import { ChevronDown, LogOut, Wrench, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AuthUser } from '@/features/auth/types';
import { renderAccountLinkIcon, renderAdminLinkIcon, renderSidebarNavIcon } from '@/layouts/app-shell/link-icons';
import { LinkBadge, MenuLinkIcon } from '@/layouts/app-shell/primitives';
import type { LinkItem } from '@/layouts/app-shell/types';

type MobileSidebarProps = {
  open: boolean;
  isDesktop: boolean;
  authUser: AuthUser | null;
  brandLogoUrl: string | null;
  isAdmin: boolean;
  userInitial: string;
  sidebarNavLinks: LinkItem[];
  accountLinks: LinkItem[];
  adminLinks: LinkItem[];
  adminSectionOpen: boolean;
  iconLogoutUrl: string | null;
  hideGuestLoginLink?: boolean;
  onClose: () => void;
  onLogout: () => void;
  onToggleAdminSection: () => void;
};

export function MobileSidebar({
  open,
  isDesktop,
  authUser,
  brandLogoUrl,
  isAdmin,
  userInitial,
  sidebarNavLinks,
  accountLinks,
  adminLinks,
  adminSectionOpen,
  iconLogoutUrl,
  hideGuestLoginLink = false,
  onClose,
  onLogout,
  onToggleAdminSection,
}: MobileSidebarProps) {
  if (isDesktop || typeof document === 'undefined') {
    return null;
  }

  const showGuestLoginLink = !authUser && !hideGuestLoginLink;
  const showAccountSection = !!authUser || accountLinks.length > 0 || isAdmin || showGuestLoginLink;

  return createPortal(
    <>
      <div className={`fixed inset-0 z-[180] bg-zinc-950/40 ${open ? '' : 'hidden'}`} aria-hidden="true" onClick={onClose} />

      <aside
        className={`fixed left-0 top-0 z-[190] flex h-full w-[86%] max-w-xs transform flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Menu"
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-4">
          <div className="flex items-center gap-2">
            {brandLogoUrl ? (
              <img src={brandLogoUrl} className="h-8 w-8 rounded-xl bg-white object-contain ring-1 ring-zinc-100" alt="NicoReparaciones" />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-white ring-1 ring-zinc-100">
                <Wrench className="h-4 w-4 text-sky-600" />
              </div>
            )}
            <div className="font-black text-zinc-900">Menu</div>
          </div>

          <button className="icon-btn" aria-label="Cerrar menu" type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {authUser ? (
            <div className="card">
              <div className="card-body flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 font-black text-sky-700 ring-1 ring-sky-100">{userInitial}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-black text-zinc-900">{authUser.name}</div>
                  <div className="sidebar-sub truncate">{authUser.email}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="sidebar-section space-y-2">
            <div className="sidebar-title">Navegacion</div>
            <div className="sidebar-links">
              {sidebarNavLinks.map((link) => (
                <Link key={link.label} className={`sidebar-link ${link.active ? 'active' : ''}`} to={link.to} onClick={onClose}>
                  <span className="inline-flex items-center gap-2">
                    <MenuLinkIcon iconUrl={link.icon} fallback={renderSidebarNavIcon(link.label)} />
                    <span>{link.label}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {showAccountSection ? (
            <div className="sidebar-section space-y-2">
              <div className="sidebar-title">Cuenta</div>
              <div className="sidebar-links">
                {accountLinks.map((link) => (
                  <Link key={link.label} className={`sidebar-link ${link.active ? 'active' : ''} ${link.highlight === 'warning' ? 'text-amber-700' : ''}`} to={link.to} onClick={onClose}>
                    <span className="inline-flex items-center gap-2">
                      <MenuLinkIcon iconUrl={link.icon} fallback={renderAccountLinkIcon(link.label)} />
                      <span>{link.label}</span>
                    </span>
                  </Link>
                ))}

                {isAdmin ? (
                  <>
                    <button type="button" className={`sidebar-link flex items-center justify-between gap-2 ${adminSectionOpen ? 'active' : ''}`} onClick={onToggleAdminSection}>
                      <span>Admin</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${adminSectionOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={adminSectionOpen ? '' : 'hidden'}>
                      <div className="ml-2 grid gap-1 border-l border-zinc-200 pl-2">
                        {adminLinks.map((link) => (
                          <Link key={link.label} className={`sidebar-link font-semibold text-zinc-700 ${link.active ? 'active' : ''}`} to={link.to} onClick={onClose}>
                            <span className="inline-flex items-center gap-2">
                              <MenuLinkIcon iconUrl={link.icon} fallback={renderAdminLinkIcon(link.label)} />
                              <span>{link.label}</span>
                              <LinkBadge count={link.badgeCount} />
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}

                {authUser ? (
                  <button type="button" className="sidebar-link text-rose-700" onClick={onLogout}>
                    <span className="inline-flex items-center gap-2">
                      <MenuLinkIcon iconUrl={iconLogoutUrl} fallback={<LogOut className="h-4 w-4" />} />
                      <span>Cerrar sesion</span>
                    </span>
                  </button>
                ) : showGuestLoginLink ? (
                  <Link className="sidebar-link" to="/auth/login" onClick={onClose}>
                    <span>Ingresar</span>
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </>,
    document.body,
  );
}
