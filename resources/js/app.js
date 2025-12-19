import './bootstrap';
import '../css/app.css';

/**
 * NicoReparaciones Web
 * - Mobile menu
 * - Add to cart por AJAX (sin recargar -> NO vuelve arriba)
 * - Toast/bottom-sheet "Agregado al carrito" (sin parpadeo/zoom)
 */

const afterPaint = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------
  // Mobile menu toggle
  // ----------------------------
  // Mobile menu (sidebar offcanvas / fallback)
  const sidebarBtn = document.querySelector('[data-toggle="sidebar"], [data-mobile-menu-btn]');
  const sidebar = document.getElementById('appSidebar') || document.querySelector('[data-mobile-menu]');
  const sidebarOverlay = document.getElementById('appSidebarOverlay');

  if (sidebarBtn && sidebar) {
    const isOffcanvas = sidebar.id === 'appSidebar';

    const isOpen = () => {
      if (isOffcanvas) return !sidebar.classList.contains('-translate-x-full');
      return !sidebar.classList.contains('hidden');
    };

    const open = () => {
      if (isOffcanvas) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        if (sidebarOverlay) sidebarOverlay.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      } else {
        sidebar.classList.remove('hidden');
      }
      sidebarBtn.setAttribute('aria-expanded', 'true');
    };

    const close = () => {
      if (isOffcanvas) {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
        if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      } else {
        sidebar.classList.add('hidden');
      }
      sidebarBtn.setAttribute('aria-expanded', 'false');
    };

    sidebarBtn.addEventListener('click', () => {
      isOpen() ? close() : open();
    });

    document.querySelectorAll('[data-close="sidebar"]').forEach((el) => {
      el.addEventListener('click', close);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  // ----------------------------
  // Toast (bottom-sheet)
  // ----------------------------
  let overlay = document.getElementById('cartAddedOverlay');
  let sheet = document.getElementById('cartAddedSheet');

  let autoCloseTimer = null;
  let unlockTimer = null;

  const lockScroll = () => {
  const docEl = document.documentElement;

  // Si el navegador soporta scrollbar-gutter, NO compensamos con padding-right
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


  const unlockScroll = () => {
    document.documentElement.classList.remove('nr-scroll-lock');
    document.body.classList.remove('nr-scroll-lock');
    document.body.style.removeProperty('--nr-sbw');
  };

  const ensureToast = () => {
    overlay = document.getElementById('cartAddedOverlay');
    sheet = document.getElementById('cartAddedSheet');
    if (overlay && sheet) return;

    // Si no existe en el HTML, lo creamos (solo para AJAX)
    const html = `
      <div id="cartAddedOverlay"
          class="fixed inset-0 z-[60] opacity-0 pointer-events-none transition-opacity duration-300 ease-out"
          aria-hidden="true">
        <div class="absolute inset-0 bg-zinc-950/40" data-cart-added-close></div>
        <div id="cartAddedSheet"
            class="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-lg translate-y-full transform transition-transform duration-300 ease-out will-change-transform">
          <div class="rounded-t-3xl bg-white p-4 shadow-2xl">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-black text-zinc-900">Agregado al carrito ✅</div>
                <div class="text-sm text-zinc-600 mt-1 truncate">
                  <span id="cartAddedName">Producto</span>
                </div>
              </div>
              <button type="button" class="icon-btn" data-cart-added-close aria-label="Cerrar">✕</button>
            </div>

            <div class="mt-4 flex gap-2">
              <a href="/carrito" class="btn-primary flex-1 justify-center">Ver carrito</a>
              <button type="button" class="btn-outline flex-1 justify-center" data-cart-added-close>Seguir</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    overlay = document.getElementById('cartAddedOverlay');
    sheet = document.getElementById('cartAddedSheet');

    overlay.querySelectorAll('[data-cart-added-close]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        closeToast();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeToast();
    });
  };

  const openToast = (productName = 'Producto') => {
    ensureToast();

    const nameEl = document.getElementById('cartAddedName');
    if (nameEl) nameEl.textContent = productName;

    lockScroll();

    overlay.classList.remove('pointer-events-none', 'opacity-0');
    overlay.classList.add('pointer-events-auto', 'opacity-100');

    afterPaint(() => {
      sheet.classList.remove('translate-y-full');
      sheet.classList.add('translate-y-0');

      autoCloseTimer = window.setTimeout(closeToast, 4500);
    });
  };

  const closeToast = () => {
    if (!overlay || !sheet) return;

    window.clearTimeout(autoCloseTimer);
    window.clearTimeout(unlockTimer);

    overlay.classList.remove('opacity-100', 'pointer-events-auto');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    sheet.classList.add('translate-y-full');
    sheet.classList.remove('translate-y-0');

    unlockTimer = window.setTimeout(unlockScroll, 260);
  };

  // ----------------------------
  // Update cart badge (UI)
  // ----------------------------
  const bumpCartBadge = (delta = 1) => {
    const cartLink = document.querySelector('a[aria-label="Carrito"]');
    if (!cartLink) return;

    let badge = cartLink.querySelector('[data-cart-count]');
    const current = badge ? (parseInt(badge.textContent || '0', 10) || 0) : 0;
    const next = Math.max(0, current + (parseInt(delta, 10) || 0));

    if (next <= 0) {
      badge?.remove();
      return;
    }

    if (!badge) {
      badge = document.createElement('span');
      badge.setAttribute('data-cart-count', '1');
      badge.className =
        'absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-sky-600 text-white text-[11px] leading-5 font-black flex items-center justify-center ring-2 ring-white';
      cartLink.appendChild(badge);
    }

    badge.textContent = String(next);
  };


  // ----------------------------
  // AJAX Add to cart (sin reload)
  // ----------------------------
  const isAddToCartForm = (form) => {
    if (!(form instanceof HTMLFormElement)) return false;

    // Señal 1: botón con clase .btn-cart dentro del form
    if (form.querySelector('button.btn-cart, .btn-cart')) return true;

    // Señal 2: action parece de carrito
    const action = (form.getAttribute('action') || '').toLowerCase();
    if (action.includes('cart.add') || action.includes('/carrito') || action.includes('/cart')) return true;

    return false;
  };

  const getProductNameFromContext = (form) => {
    const btn = form.querySelector('button.btn-cart');
    const dn = btn?.getAttribute('data-product-name');
    if (dn) return dn;

    const card = form.closest('.product-card, .card');
    const title = card?.querySelector('.product-title')?.textContent?.trim();
    if (title) return title;

    return 'Producto';
  };

  const getQtyFromForm = (form) => {
    const q = form.querySelector('input[name="quantity"]')?.value;
    const n = parseInt(q || '1', 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  };

  const setBtnLoading = (btn, loading) => {
    if (!btn) return;
    btn.disabled = !!loading;
    btn.classList.toggle('is-loading', !!loading);
  };

  document.addEventListener(
    'submit',
    async (e) => {
      const form = e.target;
      if (!isAddToCartForm(form)) return;

      e.preventDefault();

      const btn = form.querySelector('button[type="submit"]');
      const productName = getProductNameFromContext(form);
      const qty = getQtyFromForm(form);

      setBtnLoading(btn, true);

      try {
        const fd = new FormData(form);

        const res = await fetch(form.action, {
          method: 'POST',
          body: fd,
          credentials: 'same-origin',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          },
        });

        if (!res.ok) {
          if (res.status === 419) {
            openToast('Sesión expirada. Reintentá.');
          } else {
            openToast('No se pudo agregar. Reintentá.');
          }
          setBtnLoading(btn, false);
          return;
        }

        bumpCartBadge(qty);
        openToast(productName);
      } catch (_) {
        openToast('Error de red. Reintentá.');
      } finally {
        setBtnLoading(btn, false);
      }
    },
    true
  );

  // ----------------------------
  // Si tu backend todavía renderiza el toast por session (post-redirect),
  // lo abrimos también (por compatibilidad).
  // ----------------------------
  const serverOverlay = document.getElementById('cartAddedOverlay');
  if (serverOverlay?.dataset?.cartAdded === '1') {
    afterPaint(() => openToast(document.getElementById('cartAddedName')?.textContent?.trim() || 'Producto'));
  }
});
