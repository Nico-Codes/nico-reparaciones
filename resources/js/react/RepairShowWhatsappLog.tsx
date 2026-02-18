import { useEffect } from 'react';

type RepairShowWhatsappLogProps = {
  rootSelector: string;
  csrfToken: string;
};

export default function RepairShowWhatsappLog({ rootSelector, csrfToken }: RepairShowWhatsappLogProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(rootSelector);
    if (!root) return;

    const toast = document.getElementById('waToast');
    let toastTimer: number | null = null;

    const showToast = (text: string, isError = false): void => {
      if (!toast) return;
      toast.textContent = text || 'Listo.';
      toast.classList.toggle('border-emerald-200', !isError);
      toast.classList.toggle('bg-emerald-50', !isError);
      toast.classList.toggle('text-emerald-900', !isError);

      toast.classList.toggle('border-rose-200', isError);
      toast.classList.toggle('bg-rose-50', isError);
      toast.classList.toggle('text-rose-900', isError);

      toast.classList.remove('hidden');
      requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-[-6px]');
        toast.classList.add('opacity-100', 'translate-y-0');
      });

      if (toastTimer) window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-6px]');
        toast.classList.remove('opacity-100', 'translate-y-0');
        window.setTimeout(() => toast.classList.add('hidden'), 200);
      }, 2600);
    };

    const onClick = async (event: Event): Promise<void> => {
      const target = event.target as Element | null;
      const link = target?.closest<HTMLAnchorElement>('[data-wa-open]');
      if (!link || !root.contains(link)) return;

      event.preventDefault();

      const url = link.getAttribute('href');
      if (url) window.open(url, '_blank', 'noopener');

      const ajaxUrl = link.dataset.waAjax || '';
      if (!ajaxUrl) return;

      try {
        const res = await fetch(ajaxUrl, {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': csrfToken,
            Accept: 'application/json',
          },
        });

        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; created?: boolean };
        if (!res.ok || data.ok !== true) {
          showToast('No se pudo registrar el envio.', true);
          return;
        }

        showToast(data.created ? 'Envio registrado.' : 'Ya estaba registrado recientemente.');
      } catch (_e) {
        showToast('No se pudo registrar el envio.', true);
      }
    };

    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
      if (toastTimer) window.clearTimeout(toastTimer);
    };
  }, [rootSelector, csrfToken]);

  return null;
}

