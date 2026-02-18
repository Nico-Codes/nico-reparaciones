import { useEffect } from 'react';

type PricingRuleCreateModeProps = {
  selector: string;
};

export default function PricingRuleCreateMode({ selector }: PricingRuleCreateModeProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(selector);
    if (!root) return;

    const modeSelect = root.querySelector<HTMLSelectElement>('[data-pricing-mode-select]');
    const modeHint = root.querySelector<HTMLElement>('[data-pricing-mode-hint]');
    if (!modeSelect) return;

    const blocks = Array.from(root.querySelectorAll<HTMLElement>('[data-pricing-mode]'));

    const sync = (): void => {
      const mode = modeSelect.value || 'margin';
      blocks.forEach((el) => {
        const active = el.dataset.pricingMode === mode;
        el.classList.toggle('hidden', !active);
        el.classList.toggle('opacity-60', !active);
      });

      if (modeHint) {
        modeHint.textContent = mode === 'fixed'
          ? 'Modo fijo activo: defines un total final.'
          : 'Modo margen activo: porcentaje + mínimo de ganancia.';
      }
    };

    modeSelect.addEventListener('change', sync);
    sync();

    return () => {
      modeSelect.removeEventListener('change', sync);
    };
  }, [selector]);

  return null;
}

