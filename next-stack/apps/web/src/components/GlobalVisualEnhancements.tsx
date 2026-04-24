import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TARGET_SELECTOR = [
  'main [data-reveal]',
  'main .page-head',
  'main .page-header',
  'main .filter-bar',
  'main .store-hero',
  'main .store-front-hero',
  'main .store-toolbar',
  'main .store-categories',
  'main .card',
  'main .section-card',
  'main .empty-state',
].join(', ');

function collectTargets(root: ParentNode = document) {
  return Array.from(root.querySelectorAll<HTMLElement>(TARGET_SELECTOR));
}

function sortTargetsByViewportPosition(targets: HTMLElement[]) {
  return [...targets].sort((left, right) => {
    const leftRect = left.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();
    const topDiff = Math.round(leftRect.top - rightRect.top);
    if (topDiff !== 0) return topDiff;
    const leftDiff = Math.round(leftRect.left - rightRect.left);
    if (leftDiff !== 0) return leftDiff;
    return 0;
  });
}

function isNearViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  if (rect.width <= 0 || rect.height <= 0) return false;

  const verticalPadding = Math.max(120, viewportHeight * 0.12);
  const horizontalPadding = Math.max(40, viewportWidth * 0.05);

  return (
    rect.bottom >= -verticalPadding &&
    rect.top <= viewportHeight + verticalPadding &&
    rect.right >= -horizontalPadding &&
    rect.left <= viewportWidth + horizontalPadding
  );
}

export function GlobalVisualEnhancements() {
  const location = useLocation();

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const main = document.querySelector('main');
    if (!main) return;

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
            { rootMargin: '0px 0px -4% 0px', threshold: 0.01 },
          )
        : null;

    const animateTargets = (targets: HTMLElement[]) => {
      const deduped = Array.from(new Set(targets.filter(Boolean)));
      if (deduped.length === 0) return;

      const orderedTargets = sortTargetsByViewportPosition(deduped);

      orderedTargets.forEach((el, index) => {
        if (!el.classList.contains('reveal-item')) {
          el.classList.add('reveal-item');
        }

        if (seen.has(el)) return;
        seen.add(el);

        el.classList.remove('is-visible');
        el.style.transitionDelay = `${Math.min(index * 34, 260)}ms`;
      });

      if (reducedMotion || !io) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            orderedTargets.forEach((el) => el.classList.add('is-visible'));
          });
        });
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          orderedTargets.forEach((el) => {
            if (isNearViewport(el)) {
              el.classList.add('is-visible');
              return;
            }
            io.observe(el);
          });
        });
      });
    };

    animateTargets(collectTargets(main));

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
  }, [location.pathname]);

  return null;
}
