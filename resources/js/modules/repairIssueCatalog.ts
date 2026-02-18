type CatalogMode = 'create' | 'edit';

type IssueItem = {
  id: number | string;
  name: string;
};

type IssuesIndexResponse = {
  issues?: IssueItem[];
};

type IssueCreateResponse = {
  issue?: { id?: number | string };
};

function getCsrf(form: HTMLFormElement | null): string {
  return (
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.getAttribute('content') ||
    form?.querySelector<HTMLInputElement>('input[name="_token"]')?.value ||
    ''
  );
}

async function fetchJson<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(opts.headers || {}),
    },
    ...opts,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch (_e) {}

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && 'message' in data && typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string'
          ? (data as { error: string }).error
          : `HTTP ${res.status}`);
    throw new Error(msg);
  }

  return (data as T) ?? ({} as T);
}

function openList(sel: HTMLSelectElement | null): void {
  if (!sel) return;
  const n = sel.options?.length || 0;
  if (n <= 1) return;
  sel.size = Math.min(8, Math.max(2, n));
}

function closeList(sel: HTMLSelectElement | null): void {
  if (!sel) return;
  sel.size = 1;
}

function firstMatch(list: IssueItem[], q: string): IssueItem | null {
  const s = (q || '').trim().toLowerCase();
  if (!s) return null;

  return (
    list.find((x) => (x.name || '').toLowerCase() === s) ||
    list.find((x) => (x.name || '').toLowerCase().startsWith(s)) ||
    null
  );
}

export function initRepairIssueCatalog(): void {
  const blocks = document.querySelectorAll<HTMLElement>('[data-repair-issue-catalog]');
  if (!blocks.length) return;

  blocks.forEach((block) => {
    const form = block.closest('form') as HTMLFormElement | null;
    const mode = ((block.dataset.catalogMode || 'create') as CatalogMode);

    const typeSel = form?.querySelector<HTMLSelectElement>('[data-device-type]') || null;
    const issueSearch = block.querySelector<HTMLInputElement>('[data-issue-search]');
    const issueSel = block.querySelector<HTMLSelectElement>('[data-issue-select]');
    const btnAddIssue = block.querySelector<HTMLButtonElement>('[data-add-issue]');

    if (!typeSel || !issueSearch || !issueSel) return;

    let issuesList: IssueItem[] = [];

    const setEnabled = (enabled: boolean): void => {
      issueSearch.disabled = !enabled;
      issueSel.disabled = !enabled;
      if (btnAddIssue) btnAddIssue.disabled = !enabled;

      if (!enabled) {
        issueSearch.value = '';
        issueSel.innerHTML = '<option value="">Elegi una falla...</option>';
        closeList(issueSel);
      }
    };

    const setOptions = (items: IssueItem[], selectedId: number | string | null): void => {
      issuesList = (items || []).map((x) => ({ id: x.id, name: x.name }));

      const keep = issueSel.querySelector('option[value=""]')?.textContent || 'Elegi una falla...';
      issueSel.innerHTML = `<option value="">${keep}</option>`;

      for (const it of issuesList) {
        const opt = document.createElement('option');
        opt.value = String(it.id);
        opt.textContent = it.name;
        issueSel.appendChild(opt);
      }

      if (selectedId !== null && selectedId !== '') {
        issueSel.value = String(selectedId);
        const label = issueSel.options[issueSel.selectedIndex]?.text || '';
        if (label) issueSearch.value = label;
      }
    };

    const loadIssues = async (typeId: string, selectedId: number | string | null = null): Promise<void> => {
      if (!typeId) {
        setEnabled(false);
        return;
      }

      setEnabled(true);

      const selectedFromData = selectedId ?? issueSel.dataset.selected ?? '';

      const qs = new URLSearchParams({ type_id: String(typeId), mode });
      if (mode === 'edit' && selectedFromData) {
        qs.set('selected_issue_id', String(selectedFromData));
      }

      const data = await fetchJson<IssuesIndexResponse>(`/admin/device-catalog/issues?${qs.toString()}`);
      setOptions(data.issues || [], selectedId);
    };

    const issueCreateRow = block.querySelector<HTMLElement>('[data-issue-create-row]');
    const issueCreateInput = block.querySelector<HTMLInputElement>('[data-issue-create-input]');
    const issueCreateSave = block.querySelector<HTMLButtonElement>('[data-issue-create-save]');
    const issueCreateCancel = block.querySelector<HTMLButtonElement>('[data-issue-create-cancel]');

    const openCreateRow = (prefill = ''): void => {
      if (!issueCreateRow || !issueCreateInput) return;
      issueCreateRow.classList.remove('hidden');
      issueCreateInput.value = (prefill || '').trim();
      issueCreateInput.focus();
      issueCreateInput.select();
    };

    const closeCreateRow = (): void => {
      if (!issueCreateRow || !issueCreateInput) return;
      issueCreateRow.classList.add('hidden');
      issueCreateInput.value = '';
    };

    const createIssue = async (name: string): Promise<number | string | null> => {
      const typeId = (typeSel.value || '').trim();
      if (!typeId) return null;

      const fd = new FormData();
      fd.append('type_id', typeId);
      fd.append('name', name);

      const csrf = getCsrf(form);
      const data = await fetchJson<IssueCreateResponse>('/admin/device-catalog/issues', {
        method: 'POST',
        headers: csrf ? { 'X-CSRF-TOKEN': csrf } : {},
        body: fd,
      });

      return data?.issue?.id ?? null;
    };

    const saveIssueFromRow = async (): Promise<void> => {
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

      await loadIssues(typeId, null);
    };

    typeSel.addEventListener('change', async () => {
      closeCreateRow();
      const typeId = (typeSel.value || '').trim();
      const selected = issueSel.getAttribute('data-selected');
      await loadIssues(typeId, selected || null);
      issueSel.removeAttribute('data-selected');
    });

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

    issueSearch.addEventListener('focus', () => openList(issueSel));

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

    issueCreateSave?.addEventListener('click', () => {
      void saveIssueFromRow();
    });
    issueCreateCancel?.addEventListener('click', closeCreateRow);

    issueCreateInput?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      void saveIssueFromRow();
    });

    btnAddIssue?.addEventListener('click', () => openCreateRow((issueSearch.value || '').trim()));

    void (async () => {
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
