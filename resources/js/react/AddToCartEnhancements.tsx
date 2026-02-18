import { useEffect } from 'react';
import { openCartAddedToast, showServerCartAddedToastIfPresent } from '../shared/cartAddedToast';
import { setNavbarCartCount } from '../shared/uiFeedback';

export default function AddToCartEnhancements() {
  useEffect(() => {
    showServerCartAddedToastIfPresent();

    const isAddToCartForm = (form: HTMLFormElement): boolean => {
      if (form.dataset.addToCart === '1') return true;
      const action = (form.getAttribute('action') || '').toLowerCase();
      return action.includes('/carrito/agregar') || action.includes('/cart/add');
    };

    const getProductNameFromContext = (form: HTMLFormElement): string => {
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const fromData = btn?.getAttribute('data-product-name');
      if (fromData) return fromData;

      const card = form.closest('.product-card, .card');
      const title =
        card?.querySelector('.product-title')?.textContent?.trim() ||
        card?.querySelector('.page-title')?.textContent?.trim();

      return title || 'Producto';
    };

    const getQtyFromForm = (form: HTMLFormElement): number => {
      const q = form.querySelector<HTMLInputElement>('input[name="quantity"]')?.value;
      const n = parseInt(q || '1', 10);
      return Number.isFinite(n) && n > 0 ? n : 1;
    };

    const setBtnLoading = (btn: HTMLButtonElement | null, loading: boolean): void => {
      if (!btn) return;
      btn.disabled = !!loading;
      btn.setAttribute('aria-busy', loading ? 'true' : 'false');
      btn.classList.toggle('is-loading', !!loading);
    };

    const getCurrentNavbarCartCount = (): number => {
      const cartLink = document.querySelector<HTMLAnchorElement>('a[aria-label="Carrito"]');
      if (!cartLink) return 0;
      const badge = cartLink.querySelector<HTMLElement>('[data-cart-count]');
      return badge ? (parseInt(badge.textContent || '0', 10) || 0) : 0;
    };

    const onSubmitCapture = async (e: SubmitEvent) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!isAddToCartForm(form)) return;

      e.preventDefault();

      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const productName = getProductNameFromContext(form);
      const qty = getQtyFromForm(form);

      setBtnLoading(btn, true);

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          credentials: 'same-origin',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
          },
        });

        if (res.status === 422) {
          const j = await res.json().catch(() => null) as { message?: string } | null;
          openCartAddedToast(j?.message || 'No se pudo agregar.', 'No se pudo agregar');
          return;
        }

        if (!res.ok) {
          if (res.status === 419) openCartAddedToast('Sesión expirada. Reintentá.', 'Error');
          else openCartAddedToast('No se pudo agregar. Reintentá.', 'Error');
          return;
        }

        const j = await res.json().catch(() => null) as { cartCount?: number } | null;
        if (typeof j?.cartCount === 'number') {
          setNavbarCartCount(j.cartCount);
        } else {
          setNavbarCartCount(getCurrentNavbarCartCount() + qty);
        }

        openCartAddedToast(productName, 'Agregado al carrito');
      } catch (_e) {
        openCartAddedToast('Error de red. Reintentá.', 'Error');
      } finally {
        setBtnLoading(btn, false);
      }
    };

    document.addEventListener('submit', onSubmitCapture, true);
    return () => document.removeEventListener('submit', onSubmitCapture, true);
  }, []);

  return null;
}
