import { useEffect } from 'react';

export default function GlobalFormEnhancements() {
  useEffect(() => {
    const lockSubmitButtons = (form: HTMLFormElement, submitter: HTMLElement | null = null): void => {
      const buttons = new Set([
        ...Array.from(form.querySelectorAll<HTMLElement>('button[type="submit"], input[type="submit"]')),
        ...(submitter ? [submitter] : []),
      ]);

      buttons.forEach((button) => {
        if (button.dataset.originalLabel === undefined) {
          button.dataset.originalLabel = button instanceof HTMLInputElement
            ? (button.value || '')
            : (button.textContent || '');
        }

        button.setAttribute('aria-busy', 'true');
        button.setAttribute('disabled', 'disabled');
        button.classList.add('opacity-70', 'cursor-not-allowed');

        const loadingText = button.getAttribute('data-loading-label') || 'Procesando...';
        if (button instanceof HTMLInputElement) button.value = loadingText;
        else button.textContent = loadingText;
      });
    };

    const onConfirmSubmitCapture = (e: SubmitEvent) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;

      const submitter = e.submitter instanceof HTMLElement ? e.submitter : null;
      const message = submitter?.getAttribute('data-confirm') || form.getAttribute('data-confirm');
      if (!message) return;
      if (window.confirm(message)) return;
      e.preventDefault();
    };

    const onDisableOnSubmit = (e: SubmitEvent) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (e.defaultPrevented) return;
      if (!form.hasAttribute('data-disable-on-submit')) return;

      if (form.dataset.submitting === '1') {
        e.preventDefault();
        return;
      }

      form.dataset.submitting = '1';
      lockSubmitButtons(form, e.submitter instanceof HTMLElement ? e.submitter : null);
    };

    document.addEventListener('submit', onConfirmSubmitCapture, true);
    document.addEventListener('submit', onDisableOnSubmit);

    return () => {
      document.removeEventListener('submit', onConfirmSubmitCapture, true);
      document.removeEventListener('submit', onDisableOnSubmit);
    };
  }, []);

  return null;
}
