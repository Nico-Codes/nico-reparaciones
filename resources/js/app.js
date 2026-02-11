import './bootstrap';
import '../css/app.css';
import { initAdminAssetUploadDropzones } from './modules/adminAssetUploadDropzones';
import {
  initRepairCreateAdvancedToggle,
  initRepairCreateFinanceToggle,
  initRepairCreateSummaryAndPhone,
} from './modules/adminRepairCreateUi';
import { initUICollapsibles } from './modules/uiCollapsibles';
import { initCartAndCheckout } from './modules/cartAndCheckout';
import { initAdminOrdersStatusAndWhatsapp } from './modules/adminOrdersStatusAndWhatsapp';
import { initAdminProductsQuickActions } from './modules/adminProductsQuickActions';
import { initRepairIssueCatalog } from './modules/repairIssueCatalog';
import { initAdminModelGroups } from './modules/adminModelGroups';
import { initRepairDeviceCatalog } from './modules/repairDeviceCatalog';
import { initAdminCategoriesQuickToggle } from './modules/adminCategoriesQuickToggle';

window.NR_APP_VERSION = 'admin-status-quick-v1';
console.log('[NR] app.js cargado:', window.NR_APP_VERSION);

/**
 * NicoReparaciones Web
 * - Sidebar móvil (hamburguesa)
 * - Dropdown cuenta
 * - Add to cart AJAX + badge
 * - Toast/bottom-sheet "Agregado al carrito" (sin parpadeo/zoom)
 * - Checkout: resumen colapsable en móvil + sticky en desktop
 * - Checkout: anti doble submit + loading
 */

