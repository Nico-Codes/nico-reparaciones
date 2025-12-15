import './bootstrap';

document.addEventListener('DOMContentLoaded', () => {
  // Mobile drawer
  const openBtn = document.querySelector('[data-toggle="mobile-drawer"]');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileOverlay');
  const closeBtns = document.querySelectorAll('[data-close="mobile-drawer"]');

  const open = () => {
    if (!drawer || !overlay) return;
    drawer.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  };

  const close = () => {
    if (!drawer || !overlay) return;
    drawer.classList.add('translate-x-full');
    overlay.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  };

  openBtn?.addEventListener('click', open);
  overlay?.addEventListener('click', close);
  closeBtns.forEach(b => b.addEventListener('click', close));

  // Toast (cart added)
  const toast = document.getElementById('toast');
  if (toast) {
    setTimeout(() => {
      toast.classList.remove('opacity-0', 'translate-y-2');
    }, 40);

    setTimeout(() => {
      toast.classList.add('opacity-0');
    }, 3200);

    setTimeout(() => {
      toast.remove();
    }, 3800);
  }
});
