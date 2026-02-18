import { useEffect } from 'react';

type SupplierReorderProps = {
  formSelector: string;
};

export default function SupplierReorder({ formSelector }: SupplierReorderProps) {
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>(formSelector);
    if (!form) return;

    const list = form.querySelector<HTMLElement>('[data-supplier-sortable]');
    const hidden = form.querySelector<HTMLInputElement>('[data-supplier-ordered-ids]');
    if (!list || !hidden) return;

    let dragEl: HTMLElement | null = null;

    const items = (): HTMLElement[] =>
      Array.from(list.querySelectorAll<HTMLElement>('[data-supplier-item]'));

    const refreshHidden = (): void => {
      const allItems = items();
      const ids = allItems
        .map((el) => Number(el.dataset.id || 0))
        .filter((id) => id > 0);
      hidden.value = JSON.stringify(ids);

      allItems.forEach((el, index) => {
        const label = el.querySelector<HTMLElement>('[data-supplier-priority-label]');
        if (label) label.textContent = `Prioridad #${index + 1}`;
      });
    };

    const setDraggingStyle = (el: HTMLElement | null, on: boolean): void => {
      if (!el) return;
      el.classList.toggle('opacity-50', on);
      el.classList.toggle('ring-2', on);
      el.classList.toggle('ring-sky-300', on);
    };

    const onDragStart = (event: Event): void => {
      const e = event as DragEvent;
      const target = (e.target as Element | null)?.closest<HTMLElement>('[data-supplier-item]');
      if (!target) return;
      dragEl = target;
      setDraggingStyle(target, true);
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(target.dataset.id || ''));
      }
    };

    const onDragEnd = (event: Event): void => {
      const e = event as DragEvent;
      const target = (e.target as Element | null)?.closest<HTMLElement>('[data-supplier-item]');
      setDraggingStyle(target || dragEl, false);
      dragEl = null;
      refreshHidden();
    };

    const onDragOver = (event: Event): void => {
      const e = event as DragEvent;
      e.preventDefault();
      const target = (e.target as Element | null)?.closest<HTMLElement>('[data-supplier-item]');
      if (!target || target === dragEl) return;

      if (!dragEl && e.dataTransfer) {
        const draggedId = Number(e.dataTransfer.getData('text/plain') || 0);
        if (draggedId > 0) {
          dragEl = items().find((el) => Number(el.dataset.id || 0) === draggedId) || null;
          setDraggingStyle(dragEl, true);
        }
      }
      if (!dragEl) return;

      const rect = target.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      if (after) target.after(dragEl);
      else target.before(dragEl);
    };

    const onListClick = (event: Event): void => {
      const target = event.target as Element | null;
      const button = target?.closest<HTMLButtonElement>('button[data-move]');
      if (!button) return;
      const row = button.closest<HTMLElement>('[data-supplier-item]');
      if (!row) return;

      if (button.dataset.move === 'up') {
        const prev = row.previousElementSibling;
        if (prev) prev.before(row);
      } else if (button.dataset.move === 'down') {
        const next = row.nextElementSibling;
        if (next) next.after(row);
      }

      refreshHidden();
    };

    const onSubmit = (): void => refreshHidden();

    list.addEventListener('dragstart', onDragStart);
    list.addEventListener('dragend', onDragEnd);
    list.addEventListener('dragover', onDragOver);
    list.addEventListener('click', onListClick);
    form.addEventListener('submit', onSubmit);

    refreshHidden();

    return () => {
      list.removeEventListener('dragstart', onDragStart);
      list.removeEventListener('dragend', onDragEnd);
      list.removeEventListener('dragover', onDragOver);
      list.removeEventListener('click', onListClick);
      form.removeEventListener('submit', onSubmit);
    };
  }, [formSelector]);

  return null;
}

