import { useEffect } from 'react';

type OrderShowWhatsappLogProps = {
  rootSelector: string;
};

export default function OrderShowWhatsappLog({ rootSelector }: OrderShowWhatsappLogProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(rootSelector);
    if (!root) return;

    const logForm = root.querySelector<HTMLFormElement>('[data-admin-order-wa-log]');
    const openButtons = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-admin-order-wa-open]'));
    const toast = document.getElementById('waToast');
    if (!logForm || openButtons.length === 0) return;

    const logUrl = logForm.dataset.waLogUrl || '';
    if (!logUrl) return;

    const csrfToken =
      (logForm.querySelector('input[name="_token"]') as HTMLInputElement | null)?.value || '';

    let toastTimer: number | null = null;
    const showToast = (message: string): void => {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.remove('hidden');
      if (toastTimer) window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.classList.add('hidden');
      }, 1800);
    };

    const sendLog = async (): Promise<void> => {
      try {
        const response = await fetch(logUrl, {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': csrfToken,
            Accept: 'application/json',
          },
        });
        if (!response.ok) throw new Error('failed');
        showToast('Log de WhatsApp registrado');
      } catch (_e) {
        showToast('No se pudo registrar el log');
      }
    };

    const onOpenClick = (): void => {
      void sendLog();
    };

    openButtons.forEach((button) => button.addEventListener('click', onOpenClick));

    return () => {
      openButtons.forEach((button) => button.removeEventListener('click', onOpenClick));
      if (toastTimer) window.clearTimeout(toastTimer);
    };
  }, [rootSelector]);

  return null;
}

