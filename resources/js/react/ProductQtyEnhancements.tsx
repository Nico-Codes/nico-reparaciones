import { useEffect } from 'react';

export default function ProductQtyEnhancements() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const wraps = Array.from(document.querySelectorAll<HTMLElement>('[data-product-qty]'));
    wraps.forEach((wrap) => {
      const input = wrap.querySelector<HTMLInputElement>('[data-product-qty-input]');
      const minus = wrap.querySelector<HTMLButtonElement>('[data-product-qty-minus]');
      const plus = wrap.querySelector<HTMLButtonElement>('[data-product-qty-plus]');
      if (!input) return;

      const getMax = () => {
        const max = parseInt(input.getAttribute('max') || '1', 10);
        return Number.isFinite(max) && max > 0 ? max : 1;
      };
      const clamp = (n: number) => Math.max(1, Math.min(getMax(), n));
      const getVal = () => clamp(parseInt(input.value || '1', 10));

      const sync = () => {
        const v = getVal();
        const max = getMax();
        input.value = String(v);
        if (minus) minus.disabled = input.disabled || v <= 1;
        if (plus) plus.disabled = input.disabled || v >= max;
      };

      const onMinus = (e: Event) => {
        e.preventDefault();
        input.value = String(clamp(getVal() - 1));
        sync();
      };
      const onPlus = (e: Event) => {
        e.preventDefault();
        input.value = String(clamp(getVal() + 1));
        sync();
      };
      const onInput = () => sync();
      const onBlur = () => sync();

      minus?.addEventListener('click', onMinus);
      plus?.addEventListener('click', onPlus);
      input.addEventListener('input', onInput);
      input.addEventListener('blur', onBlur);
      sync();

      cleanups.push(() => {
        minus?.removeEventListener('click', onMinus);
        plus?.removeEventListener('click', onPlus);
        input.removeEventListener('input', onInput);
        input.removeEventListener('blur', onBlur);
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
