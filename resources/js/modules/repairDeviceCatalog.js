export function initRepairDeviceCatalog() {
  // ✅ Repair Create: pricing auto (costos automáticos)
  const initRepairPricingAuto = () => {
  const root = document.querySelector('[data-repair-pricing-auto]');
  if (!root) return;

  const form = root.closest('form');
  if (!form) return;

  const partsEl = form.querySelector('[data-parts-cost]');
  const laborEl = form.querySelector('[data-labor-cost]');
  const shipEl = form.querySelector('[data-shipping-enabled]');
  const shipAmtEl = form.querySelector('[data-shipping-amount]');
  const profitEl = form.querySelector('[data-profit-display]') || form.querySelector('[data-profit-suggested]');
  const totalEl = form.querySelector('[data-total-display]') || form.querySelector('[data-suggested-total]');

  const finalEl = form.querySelector('[data-final-price]');
  const finalAutoEl = form.querySelector('[data-final-auto]');
  const ruleLabelEl = form.querySelector('[data-pricing-rule-label]');
  const ruleActionEl = form.querySelector('[data-pricing-rule-action]');

  const pricingResolveUrl = '/admin/precios/resolve';
  const pricingCreateBase = root.dataset.pricingCreateBase || '/admin/precios/crear';
  const pricingEditBase = root.dataset.pricingEditBase || '/admin/precios';

  const getSelected = (name) => {
    const el = form.querySelector(`[name="${name}"]`);
    return el ? String(el.value || '') : '';
  };

  let resolveTimer = null;
  let currentRule = null;

  const fmtMoney = (n) => {
    try {
      return new Intl.NumberFormat('es-AR').format(Number(n || 0));
    } catch {
      return String(n || 0);
    }
  };

  const updateRuleAction = ({ ruleId, groupId }) => {
    if (!ruleActionEl) return;

    const deviceTypeId = getSelected('device_type_id');
    const brandId = getSelected('device_brand_id');
    const modelId = getSelected('device_model_id');
    const repairTypeId = getSelected('repair_type_id');

    const canCreate = !!(deviceTypeId && repairTypeId);

    ruleActionEl.classList.toggle('pointer-events-none', !canCreate);
    ruleActionEl.classList.toggle('opacity-50', !canCreate);

    if (ruleId) {
      ruleActionEl.textContent = 'Editar regla';
      ruleActionEl.href = `${pricingEditBase}/${ruleId}/editar`;
      return;
    }

    ruleActionEl.textContent = 'Crear regla';
    if (!canCreate) {
      ruleActionEl.href = pricingCreateBase;
      return;
    }

    const params = new URLSearchParams();
    params.set('device_type_id', deviceTypeId);
    params.set('repair_type_id', repairTypeId);
    if (brandId) params.set('device_brand_id', brandId);
    if (modelId) params.set('device_model_id', modelId);
    if (groupId) params.set('device_model_group_id', groupId);

    ruleActionEl.href = `${pricingCreateBase}?${params.toString()}`;
  };

  const setVal = (el, val) => {
    if (!el) return;
    el.value = val === null || typeof val === 'undefined' ? '' : String(val);
  };

  const compute = () => {
    const parts = Number(partsEl?.value || 0);
    const labor = Number(laborEl?.value || 0);
    const shipOn = !!shipEl?.checked;
    const shipAmt = Number(shipAmtEl?.value || 0);

    let profit = 0;
    let suggested = 0;

    if (currentRule && currentRule.mode === 'fixed') {
      // ✅ modo fijo: total fijo + envío (ganancia sugerida = fijo - repuesto)
      const fixed = Number(currentRule.fixed_total || 0);
      profit = Math.max(0, fixed - parts);
      suggested = fixed + (shipOn ? shipAmt : 0);
      // (labor no impacta el sugerido en modo fijo)
    } else if (currentRule && currentRule.mode === 'margin') {
      const mult = Number(currentRule.multiplier || 0);
      const minProfit = Number(currentRule.min_profit || 0);
      profit = Math.max(parts * mult, minProfit);
      suggested = parts + labor + profit + (shipOn ? shipAmt : 0);
    } else {
      // fallback sin regla
      profit = 0;
      suggested = parts + labor + (shipOn ? shipAmt : 0);
    }

    if (profitEl) setVal(profitEl, Math.round(profit));
    if (totalEl) setVal(totalEl, Math.round(suggested));

    if (finalEl && finalAutoEl?.checked) {
      setVal(finalEl, Math.round(suggested));
    }
  };

  const resolveRule = async () => {
    const deviceTypeId = getSelected('device_type_id');
    const brandId = getSelected('device_brand_id');
    const modelId = getSelected('device_model_id');
    const repairTypeId = getSelected('repair_type_id');

    // si falta info, reset
    if (!deviceTypeId || !repairTypeId) {
      currentRule = null;
      if (ruleLabelEl) ruleLabelEl.textContent = 'Regla: —';
      updateRuleAction({ ruleId: null, groupId: null });
      compute();
      return;
    }

    try {
      const url = new URL(pricingResolveUrl, window.location.origin);
      url.searchParams.set('device_type_id', deviceTypeId);
      url.searchParams.set('repair_type_id', repairTypeId);
      if (brandId) url.searchParams.set('device_brand_id', brandId);
      if (modelId) url.searchParams.set('device_model_id', modelId);

      const res = await fetch(url.toString(), {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      if (!res.ok) throw new Error('resolve failed');
      const data = await res.json();

      currentRule = data?.rule || null;

      // set shipping default si viene en la regla (solo si el campo está en 0/vacío)
      if (currentRule && shipAmtEl) {
        const curShip = Number(shipAmtEl.value || 0);
        if (!curShip && currentRule.shipping_default != null) {
          setVal(shipAmtEl, Math.round(Number(currentRule.shipping_default || 0)));
        }
      }

      // label + link
      if (ruleLabelEl) {
        if (!currentRule) {
          ruleLabelEl.textContent = 'Regla: —';
        } else if (currentRule.mode === 'fixed') {
          ruleLabelEl.textContent = `Regla: Fijo $${fmtMoney(currentRule.fixed_total || 0)} (+ envío $${fmtMoney(currentRule.shipping_default || 0)})`;
        } else {
          ruleLabelEl.textContent = `Regla: x${currentRule.multiplier || 0} (min $${fmtMoney(currentRule.min_profit || 0)}) (+ envío $${fmtMoney(currentRule.shipping_default || 0)})`;
        }
      }

      updateRuleAction({ ruleId: currentRule?.id || null, groupId: data?.group_id || null });
      compute();
    } catch (e) {
      currentRule = null;
      if (ruleLabelEl) ruleLabelEl.textContent = 'Regla: —';
      updateRuleAction({ ruleId: null, groupId: null });
      compute();
    }
  };

  const debouncedResolve = () => {
    clearTimeout(resolveTimer);
    resolveTimer = setTimeout(() => {
      if (ruleLabelEl) ruleLabelEl.textContent = 'Regla: calculando…';
      updateRuleAction({ ruleId: null, groupId: null });
      resolveRule();
    }, 350);
  };

  // listeners
  [
    partsEl,
    laborEl,
    shipEl,
    shipAmtEl,
    form.querySelector('[name="device_type_id"]'),
    form.querySelector('[name="device_brand_id"]'),
    form.querySelector('[name="device_model_id"]'),
    form.querySelector('[name="repair_type_id"]'),
  ].forEach((el) => {
    if (!el) return;
    el.addEventListener('input', () => {
      compute();
      debouncedResolve();
    });
    el.addEventListener('change', () => {
      compute();
      debouncedResolve();
    });
  });

  // si el usuario toca el precio final, apagamos auto
  if (finalEl && finalAutoEl) {
    finalEl.addEventListener('input', () => {
      finalAutoEl.checked = false;
    });
  }

  // init
  updateRuleAction({ ruleId: null, groupId: null });
  debouncedResolve();
  compute();
};


  initRepairPricingAuto();


  const blocks = document.querySelectorAll('[data-repair-device-catalog]');
  if (!blocks.length) return;

  const headers = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' };

  const getCsrf = () =>
    document.querySelector('input[name="_token"]')?.value || '';

  const setOptions = (select, items, placeholder, selectedId = null) => {
    select.innerHTML = '';
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = placeholder;
    select.appendChild(opt0);

    items.forEach(it => {
      const opt = document.createElement('option');
      opt.value = String(it.id);
      opt.textContent = it.name;
      if (selectedId && String(selectedId) === String(it.id)) opt.selected = true;
      select.appendChild(opt);
    });
  };

  const fetchJson = async (url, opts={}) => {
    const res = await fetch(url, { credentials: 'same-origin', headers, ...opts });
    const j = await res.json().catch(() => null);
    if (!res.ok) throw new Error(j?.message || 'Error');
    return j;
  };

  blocks.forEach(block => {
    const typeSel  = block.querySelector('[data-device-type]');
    const brandSel = block.querySelector('[data-device-brand]');
    const modelSel = block.querySelector('[data-device-model]');

    const brandSearch = block.querySelector('[data-brand-search]');
    const modelSearch = block.querySelector('[data-model-search]');

    let brandsList = [];
    let modelsList = [];

    const mode = block.dataset.catalogMode || 'create'; // create | edit


    // ✅ NUEVO: control de carga de modelos (evita “parpadeos” si cambiás rápido)
    let modelsLoadSeq = 0;
    let modelsLoadTimer = null;


    // ✅ Helpers: “desplegar” el select como listbox mientras buscás
    const openList = (sel) => {
      if (!sel) return;
      const n = sel.options?.length || 0;
      if (n <= 1) return; // solo placeholder
      sel.size = Math.min(6, Math.max(2, n)); // ✅ más cómodo en móvil
    };


    const closeList = (sel) => {
      if (!sel) return;
      sel.size = 1;
    };

    const btnAddBrand = block.querySelector('[data-add-brand]');
    const brandForm = block.querySelector('[data-add-brand-form]');
    const brandInput = block.querySelector('[data-add-brand-input]');
    const btnSaveBrand = block.querySelector('[data-save-brand]');
    const btnCancelBrand = block.querySelector('[data-cancel-brand]');

    const btnAddModel = block.querySelector('[data-add-model]');
    const modelForm = block.querySelector('[data-add-model-form]');
    const modelInput = block.querySelector('[data-add-model-input]');
    const btnSaveModel = block.querySelector('[data-save-model]');
    const btnCancelModel = block.querySelector('[data-cancel-model]');

    const loadBrands = async (typeId, selected=null) => {
      brandSel.disabled = true;
      modelSel.disabled = true;
      btnAddModel.disabled = true;

      setOptions(brandSel, [], 'Cargando marcas…');
      setOptions(modelSel, [], '— Elegí una marca primero —');

      const selectedBrandId = selected || brandSel.dataset.selected || '';

      const qs = new URLSearchParams({ type_id: String(typeId), mode });
      if (mode === 'edit' && selectedBrandId) qs.set('selected_brand_id', String(selectedBrandId));

      const j = await fetchJson(`/admin/device-catalog/brands?${qs.toString()}`);
      brandsList = j.brands || [];

      brandSel.disabled = false;
      if (brandSearch) { brandSearch.disabled = false; brandSearch.value = ''; }
      if (btnAddBrand) btnAddBrand.disabled = false;

      setOptions(brandSel, brandsList, '— Elegí una marca —', selectedBrandId);
    };


    const loadModels = async (brandId, selected=null, expectedSeq=null) => {
      modelSel.disabled = true;
      btnAddModel.disabled = true;

      setOptions(modelSel, [], 'Cargando modelos…');

      const selectedModelId = selected || modelSel.dataset.selected || '';

      const qs = new URLSearchParams({ brand_id: String(brandId), mode });
      if (mode === 'edit' && selectedModelId) qs.set('selected_model_id', String(selectedModelId));

      const j = await fetchJson(`/admin/device-catalog/models?${qs.toString()}`);

      // ✅ si cambiaste de marca mientras cargaba, ignorar este resultado
      if (expectedSeq !== null && expectedSeq !== modelsLoadSeq) return;

      modelsList = j.models || [];

      modelSel.disabled = false;
      btnAddModel.disabled = false;

      if (modelSearch) {
        modelSearch.disabled = false;
        modelSearch.value = '';
        modelSearch.placeholder = modelSearch.getAttribute('placeholder') || 'Buscar modelo…';
      }

      setOptions(modelSel, modelsList, '— Elegí un modelo —', selectedModelId);
    };



    // cambios
    typeSel?.addEventListener('change', async () => {
      const typeId = typeSel.value || '';

      // reset marca + modelo (siempre que cambia tipo)
      brandSel.innerHTML = '<option value="">— Elegí un tipo primero —</option>';
      brandSel.disabled = true;

      modelSel.innerHTML = '<option value="">— Elegí una marca primero —</option>';
      modelSel.disabled = true;

      btnAddModel.disabled = true;

      if (btnAddBrand) btnAddBrand.disabled = true;

      if (brandSearch) {
        brandSearch.value = '';
        brandSearch.disabled = true;
      }

      if (modelSearch) {
        modelSearch.value = '';
        modelSearch.disabled = true;
      }

      brandsList = [];
      modelsList = [];

      if (!typeId) return;

      await loadBrands(typeId);

      // ✅ UX: al terminar, te manda directo a Marca
      setTimeout(() => brandSearch?.focus?.(), 0);
    });



    brandSel?.addEventListener('change', async () => {
      // ✅ si estás navegando la lista con flechas, NO recargues modelos todavía
      if (brandSel?.dataset?.nrKbNav === '1' && document.activeElement === brandSel) return;

      const brandId = brandSel.value || '';

      // reset modelo (siempre que cambia marca)
      modelSel.innerHTML = '<option value="">— Elegí una marca primero —</option>';
      modelSel.disabled = true;
      btnAddModel.disabled = true;

      if (modelSearch) {
        modelSearch.value = '';
        modelSearch.disabled = true;
        modelSearch.placeholder = 'Cargando modelos…';
      }

      modelsList = [];

      if (!brandId) return;

      // ✅ delay suave para evitar “cambio muy rápido” y confusión
      const seq = ++modelsLoadSeq;
      if (modelsLoadTimer) clearTimeout(modelsLoadTimer);

      // mantener un toque el estado “cargando”
      setOptions(modelSel, [], 'Cargando modelos…');

        modelsLoadTimer = setTimeout(() => {
          (async () => {
            try {
              await loadModels(brandId, null, seq);

              // ✅ si esta carga sigue siendo la vigente, enfocamos Modelo
              if (seq === modelsLoadSeq) {
                setTimeout(() => modelSearch?.focus?.(), 0);
              }
            } catch (e) {
              console.error('[NR] loadModels error:', e);
            }
          })();
        }, 250);

    });



    // buscar marca/modelo (filtra opciones cargadas)
    const applyBrandFilter = () => {
      if (!brandSearch) return;
      const q = (brandSearch.value || '').trim().toLowerCase();
      const current = brandSel?.value || null;

      const filtered = !q
        ? brandsList
        : brandsList.filter(b => (b.name || '').toLowerCase().includes(q));

      setOptions(brandSel, filtered, '— Elegí una marca —', current);

      // ✅ “Despliega” automáticamente
      openList(brandSel);
    };

    const applyModelFilter = () => {
      if (!modelSearch) return;
      const q = (modelSearch.value || '').trim().toLowerCase();
      const current = modelSel?.value || null;

      const filtered = !q
        ? modelsList
        : modelsList.filter(m => (m.name || '').toLowerCase().includes(q));

      setOptions(modelSel, filtered, '— Elegí un modelo —', current);

      // ✅ “Despliega” automáticamente
      openList(modelSel);
    };


    brandSearch?.addEventListener('input', applyBrandFilter);
    modelSearch?.addEventListener('input', applyModelFilter);

          // ✅ Si escriben exacto y salen del input, auto-selecciona (evita errores por no apretar Enter)
    brandSearch?.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.activeElement === brandSel) return; // si fue a elegir con mouse/flechas, no molestamos
        if (brandSel.value) return;
        const q = (brandSearch.value || '').trim();
        if (!q) return;
        const hit = firstMatch(brandsList, q);
        if (!hit) return;

        brandSel.value = String(hit.id);
        brandSel.dispatchEvent(new Event('change', { bubbles: true }));
        closeList(brandSel);
      }, 0);
    });

    modelSearch?.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.activeElement === modelSel) return;
        if (modelSel.value) return;
        const q = (modelSearch.value || '').trim();
        if (!q) return;
        const hit = firstMatch(modelsList, q);
        if (!hit) return;

        modelSel.value = String(hit.id);
        modelSel.dispatchEvent(new Event('change', { bubbles: true }));
        closeList(modelSel);
      }, 0);
    });


    // ✅ Mantener la lista abierta cuando pasás del input al select (para poder navegar con flechas)
      const keepListWhileInteracting = (searchEl, selEl) => {
      if (!searchEl || !selEl) return;

      const syncInputFromSelect = () => {
        const label = selEl.options[selEl.selectedIndex]?.text || '';
        if (label && !label.startsWith('—')) searchEl.value = label;
      };

      const setPrev = () => { selEl.dataset.nrPrevValue = String(selEl.value || ''); };
      const changed = () => String(selEl.value || '') !== String(selEl.dataset.nrPrevValue || '');

      const startKbNav = () => { selEl.dataset.nrKbNav = '1'; };
      const stopKbNav  = () => { delete selEl.dataset.nrKbNav; };

      const commit = () => {
        stopKbNav();
        syncInputFromSelect();
        closeList(selEl);

        // si cambió realmente, forzar un change “final” (para que marca cargue modelos una sola vez)
        if (changed()) selEl.dispatchEvent(new Event('change', { bubbles: true }));
        setPrev();
      };

      const maybeClose = () => {
        setTimeout(() => {
          const ae = document.activeElement;
          if (ae !== searchEl && ae !== selEl) {
            // al salir del control, confirmamos y cerramos
            commit();
          }
        }, 0);
      };

      searchEl.addEventListener('focus', () => openList(selEl));

      selEl.addEventListener('focus', () => {
        setPrev();
        openList(selEl);
      });

      searchEl.addEventListener('blur', maybeClose);
      selEl.addEventListener('blur', maybeClose);

      // ✅ teclado dentro del select
      selEl.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          startKbNav();
          openList(selEl);
          return; // dejamos que el browser navegue
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
          return;
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          stopKbNav();
          closeList(selEl);
          searchEl.focus();
        }
      });

      // ✅ si el change es por flechas mientras está enfocado, NO cerrar ni sync
      selEl.addEventListener('change', () => {
        if (selEl.dataset.nrKbNav === '1' && document.activeElement === selEl) return;

        // mouse click / selección externa: confirmar
        stopKbNav();
        syncInputFromSelect();
        closeList(selEl);
        setPrev();
      });

      // ✅ desde el input, ↓/↑ pasa al select para navegar sin cerrar
      searchEl.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        if (searchEl.disabled) return;
        e.preventDefault();

        openList(selEl);
        startKbNav();
        selEl.focus();

        if ((selEl.selectedIndex ?? 0) <= 0 && selEl.options.length > 1) {
          selEl.selectedIndex = 1;
        }
      });
    };

    keepListWhileInteracting(brandSearch, brandSel);
    keepListWhileInteracting(modelSearch, modelSel);


    // helpers (DEJAR SOLO UNA VEZ)
    const openBrandFormPrefill = (value) => {
      if (!brandForm || !brandInput) return;
      brandForm.classList.remove('hidden');
      brandForm.classList.add('flex');
      brandInput.value = (value || '').trim();
      brandInput.focus();
      brandInput.select?.();
    };

    const openModelFormPrefill = (value) => {
      if (!modelForm || !modelInput) return;
      modelForm.classList.remove('hidden');
      modelForm.classList.add('flex');
      modelInput.value = (value || '').trim();
      modelInput.focus();
      modelInput.select?.();
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

    // ENTER en buscador de marca: si matchea, selecciona; si no, abre alta con el texto
    brandSearch?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();

      if (brandSearch.disabled) return;
      const q = (brandSearch.value || '').trim();
      if (!q) return;

      const hit = firstMatch(brandsList, q);
      if (hit) {
        brandSel.value = String(hit.id);

        // refleja el nombre exacto en el input
        const label = brandSel.options[brandSel.selectedIndex]?.text || q;
        if (label && !label.startsWith('—')) brandSearch.value = label;

        brandSel.dispatchEvent(new Event('change', { bubbles: true })); // carga modelos
        closeList(brandSel);
        setTimeout(() => modelSearch?.focus(), 0);
        return;
      }

      openBrandFormPrefill(q);
    });

    // ENTER en buscador de modelo: si matchea, selecciona; si no, abre alta con el texto
    modelSearch?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();

      if (modelSearch.disabled) return;
      const q = (modelSearch.value || '').trim();
      if (!q) return;

      const hit = firstMatch(modelsList, q);
      if (hit) {
        modelSel.value = String(hit.id);
        modelSel.dispatchEvent(new Event('change', { bubbles: true }));

        const label = modelSel.options[modelSel.selectedIndex]?.text || q;
        if (label && !label.startsWith('—')) modelSearch.value = label;

        closeList(modelSel);

        // salto a "Falla principal" si existe
        document.querySelector('[data-issue-search]')?.focus?.();
        return;
      }

      openModelFormPrefill(q);
    });


    // agregar marca
    btnAddBrand?.addEventListener('click', () => {
      const v = (brandSearch?.value || '').trim();
      brandForm.classList.toggle('hidden');
      brandForm.classList.toggle('flex');
      if (brandInput) brandInput.value = v || brandInput.value || '';
      brandInput?.focus();
      brandInput?.select?.();
    });

    btnCancelBrand?.addEventListener('click', () => {
      brandForm.classList.add('hidden');
      brandForm.classList.remove('flex');
      if (brandInput) brandInput.value = '';
    });
    btnSaveBrand?.addEventListener('click', async () => {
      const name = (brandInput?.value || '').trim();
      const typeId = typeSel?.value;
      if (!typeId || !name) return;

      const fd = new FormData();
      fd.append('_token', getCsrf());
      fd.append('device_type_id', typeId);
      fd.append('name', name);

      const j = await fetchJson('/admin/device-catalog/brands', { method: 'POST', body: fd });
      await loadBrands(typeId, j.brand?.id);
      btnCancelBrand?.click();
      window.openToast?.('Marca agregada ✅', 'OK');
    });

    // agregar modelo
    btnAddModel?.addEventListener('click', () => {
      if (btnAddModel.disabled) return;
      const v = (modelSearch?.value || '').trim();
      modelForm.classList.toggle('hidden');
      modelForm.classList.toggle('flex');
      if (modelInput) modelInput.value = v || modelInput.value || '';
      modelInput?.focus();
      modelInput?.select?.();
    });

    btnCancelModel?.addEventListener('click', () => {
      modelForm.classList.add('hidden');
      modelForm.classList.remove('flex');
      if (modelInput) modelInput.value = '';
    });
    btnSaveModel?.addEventListener('click', async () => {
      const name = (modelInput?.value || '').trim();
      const brandId = brandSel?.value;
      if (!brandId || !name) return;

      const fd = new FormData();
      fd.append('_token', getCsrf());
      fd.append('device_brand_id', brandId);
      fd.append('name', name);

      const j = await fetchJson('/admin/device-catalog/models', { method: 'POST', body: fd });
      await loadModels(brandId, j.model?.id);
      btnCancelModel?.click();
      window.openToast?.('Modelo agregado ✅', 'OK');
    });

    brandInput?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      btnSaveBrand?.click();
    });

    modelInput?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      btnSaveModel?.click();
    });




    // init (si viene preseleccionado)
    const initType = typeSel?.value;
    if (initType) {
      loadBrands(initType).then(() => {
        const initBrand = brandSel?.value;
        if (initBrand) loadModels(initBrand);
      });
    }
  });
}
