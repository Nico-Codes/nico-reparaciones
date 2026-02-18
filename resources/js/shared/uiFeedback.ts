export const formatARS = (value: unknown): string => {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$ ${Math.round(n)}`;
  }
};

export const showMiniToast = (msg: string): void => {
  const t = document.createElement('div');
  t.className = 'alert-success';
  t.textContent = msg;

  t.style.position = 'fixed';
  t.style.left = '50%';
  t.style.bottom = '14px';
  t.style.transform = 'translateX(-50%) translateY(8px)';
  t.style.zIndex = '9999';
  t.style.maxWidth = 'calc(100% - 24px)';
  t.style.opacity = '0';
  t.style.transition = 'opacity 160ms ease, transform 160ms ease';

  document.body.appendChild(t);

  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
  });

  window.setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(8px)';
    window.setTimeout(() => t.remove(), 220);
  }, 1600);
};

export const setNavbarCartCount = (count: unknown): void => {
  const cartLink = document.querySelector<HTMLAnchorElement>('a[aria-label="Carrito"]');
  if (!cartLink) return;

  const next = Math.max(0, parseInt(String(count ?? 0), 10) || 0);
  let badge = cartLink.querySelector<HTMLElement>('[data-cart-count]');

  if (next <= 0) {
    badge?.remove();
    return;
  }

  if (!badge) {
    badge = document.createElement('span');
    badge.setAttribute('data-cart-count', '1');

    badge.style.position = 'absolute';
    badge.style.top = '-0.5rem';
    badge.style.right = '-0.5rem';
    badge.style.minWidth = '1rem';
    badge.style.height = '1rem';
    badge.style.padding = '0 0.25rem';
    badge.style.borderRadius = '9999px';
    badge.style.background = '#0284c7';
    badge.style.color = '#fff';
    badge.style.fontSize = '10px';
    badge.style.lineHeight = '1rem';
    badge.style.fontWeight = '800';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.border = '2px solid #fff';

    cartLink.appendChild(badge);
  }

  badge.textContent = String(next);
};

export const copyToClipboard = async (text: unknown): Promise<boolean> => {
  const str = String(text ?? '');
  if (!str) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(str);
      return true;
    }
  } catch (_e) {}

  try {
    const ta = document.createElement('textarea');
    ta.value = str;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (_e) {
    return false;
  }
};
