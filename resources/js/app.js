import './bootstrap';

document.addEventListener('DOMContentLoaded', () => {
  // =============================
  // ✅ Guardar/Restaurar scroll (para "Agregar al carrito")
  // =============================
  const SCROLL_KEY_PATH = 'nr_scroll_path';
  const SCROLL_KEY_Y = 'nr_scroll_y';

  const saveScrollForNextLoad = () => {
    try {
      sessionStorage.setItem(SCROLL_KEY_PATH, window.location.pathname + window.location.search);
      sessionStorage.setItem(SCROLL_KEY_Y, String(window.scrollY || 0));
    } catch (_) {}
  };

  const restoreScrollIfNeeded = () => {
    try {
      const savedPath = sessionStorage.getItem(SCROLL_KEY_PATH);
      const savedY = Number(sessionStorage.getItem(SCROLL_KEY_Y));
      const currentPath = window.location.pathname + window.location.search;

      if (savedPath && savedPath === currentPath && Number.isFinite(savedY) && savedY > 0) {
        // Espera un frame para que pinte y después restaura
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedY, left: 0, behavior: 'auto' });
        });

        sessionStorage.removeItem(SCROLL_KEY_PATH);
        sessionStorage.removeItem(SCROLL_KEY_Y);
      }
    } catch (_) {}
  };

  // Guardamos scroll SOLO para POST /carrito/agregar/*
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;

    const action = form.getAttribute('action') || '';
    if (action.includes('/carrito/agregar/')) {
      saveScrollForNextLoad();
    }
  }, true);

  // Restaurar scroll apenas carga
  restoreScrollIfNeeded();

  // =============================
  // Offcanvas sidebar (mobile)
  // =============================
  const btnSidebar = document.querySelector('[data-toggle="sidebar"]');
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('appSidebarOverlay');

  const openSidebar = () => {
    if (!sidebar || !overlay) return;

    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.add('translate-x-0');
    });

    document.body.classList.add('overflow-hidden');
    btnSidebar?.setAttribute('aria-expanded', 'true');
  };

  const closeSidebar = () => {
    if (!sidebar || !overlay) return;

    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('translate-x-0');

    document.body.classList.remove('overflow-hidden');
    btnSidebar?.setAttribute('aria-expanded', 'false');

    window.setTimeout(() => {
      overlay.classList.add('hidden');
    }, 200);
  };

  btnSidebar?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!sidebar) return;

    const isClosed = sidebar.classList.contains('-translate-x-full');
    isClosed ? openSidebar() : closeSidebar();
  });

  document.querySelectorAll('[data-close="sidebar"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
    });
  });

  sidebar?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => closeSidebar());
  });

  // =============================
  // Dropdown genérico
  // =============================
  const closeAllDropdowns = () => {
    document.querySelectorAll('.js-dropdown').forEach((p) => p.classList.add('hidden'));
    document.querySelectorAll('[data-menu]').forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
  };

  document.querySelectorAll('[data-menu]').forEach((btn) => {
    const id = btn.getAttribute('data-menu');
    if (!id) return;

    const panel = document.getElementById(id);
    if (!panel) return;

    panel.classList.add('js-dropdown');

    const close = () => {
      panel.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = panel.classList.contains('hidden');
      closeAllDropdowns();
      if (isHidden) {
        panel.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        close();
      }
    });

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !btn.contains(e.target)) close();
    });
  });

  // =============================
  // Bottom-sheet: “Agregado al carrito” (smooth)
  // =============================
  const cartAddedOverlay = document.getElementById('cartAddedOverlay');
  const cartAddedSheet = document.getElementById('cartAddedSheet');
  const cartAddedBackdrop = document.getElementById('cartAddedBackdrop');

  const ANIM_MS = 300;
  let autoCloseTimer = null;

  const openCartAdded = () => {
    if (!cartAddedOverlay || !cartAddedSheet || !cartAddedBackdrop) return;

    cartAddedOverlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    cartAddedBackdrop.classList.remove('opacity-100');
    cartAddedSheet.classList.remove('translate-y-0', 'opacity-100');

    requestAnimationFrame(() => {
      cartAddedBackdrop.classList.add('opacity-100');
      cartAddedSheet.classList.remove('translate-y-full');
      cartAddedSheet.classList.add('translate-y-0', 'opacity-100');
    });

    clearTimeout(autoCloseTimer);
    autoCloseTimer = window.setTimeout(() => {
      closeCartAdded();
    }, 6500);
  };

  const closeCartAdded = () => {
    if (!cartAddedOverlay || !cartAddedSheet || !cartAddedBackdrop) return;

    cartAddedBackdrop.classList.remove('opacity-100');
    cartAddedSheet.classList.add('translate-y-full');
    cartAddedSheet.classList.remove('translate-y-0', 'opacity-100');

    document.body.classList.remove('overflow-hidden');

    window.setTimeout(() => {
      cartAddedOverlay.classList.add('hidden');
    }, ANIM_MS);
  };

  if (cartAddedOverlay?.dataset.cartAdded === '1') {
    // abrir después de restaurar scroll (ya se llamó arriba)
    openCartAdded();

    cartAddedOverlay.querySelectorAll('[data-cart-added-close]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        closeCartAdded();
      });
    });

    cartAddedSheet?.addEventListener('pointerdown', () => {
      clearTimeout(autoCloseTimer);
    });
  }

  // =============================
  // ESC + resize
  // =============================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      closeAllDropdowns();
      closeCartAdded();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) closeSidebar();
  });
});
