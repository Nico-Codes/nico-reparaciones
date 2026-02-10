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
  // Toast (bottom-sheet)
  // ----------------------------
  let overlay = $('#cartAddedOverlay');
  let sheet = $('#cartAddedSheet');
  let autoCloseTimer = null;
  let unlockTimer = null;

  const ensureToast = () => {
    overlay = $('#cartAddedOverlay');
    sheet = $('#cartAddedSheet');
    if (overlay && sheet) return;

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

    $$('[data-cart-added-close]', overlay).forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        closeToast();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeToast();
    });
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

  const adminBadgeClass = (st) => {
    switch (st) {
      case 'pendiente': return 'badge-amber';
      case 'confirmado': return 'badge-sky';
      case 'preparando': return 'badge-indigo';
      case 'listo_retirar': return 'badge-emerald';
      case 'entregado': return 'badge-zinc';
      case 'cancelado': return 'badge-rose';
      default: return 'badge-zinc';
    }
  };

  // Bottom-sheet confirm (reutiliza el estilo del toast)
  let adminConfirm = null;

  const ensureAdminConfirm = () => {
    if (adminConfirm) return adminConfirm;

    const html = `
      <div id="nrAdminConfirmOverlay"
           class="fixed inset-0 z-[70] opacity-0 pointer-events-none transition-opacity duration-300 ease-out">
        <div class="absolute inset-0 bg-zinc-950/40" data-admin-confirm-cancel></div>

        <div id="nrAdminConfirmSheet"
             class="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-lg translate-y-full transform transition-transform duration-300 ease-out will-change-transform">
          <div class="rounded-t-3xl bg-white p-4 shadow-2xl">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-black text-zinc-900" id="nrAdminConfirmTitle">¿Notificar?</div>
                <div class="text-sm text-zinc-600 mt-1" id="nrAdminConfirmMsg">—</div>
              </div>
              <button type="button" class="icon-btn" data-admin-confirm-cancel aria-label="Cerrar">✕</button>
            </div>

            <div class="mt-4 flex gap-2">
              <button type="button" class="btn-primary flex-1 justify-center" data-admin-confirm-ok>
                Abrir WhatsApp
              </button>
              <button type="button" class="btn-outline flex-1 justify-center" data-admin-confirm-cancel>
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('nrAdminConfirmOverlay');
    const sheet = document.getElementById('nrAdminConfirmSheet');
    const titleEl = document.getElementById('nrAdminConfirmTitle');
    const msgEl = document.getElementById('nrAdminConfirmMsg');
    const okBtn = overlay.querySelector('[data-admin-confirm-ok]');

    let resolver = null;

    const close = (val) => {
      overlay.classList.add('pointer-events-none', 'opacity-0');
      overlay.classList.remove('pointer-events-auto', 'opacity-100');
      sheet.classList.add('translate-y-full');

      unlockScroll('admin-confirm');

      const r = resolver;
      resolver = null;
      if (typeof r === 'function') r(val);
    };

    overlay.querySelectorAll('[data-admin-confirm-cancel]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); close(false); });
    });

    okBtn.addEventListener('click', (e) => { e.preventDefault(); close(true); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && resolver) close(false);
    });

    adminConfirm = {
      open: ({ title, message, okText, cancelText }) =>
        new Promise((resolve) => {
          resolver = resolve;

          if (titleEl) titleEl.textContent = title || '¿Notificar por WhatsApp?';
          if (msgEl) msgEl.textContent = message || '';
          if (okText) okBtn.textContent = okText;

          const cancelBtn = overlay.querySelector('button[data-admin-confirm-cancel].btn-outline');
          if (cancelBtn && cancelText) cancelBtn.textContent = cancelText;

          lockScroll('admin-confirm');

          overlay.classList.remove('pointer-events-none', 'opacity-0');
          overlay.classList.add('pointer-events-auto', 'opacity-100');

          afterPaint(() => sheet.classList.remove('translate-y-full'));
        }),
    };

    return adminConfirm;
  };

    const postFormJson = async (form) => {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
        body: new FormData(form),
      });

      let data = null;
      try { data = await res.json(); } catch (_) {}

      if (res.ok && data?.ok) return data;

      const msg =
        (data && (data.message || data.error)) ||
        (data && data.errors && Object.values(data.errors).flat().join(' ')) ||
        'No se pudo completar la acción.';

      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    };


  const setValueOrText = (el, value) => {
    if (!el) return;
    const v = String(value ?? '');
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.value = v;
    else el.textContent = v;
  };

  const getAdminOrdersFilter = () => {
    // 1) Preferimos lo que viene del Blade (más confiable)
    const root = document.querySelector('[data-admin-orders-filter]');
    const domVal = (root?.getAttribute('data-admin-orders-filter') || '').trim();
    if (domVal && domVal !== 'all') return domVal;

    // 2) Fallback por URL
    const params = new URLSearchParams(window.location.search);
    const qVal = (params.get('status') || '').trim();
    return qVal && qVal !== 'all' ? qVal : '';
  };

  const getAdminOrdersWaFilter = () => {
    const params = new URLSearchParams(window.location.search);
    const v = (params.get('wa') || '').trim();
    return ['pending','sent','no_phone'].includes(v) ? v : '';
  };

  const waStateToTabKey = (state) => {
    if (state === 'ok') return 'sent';
    if (state === 'pending') return 'pending';
    if (state === 'no_phone') return 'no_phone';
    return '';
  };

  const matchesWaFilter = (filter, state) => {
    if (!filter) return true;
    if (filter === 'pending') return state === 'pending';
    if (filter === 'sent') return state === 'ok';
    if (filter === 'no_phone') return state === 'no_phone';
    return true;
  };

  const bumpAdminOrdersWaTab = (key, delta) => {
    const el = document.querySelector(`[data-admin-orders-wa-count="${key}"]`);
    if (!el) return;
    const curr = parseInt(el.textContent || '0', 10) || 0;
    el.textContent = String(Math.max(0, curr + (parseInt(delta,10)||0)));
  };


  const bumpAdminOrdersTab = (st, delta) => {
    const key = String(st || '').trim();
    if (!key) return;

    const el = document.querySelector(`[data-admin-orders-count="${key}"]`);
    if (!el) return;

    const curr = parseInt((el.textContent || '0').trim(), 10) || 0;
    const next = Math.max(0, curr + (parseInt(delta, 10) || 0));
    el.textContent = String(next);
  };

  let adminOrderTransitionsCache = null;
  const getAdminOrderTransitions = (card) => {
    if (adminOrderTransitionsCache) return adminOrderTransitionsCache;

    const source =
      (card && (card.closest('[data-admin-order-transitions]') || (card.hasAttribute('data-admin-order-transitions') ? card : null))) ||
      document.querySelector('[data-admin-order-transitions]');

    let parsed = {};
    if (source) {
      try {
        const raw = source.getAttribute('data-admin-order-transitions') || '{}';
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') parsed = data;
      } catch (_) {}
    }

    adminOrderTransitionsCache = parsed;
    return parsed;
  };

  const syncStatusOptions = (card, currentStatus) => {
    const transitions = getAdminOrderTransitions(card);
    const allowed = Array.isArray(transitions?.[currentStatus])
      ? transitions[currentStatus].map((v) => String(v))
      : [];
    const allowedSet = new Set(allowed);
    let hasEnabledOption = false;

    card.querySelectorAll('[data-admin-order-set-status]').forEach((b) => {
      const btnStatus = String(b.getAttribute('data-status') || '').trim();
      const isCur = btnStatus === currentStatus;
      const canPick = isCur || allowedSet.has(btnStatus);
      const shouldDisable = !canPick || isCur;

      b.classList.toggle('bg-zinc-100', isCur);
      b.disabled = shouldDisable;
      b.classList.toggle('opacity-60', shouldDisable);
      b.classList.toggle('cursor-not-allowed', shouldDisable);

      if (!shouldDisable) hasEnabledOption = true;
    });

    const menuBtn = card.querySelector('[data-admin-order-status-btn]');
    if (menuBtn) {
      menuBtn.disabled = !hasEnabledOption;
      menuBtn.classList.toggle('opacity-60', !hasEnabledOption);
      menuBtn.classList.toggle('cursor-not-allowed', !hasEnabledOption);
    }
  };

  const ensureAdminOrdersEmpty = () => {
    const list = document.querySelector('[data-admin-orders-list]');
    if (!list) return;

    if (list.querySelector('[data-admin-order-card]')) return;

    list.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="font-black text-zinc-900">No hay pedidos</div>
          <div class="muted mt-1">Probá cambiar el estado o ajustar la búsqueda.</div>
        </div>
      </div>
    `;
  };

  // Animación "más visible" para admin (fade + slide + collapse)
  const animateAdminOut = (el) =>
    new Promise((resolve) => {
      if (!el) return resolve();

      el.style.overflow = 'hidden';
      el.style.willChange = 'height, opacity, transform';

      const h = el.offsetHeight;
      el.style.height = `${h}px`;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      el.style.transition = 'height 260ms ease, opacity 220ms ease, transform 220ms ease';

      requestAnimationFrame(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        el.style.height = '0px';
      });

      el.addEventListener(
        'transitionend',
        () => {
          el.remove();
          resolve();
        },
        { once: true }
      );
    });

    const waBadgeClass = (state) => {
      switch (state) {
        case 'ok': return 'badge-emerald';
        case 'pending': return 'badge-amber';
        case 'no_phone': return 'badge-zinc';
        default: return 'badge-zinc';
      }
    };

    const waBadgeText = (state) => {
      switch (state) {
        case 'ok': return 'WA OK';
        case 'pending': return 'WA pendiente';
        case 'no_phone': return 'Sin tel';
        default: return 'WA';
      }
    };

    const setWaBadgeState = (el, state) => {
      if (!el) return;
      el.dataset.waState = state;
      el.className = waBadgeClass(state);
      el.textContent = waBadgeText(state);
    };


  document.querySelectorAll('[data-admin-order-card]').forEach((card) => {
    const statusForm = card.querySelector('form[data-admin-order-status-form]');
    const waForm = card.querySelector('form[data-admin-order-wa-form]');
    const badgeEls = card.querySelectorAll('[data-admin-order-status-badge]');
    const waLink = card.querySelector('[data-admin-order-wa-link]');
    const waOpenBtn = card.querySelector('[data-admin-order-wa-open]');
    const waBadge = card.querySelector('[data-admin-order-wa-badge]');
    const waLastBadge = card.querySelector('[data-admin-order-wa-last]');

    const waMsgEls = card.querySelectorAll('[data-admin-order-wa-message]');

    const menuBtn = card.querySelector('[data-admin-order-status-btn]');
    const menuId = menuBtn?.getAttribute('data-menu');
    const menu = menuId ? document.getElementById(menuId) : null;
    const initialStatus = String(card.dataset.status || '').trim();

    syncStatusOptions(card, initialStatus);

    // Botón WhatsApp en el detalle: abrir WA y registrar log (sin confirm)
    if (waOpenBtn && waForm) {
      waOpenBtn.addEventListener('click', async (e) => {
        const href = waLink?.getAttribute('href') || waOpenBtn.getAttribute('href');
        if (!href) return;

        e.preventDefault();
        window.open(href, '_blank', 'noopener');

        try {
          const data = await postFormJson(waForm);
          showMiniToast(data?.created ? 'Log WhatsApp registrado ✅' : 'Ya había un log reciente ✅');

          if (waBadge) {
            waBadge.textContent = 'WA OK';
            waBadge.className = 'badge-emerald';
            waBadge.dataset.waState = 'ok';
          }

          // actualizar "Último"
          if (data?.log) {
            const lastAt = card.querySelector('[data-admin-wa-last-at]');
            const lastBy = card.querySelector('[data-admin-wa-last-by]');
            if (lastAt && data.log.sent_at) lastAt.textContent = data.log.sent_at;
            if (lastBy && data.log.sent_by) lastBy.textContent = data.log.sent_by;

            // agregar item al listado (si existe en esta vista)
            const list = card.querySelector('[data-admin-wa-log-list]');
            if (list) {
              card.querySelector('[data-admin-wa-log-empty]')?.remove();

              const li = document.createElement('li');
              li.className = 'rounded-xl border border-zinc-200 p-3';

              const title = document.createElement('div');
              title.className = 'flex items-center justify-between gap-2';

              const st = document.createElement('div');
              st.className = 'font-extrabold text-zinc-900';
              st.textContent = data.log.status_label || data.log.status || '—';

              const at = document.createElement('div');
              at.className = 'text-xs text-zinc-500';
              at.textContent = data.log.sent_at || '—';

              title.appendChild(st);
              title.appendChild(at);

              const by = document.createElement('div');
              by.className = 'text-xs text-zinc-500 mt-1';
              by.textContent = data.log.sent_by || '—';

              const details = document.createElement('details');
              details.className = 'mt-2';

              const summary = document.createElement('summary');
              summary.className = 'text-xs font-black text-zinc-600 cursor-pointer select-none';
              summary.textContent = 'Ver mensaje';

              const msg = document.createElement('div');
              msg.className = 'mt-2 text-xs whitespace-pre-wrap text-zinc-700';
              msg.textContent = data.log.message || '';

              details.appendChild(summary);
              details.appendChild(msg);

              li.appendChild(title);
              li.appendChild(by);
              li.appendChild(details);

              list.prepend(li);
            }
          }
        } catch (_) {
          showMiniToast('No se pudo registrar el log ⚠️');
        }


      });
    }

    card.querySelectorAll('[data-admin-order-set-status]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();

        const next = btn.getAttribute('data-status');
        if (!next || !statusForm) return;

        if (btn.disabled) return;

        if (card.dataset.busy === '1') return;
        card.dataset.busy = '1';
        if (menuBtn) menuBtn.disabled = true;

        menu?.classList.add('hidden');
        menuBtn?.setAttribute('aria-expanded', 'false');

        const prevSt = String(card.dataset.status || '').trim();

        const stInput = statusForm.querySelector('input[name="status"]');
        const cmInput = statusForm.querySelector('input[name="comment"]');
        if (stInput) stInput.value = next;
        if (cmInput) cmInput.value = '';

        try {
          const data = await postFormJson(statusForm);

          const newSt = data.status || next;
          card.dataset.status = newSt;
          const prevWaState = String(waBadge?.dataset?.waState || 'no_phone');
          const activeStatusFilter = getAdminOrdersFilter();
          const leavingStatusGroup = !!(activeStatusFilter && activeStatusFilter !== newSt);

          // contadores
          if (prevSt && newSt && prevSt !== newSt) {
            bumpAdminOrdersTab(prevSt, -1);
            bumpAdminOrdersTab(newSt, +1);
          }

          // dropdown: activo + disable current
          syncStatusOptions(card, newSt);

          // UI: badges (puede haber 1 o más en la vista)
          badgeEls.forEach((el) => {
            setValueOrText(el, data.status_label || newSt);
            el.className = adminBadgeClass(newSt);
          });

          showMiniToast('Estado actualizado ✅');

          // WhatsApp (si backend devuelve wa.url/message)
          const waUrl = data?.wa?.url || null;
          const waMsg = data?.wa?.message || '';

          if (waLink) {
            if (waUrl) {
              waLink.href = waUrl;
              waLink.classList.remove('pointer-events-none', 'opacity-50');
            } else {
              waLink.removeAttribute('href');
              waLink.classList.add('pointer-events-none', 'opacity-50');
            }
          }

          // WA badge: si hay URL, queda pendiente (hasta notificar); si no, sin tel
          setWaBadgeState(waBadge, waUrl ? 'pending' : 'no_phone');


          if (waMsgEls?.length) {
            waMsgEls.forEach((el) => setValueOrText(el, waMsg));
          }

          // Si hay WA, confirmamos si notificar (como ya venías haciendo)
          if (waUrl) {
            const confirmUI = ensureAdminConfirm();
            const ok = await confirmUI.open({
              title: '¿Notificar por WhatsApp?',
              message: `Pedido #${data.order_id} → ${data.status_label || newSt}`,
              okText: 'Abrir WhatsApp',
              cancelText: 'Ahora no',
            });

            if (ok) {
              window.open(waUrl, '_blank', 'noopener');

              if (waForm) {
                try {
                  const prevState = waBadge?.dataset?.waState || 'no_phone';
                  const prevKey = waStateToTabKey(prevState);

                  const data = await postFormJson(waForm);

                  setWaBadgeState(waBadge, 'ok');
                  if (waLastBadge) waLastBadge.textContent = data?.notified_at_label || 'recién';

                  const nextKey = waStateToTabKey('ok');
                  if (prevKey && nextKey && prevKey !== nextKey) {
                    bumpAdminOrdersWaTab(prevKey, -1);
                    bumpAdminOrdersWaTab(nextKey, +1);
                  }

                  showMiniToast(data?.created ? 'Log WhatsApp registrado ✅' : 'Ya había un log reciente ✅');

                  const waFilter = getAdminOrdersWaFilter();
                  if (waFilter && !matchesWaFilter(waFilter, 'ok')) {
                    await animateAdminOut(card);
                    ensureAdminOrdersEmpty();
                    return;
                  }

                } catch (_) {
                  showMiniToast('No se pudo registrar el log ⚠️');
                }
              }

            }
          }

          const nextWaState = String(data?.wa?.state || (waUrl ? 'pending' : 'no_phone'));
          setWaBadgeState(waBadge, nextWaState);
          if (waLastBadge) waLastBadge.textContent = data?.wa?.notified_at_label || '—';

          // si permanece en el status actual, ajusto contadores por cambio de estado WA
          if (!leavingStatusGroup) {
            const prevKey = waStateToTabKey(prevWaState);
            const nextKey = waStateToTabKey(nextWaState);
            if (prevKey && nextKey && prevKey !== nextKey) {
              bumpAdminOrdersWaTab(prevKey, -1);
              bumpAdminOrdersWaTab(nextKey, +1);
            }
          }

          // Remoción final por filtros
          const waFilter = getAdminOrdersWaFilter();
          const finalWaState = waBadge?.dataset?.waState || nextWaState;
          const removeByWa = !!(waFilter && !matchesWaFilter(waFilter, finalWaState));

          const shouldRemoveFromList = leavingStatusGroup || removeByWa;

          if (shouldRemoveFromList) {
            if (leavingStatusGroup) {
              bumpAdminOrdersWaTab('all', -1);
              const prevKey = waStateToTabKey(prevWaState);
              if (prevKey) bumpAdminOrdersWaTab(prevKey, -1);
            }

            await animateAdminOut(card);
            ensureAdminOrdersEmpty();
            return;
          }


          } catch (err) {
            if (err && err.status === 422) {
              showMiniToast(err.message || 'No se pudo actualizar el estado ⚠️');
            } else {
              statusForm.submit();
            }
          } finally {
            card.dataset.busy = '0';
            syncStatusOptions(card, String(card.dataset.status || '').trim());
          }

      });
    });

  });
    // Admin: Productos (toggles + stock rápido)
    (() => {
      const root = document.querySelector('[data-admin-products]');
      if (!root) return;

      const postFormJson = async (form) => {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
          body: new FormData(form),
        });

        let data = null;
        try { data = await res.json(); } catch (_) {}

        if (!res.ok) {
          const msg = data?.message || (res.status === 419 ? 'Sesión expirada (CSRF) ⚠️' : 'No se pudo completar ⚠️');
          const err = new Error(msg);
          err.status = res.status;
          err.data = data;
          throw err;
        }

        return data;
      };

      const setBusy = (form, busy) => {
        form.dataset.busy = busy ? '1' : '0';
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = !!busy;
        if (busy) btn?.classList.add('opacity-60', 'pointer-events-none');
        else btn?.classList.remove('opacity-60', 'pointer-events-none');
      };

      const updateStockUI = (productId, stock) => {
        const s = Number(stock ?? 0);
        const label = s > 0 ? `Stock: ${s}` : 'Sin stock';
        const ok = s > 0;

        root.querySelectorAll(`[data-stock-label-for="${productId}"]`).forEach(el => {
          el.textContent = label;
          el.classList.toggle('badge-emerald', ok);
          el.classList.toggle('badge-rose', !ok);
        });

        root.querySelectorAll(`[data-stock-input-for="${productId}"]`).forEach(el => {
          el.value = String(s);
        });
      };

      const updateToggleUI = (btn, kind, value) => {
        const on = !!value;

        if (kind === 'active') {
          btn.textContent = on ? 'Activo' : 'Inactivo';
          btn.classList.toggle('badge-emerald', on);
          btn.classList.toggle('badge-zinc', !on);
        }

        if (kind === 'featured') {
          btn.textContent = on ? 'Destacado' : 'Normal';
          btn.classList.toggle('badge-amber', on);
          btn.classList.toggle('badge-zinc', !on);
        }
      };

      root.addEventListener('submit', async (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;

        const toggleKind = form.getAttribute('data-admin-product-toggle');
        const isStock = form.hasAttribute('data-admin-product-stock');

        if (!toggleKind && !isStock) return;

        e.preventDefault();
        if (form.dataset.busy === '1') return;

        setBusy(form, true);

        try {
          const data = await postFormJson(form);

          if (toggleKind) {
            const btn = form.querySelector('[data-toggle-btn]') || form.querySelector('button[type="submit"]');
            if (btn) updateToggleUI(btn, toggleKind, data?.[toggleKind]);
          }

          if (isStock) {
            const pid = form.getAttribute('data-product-id');
            if (pid) updateStockUI(pid, data?.stock ?? 0);
          }

          if (typeof showMiniToast === 'function') showMiniToast(data?.message || 'Actualizado ✅');
        } catch (err) {
          if (typeof showMiniToast === 'function') showMiniToast(err?.message || 'Error ⚠️');
        } finally {
          setBusy(form, false);
        }
      }, true);

      // Bulk actions (productos)
      (() => {
        const bulkBar = root.querySelector('[data-products-bulk-bar]');
        const bulkForm = root.querySelector('[data-admin-products-bulk]');
        const bulkCount = root.querySelector('[data-bulk-count]');
        const selectAll = root.querySelector('[data-bulk-select-all]');
        const actionSel = root.querySelector('[data-bulk-action]');
        const stockInput = root.querySelector('[data-bulk-stock]');
        const applyBtn = root.querySelector('[data-bulk-apply]');
        const clearBtn = root.querySelector('[data-bulk-clear]');

        if (!bulkBar || !bulkForm) return;

        const getChecks = () => Array.from(root.querySelectorAll('[data-bulk-checkbox]'));
        const getSelectedIds = () => getChecks().filter(c => c.checked).map(c => String(c.value));

        const refresh = () => {
          const ids = getSelectedIds();
          const has = ids.length > 0;

          bulkBar.classList.toggle('hidden', !has);
          if (bulkCount) bulkCount.textContent = String(ids.length);

          if (selectAll) {
            const checks = getChecks();
            selectAll.checked = checks.length > 0 && checks.every(c => c.checked);
            selectAll.indeterminate = checks.some(c => c.checked) && !selectAll.checked;
          }

          const action = actionSel?.value || '';
          const needsStock = action === 'set_stock';
          if (stockInput) stockInput.classList.toggle('hidden', !needsStock);

          const canApply = has && action !== '' && (!needsStock || (stockInput && stockInput.value !== ''));
          if (applyBtn) applyBtn.disabled = !canApply;
        };

        // Select all
        if (selectAll) {
          selectAll.addEventListener('change', () => {
            getChecks().forEach(c => { c.checked = selectAll.checked; });
            refresh();
          });
        }

        // Any checkbox change
        root.addEventListener('change', (e) => {
          const t = e.target;
          if (t && t.matches('[data-bulk-checkbox]')) refresh();
          if (t && t.matches('[data-bulk-action]')) refresh();
          if (t && t.matches('[data-bulk-stock]')) refresh();
        }, true);

        // Clear
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            getChecks().forEach(c => { c.checked = false; });
            if (selectAll) { selectAll.checked = false; selectAll.indeterminate = false; }
            if (actionSel) actionSel.value = '';
            if (stockInput) stockInput.value = '';
            refresh();
          });
        }

        // Submit bulk
        bulkForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          const ids = getSelectedIds();
          const action = actionSel?.value || '';
          const needsStock = action === 'set_stock';
          const stockVal = stockInput?.value ?? '';

          if (!ids.length) return;
          if (!action) return;

          if (needsStock && stockVal === '') {
            if (typeof showMiniToast === 'function') showMiniToast('Ingresá el stock para aplicar ⚠️');
            return;
          }

          if (action === 'delete') {
            const ok = confirm('¿Eliminar productos seleccionados? (Se omiten los que tengan pedidos)');
            if (!ok) return;
          }

          try {
            const fd = new FormData(bulkForm);
            ids.forEach(id => fd.append('ids[]', id));

            const res = await fetch(bulkForm.action, {
              method: 'POST',
              headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
              body: fd,
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.ok) {
              throw new Error(data?.message || 'No se pudo aplicar la acción ⚠️');
            }

            if (typeof showMiniToast === 'function') showMiniToast(data?.message || 'Aplicado ✅');
            setTimeout(() => window.location.reload(), 350);
          } catch (err) {
            if (typeof showMiniToast === 'function') showMiniToast(err?.message || 'Error ⚠️');
          }
        });

        // init
        refresh();
      })();


    })();

    // Admin: Categorías (toggle activo rápido)
    (() => {
      const root = document.querySelector('[data-admin-categories]');
      if (!root) return;

      const postFormJson = async (form) => {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
          body: new FormData(form),
        });

        let data = null;
        try { data = await res.json(); } catch (_) {}

        if (!res.ok) {
          const msg = data?.message || (res.status === 419 ? 'Sesión expirada (CSRF) ⚠️' : 'No se pudo completar ⚠️');
          throw new Error(msg);
        }

        return data;
      };

      const updateActiveUI = (btn, active) => {
        const on = !!active;
        btn.textContent = on ? 'Activa' : 'Inactiva';
        btn.classList.toggle('badge-emerald', on);
        btn.classList.toggle('badge-zinc', !on);
      };

      root.addEventListener('submit', async (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (!form.hasAttribute('data-admin-category-toggle')) return;

        e.preventDefault();
        const btn = form.querySelector('[data-active-btn]') || form.querySelector('button[type="submit"]');

        try {
          const data = await postFormJson(form);
          if (btn) updateActiveUI(btn, data?.active);
          if (typeof showMiniToast === 'function') showMiniToast(data?.message || 'Actualizado ✅');
        } catch (err) {
          if (typeof showMiniToast === 'function') showMiniToast(err?.message || 'Error ⚠️');
        }
      }, true);
    })();


  (function initRepairDeviceCatalog(){

    // ✅ Repair Create: pricing auto (costos automáticos)
    const initRepairPricingAuto = () => {
    const root = document.querySelector('[data-repair-pricing-auto]');
    if (!root) return;

    const form = root.closest('form');
    if (!form) return;

    const partsEl = form.querySelector('[data-parts-cost]');
    const laborEl = form.querySelector('[data-labor-cost]');
    const shipEl = form.querySelector('[data-shipping-enabled]');
    const shipAmtEl = form.querySelector('[data-shipping-amount]');
    const profitEl = form.querySelector('[data-profit-display]') || form.querySelector('[data-profit-suggested]');
    const totalEl = form.querySelector('[data-total-display]') || form.querySelector('[data-suggested-total]');

    const finalEl = form.querySelector('[data-final-price]');
    const finalAutoEl = form.querySelector('[data-final-auto]');
    const ruleLabelEl = form.querySelector('[data-pricing-rule-label]');
    const ruleActionEl = form.querySelector('[data-pricing-rule-action]');

    const pricingResolveUrl = '/admin/precios/resolve';
    const pricingCreateBase = root.dataset.pricingCreateBase || '/admin/precios/crear';
    const pricingEditBase = root.dataset.pricingEditBase || '/admin/precios';

    const getSelected = (name) => {
      const el = form.querySelector(`[name="${name}"]`);
      return el ? String(el.value || '') : '';
    };

    let resolveTimer = null;
    let currentRule = null;

    const fmtMoney = (n) => {
      try {
        return new Intl.NumberFormat('es-AR').format(Number(n || 0));
      } catch {
        return String(n || 0);
      }
    };

    const updateRuleAction = ({ ruleId, groupId }) => {
      if (!ruleActionEl) return;

      const deviceTypeId = getSelected('device_type_id');
      const brandId = getSelected('device_brand_id');
      const modelId = getSelected('device_model_id');
      const repairTypeId = getSelected('repair_type_id');

      const canCreate = !!(deviceTypeId && repairTypeId);

      ruleActionEl.classList.toggle('pointer-events-none', !canCreate);
      ruleActionEl.classList.toggle('opacity-50', !canCreate);

      if (ruleId) {
        ruleActionEl.textContent = 'Editar regla';
        ruleActionEl.href = `${pricingEditBase}/${ruleId}/editar`;
        return;
      }

      ruleActionEl.textContent = 'Crear regla';
      if (!canCreate) {
        ruleActionEl.href = pricingCreateBase;
        return;
      }

      const params = new URLSearchParams();
      params.set('device_type_id', deviceTypeId);
      params.set('repair_type_id', repairTypeId);
      if (brandId) params.set('device_brand_id', brandId);
      if (modelId) params.set('device_model_id', modelId);
      if (groupId) params.set('device_model_group_id', groupId);

      ruleActionEl.href = `${pricingCreateBase}?${params.toString()}`;
    };

    const setVal = (el, val) => {
      if (!el) return;
      el.value = val === null || typeof val === 'undefined' ? '' : String(val);
    };

    const compute = () => {
      const parts = Number(partsEl?.value || 0);
      const labor = Number(laborEl?.value || 0);
      const shipOn = !!shipEl?.checked;
      const shipAmt = Number(shipAmtEl?.value || 0);

      let profit = 0;
      let suggested = 0;

      if (currentRule && currentRule.mode === 'fixed') {
        // ✅ modo fijo: total fijo + envío (ganancia sugerida = fijo - repuesto)
        const fixed = Number(currentRule.fixed_total || 0);
        profit = Math.max(0, fixed - parts);
        suggested = fixed + (shipOn ? shipAmt : 0);
        // (labor no impacta el sugerido en modo fijo)
      } else if (currentRule && currentRule.mode === 'margin') {
        const mult = Number(currentRule.multiplier || 0);
        const minProfit = Number(currentRule.min_profit || 0);
        profit = Math.max(parts * mult, minProfit);
        suggested = parts + labor + profit + (shipOn ? shipAmt : 0);
      } else {
        // fallback sin regla
        profit = 0;
        suggested = parts + labor + (shipOn ? shipAmt : 0);
      }

      if (profitEl) setVal(profitEl, Math.round(profit));
      if (totalEl) setVal(totalEl, Math.round(suggested));

      if (finalEl && finalAutoEl?.checked) {
        setVal(finalEl, Math.round(suggested));
      }
    };

    const resolveRule = async () => {
      const deviceTypeId = getSelected('device_type_id');
      const brandId = getSelected('device_brand_id');
      const modelId = getSelected('device_model_id');
      const repairTypeId = getSelected('repair_type_id');

      // si falta info, reset
      if (!deviceTypeId || !repairTypeId) {
        currentRule = null;
        if (ruleLabelEl) ruleLabelEl.textContent = 'Regla: —';
        updateRuleAction({ ruleId: null, groupId: null });
        compute();
        return;
      }

      try {
        const url = new URL(pricingResolveUrl, window.location.origin);
        url.searchParams.set('device_type_id', deviceTypeId);
        url.searchParams.set('repair_type_id', repairTypeId);
        if (brandId) url.searchParams.set('device_brand_id', brandId);
        if (modelId) url.searchParams.set('device_model_id', modelId);

        const res = await fetch(url.toString(), {
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });

        if (!res.ok) throw new Error('resolve failed');
        const data = await res.json();

        currentRule = data?.rule || null;

        // set shipping default si viene en la regla (solo si el campo está en 0/vacío)
        if (currentRule && shipAmtEl) {
          const curShip = Number(shipAmtEl.value || 0);
          if (!curShip && currentRule.shipping_default != null) {
            setVal(shipAmtEl, Math.round(Number(currentRule.shipping_default || 0)));
          }
        }

        // label + link
        if (ruleLabelEl) {
          if (!currentRule) {
            ruleLabelEl.textContent = 'Regla: —';
          } else if (currentRule.mode === 'fixed') {
            ruleLabelEl.textContent = `Regla: Fijo $${fmtMoney(currentRule.fixed_total || 0)} (+ envío $${fmtMoney(currentRule.shipping_default || 0)})`;
          } else {
            ruleLabelEl.textContent = `Regla: x${currentRule.multiplier || 0} (min $${fmtMoney(currentRule.min_profit || 0)}) (+ envío $${fmtMoney(currentRule.shipping_default || 0)})`;
          }
        }

        updateRuleAction({ ruleId: currentRule?.id || null, groupId: data?.group_id || null });
        compute();
      } catch (e) {
        currentRule = null;
        if (ruleLabelEl) ruleLabelEl.textContent = 'Regla: —';
        updateRuleAction({ ruleId: null, groupId: null });
        compute();
      }
    };

    const debouncedResolve = () => {
      clearTimeout(resolveTimer);
      resolveTimer = setTimeout(() => {
        if (ruleLabelEl) ruleLabelEl.textContent = 'Regla: calculando…';
        updateRuleAction({ ruleId: null, groupId: null });
        resolveRule();
      }, 350);
    };

    // listeners
    [
      partsEl,
      laborEl,
      shipEl,
      shipAmtEl,
      form.querySelector('[name="device_type_id"]'),
      form.querySelector('[name="device_brand_id"]'),
      form.querySelector('[name="device_model_id"]'),
      form.querySelector('[name="repair_type_id"]'),
    ].forEach((el) => {
      if (!el) return;
      el.addEventListener('input', () => {
        compute();
        debouncedResolve();
      });
      el.addEventListener('change', () => {
        compute();
        debouncedResolve();
      });
    });

    // si el usuario toca el precio final, apagamos auto
    if (finalEl && finalAutoEl) {
      finalEl.addEventListener('input', () => {
        finalAutoEl.checked = false;
      });
    }

    // init
    updateRuleAction({ ruleId: null, groupId: null });
    debouncedResolve();
    compute();
  };


    initRepairPricingAuto();


    const blocks = document.querySelectorAll('[data-repair-device-catalog]');
    if (!blocks.length) return;

    const headers = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' };

    const getCsrf = () =>
      document.querySelector('input[name="_token"]')?.value || '';

    const setOptions = (select, items, placeholder, selectedId = null) => {
      select.innerHTML = '';
      const opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = placeholder;
      select.appendChild(opt0);

      items.forEach(it => {
        const opt = document.createElement('option');
        opt.value = String(it.id);
        opt.textContent = it.name;
        if (selectedId && String(selectedId) === String(it.id)) opt.selected = true;
        select.appendChild(opt);
      });
    };

    const fetchJson = async (url, opts={}) => {
      const res = await fetch(url, { credentials: 'same-origin', headers, ...opts });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.message || 'Error');
      return j;
    };

    blocks.forEach(block => {
      const typeSel  = block.querySelector('[data-device-type]');
      const brandSel = block.querySelector('[data-device-brand]');
      const modelSel = block.querySelector('[data-device-model]');

      const brandSearch = block.querySelector('[data-brand-search]');
      const modelSearch = block.querySelector('[data-model-search]');

      let brandsList = [];
      let modelsList = [];

      const mode = block.dataset.catalogMode || 'create'; // create | edit


      // ✅ NUEVO: control de carga de modelos (evita “parpadeos” si cambiás rápido)
      let modelsLoadSeq = 0;
      let modelsLoadTimer = null;


      // ✅ Helpers: “desplegar” el select como listbox mientras buscás
      const openList = (sel) => {
        if (!sel) return;
        const n = sel.options?.length || 0;
        if (n <= 1) return; // solo placeholder
        sel.size = Math.min(6, Math.max(2, n)); // ✅ más cómodo en móvil
      };


      const closeList = (sel) => {
        if (!sel) return;
        sel.size = 1;
      };

      const btnAddBrand = block.querySelector('[data-add-brand]');
      const brandForm = block.querySelector('[data-add-brand-form]');
      const brandInput = block.querySelector('[data-add-brand-input]');
      const btnSaveBrand = block.querySelector('[data-save-brand]');
      const btnCancelBrand = block.querySelector('[data-cancel-brand]');

      const btnAddModel = block.querySelector('[data-add-model]');
      const modelForm = block.querySelector('[data-add-model-form]');
      const modelInput = block.querySelector('[data-add-model-input]');
      const btnSaveModel = block.querySelector('[data-save-model]');
      const btnCancelModel = block.querySelector('[data-cancel-model]');

      const loadBrands = async (typeId, selected=null) => {
        brandSel.disabled = true;
        modelSel.disabled = true;
        btnAddModel.disabled = true;

        setOptions(brandSel, [], 'Cargando marcas…');
        setOptions(modelSel, [], '— Elegí una marca primero —');

        const selectedBrandId = selected || brandSel.dataset.selected || '';

        const qs = new URLSearchParams({ type_id: String(typeId), mode });
        if (mode === 'edit' && selectedBrandId) qs.set('selected_brand_id', String(selectedBrandId));

        const j = await fetchJson(`/admin/device-catalog/brands?${qs.toString()}`);
        brandsList = j.brands || [];

        brandSel.disabled = false;
        if (brandSearch) { brandSearch.disabled = false; brandSearch.value = ''; }
        if (btnAddBrand) btnAddBrand.disabled = false;

        setOptions(brandSel, brandsList, '— Elegí una marca —', selectedBrandId);
      };


      const loadModels = async (brandId, selected=null, expectedSeq=null) => {
        modelSel.disabled = true;
        btnAddModel.disabled = true;

        setOptions(modelSel, [], 'Cargando modelos…');

        const selectedModelId = selected || modelSel.dataset.selected || '';

        const qs = new URLSearchParams({ brand_id: String(brandId), mode });
        if (mode === 'edit' && selectedModelId) qs.set('selected_model_id', String(selectedModelId));

        const j = await fetchJson(`/admin/device-catalog/models?${qs.toString()}`);

        // ✅ si cambiaste de marca mientras cargaba, ignorar este resultado
        if (expectedSeq !== null && expectedSeq !== modelsLoadSeq) return;

        modelsList = j.models || [];

        modelSel.disabled = false;
        btnAddModel.disabled = false;

        if (modelSearch) {
          modelSearch.disabled = false;
          modelSearch.value = '';
          modelSearch.placeholder = modelSearch.getAttribute('placeholder') || 'Buscar modelo…';
        }

        setOptions(modelSel, modelsList, '— Elegí un modelo —', selectedModelId);
      };



      // cambios
      typeSel?.addEventListener('change', async () => {
        const typeId = typeSel.value || '';

        // reset marca + modelo (siempre que cambia tipo)
        brandSel.innerHTML = '<option value="">— Elegí un tipo primero —</option>';
        brandSel.disabled = true;

        modelSel.innerHTML = '<option value="">— Elegí una marca primero —</option>';
        modelSel.disabled = true;

        btnAddModel.disabled = true;

        if (btnAddBrand) btnAddBrand.disabled = true;

        if (brandSearch) {
          brandSearch.value = '';
          brandSearch.disabled = true;
        }

        if (modelSearch) {
          modelSearch.value = '';
          modelSearch.disabled = true;
        }

        brandsList = [];
        modelsList = [];

        if (!typeId) return;

        await loadBrands(typeId);

        // ✅ UX: al terminar, te manda directo a Marca
        setTimeout(() => brandSearch?.focus?.(), 0);
      });



      brandSel?.addEventListener('change', async () => {
        // ✅ si estás navegando la lista con flechas, NO recargues modelos todavía
        if (brandSel?.dataset?.nrKbNav === '1' && document.activeElement === brandSel) return;

        const brandId = brandSel.value || '';

        // reset modelo (siempre que cambia marca)
        modelSel.innerHTML = '<option value="">— Elegí una marca primero —</option>';
        modelSel.disabled = true;
        btnAddModel.disabled = true;

        if (modelSearch) {
          modelSearch.value = '';
          modelSearch.disabled = true;
          modelSearch.placeholder = 'Cargando modelos…';
        }

        modelsList = [];

        if (!brandId) return;

        // ✅ delay suave para evitar “cambio muy rápido” y confusión
        const seq = ++modelsLoadSeq;
        if (modelsLoadTimer) clearTimeout(modelsLoadTimer);

        // mantener un toque el estado “cargando”
        setOptions(modelSel, [], 'Cargando modelos…');

          modelsLoadTimer = setTimeout(() => {
            (async () => {
              try {
                await loadModels(brandId, null, seq);

                // ✅ si esta carga sigue siendo la vigente, enfocamos Modelo
                if (seq === modelsLoadSeq) {
                  setTimeout(() => modelSearch?.focus?.(), 0);
                }
              } catch (e) {
                console.error('[NR] loadModels error:', e);
              }
            })();
          }, 250);

      });



      // buscar marca/modelo (filtra opciones cargadas)
      const applyBrandFilter = () => {
        if (!brandSearch) return;
        const q = (brandSearch.value || '').trim().toLowerCase();
        const current = brandSel?.value || null;

        const filtered = !q
          ? brandsList
          : brandsList.filter(b => (b.name || '').toLowerCase().includes(q));

        setOptions(brandSel, filtered, '— Elegí una marca —', current);

        // ✅ “Despliega” automáticamente
        openList(brandSel);
      };

      const applyModelFilter = () => {
        if (!modelSearch) return;
        const q = (modelSearch.value || '').trim().toLowerCase();
        const current = modelSel?.value || null;

        const filtered = !q
          ? modelsList
          : modelsList.filter(m => (m.name || '').toLowerCase().includes(q));

        setOptions(modelSel, filtered, '— Elegí un modelo —', current);

        // ✅ “Despliega” automáticamente
        openList(modelSel);
      };


      brandSearch?.addEventListener('input', applyBrandFilter);
      modelSearch?.addEventListener('input', applyModelFilter);

            // ✅ Si escriben exacto y salen del input, auto-selecciona (evita errores por no apretar Enter)
      brandSearch?.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.activeElement === brandSel) return; // si fue a elegir con mouse/flechas, no molestamos
          if (brandSel.value) return;
          const q = (brandSearch.value || '').trim();
          if (!q) return;
          const hit = firstMatch(brandsList, q);
          if (!hit) return;

          brandSel.value = String(hit.id);
          brandSel.dispatchEvent(new Event('change', { bubbles: true }));
          closeList(brandSel);
        }, 0);
      });

      modelSearch?.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.activeElement === modelSel) return;
          if (modelSel.value) return;
          const q = (modelSearch.value || '').trim();
          if (!q) return;
          const hit = firstMatch(modelsList, q);
          if (!hit) return;

          modelSel.value = String(hit.id);
          modelSel.dispatchEvent(new Event('change', { bubbles: true }));
          closeList(modelSel);
        }, 0);
      });


      // ✅ Mantener la lista abierta cuando pasás del input al select (para poder navegar con flechas)
        const keepListWhileInteracting = (searchEl, selEl) => {
        if (!searchEl || !selEl) return;

        const syncInputFromSelect = () => {
          const label = selEl.options[selEl.selectedIndex]?.text || '';
          if (label && !label.startsWith('—')) searchEl.value = label;
        };

        const setPrev = () => { selEl.dataset.nrPrevValue = String(selEl.value || ''); };
        const changed = () => String(selEl.value || '') !== String(selEl.dataset.nrPrevValue || '');

        const startKbNav = () => { selEl.dataset.nrKbNav = '1'; };
        const stopKbNav  = () => { delete selEl.dataset.nrKbNav; };

        const commit = () => {
          stopKbNav();
          syncInputFromSelect();
          closeList(selEl);

          // si cambió realmente, forzar un change “final” (para que marca cargue modelos una sola vez)
          if (changed()) selEl.dispatchEvent(new Event('change', { bubbles: true }));
          setPrev();
        };

        const maybeClose = () => {
          setTimeout(() => {
            const ae = document.activeElement;
            if (ae !== searchEl && ae !== selEl) {
              // al salir del control, confirmamos y cerramos
              commit();
            }
          }, 0);
        };

        searchEl.addEventListener('focus', () => openList(selEl));

        selEl.addEventListener('focus', () => {
          setPrev();
          openList(selEl);
        });

        searchEl.addEventListener('blur', maybeClose);
        selEl.addEventListener('blur', maybeClose);

        // ✅ teclado dentro del select
        selEl.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            startKbNav();
            openList(selEl);
            return; // dejamos que el browser navegue
          }

          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            return;
          }

          if (e.key === 'Escape') {
            e.preventDefault();
            stopKbNav();
            closeList(selEl);
            searchEl.focus();
          }
        });

        // ✅ si el change es por flechas mientras está enfocado, NO cerrar ni sync
        selEl.addEventListener('change', () => {
          if (selEl.dataset.nrKbNav === '1' && document.activeElement === selEl) return;

          // mouse click / selección externa: confirmar
          stopKbNav();
          syncInputFromSelect();
          closeList(selEl);
          setPrev();
        });

        // ✅ desde el input, ↓/↑ pasa al select para navegar sin cerrar
        searchEl.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
          if (searchEl.disabled) return;
          e.preventDefault();

          openList(selEl);
          startKbNav();
          selEl.focus();

          if ((selEl.selectedIndex ?? 0) <= 0 && selEl.options.length > 1) {
            selEl.selectedIndex = 1;
          }
        });
      };

      keepListWhileInteracting(brandSearch, brandSel);
      keepListWhileInteracting(modelSearch, modelSel);


      // helpers (DEJAR SOLO UNA VEZ)
      const openBrandFormPrefill = (value) => {
        if (!brandForm || !brandInput) return;
        brandForm.classList.remove('hidden');
        brandForm.classList.add('flex');
        brandInput.value = (value || '').trim();
        brandInput.focus();
        brandInput.select?.();
      };

      const openModelFormPrefill = (value) => {
        if (!modelForm || !modelInput) return;
        modelForm.classList.remove('hidden');
        modelForm.classList.add('flex');
        modelInput.value = (value || '').trim();
        modelInput.focus();
        modelInput.select?.();
      };

      const firstMatch = (list, q) => {
        const s = (q || '').trim().toLowerCase();
        if (!s) return null;
        return (
          list.find(x => (x.name || '').toLowerCase() === s) ||
          list.find(x => (x.name || '').toLowerCase().startsWith(s)) ||
          null
        );
      };

      // ENTER en buscador de marca: si matchea, selecciona; si no, abre alta con el texto
      brandSearch?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        if (brandSearch.disabled) return;
        const q = (brandSearch.value || '').trim();
        if (!q) return;

        const hit = firstMatch(brandsList, q);
        if (hit) {
          brandSel.value = String(hit.id);

          // refleja el nombre exacto en el input
          const label = brandSel.options[brandSel.selectedIndex]?.text || q;
          if (label && !label.startsWith('—')) brandSearch.value = label;

          brandSel.dispatchEvent(new Event('change', { bubbles: true })); // carga modelos
          closeList(brandSel);
          setTimeout(() => modelSearch?.focus(), 0);
          return;
        }

        openBrandFormPrefill(q);
      });

      // ENTER en buscador de modelo: si matchea, selecciona; si no, abre alta con el texto
      modelSearch?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        if (modelSearch.disabled) return;
        const q = (modelSearch.value || '').trim();
        if (!q) return;

        const hit = firstMatch(modelsList, q);
        if (hit) {
          modelSel.value = String(hit.id);
          modelSel.dispatchEvent(new Event('change', { bubbles: true }));

          const label = modelSel.options[modelSel.selectedIndex]?.text || q;
          if (label && !label.startsWith('—')) modelSearch.value = label;

          closeList(modelSel);

          // salto a "Falla principal" si existe
          document.querySelector('[data-issue-search]')?.focus?.();
          return;
        }

        openModelFormPrefill(q);
      });


      // agregar marca
      btnAddBrand?.addEventListener('click', () => {
        const v = (brandSearch?.value || '').trim();
        brandForm.classList.toggle('hidden');
        brandForm.classList.toggle('flex');
        if (brandInput) brandInput.value = v || brandInput.value || '';
        brandInput?.focus();
        brandInput?.select?.();
      });

      btnCancelBrand?.addEventListener('click', () => {
        brandForm.classList.add('hidden');
        brandForm.classList.remove('flex');
        if (brandInput) brandInput.value = '';
      });
      btnSaveBrand?.addEventListener('click', async () => {
        const name = (brandInput?.value || '').trim();
        const typeId = typeSel?.value;
        if (!typeId || !name) return;

        const fd = new FormData();
        fd.append('_token', getCsrf());
        fd.append('device_type_id', typeId);
        fd.append('name', name);

        const j = await fetchJson('/admin/device-catalog/brands', { method: 'POST', body: fd });
        await loadBrands(typeId, j.brand?.id);
        btnCancelBrand?.click();
        window.openToast?.('Marca agregada ✅', 'OK');
      });

      // agregar modelo
      btnAddModel?.addEventListener('click', () => {
        if (btnAddModel.disabled) return;
        const v = (modelSearch?.value || '').trim();
        modelForm.classList.toggle('hidden');
        modelForm.classList.toggle('flex');
        if (modelInput) modelInput.value = v || modelInput.value || '';
        modelInput?.focus();
        modelInput?.select?.();
      });

      btnCancelModel?.addEventListener('click', () => {
        modelForm.classList.add('hidden');
        modelForm.classList.remove('flex');
        if (modelInput) modelInput.value = '';
      });
      btnSaveModel?.addEventListener('click', async () => {
        const name = (modelInput?.value || '').trim();
        const brandId = brandSel?.value;
        if (!brandId || !name) return;

        const fd = new FormData();
        fd.append('_token', getCsrf());
        fd.append('device_brand_id', brandId);
        fd.append('name', name);

        const j = await fetchJson('/admin/device-catalog/models', { method: 'POST', body: fd });
        await loadModels(brandId, j.model?.id);
        btnCancelModel?.click();
        window.openToast?.('Modelo agregado ✅', 'OK');
      });

      brandInput?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        btnSaveBrand?.click();
      });

      modelInput?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        btnSaveModel?.click();
      });




      // init (si viene preseleccionado)
      const initType = typeSel?.value;
      if (initType) {
        loadBrands(initType).then(() => {
          const initBrand = brandSel?.value;
          if (initBrand) loadModels(initBrand);
        });
      }
    });
  })();

  // ✅ Admin: asignar modelos a grupos (guardar automático)
  const initAdminModelGroups = () => {
    const root = document.querySelector('[data-admin-model-groups]');
    if (!root) return;

    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    root.querySelectorAll('select[data-model-id]').forEach(sel => {
      sel.addEventListener('change', async () => {
        const modelId = sel.getAttribute('data-model-id');
        const device_model_group_id = sel.value || '';

        try {
          const res = await fetch(`/admin/grupos-modelos/modelo/${modelId}/asignar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...(token ? { 'X-CSRF-TOKEN': token } : {}),
            },
            body: JSON.stringify({ device_model_group_id: device_model_group_id || null }),
          });

          if (!res.ok) {
            // fallback simple
            sel.classList.add('ring-2','ring-red-400');
            setTimeout(() => sel.classList.remove('ring-2','ring-red-400'), 1200);
            return;
          }

          sel.classList.add('ring-2','ring-emerald-400');
          setTimeout(() => sel.classList.remove('ring-2','ring-emerald-400'), 600);
        } catch (e) {
          sel.classList.add('ring-2','ring-red-400');
          setTimeout(() => sel.classList.remove('ring-2','ring-red-400'), 1200);
        }
      });
    });
  };

  initAdminModelGroups();


  ;(function initRepairIssueCatalog() {
    const blocks = document.querySelectorAll('[data-repair-issue-catalog]');
    if (!blocks.length) return;

    const getCsrf = (form) =>
      document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      || form?.querySelector('input[name="_token"]')?.value
      || '';

    const fetchJson = async (url, opts = {}) => {
      const res = await fetch(url, {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          ...(opts.headers || {}),
        },
        ...opts,
      });

      let data = null;
      try { data = await res.json(); } catch (_) {}

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return data;
    };

    const openList = (sel) => {
      if (!sel) return;
      const n = sel.options?.length || 0;
      if (n <= 1) return;
      sel.size = Math.min(8, Math.max(2, n));
    };

    const closeList = (sel) => {
      if (!sel) return;
      sel.size = 1;
    };

    const firstMatch = (list, q) => {
      const s = (q || '').trim().toLowerCase();
      if (!s) return null;
      return (
        list.find(x => (x.name || '').toLowerCase() === s) ||
        list.find(x => (x.name || '').toLowerCase().startsWith(s)) ||
        null
      );
    };

    blocks.forEach((block) => {
      const form = block.closest('form');
      const mode = block.dataset.catalogMode || 'create'; // create | edit


      // el tipo está en el catálogo de device (mismo form)
      const typeSel = form?.querySelector('[data-device-type]');
      const issueSearch = block.querySelector('[data-issue-search]');
      const issueSel = block.querySelector('[data-issue-select]');
      const btnAddIssue = block.querySelector('[data-add-issue]');

      if (!typeSel || !issueSearch || !issueSel) return;

      let issuesList = [];

      const setEnabled = (enabled) => {
        issueSearch.disabled = !enabled;
        issueSel.disabled = !enabled;
        if (btnAddIssue) btnAddIssue.disabled = !enabled;
        if (!enabled) {
          issueSearch.value = '';
          issueSel.innerHTML = '<option value="">Elegí una falla…</option>';
          closeList(issueSel);
        }
      };

      const setOptions = (items, selectedId) => {
        issuesList = (items || []).map(x => ({ id: x.id, name: x.name }));

        const keep = issueSel.querySelector('option[value=""]')?.textContent || 'Elegí una falla…';
        issueSel.innerHTML = `<option value="">${keep}</option>`;
        for (const it of issuesList) {
          const opt = document.createElement('option');
          opt.value = String(it.id);
          opt.textContent = it.name;
          issueSel.appendChild(opt);
        }

        if (selectedId) {
          issueSel.value = String(selectedId);
          const label = issueSel.options[issueSel.selectedIndex]?.text || '';
          if (label) issueSearch.value = label;
        }
      };

        const loadIssues = async (typeId, selectedId = null) => {
          if (!typeId) {
            setEnabled(false);
            return;
          }

          setEnabled(true);

          const sel = selectedId || issueSel?.dataset?.selected || '';

          const qs = new URLSearchParams({ type_id: String(typeId), mode });
          if (mode === 'edit' && sel) qs.set('selected_issue_id', String(sel));

          const data = await fetchJson(`/admin/device-catalog/issues?${qs.toString()}`);
          const items = data.issues || [];
          setOptions(items, selectedId);
        };


      // UI inline para crear falla (sin prompt)
      const issueCreateRow    = block.querySelector('[data-issue-create-row]');
      const issueCreateInput  = block.querySelector('[data-issue-create-input]');
      const issueCreateSave   = block.querySelector('[data-issue-create-save]');
      const issueCreateCancel = block.querySelector('[data-issue-create-cancel]');

      const openCreateRow = (prefill = '') => {
        if (!issueCreateRow || !issueCreateInput) return;
        issueCreateRow.classList.remove('hidden');
        issueCreateInput.value = (prefill || '').trim();
        issueCreateInput.focus();
        issueCreateInput.select?.();
      };

      const closeCreateRow = () => {
        if (!issueCreateRow || !issueCreateInput) return;
        issueCreateRow.classList.add('hidden');
        issueCreateInput.value = '';
      };

      const createIssue = async (name) => {
        const typeId = (typeSel.value || '').trim();
        if (!typeId) return null;

        const fd = new FormData();
        fd.append('type_id', typeId);
        fd.append('name', name);

        const csrf = getCsrf(form);
        const data = await fetchJson('/admin/device-catalog/issues', {
          method: 'POST',
          headers: csrf ? { 'X-CSRF-TOKEN': csrf } : {},
          body: fd,
        });

        return data?.issue?.id || null;
      };

      const saveIssueFromRow = async () => {
        const typeId = (typeSel.value || '').trim();
        if (!typeId) return;

        const name = (issueCreateInput?.value || '').trim();
        if (!name) return;

        const newId = await createIssue(name);
        if (newId) {
          await loadIssues(typeId, newId);
          issueSel.value = String(newId);
          issueSel.dispatchEvent(new Event('change', { bubbles: true }));
          closeCreateRow();
          return;
        }

        // fallback
        await loadIssues(typeId, null);
      };

      // Eventos UI
      typeSel.addEventListener('change', async () => {
        closeCreateRow();
        const typeId = (typeSel.value || '').trim();
        const selected = issueSel.getAttribute('data-selected');
        await loadIssues(typeId, selected || null);
        issueSel.removeAttribute('data-selected');
      });

      // Enter: si hay match, selecciona. Si no, ofrece crear inline.
      issueSearch.addEventListener('keydown', async (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        const q = (issueSearch.value || '').trim();
        if (!q) return;

        const hit = firstMatch(issuesList, q);
        if (hit) {
          closeCreateRow();
          issueSel.value = String(hit.id);
          issueSel.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }

        openCreateRow(q);
      });

      // Si escriben una falla exacta y salen del campo, auto-selecciona
      issueSearch.addEventListener('blur', () => {
        setTimeout(() => {
          if (issueSel.value) return;
          if (!issueCreateRow?.classList.contains('hidden')) return;

          const q = (issueSearch.value || '').trim();
          if (!q) return;

          const hit = firstMatch(issuesList, q);
          if (!hit) return;

          issueSel.value = String(hit.id);
          issueSel.dispatchEvent(new Event('change', { bubbles: true }));
        }, 0);
      });

      issueSel.addEventListener('change', () => {
        const label = issueSel.options[issueSel.selectedIndex]?.text || '';
        issueSearch.value = label || '';
        closeList(issueSel);
      });

      // Botones inline (si existen)
      issueCreateSave?.addEventListener('click', saveIssueFromRow);
      issueCreateCancel?.addEventListener('click', closeCreateRow);

      issueCreateInput?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        saveIssueFromRow();
      });

      // Compatibilidad si todavía existiera el botón viejo
      btnAddIssue?.addEventListener('click', () => openCreateRow((issueSearch.value || '').trim()));


      // Init (si ya hay tipo seleccionado)
      (async () => {
        const typeId = (typeSel.value || '').trim();
        const selected = issueSel.getAttribute('data-selected');
        if (typeId) {
          await loadIssues(typeId, selected || null);
          issueSel.removeAttribute('data-selected');
        } else {
          setEnabled(false);
        }
      })();
    });
    })();

    initRepairCreateAdvancedToggle();
    initRepairCreateFinanceToggle();
    initUICollapsibles();
    initRepairCreateSummaryAndPhone();
    initAdminAssetUploadDropzones();
});
