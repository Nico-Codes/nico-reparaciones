import { useEffect } from 'react';

type SuggestionItem = {
  url?: string;
  name?: string;
  brand?: string;
  category?: string;
  price?: number | string;
};

type Props = {
  rootSelector: string;
};

function asInput(el: Element | null): HTMLInputElement | null {
  return el instanceof HTMLInputElement ? el : null;
}

export default function StoreSearchSuggestions({ rootSelector }: Props) {
  useEffect(() => {
    const RECENT_KEY = 'nr_store_recent_searches';
    const RECENT_LIMIT = 6;

    const roots = Array.from(document.querySelectorAll<HTMLElement>(rootSelector));
    if (!roots.length) return;

    const cleanups: Array<() => void> = [];

    roots.forEach((root) => {
      const input = asInput(root.querySelector('[data-store-search-input]'));
      const panel = root.querySelector<HTMLElement>('[data-store-search-panel]');
      const list = root.querySelector<HTMLElement>('[data-store-search-list]');
      const url = root.getAttribute('data-store-suggestions-url') || '';
      const category = (root.getAttribute('data-store-search-category') || '').trim();

      if (!input || !panel || !list || !url) return;

      let timer: number | null = null;
      let controller: AbortController | null = null;
      let lastQuery = '';

      const normalizeQuery = (value: unknown): string => {
        return String(value || '')
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 80);
      };

      const readRecent = (): string[] => {
        try {
          const raw = window.localStorage.getItem(RECENT_KEY);
          if (!raw) return [];

          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return [];

          return parsed
            .map((item) => normalizeQuery(item))
            .filter((item) => item.length >= 2)
            .slice(0, RECENT_LIMIT);
        } catch (_e) {
          return [];
        }
      };

      const writeRecent = (items: string[]): void => {
        try {
          window.localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, RECENT_LIMIT)));
        } catch (_e) {}
      };

      const saveRecent = (query: string): void => {
        const normalized = normalizeQuery(query);
        if (normalized.length < 2) return;

        const lower = normalized.toLowerCase();
        const merged = [normalized, ...readRecent().filter((item) => item.toLowerCase() !== lower)];
        writeRecent(merged);
      };

      const hidePanel = (): void => {
        panel.classList.add('hidden');
      };

      const showPanel = (): void => {
        panel.classList.remove('hidden');
      };

      const clearList = (): void => {
        list.innerHTML = '';
      };

      const renderRecent = (): void => {
        const items = readRecent();
        clearList();

        if (!items.length) {
          hidePanel();
          return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'p-2';

        const header = document.createElement('div');
        header.className = 'px-1 pb-2 text-[11px] font-black uppercase tracking-wide text-zinc-500';
        header.textContent = 'Busquedas recientes';
        wrapper.appendChild(header);

        const chips = document.createElement('div');
        chips.className = 'flex flex-wrap gap-2';

        items.forEach((item) => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className =
            'rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100';
          chip.textContent = item;
          chip.addEventListener('click', () => {
            input.value = item;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
          });
          chips.appendChild(chip);
        });

        wrapper.appendChild(chips);
        list.appendChild(wrapper);
        showPanel();
      };

      const renderEmpty = (query: string): void => {
        clearList();
        const row = document.createElement('div');
        row.className = 'px-3 py-2 text-sm text-zinc-500';
        row.textContent = `Sin coincidencias para "${query}".`;
        list.appendChild(row);
        showPanel();
      };

      const renderItems = (items: SuggestionItem[]): void => {
        clearList();

        items.forEach((item) => {
          const link = document.createElement('a');
          link.href = item.url || '#';
          link.className = 'block rounded-xl px-3 py-2 transition hover:bg-zinc-50 focus:bg-zinc-50';

          const title = document.createElement('div');
          title.className = 'truncate text-sm font-black text-zinc-900';
          title.textContent = item.name || 'Producto';

          const meta = document.createElement('div');
          meta.className = 'truncate text-xs text-zinc-500';

          const parts: string[] = [];
          if (item.brand) parts.push(String(item.brand));
          if (item.category) parts.push(String(item.category));
          if (Number.isFinite(Number(item.price))) {
            const formatted = new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(Number(item.price));
            parts.push(formatted);
          }
          meta.textContent = parts.join(' | ');

          link.appendChild(title);
          link.appendChild(meta);
          list.appendChild(link);
        });

        showPanel();
      };

      const fetchSuggestions = async (query: string): Promise<void> => {
        if (controller) controller.abort();
        controller = new AbortController();

        const params = new URLSearchParams({ q: query });
        if (category) params.set('category', category);

        try {
          const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            credentials: 'same-origin',
            signal: controller.signal,
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              Accept: 'application/json',
            },
          });

          if (!response.ok) {
            hidePanel();
            return;
          }

          const data = (await response.json().catch(() => ({}))) as { items?: SuggestionItem[] };
          if ((input.value || '').trim() !== query) return;

          const items = Array.isArray(data?.items) ? data.items : [];
          if (!items.length) {
            renderEmpty(query);
            return;
          }

          renderItems(items);
        } catch (error) {
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            hidePanel();
          }
        }
      };

      const onInput = () => {
        const query = (input.value || '').trim();
        if (query === lastQuery) return;
        lastQuery = query;

        if (timer !== null) {
          window.clearTimeout(timer);
        }

        if (query.length < 2) {
          renderRecent();
          return;
        }

        timer = window.setTimeout(() => {
          void fetchSuggestions(query);
        }, 180);
      };

      const onFocus = () => {
        const query = normalizeQuery(input.value);
        if (query.length < 2) {
          renderRecent();
          return;
        }

        if (list.children.length > 0) showPanel();
      };

      const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          hidePanel();
        }
      };

      const onDocumentClick = (event: Event) => {
        if (!(event.target instanceof Node)) return;
        if (!root.contains(event.target)) {
          hidePanel();
        }
      };

      const form = input.closest('form');
      const onSubmit = () => {
        saveRecent(input.value);
      };

      const onListClick = (event: Event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest('a[href]')) {
          saveRecent(input.value);
        }
      };

      input.addEventListener('input', onInput);
      input.addEventListener('focus', onFocus);
      input.addEventListener('keydown', onKeydown);
      document.addEventListener('click', onDocumentClick);
      if (form) form.addEventListener('submit', onSubmit);
      list.addEventListener('click', onListClick);

      cleanups.push(() => {
        if (timer !== null) window.clearTimeout(timer);
        if (controller) controller.abort();
        input.removeEventListener('input', onInput);
        input.removeEventListener('focus', onFocus);
        input.removeEventListener('keydown', onKeydown);
        document.removeEventListener('click', onDocumentClick);
        if (form) form.removeEventListener('submit', onSubmit);
        list.removeEventListener('click', onListClick);
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [rootSelector]);

  return null;
}
