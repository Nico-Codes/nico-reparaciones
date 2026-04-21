import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LinkItem } from './types';

export function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

export function CartGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
      <path d="M4.00488 16V4H2.00488V2H5.00488C5.55717 2 6.00488 2.44772 6.00488 3V15H18.4433L20.4433 7H8.00488V5H21.7241C22.2764 5 22.7241 5.44772 22.7241 6C22.7241 6.08176 22.7141 6.16322 22.6942 6.24254L20.1942 16.2425C20.083 16.6877 19.683 17 19.2241 17H5.00488C4.4526 17 4.00488 16.5523 4.00488 16ZM6.00488 23C4.90031 23 4.00488 22.1046 4.00488 21C4.00488 19.8954 4.90031 19 6.00488 19C7.10945 19 8.00488 19.8954 8.00488 21C8.00488 22.1046 7.10945 23 6.00488 23ZM18.0049 23C16.9003 23 16.0049 22.1046 16.0049 21C16.0049 19.8954 16.9003 19 18.0049 19C19.1095 19 20.0049 19.8954 20.0049 21C20.0049 22.1046 19.1095 23 18.0049 23Z" />
    </svg>
  );
}

export function LinkBadge({ count }: { count?: number }) {
  if (!count || count <= 0) return null;
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 text-[10px] font-black leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function MenuLinkIcon({ iconUrl, fallback }: { iconUrl?: string | null; fallback: ReactNode }) {
  if (iconUrl) {
    return <img src={iconUrl} alt="" className="h-5 w-5 shrink-0 object-contain" loading="lazy" decoding="async" />;
  }
  return <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{fallback}</span>;
}

export function BrandWordmark({ title }: { title: string }) {
  const normalized = title.replace(/\s+/g, '').toLowerCase();
  if (normalized !== 'nicoreparaciones') {
    return (
      <>
        <div className="hidden truncate font-black tracking-tight text-zinc-900 sm:block">{title}</div>
        <div className="truncate font-black tracking-tight text-zinc-900 sm:hidden">{title}</div>
      </>
    );
  }

  return (
    <>
      <div className="hidden truncate font-black tracking-tight text-zinc-900 sm:block">
        Nico<span className="text-sky-600">Reparaciones</span>
      </div>
      <div className="flex flex-col gap-0 font-black leading-none tracking-tight sm:hidden">
        <span className="block text-[13px] leading-none text-zinc-900">Nico</span>
        <span className="block text-[13px] leading-none text-sky-600">Reparaciones</span>
      </div>
    </>
  );
}

export function MenuLink({
  link,
  onClick,
  menuItem = false,
  className,
  children,
}: {
  link: LinkItem;
  onClick?: () => void;
  menuItem?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={link.to}
      role={menuItem ? 'menuitem' : undefined}
      data-account-menu-item={menuItem || undefined}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
