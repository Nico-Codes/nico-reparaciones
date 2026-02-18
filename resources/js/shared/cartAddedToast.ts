import { lockScroll, unlockScroll } from './scrollLock';

let overlay: HTMLElement | null = null;
let sheet: HTMLElement | null = null;
let autoCloseTimer: number | null = null;
let unlockTimer: number | null = null;
let toastEscBound = false;

const afterPaint = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn));

const $ = <T extends Element = Element>(sel: string, root: ParentNode = document): T | null =>
  root.querySelector(sel);

const $$ = <T extends Element = Element>(sel: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll(sel));

export const closeCartAddedToast = (): void => {
  if (!overlay || !sheet) return;

  if (autoCloseTimer !== null) window.clearTimeout(autoCloseTimer);
  if (unlockTimer !== null) window.clearTimeout(unlockTimer);

  overlay.classList.remove('opacity-100', 'pointer-events-auto');
  overlay.classList.add('opacity-0', 'pointer-events-none');
  sheet.classList.add('translate-y-full');
  sheet.classList.remove('translate-y-0');

  unlockTimer = window.setTimeout(() => unlockScroll('toast'), 260);
};

const bindToastInteractions = (): void => {
  if (!overlay) return;
  if (overlay.dataset.toastBound === '1') return;

  overlay.dataset.toastBound = '1';

  $$<HTMLElement>('[data-cart-added-close]', overlay).forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeCartAddedToast();
    });
  });

  if (!toastEscBound) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCartAddedToast();
    });
    toastEscBound = true;
  }
};

const ensureToast = (): void => {
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
              <div class="font-black text-zinc-900" id="cartAddedTitle">Agregado al carrito</div>
              <div class="text-sm text-zinc-600 mt-1 truncate">
                <span id="cartAddedName">Producto</span>
              </div>
            </div>
            <button type="button" class="icon-btn" data-cart-added-close aria-label="Cerrar">×</button>
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

export const openCartAddedToast = (message = 'Producto', title = 'Agregado al carrito'): void => {
  ensureToast();
  if (!overlay || !sheet) return;

  const titleEl = $('#cartAddedTitle');
  const nameEl = $('#cartAddedName');
  if (titleEl) titleEl.textContent = title;
  if (nameEl) nameEl.textContent = message;

  lockScroll('toast');

  overlay.classList.remove('pointer-events-none', 'opacity-0');
  overlay.classList.add('pointer-events-auto', 'opacity-100');

  afterPaint(() => {
    sheet?.classList.remove('translate-y-full');
    sheet?.classList.add('translate-y-0');
    autoCloseTimer = window.setTimeout(closeCartAddedToast, 4500);
  });
};

export const showServerCartAddedToastIfPresent = (): void => {
  ensureToast();
  const serverOverlay = $('#cartAddedOverlay');
  if (!serverOverlay || !(serverOverlay instanceof HTMLElement)) return;

  if (serverOverlay.dataset.cartAdded === '1') {
    const serverName =
      (serverOverlay.dataset.cartAddedName || '').trim() ||
      ($('#cartAddedName')?.textContent || '').trim() ||
      'Producto';

    openCartAddedToast(serverName, 'Agregado al carrito');
  }
};
