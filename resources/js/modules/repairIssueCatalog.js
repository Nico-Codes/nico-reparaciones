export function initRepairIssueCatalog() {
const blocks = document.querySelectorAll('[data-repair-issue-catalog]');
if (!blocks.length) return;

const getCsrf = (form) =>
  document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  || form?.querySelector('input[name="_token"]')?.value
  || '';

const fetchJson = async (url, opts = {}) => {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Accept': 'application/json',
      ...(opts.headers || {}),
    },
    ...opts,
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
};

const openList = (sel) => {
  if (!sel) return;
  const n = sel.options?.length || 0;
  if (n <= 1) return;
  sel.size = Math.min(8, Math.max(2, n));
};

const closeList = (sel) => {
  if (!sel) return;
  sel.size = 1;
};

const firstMatch = (list, q) => {
  const s = (q || '').trim().toLowerCase();
  if (!s) return null;
  return (
    list.find(x => (x.name || '').toLowerCase() === s) ||
    list.find(x => (x.name || '').toLowerCase().startsWith(s)) ||
    null
  );
};

blocks.forEach((block) => {
  const form = block.closest('form');
  const mode = block.dataset.catalogMode || 'create'; // create | edit


  // el tipo está en el catálogo de device (mismo form)
  const typeSel = form?.querySelector('[data-device-type]');
  const issueSearch = block.querySelector('[data-issue-search]');
  const issueSel = block.querySelector('[data-issue-select]');
  const btnAddIssue = block.querySelector('[data-add-issue]');

  if (!typeSel || !issueSearch || !issueSel) return;

  let issuesList = [];

  const setEnabled = (enabled) => {
    issueSearch.disabled = !enabled;
    issueSel.disabled = !enabled;
    if (btnAddIssue) btnAddIssue.disabled = !enabled;
    if (!enabled) {
      issueSearch.value = '';
      issueSel.innerHTML = '<option value="">Elegí una falla…</option>';
      closeList(issueSel);
    }
  };

  const setOptions = (items, selectedId) => {
    issuesList = (items || []).map(x => ({ id: x.id, name: x.name }));

    const keep = issueSel.querySelector('option[value=""]')?.textContent || 'Elegí una falla…';
    issueSel.innerHTML = `<option value="">${keep}</option>`;
    for (const it of issuesList) {
      const opt = document.createElement('option');
      opt.value = String(it.id);
      opt.textContent = it.name;
      issueSel.appendChild(opt);
    }

    if (selectedId) {
      issueSel.value = String(selectedId);
      const label = issueSel.options[issueSel.selectedIndex]?.text || '';
      if (label) issueSearch.value = label;
    }
  };

    const loadIssues = async (typeId, selectedId = null) => {
      if (!typeId) {
        setEnabled(false);
        return;
      }

      setEnabled(true);

      const sel = selectedId || issueSel?.dataset?.selected || '';

      const qs = new URLSearchParams({ type_id: String(typeId), mode });
      if (mode === 'edit' && sel) qs.set('selected_issue_id', String(sel));

      const data = await fetchJson(`/admin/device-catalog/issues?${qs.toString()}`);
      const items = data.issues || [];
      setOptions(items, selectedId);
    };


  // UI inline para crear falla (sin prompt)
  const issueCreateRow    = block.querySelector('[data-issue-create-row]');
  const issueCreateInput  = block.querySelector('[data-issue-create-input]');
  const issueCreateSave   = block.querySelector('[data-issue-create-save]');
  const issueCreateCancel = block.querySelector('[data-issue-create-cancel]');

  const openCreateRow = (prefill = '') => {
    if (!issueCreateRow || !issueCreateInput) return;
    issueCreateRow.classList.remove('hidden');
    issueCreateInput.value = (prefill || '').trim();
    issueCreateInput.focus();
    issueCreateInput.select?.();
  };

  const closeCreateRow = () => {
    if (!issueCreateRow || !issueCreateInput) return;
    issueCreateRow.classList.add('hidden');
    issueCreateInput.value = '';
  };

  const createIssue = async (name) => {
    const typeId = (typeSel.value || '').trim();
    if (!typeId) return null;

    const fd = new FormData();
    fd.append('type_id', typeId);
    fd.append('name', name);

    const csrf = getCsrf(form);
    const data = await fetchJson('/admin/device-catalog/issues', {
      method: 'POST',
      headers: csrf ? { 'X-CSRF-TOKEN': csrf } : {},
      body: fd,
    });

    return data?.issue?.id || null;
  };

  const saveIssueFromRow = async () => {
    const typeId = (typeSel.value || '').trim();
    if (!typeId) return;

    const name = (issueCreateInput?.value || '').trim();
    if (!name) return;

    const newId = await createIssue(name);
    if (newId) {
      await loadIssues(typeId, newId);
      issueSel.value = String(newId);
      issueSel.dispatchEvent(new Event('change', { bubbles: true }));
      closeCreateRow();
      return;
    }

    // fallback
    await loadIssues(typeId, null);
  };

  // Eventos UI
  typeSel.addEventListener('change', async () => {
    closeCreateRow();
    const typeId = (typeSel.value || '').trim();
    const selected = issueSel.getAttribute('data-selected');
    await loadIssues(typeId, selected || null);
    issueSel.removeAttribute('data-selected');
  });

  // Enter: si hay match, selecciona. Si no, ofrece crear inline.
  issueSearch.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const q = (issueSearch.value || '').trim();
    if (!q) return;

    const hit = firstMatch(issuesList, q);
    if (hit) {
      closeCreateRow();
      issueSel.value = String(hit.id);
      issueSel.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    openCreateRow(q);
  });

  // Si escriben una falla exacta y salen del campo, auto-selecciona
  issueSearch.addEventListener('blur', () => {
    setTimeout(() => {
      if (issueSel.value) return;
      if (!issueCreateRow?.classList.contains('hidden')) return;

      const q = (issueSearch.value || '').trim();
      if (!q) return;

      const hit = firstMatch(issuesList, q);
      if (!hit) return;

      issueSel.value = String(hit.id);
      issueSel.dispatchEvent(new Event('change', { bubbles: true }));
    }, 0);
  });

  issueSel.addEventListener('change', () => {
    const label = issueSel.options[issueSel.selectedIndex]?.text || '';
    issueSearch.value = label || '';
    closeList(issueSel);
  });

  // Botones inline (si existen)
  issueCreateSave?.addEventListener('click', saveIssueFromRow);
  issueCreateCancel?.addEventListener('click', closeCreateRow);

  issueCreateInput?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    saveIssueFromRow();
  });

  // Compatibilidad si todavía existiera el botón viejo
  btnAddIssue?.addEventListener('click', () => openCreateRow((issueSearch.value || '').trim()));


  // Init (si ya hay tipo seleccionado)
  (async () => {
    const typeId = (typeSel.value || '').trim();
    const selected = issueSel.getAttribute('data-selected');
    if (typeId) {
      await loadIssues(typeId, selected || null);
      issueSel.removeAttribute('data-selected');
    } else {
      setEnabled(false);
    }
  })();
});
}
