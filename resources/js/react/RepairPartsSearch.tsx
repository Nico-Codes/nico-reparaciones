import { useEffect } from 'react';

type SupplierQueueItem = {
  id: number;
  name?: string;
};

type PartSearchRow = {
  supplier_id?: number;
  supplier_name?: string;
  part_name?: string;
  stock?: string;
  price?: number;
  url?: string;
  relevance_score?: number;
  saving_vs_avg?: number;
  saving_pct_vs_avg?: number;
  is_best_price?: boolean;
};

type RepairPartsSearchProps = {
  rootSelector: string;
};

export default function RepairPartsSearch({ rootSelector }: RepairPartsSearchProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(rootSelector);
    if (!root) return;

    const bySupplierBase = root.dataset.searchBySupplierBase || '';
    const suppliersQueue: SupplierQueueItem[] = (() => {
      try {
        const raw = JSON.parse(root.dataset.searchSuppliers || '[]') as unknown;
        return Array.isArray(raw) ? (raw as SupplierQueueItem[]) : [];
      } catch (_e) {
        return [];
      }
    })();

    const queryInput = root.querySelector<HTMLInputElement>('[data-part-search-query]');
    const searchBtn = root.querySelector<HTMLButtonElement>('[data-part-search-btn]');
    const clearBtn = root.querySelector<HTMLButtonElement>('[data-part-search-clear]');
    const resultsWrap = root.querySelector<HTMLElement>('[data-part-search-results-wrap]');
    const resultsBody = root.querySelector<HTMLElement>('[data-part-search-results]');
    const statusEl = root.querySelector<HTMLElement>('[data-part-search-status]');
    const progressWrap = root.querySelector<HTMLElement>('[data-part-search-progress-wrap]');
    const progressBar = root.querySelector<HTMLElement>('[data-part-search-progress-bar]');

    const partsCostInput = document.querySelector<HTMLInputElement>('input[name="parts_cost"]');
    const supplierSelect = document.querySelector<HTMLSelectElement>('select[name="supplier_id"]');
    const supplierPartInput = document.querySelector<HTMLInputElement>('input[name="supplier_part_name"]');
    const purchaseReferenceInput = document.querySelector<HTMLInputElement>('input[name="purchase_reference"]');

    if (!queryInput || !searchBtn || !resultsWrap || !resultsBody) return;

    let currentRun = 0;
    let aggregatedRows: PartSearchRow[] = [];

    const money = (value: unknown): string =>
      '$ ' + new Intl.NumberFormat('es-AR').format(Number(value || 0));

    const escapeHtml = (value: unknown): string =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const enrichSavings = (rows: PartSearchRow[]): PartSearchRow[] => {
      const prices = rows
        .map((row) => Number(row.price || 0))
        .filter((price) => Number.isFinite(price) && price > 0);
      const avg = prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : 0;
      const best = prices.length > 0 ? Math.min(...prices) : 0;

      return rows.map((row) => {
        const price = Number(row.price || 0);
        const savingVsAvg = Math.max(0, avg - price);
        const savingPctVsAvg = avg > 0 ? Math.round((savingVsAvg / avg) * 100) : 0;
        return {
          ...row,
          saving_vs_avg: savingVsAvg,
          saving_pct_vs_avg: savingPctVsAvg,
          is_best_price: best > 0 && price === best,
        };
      });
    };

    const applySelection = (row: PartSearchRow): void => {
      if (partsCostInput) {
        partsCostInput.value = String(row.price || 0);
        partsCostInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (supplierSelect && row.supplier_id) {
        supplierSelect.value = String(row.supplier_id);
        supplierSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (supplierPartInput) {
        supplierPartInput.value = String(row.part_name || '');
        supplierPartInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (purchaseReferenceInput) {
        const ref = row.url
          ? `${row.supplier_name || ''} | ${row.part_name || ''} | ${money(row.price)} | ${row.url}`
          : `${row.supplier_name || ''} | ${row.part_name || ''} | ${money(row.price)}`;
        purchaseReferenceInput.value = ref.trim();
        purchaseReferenceInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    const renderRows = (rows: PartSearchRow[]): void => {
      resultsBody.innerHTML = '';
      if (!Array.isArray(rows) || rows.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" class="px-3 py-4 text-center text-zinc-500">Sin resultados para esta busqueda.</td>';
        resultsBody.appendChild(tr);
        resultsWrap.classList.remove('hidden');
        return;
      }

      const rowsToRender = enrichSavings(rows);
      rowsToRender.forEach((row) => {
        const tr = document.createElement('tr');
        tr.className = 'border-t border-zinc-100';
        const safeName = escapeHtml(row.supplier_name || '-');
        const safePart = escapeHtml(row.part_name || '-');
        const safeStock = escapeHtml(row.stock || '-');
        const safeUrl = row.url ? escapeHtml(row.url) : '';
        const saving = Number(row.saving_vs_avg || 0);
        const savingPct = Number(row.saving_pct_vs_avg || 0);
        const isBest = Boolean(row.is_best_price);
        tr.innerHTML = `
          <td class="px-3 py-2 font-semibold text-zinc-900">${safeName}</td>
          <td class="px-3 py-2 text-zinc-700">${safePart}</td>
          <td class="px-3 py-2 text-zinc-700">${safeStock}</td>
          <td class="px-3 py-2 text-right font-black ${isBest ? 'text-emerald-700' : 'text-zinc-900'}">
            ${money(row.price)}
            ${isBest ? '<span class="badge-emerald ml-2">Mejor precio</span>' : ''}
          </td>
          <td class="px-3 py-2 text-right font-semibold ${saving > 0 ? 'text-emerald-700' : 'text-zinc-500'}">
            ${saving > 0 ? `${money(saving)} (${savingPct}%)` : '-'}
          </td>
          <td class="px-3 py-2 text-right">
            <button type="button" class="btn-ghost btn-sm h-9" data-part-apply>Usar</button>
            ${row.url ? '<button type="button" class="btn-ghost btn-sm h-9" data-part-buy>Comprar</button>' : ''}
            ${row.url ? `<a class="btn-ghost btn-sm h-9" href="${safeUrl}" target="_blank" rel="noopener">Abrir</a>` : ''}
          </td>
        `;

        const applyBtn = tr.querySelector<HTMLButtonElement>('[data-part-apply]');
        applyBtn?.addEventListener('click', () => applySelection(row));

        const buyBtn = tr.querySelector<HTMLButtonElement>('[data-part-buy]');
        buyBtn?.addEventListener('click', () => {
          applySelection(row);
          if (row.url) window.open(String(row.url), '_blank', 'noopener');
        });

        resultsBody.appendChild(tr);
      });

      resultsWrap.classList.remove('hidden');
    };

    const appendUniqueRows = (incomingRows: PartSearchRow[]): void => {
      incomingRows.forEach((row) => {
        const key = `${String(row.url || '').toLowerCase()}|${String(row.part_name || '').toLowerCase()}|${Number(row.price || 0)}`;
        const exists = aggregatedRows.some((r) => {
          const k = `${String(r.url || '').toLowerCase()}|${String(r.part_name || '').toLowerCase()}|${Number(r.price || 0)}`;
          return k === key;
        });
        if (!exists) aggregatedRows.push(row);
      });
    };

    const byRelevanceThenPrice = (rows: PartSearchRow[]): PartSearchRow[] =>
      [...rows].sort((a, b) => {
        const aScore = Number(a.relevance_score || 0);
        const bScore = Number(b.relevance_score || 0);
        if (bScore !== aScore) return bScore - aScore;
        return Number(a.price || 0) - Number(b.price || 0);
      });

    const updateStatus = (text: string): void => {
      if (statusEl) statusEl.textContent = text;
    };

    const setProgress = (done: number, total: number): void => {
      if (!progressWrap || !progressBar) return;
      if (!total || done <= 0) {
        progressWrap.classList.add('hidden');
        progressBar.style.width = '0%';
        return;
      }
      const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
      progressWrap.classList.remove('hidden');
      progressBar.style.width = `${pct}%`;
    };

    const runSearch = async (): Promise<void> => {
      const q = String(queryInput.value || '').trim();
      if (q.length < 2) {
        updateStatus('Escribe al menos 2 caracteres para buscar.');
        return;
      }

      currentRun += 1;
      const runId = currentRun;
      aggregatedRows = [];
      renderRows([]);
      resultsWrap.classList.remove('hidden');
      searchBtn.disabled = true;
      searchBtn.textContent = 'Buscando...';
      if (clearBtn) {
        clearBtn.disabled = false;
        clearBtn.textContent = 'Cancelar';
      }
      setProgress(0, 0);

      const queue = suppliersQueue.length > 0 ? suppliersQueue : [];
      if (queue.length === 0) {
        updateStatus('No hay proveedores con busqueda habilitada.');
        searchBtn.disabled = false;
        searchBtn.textContent = 'Buscar';
        if (clearBtn) clearBtn.textContent = 'Limpiar';
        return;
      }

      try {
        for (let i = 0; i < queue.length; i += 1) {
          if (runId !== currentRun) return;

          const supplier = queue[i];
          updateStatus(`Buscando ${i + 1}/${queue.length}: ${supplier.name || 'Proveedor'}...`);
          setProgress(i, queue.length);

          const url = new URL(`${bySupplierBase}/${supplier.id}`, window.location.origin);
          url.searchParams.set('q', q);
          const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
          const data = (await res.json().catch(() => null)) as { results?: PartSearchRow[] } | null;
          const rows = Array.isArray(data?.results) ? data.results : [];
          appendUniqueRows(rows);
          const ordered = byRelevanceThenPrice(aggregatedRows);
          renderRows(ordered);
          setProgress(i + 1, queue.length);
        }

        if (aggregatedRows.length === 0) {
          updateStatus('Sin resultados en los proveedores consultados.');
        } else {
          updateStatus(`Completado: ${aggregatedRows.length} resultado(s) en ${queue.length} proveedor(es).`);
        }
      } catch (_e) {
        if (runId === currentRun) {
          renderRows([]);
          updateStatus('Error consultando proveedores. Revisa conexion o configuracion.');
        }
      } finally {
        if (runId === currentRun) {
          searchBtn.disabled = false;
          searchBtn.textContent = 'Buscar';
          if (clearBtn) clearBtn.textContent = 'Limpiar';
          window.setTimeout(() => setProgress(0, 0), 500);
        }
      }
    };

    const onQueryKeydown = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void runSearch();
      }
    };

    const onSearchClick = (): void => {
      void runSearch();
    };

    const onClearClick = (): void => {
      const searching = searchBtn.disabled;
      if (searching) {
        currentRun += 1;
        searchBtn.disabled = false;
        searchBtn.textContent = 'Buscar';
        if (clearBtn) clearBtn.textContent = 'Limpiar';
        updateStatus('Busqueda cancelada.');
        setProgress(0, 0);
        return;
      }

      queryInput.value = '';
      resultsBody.innerHTML = '';
      resultsWrap.classList.add('hidden');
      updateStatus('');
      setProgress(0, 0);
      queryInput.focus();
    };

    searchBtn.addEventListener('click', onSearchClick);
    queryInput.addEventListener('keydown', onQueryKeydown);
    clearBtn?.addEventListener('click', onClearClick);

    return () => {
      currentRun += 1;
      searchBtn.removeEventListener('click', onSearchClick);
      queryInput.removeEventListener('keydown', onQueryKeydown);
      clearBtn?.removeEventListener('click', onClearClick);
    };
  }, [rootSelector]);

  return null;
}
