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
  const menuBtn = document.querySelector('[data-mobile-menu-btn]');
  const menu = document.querySelector('[data-mobile-menu]');

  if (menuBtn && menu) {
    const close = () => {
      menu.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
    };
    const open = () => {
      menu.classList.remove('hidden');
      menuBtn.setAttribute('aria-expanded', 'true');
    };

    menuBtn.addEventListener('click', () => {
      const isOpen = !menu.classList.contains('hidden');
      isOpen ? close() : open();
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
    const sbw = window.innerWidth - docEl.clientWidth;
    document.body.style.setProperty('--nr-sbw', sbw > 0 ? `${sbw}px` : '0px');

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
    const div = document.createElement('div');
    div.innerHTML = `
      <div id="cartAddedOverlay"
           class="fixed inset-0 z-[60] opacity-0 pointer-events-none transition-opacity duration-300 ease-out"
           aria-hidden="true">
        <div class="absolute inset-0 bg-zinc-950/40" data-cart-added-close></div>

        <div id="cartAddedSheet"
             class="absolute bottom-0 left-0 right-0 mx-auto max-w-xl translate-y-full transition-transform duration-300 ease-out will-change-transform">
          <div class="rounded-t-3xl bg-white p-4 shadow-2xl">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div id="cartAddedTitle" class="text-base font-black">Agregado al carrito</div>
                <div id="cartAddedName" class="mt-0.5 text-sm text-zinc-600 truncate"></div>
              </div>

              <button type="button" class="icon-btn" data-cart-added-close aria-label="Cerrar">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="mt-4 flex gap-2">
              <a href="/carrito" class="btn btn-primary flex-1 justify-center">Ver carrito</a>
              <button type="button" class="btn btn-outline flex-1 justify-center" data-cart-added-close>Seguir</button>
            </div>
          </div>
        </div>
      </div>
    `.trim();

    document.body.appendChild(div.firstElementChild);

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
    if (!overlay || !sheet) return;

    const nameEl = document.getElementById('cartAddedName');
    if (nameEl) nameEl.textContent = productName || 'Producto';

    window.clearTimeout(autoCloseTimer);
    window.clearTimeout(unlockTimer);

    // Estado base cerrado
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100', 'pointer-events-auto');
    sheet.classList.add('translate-y-full');
    sheet.classList.remove('translate-y-0');

    afterPaint(() => {
      overlay.classList.add('nr-no-transition');
      sheet.classList.add('nr-no-transition');

      overlay.getBoundingClientRect();
      sheet.getBoundingClientRect();

      overlay.classList.remove('nr-no-transition');
      sheet.classList.remove('nr-no-transition');

      lockScroll();

      overlay.classList.remove('opacity-0', 'pointer-events-none');
      overlay.classList.add('opacity-100', 'pointer-events-auto');
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

    overlay.setAttribute('aria-hidden', 'true');

    unlockTimer = window.setTimeout(() => {
      unlockScroll();
    }, 320);
  };

  // ----------------------------
  // Update cart badge (UI)
  // ----------------------------
  const bumpCartBadge = (delta = 1) => {
    // Busca el badge existente
    let badge = document.querySelector('.cart-badge');
    if (!badge) {
      // intenta crear uno en el botón del carrito
      const cartBtn =
        document.querySelector('a[aria-label="Carrito"]') ||
        document.querySelector('a.cart-btn') ||
        document.querySelector('a[href*="carrito"]');

      if (!cartBtn) return;

      badge = document.createElement('span');
      badge.className = 'cart-badge';
      badge.textContent = '0';
      cartBtn.appendChild(badge);
    }

    const current = parseInt(badge.textContent || '0', 10) || 0;
    const next = Math.max(0, current + (parseInt(delta, 10) || 0));
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
    // Intento 1: data-product-name en el botón
    const btn = form.querySelector('button.btn-cart');
    const dn = btn?.getAttribute('data-product-name');
    if (dn) return dn;

    // Intento 2: dentro de la card, un .product-title
    const card = form.closest('.product-card');
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
    btn.setAttribute('aria-busy', loading ? 'true' : 'false');
    if (loading) btn.classList.add('opacity-60');
    else btn.classList.remove('opacity-60');
  };

  document.addEventListener(
    'submit',
    async (e) => {
      const form = e.target;
      if (!isAddToCartForm(form)) return;

      // Evita recarga => NO vuelve arriba
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

        // Laravel puede responder 302 y fetch lo sigue (OK igual)
        if (!res.ok) {
          // 419 = CSRF/session expirada
          if (res.status === 419) {
            openToast('Sesión expirada. Reintentá.');
          } else {
            openToast('No se pudo agregar. Reintentá.');
          }
          setBtnLoading(btn, false);
          return;
        }

        // Éxito: actualizamos badge y mostramos toast
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
    // Si vino por backend, abrimos sin tocar scroll (ya estás en la página nueva)
    afterPaint(() => openToast(document.getElementById('cartAddedName')?.textContent?.trim() || 'Producto'));
  }
});
