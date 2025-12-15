import './bootstrap';

document.addEventListener('DOMContentLoaded', () => {
  // Menú mobile (header)
  const btnMobile = document.querySelector('[data-toggle="mobile-menu"]');
  const mobileMenu = document.getElementById('mobileMenu');

  const closeMobile = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.add('hidden');
    btnMobile?.setAttribute('aria-expanded', 'false');
  };

  btnMobile?.addEventListener('click', () => {
    if (!mobileMenu) return;
    const isHidden = mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden');
    btnMobile.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
  });

  // Dropdown genérico
  document.querySelectorAll('[data-menu]').forEach((btn) => {
    const id = btn.getAttribute('data-menu');
    if (!id) return;
    const panel = document.getElementById(id);
    if (!panel) return;

    const close = () => {
      panel.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = panel.classList.contains('hidden');
      document.querySelectorAll('.js-dropdown').forEach((p) => p.classList.add('hidden'));
      if (isHidden) {
        panel.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        close();
      }
    });

    panel.classList.add('js-dropdown');

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !btn.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) closeMobile();
  });
});
