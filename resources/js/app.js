import './bootstrap';
import '../css/app.css';

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

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') sidebarClose();
    });
  }

  // ----------------------------
  // Dropdown cuenta (data-menu="id")
  // ----------------------------
  const initDropdowns = () => {
    $$('[data-menu]').forEach((btn) => {
      const id = btn.getAttribute('data-menu');
      const menu = id ? document.getElementById(id) : null;
      if (!menu) return;

      const close = () => {
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
      };

      const open = () => {
        menu.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
      };

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = !menu.classList.contains('hidden');
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

  const openToast = (productName = 'Producto') => {
    ensureToast();

    const nameEl = $('#cartAddedName');
    if (nameEl) nameEl.textContent = productName;

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
            'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          },
        });

        if (!res.ok) {
          if (res.status === 419) openToast('Sesión expirada. Reintentá.');
          else openToast('No se pudo agregar. Reintentá.');
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

  const serverOverlay = $('#cartAddedOverlay');
  if (serverOverlay?.dataset?.cartAdded === '1') {
    afterPaint(() => openToast($('#cartAddedName')?.textContent?.trim() || 'Producto'));
  }

  // ----------------------------
  // Checkout: resumen colapsable móvil + siempre abierto desktop
  // ----------------------------
  const sumBtn = $('[data-summary-toggle]');
  const sumBody = $('[data-summary-body]');
  const sumIcon = $('[data-summary-icon]');

  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

  const setSummaryOpen = (open) => {
    if (!sumBtn || !sumBody) return;

    sumBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    sumBody.style.display = open ? 'block' : 'none';
    if (sumIcon) sumIcon.textContent = open ? '▴' : '▾';
  };

  const syncSummary = () => {
    if (!sumBtn || !sumBody) return;

    if (isDesktop()) {
      sumBody.style.display = 'block';
      sumBtn.setAttribute('aria-expanded', 'true');
    } else {
      setSummaryOpen(false);
    }
  };

  if (sumBtn && sumBody) {
    syncSummary();
    window.addEventListener('resize', syncSummary);

    sumBtn.addEventListener('click', () => {
      if (isDesktop()) return;
      const expanded = sumBtn.getAttribute('aria-expanded') === 'true';
      setSummaryOpen(!expanded);
    });
  }

  // ----------------------------
  // Checkout: anti doble submit + loading
  // ----------------------------
  const checkoutForm = $('[data-checkout-form]');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      const btn = $('[data-checkout-submit]', checkoutForm);
      if (!btn) return;

      if (btn.disabled || btn.getAttribute('aria-busy') === 'true') {
        e.preventDefault();
        return;
      }

      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');

      const label = $('[data-checkout-label]', btn);
      const loading = $('[data-checkout-loading]', btn);
      if (label) label.classList.add('hidden');
      if (loading) loading.classList.remove('hidden');
      if (loading) loading.classList.add('inline-flex');
    });
  }

  // ---------------------------------------------
  // Preserve scroll para POSTs (carrito, etc.)
  // ---------------------------------------------
  const SCROLL_KEY = 'nr_preserve_scroll';

  const saveScroll = () => {
    try {
      sessionStorage.setItem(
        SCROLL_KEY,
        JSON.stringify({
          path: location.pathname,
          y: window.scrollY,
        })
      );
    } catch (_) {}
  };

  const restoreScroll = () => {
    try {
      const raw = sessionStorage.getItem(SCROLL_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      sessionStorage.removeItem(SCROLL_KEY);
      if (data?.path === location.pathname && Number.isFinite(data?.y)) {
        window.scrollTo(0, data.y);
      }
    } catch (_) {}
  };

  restoreScroll();

  document.addEventListener(
    'submit',
    (e) => {
      const form = e.target;
      if (form?.dataset?.preserveScroll === '1') saveScroll();
    },
    true
  );

  // ---------------------------------------------
  // Carrito: eliminar ítem sin recargar (fade + collapse)
  // ---------------------------------------------
  const formatARS = (value) => {
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

  const showMiniToast = (msg) => {
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

  // ---------------------------------------------
  // Copy to clipboard (para WhatsApp, etc.)
  // ---------------------------------------------
  const copyToClipboard = async (text) => {
    const str = String(text ?? '');
    if (!str) return false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(str);
        return true;
      }
    } catch (_) {}

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
    } catch (_) {
      return false;
    }
  };

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy-target]');
    if (!btn) return;

    e.preventDefault();

    const sel = btn.getAttribute('data-copy-target');
    if (!sel) return;

    const el = document.querySelector(sel);
    if (!el) return;

    const text = (typeof el.value === 'string') ? el.value : (el.textContent || '');
    const ok = await copyToClipboard(text);

    showMiniToast(ok ? (btn.getAttribute('data-copy-toast') || 'Copiado ✅') : 'No se pudo copiar');
  });

  const setNavbarCartCount = (count) => {
    const cartLink = document.querySelector('a[aria-label="Carrito"]');
    if (!cartLink) return;

    const next = Math.max(0, parseInt(count, 10) || 0);
    let badge = cartLink.querySelector('[data-cart-count]');

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

  const animateCollapseRemove = (el) =>
    new Promise((resolve) => {
      if (!el) return resolve();

      el.style.overflow = 'hidden';
      el.style.willChange = 'height, opacity';
      const h = el.offsetHeight;
      el.style.height = `${h}px`;
      el.style.opacity = '1';
      el.style.transition = 'height 220ms ease, opacity 180ms ease';

      requestAnimationFrame(() => {
        el.style.opacity = '0';
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

  const cartGrid = document.querySelector('[data-cart-grid]');
  if (cartGrid) {
    const storeUrl = cartGrid.dataset.storeUrl || '/tienda';
    const renderEmptyCart = () => {
      cartGrid.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="font-black">Tu carrito está vacío.</div>
            <div class="muted" style="margin-top:4px">Agregá productos desde la tienda.</div>
            <div style="margin-top:14px">
              <a href="${storeUrl}" class="btn-primary">Ir a la tienda</a>
            </div>
          </div>
        </div>
      `;
    };

    cartGrid.querySelectorAll('form[data-cart-remove]').forEach((form) => {
      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        const card = form.closest('[data-cart-item]');

        try {
          const res = await fetch(form.action, {
            method: 'POST',
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              Accept: 'application/json',
            },
            body: new FormData(form),
          });

          if (!res.ok) throw new Error('bad response');
          const data = await res.json();
          if (!data?.ok) throw new Error('bad json');

          await animateCollapseRemove(card);

          const itemsCountEl = document.querySelector('[data-cart-items-count]');
          const totalEl = document.querySelector('[data-cart-total]');

          if (itemsCountEl && typeof data.itemsCount !== 'undefined') {
            const n = parseInt(data.itemsCount, 10) || 0;
            itemsCountEl.textContent = `${n} ítem${n === 1 ? '' : 's'}`;
          }

          if (totalEl && typeof data.total !== 'undefined') {
            totalEl.textContent = formatARS(data.total);
          }

          if (typeof data.cartCount !== 'undefined') {
            setNavbarCartCount(data.cartCount);
          }

          showMiniToast(data.message || 'Carrito actualizado.');

          if (data.empty) {
            renderEmptyCart();
          }

        } catch (err) {
          if (btn) btn.disabled = false;
          form.submit();
        }
      });
    });

    const clearForm = cartGrid.querySelector('form[data-cart-clear]');
    if (clearForm) {
      const btn = clearForm.querySelector('button[type="submit"]');

      clearForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();

        if (btn) btn.disabled = true;

        try {
          const res = await fetch(clearForm.action, {
            method: 'POST',
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              Accept: 'application/json',
            },
            body: new FormData(clearForm),
          });

          if (!res.ok) throw new Error('bad response');
          const data = await res.json();
          if (!data?.ok) throw new Error('bad json');

          const itemsWrap = cartGrid.querySelector('[data-cart-items-wrap]');
          const summaryWrap = cartGrid.querySelector('[data-cart-summary-wrap]');

          const fadeOut = (el) =>
            new Promise((resolve) => {
              if (!el) return resolve();
              el.style.willChange = 'opacity, transform';
              el.style.transition = 'opacity 180ms ease, transform 180ms ease';
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
              requestAnimationFrame(() => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(6px)';
              });
              window.setTimeout(resolve, 190);
            });

          await Promise.all([fadeOut(itemsWrap), fadeOut(summaryWrap)]);

          const itemsCountEl = document.querySelector('[data-cart-items-count]');
          const totalEl = document.querySelector('[data-cart-total]');

          if (itemsCountEl) itemsCountEl.textContent = '0 ítems';
          if (totalEl) totalEl.textContent = formatARS(0);

          setNavbarCartCount(0);

          showMiniToast(data.message || 'Carrito vaciado.');

          renderEmptyCart();
        } catch (err) {
          if (btn) btn.disabled = false;
          clearForm.submit();
        }
      });
    }
  }

  // ---------------------------------------------
  // Carrito: control de cantidad (− / input / +)
  // ---------------------------------------------
  document.querySelectorAll('form[data-cart-qty]').forEach((form) => {
    const input = form.querySelector('[data-qty-input]');
    const minus = form.querySelector('[data-qty-minus]');
    const plus = form.querySelector('[data-qty-plus]');
    if (!input) return;

    const clamp = (n) => Math.max(1, Math.min(999, n));
    const getVal = () => clamp(parseInt(input.value, 10) || 1);
    const syncButtons = () => {
      const v = getVal();
      if (minus) minus.disabled = v <= 1;
    };

    const setVal = (n) => {
      input.value = String(clamp(n));
      syncButtons();
    };

    // Inicial (por si vino disabled desde Blade)
    syncButtons();

    const postFormJsonQty = async (form) => {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        body: new FormData(form),
      });

      if (!res.ok) throw new Error('bad response');
      return await res.json();
    };

    let inFlight = false;

    const doSubmit = async () => {
      if (inFlight) return;
      inFlight = true;

      try {
        const data = await postFormJsonQty(form);
        if (!data?.ok) throw new Error('bad json');

        if (typeof data.quantity !== 'undefined') {
          input.value = String(data.quantity);
          syncButtons();
        }


        const card = form.closest('[data-cart-item]');
        const lineEl = card?.querySelector('[data-line-subtotal]');
        if (lineEl && typeof data.lineSubtotal !== 'undefined') {
          lineEl.textContent = formatARS(data.lineSubtotal);
        }

        const itemsCountEl = document.querySelector('[data-cart-items-count]');
        const totalEl = document.querySelector('[data-cart-total]');

        if (itemsCountEl && typeof data.itemsCount !== 'undefined') {
          const n = parseInt(data.itemsCount, 10) || 0;
          itemsCountEl.textContent = `${n} ítem${n === 1 ? '' : 's'}`;
        }
        if (totalEl && typeof data.total !== 'undefined') {
          totalEl.textContent = formatARS(data.total);
        }

        if (typeof data.cartCount !== 'undefined') {
          setNavbarCartCount(data.cartCount);
        }

        showMiniToast(data.message || 'Carrito actualizado.');
      } catch (e) {
        if (typeof form.requestSubmit === 'function') form.requestSubmit();
        else form.submit();
      } finally {
        inFlight = false;
      }
    };

    minus?.addEventListener('click', (e) => {
      e.preventDefault();
      setVal(getVal() - 1);
      doSubmit();
    });

    plus?.addEventListener('click', (e) => {
      e.preventDefault();
      setVal(getVal() + 1);
      doSubmit();
    });

    let t = null;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        setVal(getVal());
        doSubmit();
      }, 450);
    });

    input.addEventListener('blur', () => {
      setVal(getVal());
    });
  });

  // ---------------------------------------------
  // Admin pedidos: cambio rápido de estado + WhatsApp opcional
  // ---------------------------------------------
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
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    if (!data?.ok) throw new Error('bad json');
    return data;
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

  const syncStatusOptions = (card, currentStatus) => {
    card.querySelectorAll('[data-admin-order-set-status]').forEach((b) => {
      const isCur = b.getAttribute('data-status') === currentStatus;

      b.classList.toggle('bg-zinc-100', isCur);
      b.disabled = isCur;
      b.classList.toggle('opacity-60', isCur);
      b.classList.toggle('cursor-not-allowed', isCur);
    });
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

    const waMsgEls = card.querySelectorAll('[data-admin-order-wa-message]');

    const menuBtn = card.querySelector('[data-admin-order-status-btn]');
    const menuId = menuBtn?.getAttribute('data-menu');
    const menu = menuId ? document.getElementById(menuId) : null;

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

          // marcar activo visual
          card.querySelectorAll('[data-admin-order-set-status]').forEach((b) => {
            b.classList.toggle('bg-zinc-100', b.getAttribute('data-status') === newSt);
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
                  if (waLastBadge) waLastBadge.textContent = data?.sent_at_label || 'recién';

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


        } catch (_) {
          statusForm.submit();
        } finally {
          card.dataset.busy = '0';
          if (menuBtn) menuBtn.disabled = false;
        }
      });
    });
  });
});
