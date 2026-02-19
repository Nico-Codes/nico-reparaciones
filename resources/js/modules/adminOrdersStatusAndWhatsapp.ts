type AdminOrderModuleOptions = {
  afterPaint: (fn: () => void) => void;
  lockScroll: (key: string) => void;
  unlockScroll: (key: string) => void;
  showMiniToast: (message: string) => void;
};
export function initAdminOrdersStatusAndWhatsapp({ afterPaint, lockScroll, unlockScroll, showMiniToast }: AdminOrderModuleOptions) {
  const adminBadgeClass = (st) => {
    switch (st) {
      case 'pendiente': return 'badge-amber';
      case 'confirmado': return 'badge-sky';
      case 'preparando': return 'badge-indigo';
      case 'listo_retirar': return 'badge-emerald';
      case 'entregado': return 'badge-zinc';
      case 'cancelado': return 'badge-rose';
      default: return 'badge-zinc';
    }
  };

  // Bottom-sheet confirm (reutiliza el estilo del toast)
  let adminConfirm: null | { open: (args: { title?: string; message?: string; okText?: string; cancelText?: string }) => Promise<boolean> } = null;

  const ensureAdminConfirm = () => {
    if (adminConfirm) return adminConfirm;

    const html = `
      <div id="nrAdminConfirmOverlay"
           class="fixed inset-0 z-[70] opacity-0 pointer-events-none transition-opacity duration-300 ease-out">
        <div class="absolute inset-0 bg-zinc-950/40" data-admin-confirm-cancel></div>

        <div id="nrAdminConfirmSheet"
             class="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-lg translate-y-full transform transition-transform duration-300 ease-out will-change-transform">
          <div class="rounded-t-3xl bg-white p-4 shadow-2xl">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-black text-zinc-900" id="nrAdminConfirmTitle">¿Notificar?</div>
                <div class="text-sm text-zinc-600 mt-1" id="nrAdminConfirmMsg">-</div>
              </div>
              <button type="button" class="icon-btn" data-admin-confirm-cancel aria-label="Cerrar">×</button>
            </div>

            <div class="mt-4 flex gap-2">
              <button type="button" class="btn-primary flex-1 justify-center" data-admin-confirm-ok>
                Abrir WhatsApp
              </button>
              <button type="button" class="btn-outline flex-1 justify-center" data-admin-confirm-cancel>
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('nrAdminConfirmOverlay');
    const sheet = document.getElementById('nrAdminConfirmSheet');
    const titleEl = document.getElementById('nrAdminConfirmTitle');
    const msgEl = document.getElementById('nrAdminConfirmMsg');
    const okBtn = overlay.querySelector<HTMLButtonElement>('[data-admin-confirm-ok]');

    let resolver: null | ((val: boolean) => void) = null;

    const close = (val) => {
      overlay.classList.add('pointer-events-none', 'opacity-0');
      overlay.classList.remove('pointer-events-auto', 'opacity-100');
      sheet.classList.add('translate-y-full');

      unlockScroll('admin-confirm');

      const r = resolver;
      resolver = null;
      if (typeof r === 'function') r(val);
    };

    overlay.querySelectorAll('[data-admin-confirm-cancel]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); close(false); });
    });

    okBtn.addEventListener('click', (e) => { e.preventDefault(); close(true); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && resolver) close(false);
    });

    adminConfirm = {
      open: ({ title, message, okText, cancelText }) =>
        new Promise<boolean>((resolve) => {
          resolver = resolve;

          if (titleEl) titleEl.textContent = title || '¿Notificar por WhatsApp?';
          if (msgEl) msgEl.textContent = message || '';
          if (okText) okBtn.textContent = okText;

          const cancelBtn = overlay.querySelector('button[data-admin-confirm-cancel].btn-outline');
          if (cancelBtn && cancelText) cancelBtn.textContent = cancelText;

          lockScroll('admin-confirm');

          overlay.classList.remove('pointer-events-none', 'opacity-0');
          overlay.classList.add('pointer-events-auto', 'opacity-100');

          afterPaint(() => sheet.classList.remove('translate-y-full'));
        }),
    };

    return adminConfirm;
  };

    const postFormJson = async (form: HTMLFormElement) => {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
        body: new FormData(form),
      });

      let data = null;
      try { data = await res.json(); } catch (_) {}

      if (res.ok && data?.ok) return data;

      const msg =
        (data && (data.message || data.error)) ||
        (data && data.errors && Object.values(data.errors).flat().join(' ')) ||
        'No se pudo completar la accion.';

      const err = new Error(msg) as Error & { status?: number; data?: unknown };
      err.status = res.status;
      err.data = data;
      throw err;
    };


  const setValueOrText = (el, value) => {
    if (!el) return;
    const v = String(value ?? '');
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.value = v;
    else el.textContent = v;
  };

  const getAdminOrdersFilter = () => {
    // 1) Preferimos lo que viene del Blade (mÃ¡s confiable)
    const root = document.querySelector('[data-admin-orders-filter]');
    const domVal = (root?.getAttribute('data-admin-orders-filter') || '').trim();
    if (domVal && domVal !== 'all') return domVal;

    // 2) Fallback por URL
    const params = new URLSearchParams(window.location.search);
    const qVal = (params.get('status') || '').trim();
    return qVal && qVal !== 'all' ? qVal : '';
  };

  const getAdminOrdersWaFilter = () => {
    const params = new URLSearchParams(window.location.search);
    const v = (params.get('wa') || '').trim();
    return ['pending','sent','no_phone'].includes(v) ? v : '';
  };

  const waStateToTabKey = (state) => {
    if (state === 'ok') return 'sent';
    if (state === 'pending') return 'pending';
    if (state === 'no_phone') return 'no_phone';
    return '';
  };

  const matchesWaFilter = (filter, state) => {
    if (!filter) return true;
    if (filter === 'pending') return state === 'pending';
    if (filter === 'sent') return state === 'ok';
    if (filter === 'no_phone') return state === 'no_phone';
    return true;
  };

  const bumpAdminOrdersWaTab = (key, delta) => {
    const el = document.querySelector(`[data-admin-orders-wa-count="${key}"]`);
    if (!el) return;
    const curr = parseInt(el.textContent || '0', 10) || 0;
    el.textContent = String(Math.max(0, curr + (parseInt(delta,10)||0)));
  };


  const bumpAdminOrdersTab = (st, delta) => {
    const key = String(st || '').trim();
    if (!key) return;

    const el = document.querySelector(`[data-admin-orders-count="${key}"]`);
    if (!el) return;

    const curr = parseInt((el.textContent || '0').trim(), 10) || 0;
    const next = Math.max(0, curr + (parseInt(delta, 10) || 0));
    el.textContent = String(next);
  };

  let adminOrderTransitionsCache = null;
  const getAdminOrderTransitions = (card) => {
    if (adminOrderTransitionsCache) return adminOrderTransitionsCache;

    const source =
      (card && (card.closest('[data-admin-order-transitions]') || (card.hasAttribute('data-admin-order-transitions') ? card : null))) ||
      document.querySelector('[data-admin-order-transitions]');

    let parsed = {};
    if (source) {
      try {
        const raw = source.getAttribute('data-admin-order-transitions') || '{}';
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') parsed = data;
      } catch (_) {}
    }

    adminOrderTransitionsCache = parsed;
    return parsed;
  };

  const syncStatusOptions = (card: HTMLElement, currentStatus: string) => {
    const transitions = getAdminOrderTransitions(card);
    const allowed = Array.isArray(transitions?.[currentStatus])
      ? transitions[currentStatus].map((v) => String(v))
      : [];
    const allowedSet = new Set(allowed);
    let hasEnabledOption = false;

    card.querySelectorAll<HTMLButtonElement>('[data-admin-order-set-status]').forEach((b) => {
      const btnStatus = String(b.getAttribute('data-status') || '').trim();
      const isCur = btnStatus === currentStatus;
      const canPick = isCur || allowedSet.has(btnStatus);
      const shouldDisable = !canPick || isCur;

      b.classList.toggle('bg-zinc-100', isCur);
      b.disabled = shouldDisable;
      b.classList.toggle('opacity-60', shouldDisable);
      b.classList.toggle('cursor-not-allowed', shouldDisable);

      if (!shouldDisable) hasEnabledOption = true;
    });

    const menuBtn = card.querySelector<HTMLButtonElement>('[data-admin-order-status-btn]');
    if (menuBtn) {
      menuBtn.disabled = !hasEnabledOption;
      menuBtn.classList.toggle('opacity-60', !hasEnabledOption);
      menuBtn.classList.toggle('cursor-not-allowed', !hasEnabledOption);
    }
  };

  const ensureAdminOrdersEmpty = () => {
    const list = document.querySelector('[data-admin-orders-list]');
    if (!list) return;

    if (list.querySelector('[data-admin-order-card]')) return;

    list.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="font-black text-zinc-900">No hay pedidos</div>
          <div class="muted mt-1">Proba cambiar el estado o ajustar la busqueda.</div>
        </div>
      </div>
    `;
  };

  // AnimaciÃ³n "mÃ¡s visible" para admin (fade + slide + collapse)
  const animateAdminOut = (el: HTMLElement | null) =>
    new Promise<void>((resolve) => {
      if (!el) return resolve();

      el.style.overflow = 'hidden';
      el.style.willChange = 'height, opacity, transform';

      const h = el.offsetHeight;
      el.style.height = `${h}px`;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      el.style.transition = 'height 260ms ease, opacity 220ms ease, transform 220ms ease';

      requestAnimationFrame(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        el.style.height = '0px';
      });

      el.addEventListener(
        'transitionend',
        () => {
          el.remove();
          resolve();
        },
        { once: true }
      );
    });

    const waBadgeClass = (state) => {
      switch (state) {
        case 'ok': return 'badge-emerald';
        case 'pending': return 'badge-amber';
        case 'no_phone': return 'badge-zinc';
        default: return 'badge-zinc';
      }
    };

    const waBadgeText = (state) => {
      switch (state) {
        case 'ok': return 'WA OK';
        case 'pending': return 'WA pendiente';
        case 'no_phone': return 'Sin tel';
        default: return 'WA';
      }
    };

    const setWaBadgeState = (el, state) => {
      if (!el) return;
      el.dataset.waState = state;
      el.className = waBadgeClass(state);
      el.textContent = waBadgeText(state);
    };


  document.querySelectorAll<HTMLElement>('[data-admin-order-card]').forEach((card) => {
    const statusForm = card.querySelector<HTMLFormElement>('form[data-admin-order-status-form]');
    const waForm = card.querySelector<HTMLFormElement>('form[data-admin-order-wa-form]');
    const badgeEls = card.querySelectorAll<HTMLElement>('[data-admin-order-status-badge]');
    const waLink = card.querySelector<HTMLAnchorElement>('[data-admin-order-wa-link]');
    const waOpenBtn = card.querySelector<HTMLElement>('[data-admin-order-wa-open]');
    const waBadge = card.querySelector<HTMLElement>('[data-admin-order-wa-badge]');
    const waLastBadge = card.querySelector<HTMLElement>('[data-admin-order-wa-last]');

    const waMsgEls = card.querySelectorAll<HTMLElement>('[data-admin-order-wa-message]');

    const menuBtn = card.querySelector<HTMLButtonElement>('[data-admin-order-status-btn]');
    const menuId = menuBtn?.getAttribute('data-menu');
    const menu = menuId ? document.getElementById(menuId) : null;
    const initialStatus = String(card.dataset.status || '').trim();

    syncStatusOptions(card, initialStatus);

    // BotÃ³n WhatsApp en el detalle: abrir WA y registrar log (sin confirm)
    if (waOpenBtn && waForm) {
      waOpenBtn.addEventListener('click', async (e) => {
        const href = waLink?.getAttribute('href') || waOpenBtn.getAttribute('href');
        if (!href) return;

        e.preventDefault();
        window.open(href, '_blank', 'noopener');

        try {
          const data = await postFormJson(waForm);
          showMiniToast(data?.created ? 'Log WhatsApp registrado OK' : 'Ya habia un log reciente OK');

          if (waBadge) {
            waBadge.textContent = 'WA OK';
            waBadge.className = 'badge-emerald';
            waBadge.dataset.waState = 'ok';
          }

          // actualizar "Ãšltimo"
          if (data?.log) {
            const lastAt = card.querySelector('[data-admin-wa-last-at]');
            const lastBy = card.querySelector('[data-admin-wa-last-by]');
            if (lastAt && data.log.sent_at) lastAt.textContent = data.log.sent_at;
            if (lastBy && data.log.sent_by) lastBy.textContent = data.log.sent_by;

            // agregar item al listado (si existe en esta vista)
            const list = card.querySelector('[data-admin-wa-log-list]');
            if (list) {
              card.querySelector('[data-admin-wa-log-empty]')?.remove();

              const li = document.createElement('li');
              li.className = 'rounded-xl border border-zinc-200 p-3';

              const title = document.createElement('div');
              title.className = 'flex items-center justify-between gap-2';

              const st = document.createElement('div');
              st.className = 'font-extrabold text-zinc-900';
              st.textContent = data.log.status_label || data.log.status || '-';

              const at = document.createElement('div');
              at.className = 'text-xs text-zinc-500';
              at.textContent = data.log.sent_at || '-';

              title.appendChild(st);
              title.appendChild(at);

              const by = document.createElement('div');
              by.className = 'text-xs text-zinc-500 mt-1';
              by.textContent = data.log.sent_by || '-';

              const details = document.createElement('details');
              details.className = 'mt-2';

              const summary = document.createElement('summary');
              summary.className = 'text-xs font-black text-zinc-600 cursor-pointer select-none';
              summary.textContent = 'Ver mensaje';

              const msg = document.createElement('div');
              msg.className = 'mt-2 text-xs whitespace-pre-wrap text-zinc-700';
              msg.textContent = data.log.message || '';

              details.appendChild(summary);
              details.appendChild(msg);

              li.appendChild(title);
              li.appendChild(by);
              li.appendChild(details);

              list.prepend(li);
            }
          }
        } catch (_) {
          showMiniToast('No se pudo registrar el log');
        }


      });
    }

    card.querySelectorAll<HTMLButtonElement>('[data-admin-order-set-status]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();

        const next = btn.getAttribute('data-status');
        if (!next || !statusForm) return;

        if (btn.disabled) return;

        if (card.dataset.busy === '1') return;
        card.dataset.busy = '1';
        if (menuBtn) menuBtn.disabled = true;

        menu?.classList.add('hidden');
        menuBtn?.setAttribute('aria-expanded', 'false');

        const prevSt = String(card.dataset.status || '').trim();

        const stInput = statusForm.querySelector<HTMLInputElement>('input[name="status"]');
        const cmInput = statusForm.querySelector<HTMLInputElement>('input[name="comment"]');
        if (stInput) stInput.value = next;
        if (cmInput) cmInput.value = '';

        try {
          const data = await postFormJson(statusForm);

          const newSt = data.status || next;
          card.dataset.status = newSt;
          const prevWaState = String(waBadge?.dataset?.waState || 'no_phone');
          const activeStatusFilter = getAdminOrdersFilter();
          const leavingStatusGroup = !!(activeStatusFilter && activeStatusFilter !== newSt);

          // contadores
          if (prevSt && newSt && prevSt !== newSt) {
            bumpAdminOrdersTab(prevSt, -1);
            bumpAdminOrdersTab(newSt, +1);
          }

          // dropdown: activo + disable current
          syncStatusOptions(card, newSt);

          // UI: badges (puede haber 1 o mÃ¡s en la vista)
          badgeEls.forEach((el) => {
            setValueOrText(el, data.status_label || newSt);
            el.className = adminBadgeClass(newSt);
          });

          showMiniToast('Estado actualizado OK');

          // WhatsApp (si backend devuelve wa.url/message)
          const waUrl = data?.wa?.url || null;
          const waMsg = data?.wa?.message || '';

          if (waLink) {
            if (waUrl) {
              waLink.href = waUrl;
              waLink.classList.remove('pointer-events-none', 'opacity-50');
            } else {
              waLink.removeAttribute('href');
              waLink.classList.add('pointer-events-none', 'opacity-50');
            }
          }

          // WA badge: si hay URL, queda pendiente (hasta notificar); si no, sin tel
          setWaBadgeState(waBadge, waUrl ? 'pending' : 'no_phone');


          if (waMsgEls?.length) {
            waMsgEls.forEach((el) => setValueOrText(el, waMsg));
          }

          // Si hay WA, confirmamos si notificar (como ya venÃ­as haciendo)
          if (waUrl) {
            const confirmUI = ensureAdminConfirm();
            const ok = await confirmUI.open({
              title: '¿Notificar por WhatsApp?',
              message: `Pedido #${data.order_id} -> ${data.status_label || newSt}`,
              okText: 'Abrir WhatsApp',
              cancelText: 'Ahora no',
            });

            if (ok) {
              window.open(waUrl, '_blank', 'noopener');

              if (waForm) {
                try {
                  const prevState = waBadge?.dataset?.waState || 'no_phone';
                  const prevKey = waStateToTabKey(prevState);

                  const data = await postFormJson(waForm);

                  setWaBadgeState(waBadge, 'ok');
                  if (waLastBadge) waLastBadge.textContent = data?.notified_at_label || 'recien';

                  const nextKey = waStateToTabKey('ok');
                  if (prevKey && nextKey && prevKey !== nextKey) {
                    bumpAdminOrdersWaTab(prevKey, -1);
                    bumpAdminOrdersWaTab(nextKey, +1);
                  }

                  showMiniToast(data?.created ? 'Log WhatsApp registrado OK' : 'Ya habia un log reciente OK');

                  const waFilter = getAdminOrdersWaFilter();
                  if (waFilter && !matchesWaFilter(waFilter, 'ok')) {
                    await animateAdminOut(card);
                    ensureAdminOrdersEmpty();
                    return;
                  }

                } catch (_) {
                  showMiniToast('No se pudo registrar el log');
                }
              }

            }
          }

          const nextWaState = String(data?.wa?.state || (waUrl ? 'pending' : 'no_phone'));
          setWaBadgeState(waBadge, nextWaState);
          if (waLastBadge) waLastBadge.textContent = data?.wa?.notified_at_label || '-';

          // si permanece en el status actual, ajusto contadores por cambio de estado WA
          if (!leavingStatusGroup) {
            const prevKey = waStateToTabKey(prevWaState);
            const nextKey = waStateToTabKey(nextWaState);
            if (prevKey && nextKey && prevKey !== nextKey) {
              bumpAdminOrdersWaTab(prevKey, -1);
              bumpAdminOrdersWaTab(nextKey, +1);
            }
          }

          // RemociÃ³n final por filtros
          const waFilter = getAdminOrdersWaFilter();
          const finalWaState = waBadge?.dataset?.waState || nextWaState;
          const removeByWa = !!(waFilter && !matchesWaFilter(waFilter, finalWaState));

          const shouldRemoveFromList = leavingStatusGroup || removeByWa;

          if (shouldRemoveFromList) {
            if (leavingStatusGroup) {
              bumpAdminOrdersWaTab('all', -1);
              const prevKey = waStateToTabKey(prevWaState);
              if (prevKey) bumpAdminOrdersWaTab(prevKey, -1);
            }

            await animateAdminOut(card);
            ensureAdminOrdersEmpty();
            return;
          }


          } catch (err) {
            if (err && err.status === 422) {
              showMiniToast(err.message || 'No se pudo actualizar el estado');
            } else {
              statusForm.submit();
            }
          } finally {
            card.dataset.busy = '0';
            syncStatusOptions(card, String(card.dataset.status || '').trim());
          }

      });
    });

  });
}



