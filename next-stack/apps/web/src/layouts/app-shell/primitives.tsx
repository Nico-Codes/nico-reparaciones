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
      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1z" />
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
