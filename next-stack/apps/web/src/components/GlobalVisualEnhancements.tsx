import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TARGET_SELECTOR = [
  'main .page-head',
  'main .store-hero',
  'main .store-front-hero',
  'main .store-toolbar',
  'main .store-categories',
  'main .card',
].join(', ');

function collectTargets(root: ParentNode = document) {
  return Array.from(root.querySelectorAll<HTMLElement>(TARGET_SELECTOR));
}

export function GlobalVisualEnhancements() {
  const location = useLocation();

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const main = document.querySelector('main');
    if (!main) return;

    let sequence = 0;
    const seen = new WeakSet<HTMLElement>();

    const io =
      !reducedMotion && 'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => {
              const observer = io;
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target as HTMLElement;
                el.classList.add('is-visible');
                observer?.unobserve(el);
              });
            },
            { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
          )
        : null;

    const animateTargets = (targets: HTMLElement[]) => {
      if (targets.length === 0) return;

      targets.forEach((el) => {
        if (!el.classList.contains('reveal-item')) {
          el.classList.add('reveal-item');
        }

        // Re-arm only once per route/render cycle for each element
        if (seen.has(el)) return;
        seen.add(el);

        el.classList.remove('is-visible');
        el.style.transitionDelay = `${Math.min(sequence * 34, 260)}ms`;
        sequence += 1;
      });

      if (reducedMotion || !io) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            targets.forEach((el) => el.classList.add('is-visible'));
          });
        });
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          targets.forEach((el) => io.observe(el));
        });
      });
    };

    // Initial route paint
    animateTargets(collectTargets(main));

    // Animate async-rendered cards/panels added after fetch completes
    const mo = new MutationObserver((mutations) => {
      const nextTargets: HTMLElement[] = [];
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches?.(TARGET_SELECTOR)) nextTargets.push(node);
          nextTargets.push(...collectTargets(node));
        });
      }
      if (nextTargets.length > 0) animateTargets(nextTargets);
    });

    mo.observe(main, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io?.disconnect();
    };
  }, [location.pathname, location.search]);

  return null;
}
