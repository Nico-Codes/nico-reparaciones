import './bootstrap';

function toggleEl(el) {
  if (!el) return;
  el.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  // Mobile menu
  const mobileBtn = e.target.closest('[data-toggle="mobile-menu"]');
  if (mobileBtn) {
    toggleEl(document.getElementById('mobileMenu'));
    return;
  }

  // User menu
  const userBtn = e.target.closest('[data-toggle="user-menu"]');
  const userMenu = document.querySelector('[data-menu="user-menu"]');

  if (userBtn) {
    toggleEl(userMenu);
    return;
  }

  // Click outside closes dropdown
  if (userMenu && !userMenu.contains(e.target)) {
    userMenu.classList.add('hidden');
  }
});
