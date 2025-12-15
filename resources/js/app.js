import './bootstrap';

/**
 * NicoReparaciones UI helpers (sin dependencias)
 * - Toggle de menús (mobile)
 * - Toast autocierre
 */
document.addEventListener('DOMContentLoaded', () => {
  // Toggle targets por id via data-toggle / data-target
  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      if (!targetId) return;
      const el = document.getElementById(targetId);
      if (!el) return;
      el.classList.toggle('hidden');
    });
  });

  // Cerrar toast manual
  document.querySelectorAll('[data-toast-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const toast = btn.closest('[data-toast]');
      if (toast) toast.remove();
    });
  });

  // Autocierre de toasts
  document.querySelectorAll('[data-toast]').forEach((toast) => {
    const ms = parseInt(toast.getAttribute('data-timeout') || '4500', 10);
    window.setTimeout(() => {
      if (toast && toast.parentElement) toast.remove();
    }, ms);
  });
});
