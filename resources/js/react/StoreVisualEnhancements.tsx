import { useEffect } from 'react';

export default function StoreVisualEnhancements() {
  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('.reveal-item'));
    const toolbar = document.querySelector<HTMLElement>('[data-store-toolbar]');
    const storeForm = toolbar?.querySelector<HTMLFormElement>('form');
    const mobileSortToggle = toolbar?.querySelector<HTMLButtonElement>('[data-store-mobile-sort-toggle]') ?? null;
    const mobileSortMenu = toolbar?.querySelector<HTMLElement>('[data-store-mobile-sort-menu]') ?? null;
    const mobileSortOptions = Array.from(toolbar?.querySelectorAll<HTMLButtonElement>('[data-store-mobile-sort-option]') ?? []);
    const sortSelect = toolbar?.querySelector<HTMLSelectElement>('[data-store-sort-select]') ?? null;
    const cleanups: Array<() => void> = [];

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (revealItems.length > 0) {
      if (reducedMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach((el) => el.classList.add('is-visible'));
      } else {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const target = entry.target as HTMLElement;
              target.classList.add('is-visible');
              io.unobserve(target);
            });
          },
          { rootMargin: '0px 0px -8% 0px', threshold: 0.14 }
        );

        revealItems.forEach((el, index) => {
          el.style.transitionDelay = `${Math.min(index * 24, 200)}ms`;
          io.observe(el);
        });
        cleanups.push(() => io.disconnect());
      }
    }

    if (toolbar) {
      const markSticky = () => {
        const top = toolbar.getBoundingClientRect().top;
        toolbar.classList.toggle('is-stuck', top <= 72);
      };
      markSticky();
      window.addEventListener('scroll', markSticky, { passive: true });
      window.addEventListener('resize', markSticky);
      cleanups.push(() => {
        window.removeEventListener('scroll', markSticky);
        window.removeEventListener('resize', markSticky);
      });
    }

    if (storeForm && mobileSortToggle && mobileSortMenu && sortSelect && mobileSortOptions.length > 0) {
      const closeMenu = () => {
        mobileSortMenu.classList.add('hidden');
        mobileSortToggle.setAttribute('aria-expanded', 'false');
      };

      const openMenu = () => {
        mobileSortMenu.classList.remove('hidden');
        mobileSortToggle.setAttribute('aria-expanded', 'true');
      };

      const syncActiveOption = () => {
        const currentValue = sortSelect.value;
        mobileSortOptions.forEach((optionButton) => {
          optionButton.classList.toggle('is-active', optionButton.dataset.sortValue === currentValue);
        });
      };

      syncActiveOption();

      const onToggleClick = () => {
        if (mobileSortMenu.classList.contains('hidden')) {
          openMenu();
        } else {
          closeMenu();
        }
      };

      const onDocumentClick = (event: MouseEvent) => {
        const target = event.target as Node | null;
        if (!target) return;
        if (mobileSortMenu.contains(target) || mobileSortToggle.contains(target)) return;
        closeMenu();
      };

      const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') closeMenu();
      };

      mobileSortToggle.addEventListener('click', onToggleClick);
      document.addEventListener('click', onDocumentClick);
      document.addEventListener('keydown', onKeydown);

      mobileSortOptions.forEach((optionButton) => {
        optionButton.addEventListener('click', () => {
          const nextValue = optionButton.dataset.sortValue || 'relevance';
          if (sortSelect.value !== nextValue) {
            sortSelect.value = nextValue;
          }
          syncActiveOption();
          closeMenu();
          storeForm.requestSubmit();
        });
      });

      cleanups.push(() => {
        mobileSortToggle.removeEventListener('click', onToggleClick);
        document.removeEventListener('click', onDocumentClick);
        document.removeEventListener('keydown', onKeydown);
      });
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
