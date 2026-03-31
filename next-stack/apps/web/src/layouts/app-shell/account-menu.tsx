import type { KeyboardEvent, RefObject } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import type { AuthUser } from '@/features/auth/types';
import { renderAccountLinkIcon } from '@/layouts/app-shell/link-icons';
import { MenuLink, MenuLinkIcon } from '@/layouts/app-shell/primitives';
import type { LinkItem } from '@/layouts/app-shell/types';

type AccountMenuProps = {
  authUser: AuthUser;
  isDesktop: boolean;
  accountOpen: boolean;
  accountRef: RefObject<HTMLDivElement | null>;
  accountButtonRef: RefObject<HTMLButtonElement | null>;
  accountMenuRef: RefObject<HTMLDivElement | null>;
  accountLinks: LinkItem[];
  emailStatusText: string;
  iconLogoutUrl: string | null;
  onButtonClick: () => void;
  onButtonKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onMenuKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onOpen: () => void;
  onClose: () => void;
  onLinkClick: () => void;
  onLogout: () => void;
};

export function AccountMenu({
  authUser,
  isDesktop,
  accountOpen,
  accountRef,
  accountButtonRef,
  accountMenuRef,
  accountLinks,
  emailStatusText,
  iconLogoutUrl,
  onButtonClick,
  onButtonKeyDown,
  onMenuKeyDown,
  onOpen,
  onClose,
  onLinkClick,
  onLogout,
}: AccountMenuProps) {
  return (
    <div
      className="relative"
      ref={accountRef}
      onMouseEnter={isDesktop ? onOpen : undefined}
      onMouseLeave={isDesktop ? onClose : undefined}
    >
      <button
        id="account-menu-button"
        ref={accountButtonRef}
        className="btn-ghost px-3 py-2"
        aria-expanded={accountOpen ? 'true' : 'false'}
        aria-haspopup="menu"
        aria-controls="account-menu"
        aria-label="Abrir menu de cuenta"
        type="button"
        onClick={onButtonClick}
        onKeyDown={onButtonKeyDown}
      >
        <span className="sm:hidden">
          <User className="h-5 w-5" />
        </span>
        <span className="hidden max-w-[12rem] truncate sm:inline">{authUser.name || 'Cuenta'}</span>
        <ChevronDown className="hidden h-4 w-4 text-zinc-500 sm:inline-block" />
      </button>
      <div className="absolute right-0 top-full h-2 w-64" aria-hidden="true" />

      <div
        id="account-menu"
        ref={accountMenuRef}
        role="menu"
        aria-labelledby="account-menu-button"
        className={`dropdown-menu top-full ${accountOpen ? 'is-open' : 'hidden'}`}
        onKeyDown={onMenuKeyDown}
        style={{ overflow: 'visible', maxHeight: 'none' }}
      >
        <div className="px-3 py-2">
          <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Estado de correo</div>
          <span
            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              authUser.emailVerified
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {emailStatusText}
          </span>
        </div>

        <div className="my-2 border-t border-zinc-200" />

        {accountLinks.map((link) => (
          <MenuLink
            key={link.label}
            link={link}
            menuItem
            onClick={onLinkClick}
            className={`dropdown-item ${link.active ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100' : ''} ${link.highlight === 'warning' ? 'text-amber-700' : ''}`}
          >
            <span className="inline-flex items-center gap-2">
              <MenuLinkIcon iconUrl={link.icon} fallback={renderAccountLinkIcon(link.label)} />
              <span>{link.label}</span>
            </span>
          </MenuLink>
        ))}

        <div className="my-2 border-t border-zinc-200" />
        <button type="button" role="menuitem" data-account-menu-item className="dropdown-item text-rose-700" onClick={onLogout}>
          <span className="inline-flex items-center gap-2">
            <MenuLinkIcon iconUrl={iconLogoutUrl} fallback={<LogOut className="h-4 w-4" />} />
            <span>Cerrar sesion</span>
          </span>
        </button>
      </div>
    </div>
  );
}
