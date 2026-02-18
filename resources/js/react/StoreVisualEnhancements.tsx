import { useEffect } from 'react';

export default function StoreVisualEnhancements() {
  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('.reveal-item'));
    const toolbar = document.querySelector<HTMLElement>('[data-store-toolbar]');
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

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
