import { useEffect } from 'react';
import { copyToClipboard, showMiniToast } from '../shared/uiFeedback';

export default function GlobalCopyActionsEnhancements() {
  useEffect(() => {
    const onClick = async (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest<HTMLElement>('[data-copy-target]');
      if (!btn) return;

      e.preventDefault();

      const sel = btn.getAttribute('data-copy-target');
      if (!sel) return;

      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return;

      const text = (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
        ? el.value
        : (el.textContent || '');

      const ok = await copyToClipboard(text);
      showMiniToast(ok ? (btn.getAttribute('data-copy-toast') || 'Copiado') : 'No se pudo copiar');
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
