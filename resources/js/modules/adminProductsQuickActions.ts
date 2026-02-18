type ProductQuickResponse = {
  ok?: boolean;
  message?: string;
  stock?: number | string;
  active?: boolean;
  featured?: boolean;
};

type ProductToggleKind = 'active' | 'featured';

type ProductQuickActionsOptions = {
  showMiniToast?: (message: string) => void;
};

class HttpActionError extends Error {
  status: number;
  data: ProductQuickResponse | null;

  constructor(message: string, status: number, data: ProductQuickResponse | null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function initAdminProductsQuickActions({ showMiniToast }: ProductQuickActionsOptions): void {
  const root = document.querySelector<HTMLElement>('[data-admin-products]');
  if (!root) return;

  const toast = (message: string): void => {
    if (typeof showMiniToast === 'function') showMiniToast(message);
  };

  const postFormJson = async (form: HTMLFormElement): Promise<ProductQuickResponse> => {
    const res = await fetch(form.action, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
      body: new FormData(form),
    });

    let data: ProductQuickResponse | null = null;
    try {
      data = (await res.json()) as ProductQuickResponse;
    } catch (_e) {}

    if (!res.ok) {
      const msg = data?.message || (res.status === 419 ? 'Sesion expirada (CSRF)' : 'No se pudo completar');
      throw new HttpActionError(msg, res.status, data);
    }

    return data ?? {};
  };

  const setBusy = (form: HTMLFormElement, busy: boolean): void => {
    form.dataset.busy = busy ? '1' : '0';
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (btn) btn.disabled = busy;
    if (busy) btn?.classList.add('opacity-60', 'pointer-events-none');
    else btn?.classList.remove('opacity-60', 'pointer-events-none');
  };

  const updateStockUI = (productId: string, stock: number | string | undefined): void => {
    const s = Number(stock ?? 0);
    const label = s > 0 ? `Stock: ${s}` : 'Sin stock';
    const ok = s > 0;

    root.querySelectorAll<HTMLElement>(`[data-stock-label-for="${productId}"]`).forEach((el) => {
      el.textContent = label;
      el.classList.toggle('badge-emerald', ok);
      el.classList.toggle('badge-rose', !ok);
    });

    root.querySelectorAll<HTMLInputElement>(`[data-stock-input-for="${productId}"]`).forEach((el) => {
      el.value = String(s);
    });
  };

  const updateToggleUI = (btn: HTMLElement, kind: ProductToggleKind, value: boolean | undefined): void => {
    const on = !!value;

    if (kind === 'active') {
      btn.textContent = on ? 'Activo' : 'Inactivo';
      btn.classList.toggle('badge-emerald', on);
      btn.classList.toggle('badge-zinc', !on);
    }

    if (kind === 'featured') {
      btn.textContent = on ? 'Destacado' : 'Normal';
      btn.classList.toggle('badge-amber', on);
      btn.classList.toggle('badge-zinc', !on);
    }
  };

  root.addEventListener(
    'submit',
    async (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;

      const toggleKindRaw = form.getAttribute('data-admin-product-toggle');
      const isStock = form.hasAttribute('data-admin-product-stock');
      const toggleKind = (toggleKindRaw === 'active' || toggleKindRaw === 'featured') ? toggleKindRaw : null;

      if (!toggleKind && !isStock) return;

      e.preventDefault();
      if (form.dataset.busy === '1') return;

      setBusy(form, true);

      try {
        const data = await postFormJson(form);

        if (toggleKind) {
          const btn =
            form.querySelector<HTMLElement>('[data-toggle-btn]') ||
            form.querySelector<HTMLElement>('button[type="submit"]');
          if (btn) updateToggleUI(btn, toggleKind, data[toggleKind]);
        }

        if (isStock) {
          const pid = form.getAttribute('data-product-id');
          if (pid) updateStockUI(pid, data.stock ?? 0);
        }

        toast(data.message || 'Actualizado');
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Error');
      } finally {
        setBusy(form, false);
      }
    },
    true
  );

  const bulkBar = root.querySelector<HTMLElement>('[data-products-bulk-bar]');
  const bulkForm = root.querySelector<HTMLFormElement>('[data-admin-products-bulk]');
  const bulkCount = root.querySelector<HTMLElement>('[data-bulk-count]');
  const selectAll = root.querySelector<HTMLInputElement>('[data-bulk-select-all]');
  const actionSel = root.querySelector<HTMLSelectElement>('[data-bulk-action]');
  const stockInput = root.querySelector<HTMLInputElement>('[data-bulk-stock]');
  const applyBtn = root.querySelector<HTMLButtonElement>('[data-bulk-apply]');
  const clearBtn = root.querySelector<HTMLButtonElement>('[data-bulk-clear]');

  if (!bulkBar || !bulkForm) return;

  const getChecks = (): HTMLInputElement[] =>
    Array.from(root.querySelectorAll<HTMLInputElement>('[data-bulk-checkbox]'));

  const getSelectedIds = (): string[] =>
    getChecks()
      .filter((c) => c.checked)
      .map((c) => String(c.value));

  const refresh = (): void => {
    const ids = getSelectedIds();
    const has = ids.length > 0;

    bulkBar.classList.toggle('hidden', !has);
    if (bulkCount) bulkCount.textContent = String(ids.length);

    if (selectAll) {
      const checks = getChecks();
      selectAll.checked = checks.length > 0 && checks.every((c) => c.checked);
      selectAll.indeterminate = checks.some((c) => c.checked) && !selectAll.checked;
    }

    const action = actionSel?.value || '';
    const needsStock = action === 'set_stock';
    if (stockInput) stockInput.classList.toggle('hidden', !needsStock);

    const canApply = has && action !== '' && (!needsStock || (!!stockInput && stockInput.value !== ''));
    if (applyBtn) applyBtn.disabled = !canApply;
  };

  if (selectAll) {
    selectAll.addEventListener('change', () => {
      getChecks().forEach((c) => {
        c.checked = selectAll.checked;
      });
      refresh();
    });
  }

  root.addEventListener(
    'change',
    (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.matches('[data-bulk-checkbox]')) refresh();
      if (t.matches('[data-bulk-action]')) refresh();
      if (t.matches('[data-bulk-stock]')) refresh();
    },
    true
  );

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      getChecks().forEach((c) => {
        c.checked = false;
      });
      if (selectAll) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
      }
      if (actionSel) actionSel.value = '';
      if (stockInput) stockInput.value = '';
      refresh();
    });
  }

  bulkForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ids = getSelectedIds();
    const action = actionSel?.value || '';
    const needsStock = action === 'set_stock';
    const stockVal = stockInput?.value ?? '';

    if (!ids.length || !action) return;

    if (needsStock && stockVal === '') {
      toast('Ingresa el stock para aplicar');
      return;
    }

    if (action === 'delete') {
      const ok = confirm('Eliminar productos seleccionados? (Se omiten los que tengan pedidos)');
      if (!ok) return;
    }

    try {
      const fd = new FormData(bulkForm);
      ids.forEach((id) => fd.append('ids[]', id));

      const res = await fetch(bulkForm.action, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
        body: fd,
      });

      const data = (await res.json().catch(() => ({}))) as ProductQuickResponse;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo aplicar la accion');
      }

      toast(data?.message || 'Aplicado');
      setTimeout(() => window.location.reload(), 350);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error');
    }
  });

  refresh();
}
