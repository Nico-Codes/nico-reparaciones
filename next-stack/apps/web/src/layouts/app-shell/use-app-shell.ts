import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authStorage } from '@/features/auth/storage';
import type { AuthUser } from '@/features/auth/types';
import { useCartCount } from '@/features/cart/useCart';
import { storeApi } from '@/features/store/api';
import type { StoreBrandingAssets } from '@/features/store/types';
import { buildAccountLinks, buildAdminLinks, buildDesktopLinks, buildSidebarNavLinks, deriveAppShellDisplay } from './helpers';
import { lockScroll, resolveShellContext, unlockScroll } from './utils';

export function useAppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const shellContext = resolveShellContext(location.pathname);
  const cartCount = useCartCount();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  );
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => authStorage.getUser());
  const [branding, setBranding] = useState<StoreBrandingAssets | null>(null);
  const [adminSectionOpen, setAdminSectionOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sync = () => setAuthUser(authStorage.getUser());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('nico:auth-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('nico:auth-changed', sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void storeApi
      .branding()
      .then((data) => {
        if (!cancelled) setBranding(data);
      })
      .catch(() => {
        if (!cancelled) setBranding(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setAccountOpen(false);
    setAuthUser(authStorage.getUser());
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const syncViewport = (event?: MediaQueryListEvent) => setIsDesktop(event ? event.matches : mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);

    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (sidebarOpen) lockScroll();
    else unlockScroll();

    return () => unlockScroll();
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
      if (!accountRef.current.contains(target)) setAccountOpen(false);
    };

    document.addEventListener('keydown', onEsc);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [accountOpen]);

  const display = deriveAppShellDisplay(authUser, branding);

  const desktopLinks = useMemo(
    () => buildDesktopLinks(location.pathname, display.isAdmin),
    [display.isAdmin, location.pathname],
  );

  const accountLinks = useMemo(
    () =>
      buildAccountLinks({
        authUser,
        pathname: location.pathname,
        iconOrdersUrl: display.iconOrdersUrl,
        iconRepairsUrl: display.iconRepairsUrl,
      }),
    [authUser, display.iconOrdersUrl, display.iconRepairsUrl, location.pathname],
  );

  const adminLinks = useMemo(
    () =>
      buildAdminLinks({
        pathname: location.pathname,
        isAdmin: display.isAdmin,
        iconDashboardUrl: display.iconDashboardUrl,
        iconSettingsUrl: display.iconSettingsUrl,
      }),
    [display.iconDashboardUrl, display.iconSettingsUrl, display.isAdmin, location.pathname],
  );

  const sidebarNavLinks = useMemo(
    () =>
      buildSidebarNavLinks({
        pathname: location.pathname,
        isAdmin: display.isAdmin,
        iconStoreUrl: display.iconStoreUrl,
        iconRepairLookupUrl: display.iconRepairLookupUrl,
        iconDashboardUrl: display.iconDashboardUrl,
      }),
    [display.iconDashboardUrl, display.iconRepairLookupUrl, display.iconStoreUrl, display.isAdmin, location.pathname],
  );

  useEffect(() => {
    setAdminSectionOpen(display.isAdmin && adminLinks.some((link) => link.active));
  }, [adminLinks, display.isAdmin]);

  const logout = () => {
    authStorage.clear();
    setAccountOpen(false);
    setSidebarOpen(false);
    navigate('/store', { replace: true });
  };

  const closeAccount = () => setAccountOpen(false);
  const openAccount = () => setAccountOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  const toggleSidebar = () => {
    setAccountOpen(false);
    setSidebarOpen((prev) => !prev);
  };

  const toggleAccount = () => {
    if (!isDesktop) setSidebarOpen(false);
    setAccountOpen((prev) => !prev);
  };

  const toggleAdminSection = () => setAdminSectionOpen((prev) => !prev);

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

  const handleAccountButtonKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setAccountOpen(true);
      window.setTimeout(() => focusFirstAccountItem(), 0);
    }
  };

  const handleAccountMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setAccountOpen(false);
      accountButtonRef.current?.focus();
      return;
    }

    const items = accountMenuItems();
    if (!items.length) return;
    const currentIndex = items.findIndex((item) => item === document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusAccountItem(currentIndex >= 0 ? (currentIndex + 1) % items.length : 0);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusAccountItem(currentIndex >= 0 ? (currentIndex - 1 + items.length) % items.length : items.length - 1);
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
  };

  return {
    shellContext,
    cartCount,
    sidebarOpen,
    accountOpen,
    isDesktop,
    authUser,
    adminSectionOpen,
    accountRef,
    accountButtonRef,
    accountMenuRef,
    desktopLinks,
    accountLinks,
    adminLinks,
    sidebarNavLinks,
    logout,
    closeAccount,
    openAccount,
    closeSidebar,
    toggleSidebar,
    toggleAccount,
    toggleAdminSection,
    handleAccountButtonKeyDown,
    handleAccountMenuKeyDown,
    ...display,
  };
}
