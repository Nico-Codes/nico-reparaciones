import type { ShellContext } from './types';

export function isActiveGroup(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveShellContext(pathname: string): ShellContext {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (
    pathname === '/checkout' ||
    pathname === '/mi-cuenta' ||
    pathname === '/orders' ||
    pathname.startsWith('/orders/') ||
    pathname === '/repairs' ||
    pathname.startsWith('/repairs/')
  ) {
    return 'account';
  }
  return 'store';
}

export function lockScroll() {
  const docEl = document.documentElement;
  const scrollbarWidth = Math.max(0, window.innerWidth - docEl.clientWidth);
  document.body.style.setProperty('--nr-sbw', `${scrollbarWidth}px`);
  docEl.classList.add('nr-scroll-lock');
  document.body.classList.add('nr-scroll-lock');
}

export function unlockScroll() {
  document.documentElement.classList.remove('nr-scroll-lock');
  document.body.classList.remove('nr-scroll-lock');
  document.body.style.removeProperty('--nr-sbw');
}
