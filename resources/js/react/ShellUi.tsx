import { useEffect } from 'react';
import { lockScroll, unlockScroll } from '../shared/scrollLock';

export default function ShellUi() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const sidebarBtn = document.querySelector<HTMLElement>('[data-toggle="sidebar"], [data-mobile-menu-btn]');
    const sidebar = (document.getElementById('appSidebar') || document.querySelector<HTMLElement>('[data-mobile-menu]'));
    const sidebarOverlay = document.getElementById('appSidebarOverlay');

    const sidebarIsOffcanvas = () => !!sidebar && sidebar.id === 'appSidebar';
    const sidebarIsOpen = () => {
      if (!sidebar) return false;
      if (sidebarIsOffcanvas()) return !sidebar.classList.contains('-translate-x-full');
      return !sidebar.classList.contains('hidden');
    };

    const sidebarOpen = () => {
      if (!sidebar || !sidebarBtn) return;
      if (sidebarIsOffcanvas()) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        sidebarOverlay?.classList.remove('hidden');
        lockScroll('sidebar');
      } else {
        sidebar.classList.remove('hidden');
      }
      sidebarBtn.setAttribute('aria-expanded', 'true');
    };

    const sidebarClose = () => {
      if (!sidebar || !sidebarBtn) return;
      if (sidebarIsOffcanvas()) {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
        sidebarOverlay?.classList.add('hidden');
        unlockScroll('sidebar');
      } else {
        sidebar.classList.add('hidden');
      }
      sidebarBtn.setAttribute('aria-expanded', 'false');
    };

    if (sidebarBtn && sidebar) {
      const onSidebarBtnClick = () => (sidebarIsOpen() ? sidebarClose() : sidebarOpen());
      sidebarBtn.addEventListener('click', onSidebarBtnClick);
      cleanups.push(() => sidebarBtn.removeEventListener('click', onSidebarBtnClick));

      const closeButtons = Array.from(document.querySelectorAll<HTMLElement>('[data-close="sidebar"]'));
      closeButtons.forEach((el) => {
        el.addEventListener('click', sidebarClose);
        cleanups.push(() => el.removeEventListener('click', sidebarClose));
      });

      const onSidebarClick = (e: Event) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const a = target.closest('a');
        if (a && sidebar.contains(a)) {
          const href = a.getAttribute('href');
          if (href && href !== '#') {
            sidebarClose();
            return;
          }
        }

        const btn = target.closest('button');
        if (btn && sidebar.contains(btn) && btn.type === 'submit') {
          sidebarClose();
        }
      };
      sidebar.addEventListener('click', onSidebarClick);
      cleanups.push(() => sidebar.removeEventListener('click', onSidebarClick));

      const onSidebarEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') sidebarClose();
      };
      document.addEventListener('keydown', onSidebarEsc);
      cleanups.push(() => document.removeEventListener('keydown', onSidebarEsc));
    }

    const ANIM_MS = 170;
    const dropdowns = Array.from(document.querySelectorAll<HTMLElement>('[data-menu]'))
      .map((btn) => {
        const id = btn.getAttribute('data-menu');
        const menu = id ? document.getElementById(id) : null;
        if (!menu) return null;
        return { btn, menu, closeTimer: null as number | null };
      })
      .filter((entry): entry is { btn: HTMLElement; menu: HTMLElement; closeTimer: number | null } => entry !== null);

    const closeDropdown = (entry: { btn: HTMLElement; menu: HTMLElement; closeTimer: number | null }) => {
      entry.btn.setAttribute('aria-expanded', 'false');
      entry.menu.classList.remove('is-open');
      if (entry.closeTimer !== null) window.clearTimeout(entry.closeTimer);
      entry.closeTimer = window.setTimeout(() => {
        if (entry.btn.getAttribute('aria-expanded') === 'true') return;
        entry.menu.classList.add('hidden');
      }, ANIM_MS);
    };

    const openDropdown = (entry: { btn: HTMLElement; menu: HTMLElement; closeTimer: number | null }) => {
      if (entry.closeTimer !== null) window.clearTimeout(entry.closeTimer);
      entry.menu.classList.remove('hidden');
      entry.btn.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => entry.menu.classList.add('is-open'));
    };

    dropdowns.forEach((entry) => {
      const onClick = (e: Event) => {
        e.preventDefault();
        const isOpen = entry.menu.classList.contains('is-open');
        if (isOpen) closeDropdown(entry);
        else {
          dropdowns.forEach((other) => {
            if (other !== entry) closeDropdown(other);
          });
          openDropdown(entry);
        }
      };
      entry.btn.addEventListener('click', onClick);
      cleanups.push(() => entry.btn.removeEventListener('click', onClick));
    });

    const onDocumentClick = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      dropdowns.forEach((entry) => {
        if (entry.btn.contains(target)) return;
        if (entry.menu.contains(target)) return;
        closeDropdown(entry);
      });
    };
    document.addEventListener('click', onDocumentClick);
    cleanups.push(() => document.removeEventListener('click', onDocumentClick));

    const onDropdownEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      dropdowns.forEach((entry) => closeDropdown(entry));
    };
    document.addEventListener('keydown', onDropdownEsc);
    cleanups.push(() => document.removeEventListener('keydown', onDropdownEsc));

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
