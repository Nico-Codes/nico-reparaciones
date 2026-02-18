const scrollLocks = new Set<string>();

const applyScrollLock = () => {
  const docEl = document.documentElement;

  const hasStableGutter =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    (CSS.supports('scrollbar-gutter: stable') || CSS.supports('scrollbar-gutter: stable both-edges'));

  if (!hasStableGutter) {
    const sbw = window.innerWidth - docEl.clientWidth;
    document.body.style.setProperty('--nr-sbw', `${sbw}px`);
  } else {
    document.body.style.removeProperty('--nr-sbw');
  }

  docEl.classList.add('nr-scroll-lock');
  document.body.classList.add('nr-scroll-lock');
};

const removeScrollLock = () => {
  document.documentElement.classList.remove('nr-scroll-lock');
  document.body.classList.remove('nr-scroll-lock');
  document.body.style.removeProperty('--nr-sbw');
};

export const lockScroll = (key: string) => {
  scrollLocks.add(key);
  if (scrollLocks.size === 1) applyScrollLock();
};

export const unlockScroll = (key: string) => {
  scrollLocks.delete(key);
  if (scrollLocks.size === 0) removeScrollLock();
};
