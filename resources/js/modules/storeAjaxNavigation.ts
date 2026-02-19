let initialized = false;

function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function normalizeStoreUrl(rawUrl: string): URL | null {
  if (!rawUrl) return null;

  const parsed = new URL(rawUrl, window.location.origin);
  if (parsed.origin === window.location.origin) {
    return parsed;
  }

  // Soporta APP_URL distinto (ej: links 127.0.0.1 cuando el usuario navega por ngrok).
  if (parsed.pathname.startsWith('/tienda')) {
    return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, window.location.origin);
  }

  return null;
}

export function initStoreAjaxNavigation(): void {
  if (initialized) return;
  initialized = true;

  let pendingController: AbortController | null = null;
  let isNavigating = false;

  const shellSelector = '[data-store-results-shell]';
  const findShell = (): HTMLElement | null => document.querySelector<HTMLElement>(shellSelector);

  const syncToolbarForm = (nextDoc: Document): void => {
    const currentForm = document.querySelector<HTMLFormElement>('[data-store-nav-form]');
    const nextForm = nextDoc.querySelector<HTMLFormElement>('[data-store-nav-form]');
    if (!currentForm || !nextForm) return;

    const currentQuery = currentForm.querySelector<HTMLInputElement>('input[name="q"]');
    const nextQuery = nextForm.querySelector<HTMLInputElement>('input[name="q"]');
    if (currentQuery && nextQuery) {
      currentQuery.value = nextQuery.value;
    }

    const currentSort = currentForm.querySelector<HTMLSelectElement>('select[name="sort"]');
    const nextSort = nextForm.querySelector<HTMLSelectElement>('select[name="sort"]');
    if (currentSort && nextSort) {
      currentSort.value = nextSort.value;
      currentSort.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const activeSort = (nextSort?.value || currentSort?.value || 'relevance').trim();
    document.querySelectorAll<HTMLElement>('[data-store-mobile-sort-option]').forEach((optionButton) => {
      optionButton.classList.toggle('is-active', (optionButton.dataset.sortValue || '') === activeSort);
    });
  };

  const reinitStore = (): void => {
    if (typeof window !== 'undefined' && typeof (window as any).NR_REINIT_STORE_ISLANDS === 'function') {
      (window as any).NR_REINIT_STORE_ISLANDS();
    }
  };

  const navigate = async (url: string, pushHistory: boolean): Promise<void> => {
    if (isNavigating) return;
    const currentShell = findShell();
    if (!currentShell) return;

    isNavigating = true;
    currentShell.classList.add('is-loading');

    if (pendingController) pendingController.abort();
    pendingController = new AbortController();

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        signal: pendingController.signal,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'text/html',
        },
      });

      if (!response.ok) {
        window.location.href = url;
        return;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const nextDoc = parser.parseFromString(html, 'text/html');
      const nextShell = nextDoc.querySelector<HTMLElement>(shellSelector);
      const liveShell = findShell();

      if (!nextShell || !liveShell) {
        window.location.href = url;
        return;
      }

      syncToolbarForm(nextDoc);
      nextShell.classList.add('is-loading');
      liveShell.replaceWith(nextShell);
      nextShell.querySelectorAll<HTMLElement>('.reveal-item').forEach((item) => {
        item.classList.add('is-visible');
      });
      requestAnimationFrame(() => {
        nextShell.classList.remove('is-loading');
      });

      if (pushHistory) {
        window.history.pushState({ nrStoreAjax: true }, '', url);
      }

      reinitStore();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        window.location.href = url;
      }
    } finally {
      findShell()?.classList.remove('is-loading');
      isNavigating = false;
    }
  };

  document.addEventListener('click', (event) => {
    if (isModifiedClick(event)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest<HTMLAnchorElement>('a[data-store-nav-link], #productos .pagination a, #top .pagination a');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#')) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;

    const nextUrl = normalizeStoreUrl(href);
    if (!nextUrl) return;

    event.preventDefault();
    void navigate(nextUrl.toString(), true);
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.matches('[data-store-nav-form]')) return;

    event.preventDefault();

    const action = form.getAttribute('action') || window.location.pathname;
    const method = (form.getAttribute('method') || 'GET').toUpperCase();
    if (method !== 'GET') {
      form.submit();
      return;
    }

    const url = normalizeStoreUrl(action);
    if (!url) {
      form.submit();
      return;
    }
    const formData = new FormData(form);
    const params = new URLSearchParams();
    formData.forEach((value, key) => {
      const text = String(value ?? '').trim();
      if (text === '') return;
      params.set(key, text);
    });
    url.search = params.toString();

    void navigate(url.toString(), true);
  });

  window.addEventListener('popstate', () => {
    void navigate(window.location.href, false);
  });
}
