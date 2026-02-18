export function initUICollapsibles(): void {
  const btns = document.querySelectorAll<HTMLElement>('[data-toggle-collapse]');
  if (!btns.length) return;

  const esc = (s: string): string => (window.CSS && CSS.escape)
    ? CSS.escape(s)
    : String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');

  btns.forEach((btn) => {
    const key = btn.getAttribute('data-toggle-collapse');
    if (!key) return;

    const block = document.querySelector<HTMLElement>(`[data-collapse="${esc(key)}"]`);
    if (!block) return;

    const STORE = `nr_collapse_${key}`;

    const isStatic = btn.hasAttribute('data-toggle-collapse-static');
    const noStore = btn.hasAttribute('data-toggle-collapse-no-store');
    const chevron = btn.querySelector('[data-collapse-chevron]');

    const setOpen = (open: boolean): void => {
      block.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');

      if (isStatic) {
        if (chevron) chevron.classList.toggle('rotate-180', open);
        return;
      }

      const label = btn.getAttribute('data-toggle-collapse-label');
      if (label) {
        btn.textContent = open ? `Ocultar ${label}` : `Ver ${label}`;
      } else {
        btn.textContent = open ? 'Ocultar' : 'Ver';
      }
    };

    let open = !block.classList.contains('hidden');
    if (!noStore) {
      try {
        const saved = localStorage.getItem(STORE);
        if (saved !== null) open = (saved === '1');
      } catch (_e) {}
    }

    setOpen(open);

    btn.addEventListener('click', () => {
      open = !open;
      setOpen(open);
      if (!noStore) {
        try { localStorage.setItem(STORE, open ? '1' : '0'); } catch (_e) {}
      }
    });
  });
}
