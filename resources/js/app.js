import './bootstrap';

document.addEventListener('DOMContentLoaded', () => {
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

  // cerrar al tocar cualquier link dentro del sidebar
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
  // ESC + resize
  // =============================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      closeAllDropdowns();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) closeSidebar();
  });
});
