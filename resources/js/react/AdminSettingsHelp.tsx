import { useEffect } from 'react';

type AdminSettingsHelpProps = {
  messageInputId: string;
  messageCounterId: string;
  messageMinAlertId: string;
  messageSubmitId: string;
  searchInputId: string;
  visibleCountId: string;
  emptySearchId: string;
  itemSelector: string;
};

function normalize(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function AdminSettingsHelp(props: AdminSettingsHelpProps) {
  useEffect(() => {
    const input = document.getElementById(props.messageInputId) as HTMLTextAreaElement | null;
    const counter = document.getElementById(props.messageCounterId);
    const minAlert = document.getElementById(props.messageMinAlertId);
    const submitBtn = document.getElementById(props.messageSubmitId) as HTMLButtonElement | null;

    const limit = 500;
    const minLen = 10;

    const updateMessage = () => {
      if (!input || !counter || !minAlert || !submitBtn) return;
      const used = String(input.value || '').trim().length;
      counter.textContent = `${used} / ${limit}`;
      counter.className = used >= limit
        ? 'mt-1 text-xs font-bold text-rose-700'
        : 'mt-1 text-xs text-zinc-500';
      minAlert.classList.toggle('hidden', used === 0 || used >= minLen);
      submitBtn.disabled = used < minLen;
      submitBtn.setAttribute('aria-disabled', used < minLen ? 'true' : 'false');
      submitBtn.classList.toggle('opacity-60', used < minLen);
      submitBtn.classList.toggle('cursor-not-allowed', used < minLen);
    };

    if (input && counter && minAlert && submitBtn) {
      input.addEventListener('input', updateMessage);
      updateMessage();
    }

    const searchInput = document.getElementById(props.searchInputId) as HTMLInputElement | null;
    const visibleCount = document.getElementById(props.visibleCountId);
    const emptySearch = document.getElementById(props.emptySearchId);
    const items = Array.from(document.querySelectorAll(props.itemSelector)) as HTMLElement[];

    const updateSearch = () => {
      if (!searchInput || !visibleCount || !emptySearch || items.length === 0) return;
      const q = normalize(searchInput.value);
      let visible = 0;

      items.forEach((item) => {
        const source = normalize(item.getAttribute('data-help-admin-search') || '');
        const match = q === '' || source.includes(q);
        item.classList.toggle('hidden', !match);
        if (match) visible += 1;
      });

      visibleCount.textContent = String(visible);
      emptySearch.classList.toggle('hidden', visible > 0);
    };

    if (searchInput && visibleCount && emptySearch && items.length > 0) {
      searchInput.addEventListener('input', updateSearch);
      updateSearch();
    }

    return () => {
      if (input) input.removeEventListener('input', updateMessage);
      if (searchInput) searchInput.removeEventListener('input', updateSearch);
    };
  }, [props]);

  return null;
}
