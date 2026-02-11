export function initStoreSearchSuggestions() {
  const roots = Array.from(document.querySelectorAll('[data-store-search]'));
  if (!roots.length) return;

  roots.forEach((root) => {
    const input = root.querySelector('[data-store-search-input]');
    const panel = root.querySelector('[data-store-search-panel]');
    const list = root.querySelector('[data-store-search-list]');
    const url = root.getAttribute('data-store-suggestions-url') || '';
    const category = (root.getAttribute('data-store-search-category') || '').trim();

    if (!input || !panel || !list || !url) return;

    let timer = null;
    let controller = null;
    let lastQuery = '';

    const hidePanel = () => {
      panel.classList.add('hidden');
    };

    const showPanel = () => {
      panel.classList.remove('hidden');
    };

    const clearList = () => {
      list.innerHTML = '';
    };

    const renderEmpty = (query) => {
      clearList();
      const row = document.createElement('div');
      row.className = 'px-3 py-2 text-sm text-zinc-500';
      row.textContent = `Sin coincidencias para "${query}".`;
      list.appendChild(row);
      showPanel();
    };

    const renderItems = (items) => {
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

        const parts = [];
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

    const fetchSuggestions = async (query) => {
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

        const data = await response.json().catch(() => ({}));
        if ((input.value || '').trim() !== query) return;

        const items = Array.isArray(data?.items) ? data.items : [];
        if (!items.length) {
          renderEmpty(query);
          return;
        }

        renderItems(items);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          hidePanel();
        }
      }
    };

    input.addEventListener('input', () => {
      const query = (input.value || '').trim();
      if (query === lastQuery) return;
      lastQuery = query;

      window.clearTimeout(timer);

      if (query.length < 2) {
        clearList();
        hidePanel();
        return;
      }

      timer = window.setTimeout(() => {
        fetchSuggestions(query);
      }, 180);
    });

    input.addEventListener('focus', () => {
      if (list.children.length > 0) showPanel();
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hidePanel();
      }
    });

    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) {
        hidePanel();
      }
    });
  });
}
