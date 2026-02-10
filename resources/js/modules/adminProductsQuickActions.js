export function initAdminProductsQuickActions({ showMiniToast }) {
const root = document.querySelector('[data-admin-products]');
if (!root) return;

const postFormJson = async (form) => {
  const res = await fetch(form.action, {
    method: 'POST',
    headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
    body: new FormData(form),
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    const msg = data?.message || (res.status === 419 ? 'Sesión expirada (CSRF) ⚠️' : 'No se pudo completar ⚠️');
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

const setBusy = (form, busy) => {
  form.dataset.busy = busy ? '1' : '0';
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.disabled = !!busy;
  if (busy) btn?.classList.add('opacity-60', 'pointer-events-none');
  else btn?.classList.remove('opacity-60', 'pointer-events-none');
};

const updateStockUI = (productId, stock) => {
  const s = Number(stock ?? 0);
  const label = s > 0 ? `Stock: ${s}` : 'Sin stock';
  const ok = s > 0;

  root.querySelectorAll(`[data-stock-label-for="${productId}"]`).forEach(el => {
    el.textContent = label;
    el.classList.toggle('badge-emerald', ok);
    el.classList.toggle('badge-rose', !ok);
  });

  root.querySelectorAll(`[data-stock-input-for="${productId}"]`).forEach(el => {
    el.value = String(s);
  });
};

const updateToggleUI = (btn, kind, value) => {
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

root.addEventListener('submit', async (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;

  const toggleKind = form.getAttribute('data-admin-product-toggle');
  const isStock = form.hasAttribute('data-admin-product-stock');

  if (!toggleKind && !isStock) return;

  e.preventDefault();
  if (form.dataset.busy === '1') return;

  setBusy(form, true);

  try {
    const data = await postFormJson(form);

    if (toggleKind) {
      const btn = form.querySelector('[data-toggle-btn]') || form.querySelector('button[type="submit"]');
      if (btn) updateToggleUI(btn, toggleKind, data?.[toggleKind]);
    }

    if (isStock) {
      const pid = form.getAttribute('data-product-id');
      if (pid) updateStockUI(pid, data?.stock ?? 0);
    }

    if (typeof showMiniToast === 'function') showMiniToast(data?.message || 'Actualizado ✅');
  } catch (err) {
    if (typeof showMiniToast === 'function') showMiniToast(err?.message || 'Error ⚠️');
  } finally {
    setBusy(form, false);
  }
}, true);

// Bulk actions (productos)
(() => {
  const bulkBar = root.querySelector('[data-products-bulk-bar]');
  const bulkForm = root.querySelector('[data-admin-products-bulk]');
  const bulkCount = root.querySelector('[data-bulk-count]');
  const selectAll = root.querySelector('[data-bulk-select-all]');
  const actionSel = root.querySelector('[data-bulk-action]');
  const stockInput = root.querySelector('[data-bulk-stock]');
  const applyBtn = root.querySelector('[data-bulk-apply]');
  const clearBtn = root.querySelector('[data-bulk-clear]');

  if (!bulkBar || !bulkForm) return;

  const getChecks = () => Array.from(root.querySelectorAll('[data-bulk-checkbox]'));
  const getSelectedIds = () => getChecks().filter(c => c.checked).map(c => String(c.value));

  const refresh = () => {
    const ids = getSelectedIds();
    const has = ids.length > 0;

    bulkBar.classList.toggle('hidden', !has);
    if (bulkCount) bulkCount.textContent = String(ids.length);

    if (selectAll) {
      const checks = getChecks();
      selectAll.checked = checks.length > 0 && checks.every(c => c.checked);
      selectAll.indeterminate = checks.some(c => c.checked) && !selectAll.checked;
    }

    const action = actionSel?.value || '';
    const needsStock = action === 'set_stock';
    if (stockInput) stockInput.classList.toggle('hidden', !needsStock);

    const canApply = has && action !== '' && (!needsStock || (stockInput && stockInput.value !== ''));
    if (applyBtn) applyBtn.disabled = !canApply;
  };

  // Select all
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      getChecks().forEach(c => { c.checked = selectAll.checked; });
      refresh();
    });
  }

  // Any checkbox change
  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t && t.matches('[data-bulk-checkbox]')) refresh();
    if (t && t.matches('[data-bulk-action]')) refresh();
    if (t && t.matches('[data-bulk-stock]')) refresh();
  }, true);

  // Clear
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      getChecks().forEach(c => { c.checked = false; });
      if (selectAll) { selectAll.checked = false; selectAll.indeterminate = false; }
      if (actionSel) actionSel.value = '';
      if (stockInput) stockInput.value = '';
      refresh();
    });
  }

  // Submit bulk
  bulkForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ids = getSelectedIds();
    const action = actionSel?.value || '';
    const needsStock = action === 'set_stock';
    const stockVal = stockInput?.value ?? '';

    if (!ids.length) return;
    if (!action) return;

    if (needsStock && stockVal === '') {
      if (typeof showMiniToast === 'function') showMiniToast('Ingresá el stock para aplicar ⚠️');
      return;
    }

    if (action === 'delete') {
      const ok = confirm('¿Eliminar productos seleccionados? (Se omiten los que tengan pedidos)');
      if (!ok) return;
    }

    try {
      const fd = new FormData(bulkForm);
      ids.forEach(id => fd.append('ids[]', id));

      const res = await fetch(bulkForm.action, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo aplicar la acción ⚠️');
      }

      if (typeof showMiniToast === 'function') showMiniToast(data?.message || 'Aplicado ✅');
      setTimeout(() => window.location.reload(), 350);
    } catch (err) {
      if (typeof showMiniToast === 'function') showMiniToast(err?.message || 'Error ⚠️');
    }
  });

  // init
  refresh();
})();



}