const afterPaint = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------
  // Scroll lock (shared) — evita “zoom” por scrollbar
  // ----------------------------
  const scrollLocks = new Set();

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

  const lockScroll = (key) => {
    scrollLocks.add(key);
    if (scrollLocks.size === 1) applyScrollLock();
  };

  const unlockScroll = (key) => {
    scrollLocks.delete(key);
    if (scrollLocks.size === 0) removeScrollLock();
  };

  // ----------------------------
  // Sidebar móvil (hamburguesa)
  // ----------------------------
  const sidebarBtn = $('[data-toggle="sidebar"], [data-mobile-menu-btn]');
  const sidebar = $('#appSidebar') || $('[data-mobile-menu]');
  const sidebarOverlay = $('#appSidebarOverlay');

  const sidebarIsOffcanvas = () => sidebar && sidebar.id === 'appSidebar';

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
    sidebarBtn.addEventListener('click', () => (sidebarIsOpen() ? sidebarClose() : sidebarOpen()));
    $$('[data-close="sidebar"]').forEach((el) => el.addEventListener('click', sidebarClose));

    // ✅ UX: cerrar el menú al navegar (click en links dentro del sidebar)
    sidebar.addEventListener('click', (e) => {
      // Close sidebar after navigating (any real link inside the sidebar)
      const a = e.target.closest('a')
      if (a && sidebar.contains(a)) {
        const href = a.getAttribute('href')
        if (href && href !== '#') {
          sidebarClose()
          return
        }
      }

      const btn = e.target.closest('button')
      if (btn && sidebar.contains(btn) && btn.type === 'submit') {
        sidebarClose()
      }
    })


    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') sidebarClose();
    });
  }


  // ----------------------------
  // Dropdown cuenta (data-menu="id")
  // ----------------------------
  const initDropdowns = () => {
    const ANIM_MS = 170;

    $$('[data-menu]').forEach((btn) => {
      const id = btn.getAttribute('data-menu');
      const menu = id ? document.getElementById(id) : null;
      if (!menu) return;

      let closeTimer = null;

      const close = () => {
        btn.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');

        window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(() => {
          if (btn.getAttribute('aria-expanded') === 'true') return;
          menu.classList.add('hidden');
        }, ANIM_MS);
      };

      const open = () => {
        window.clearTimeout(closeTimer);
        menu.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => {
          menu.classList.add('is-open');
        });
      };

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = menu.classList.contains('is-open');
        isOpen ? close() : open();
      });

      document.addEventListener('click', (e) => {
        if (btn.contains(e.target)) return;
        if (menu.contains(e.target)) return;
        close();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      });
    });
  };
  initDropdowns();

  // ----------------------------
  // Selector de cantidad (detalle producto)
  // ----------------------------
  const initProductQtyPicker = () => {
    $$('[data-product-qty]').forEach((wrap) => {
      const input = $('[data-product-qty-input]', wrap);
      const minus = $('[data-product-qty-minus]', wrap);
      const plus = $('[data-product-qty-plus]', wrap);
      if (!input) return;

      const getMax = () => {
        const max = parseInt(input.getAttribute('max') || '1', 10);
        return Number.isFinite(max) && max > 0 ? max : 1;
      };

      const clamp = (n) => Math.max(1, Math.min(getMax(), n));
      const getVal = () => clamp(parseInt(input.value || '1', 10));

      const sync = () => {
        const v = getVal();
        const max = getMax();
        input.value = String(v);
        if (minus) minus.disabled = input.disabled || v <= 1;
        if (plus) plus.disabled = input.disabled || v >= max;
      };

      minus?.addEventListener('click', (e) => {
        e.preventDefault();
        input.value = String(clamp(getVal() - 1));
        sync();
      });

      plus?.addEventListener('click', (e) => {
        e.preventDefault();
        input.value = String(clamp(getVal() + 1));
        sync();
      });

      input.addEventListener('input', sync);
      input.addEventListener('blur', sync);
      sync();
    });
  };
  initProductQtyPicker();

  // ----------------------------
  // Toast (bottom-sheet)
  // ----------------------------
  let overlay = $('#cartAddedOverlay');
  let sheet = $('#cartAddedSheet');
  let autoCloseTimer = null;
  let unlockTimer = null;
  let toastEscBound = false;

  const bindToastInteractions = () => {
    if (!overlay) return;
    if (overlay.dataset.toastBound === '1') return;

    overlay.dataset.toastBound = '1';

    $$('[data-cart-added-close]', overlay).forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        closeToast();
      });
    });

    if (!toastEscBound) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeToast();
      });
      toastEscBound = true;
    }
  };

  const ensureToast = () => {
    overlay = $('#cartAddedOverlay');
    sheet = $('#cartAddedSheet');
    if (overlay && sheet) {
      bindToastInteractions();
      return;
    }

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
                <div class="font-black text-zinc-900" id="cartAddedTitle">Agregado al carrito ✅</div>
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

    overlay = $('#cartAddedOverlay');
    sheet = $('#cartAddedSheet');
    bindToastInteractions();
  };

  const openToast = (message = 'Producto', title = 'Agregado al carrito ✅') => {
    ensureToast();

    const titleEl = $('#cartAddedTitle');
    if (titleEl) titleEl.textContent = title;

    const nameEl = $('#cartAddedName');
    if (nameEl) nameEl.textContent = message;

    lockScroll('toast');

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

    unlockTimer = window.setTimeout(() => unlockScroll('toast'), 260);
  };

  // ----------------------------
  // Cart badge (UI)
  // ----------------------------
  const bumpCartBadge = (delta = 1) => {
    const cartLink = $('a[aria-label="Carrito"]');
    if (!cartLink) return;

    let badge = $('[data-cart-count]', cartLink);
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
    if (form.dataset.addToCart === '1') return true;

    const action = (form.getAttribute('action') || '').toLowerCase();
    return action.includes('/carrito/agregar') || action.includes('/cart/add');
  };

  const getProductNameFromContext = (form) => {
    const btn = form.querySelector('button[type="submit"]');
    const dn = btn?.getAttribute('data-product-name');
    if (dn) return dn;

    const card = form.closest('.product-card, .card');
    const title =
      card?.querySelector('.product-title')?.textContent?.trim() ||
      card?.querySelector('.page-title')?.textContent?.trim();

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
            'Accept': 'application/json',
          },
        });

        if (res.status === 422) {
          const j = await res.json().catch(() => null);
          openToast(j?.message || 'No se pudo agregar.', 'No se pudo agregar ❌');
          return;
        }

        if (!res.ok) {
          if (res.status === 419) openToast('Sesión expirada. Reintentá.', 'Error');
          else openToast('No se pudo agregar. Reintentá.', 'Error');
          return;
        }

        const j = await res.json().catch(() => null);
        if (typeof j?.cartCount === 'number') {
          // setea el número real (mejor que “+1”)
          const cartLink = $('a[aria-label="Carrito"]');
          if (cartLink) {
            let badge = $('[data-cart-count]', cartLink);

            if (j.cartCount <= 0) {
              badge?.remove();
            } else {
              if (!badge) {
                badge = document.createElement('span');
                badge.setAttribute('data-cart-count', '1');
                badge.className =
                  'absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-sky-600 text-white text-[11px] leading-5 font-black flex items-center justify-center ring-2 ring-white';
                cartLink.appendChild(badge);
              }
              badge.textContent = String(j.cartCount);
            }
          }
        } else {
          bumpCartBadge(qty);
        }

        openToast(productName, 'Agregado al carrito ✅');


      } catch (_) {
        openToast('Error de red. Reintentá.');
      } finally {
        setBtnLoading(btn, false);
      }
    },
    true
  );

  const { showMiniToast } = initCartAndCheckout({ $, afterPaint, openToast });

  initAdminOrdersStatusAndWhatsapp({ afterPaint, lockScroll, unlockScroll, showMiniToast });
  initAdminProductsQuickActions({ showMiniToast });
  initAdminCategoriesQuickToggle({ showMiniToast });
  initRepairDeviceCatalog();
  initAdminModelGroups();
  initRepairIssueCatalog();

  initRepairCreateAdvancedToggle();
  initRepairCreateFinanceToggle();
  initUICollapsibles();
  initRepairCreateSummaryAndPhone();
  initAdminAssetUploadDropzones();
});
