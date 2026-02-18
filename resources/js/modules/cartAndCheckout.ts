export function initCartAndCheckout({ $, afterPaint, openToast }) {
  const serverOverlay = $('#cartAddedOverlay');
  if (serverOverlay?.dataset?.cartAdded === '1') {
    const serverName =
      (serverOverlay.dataset.cartAddedName || '').trim() ||
      ($('#cartAddedName')?.textContent || '').trim() ||
      'Producto';

    afterPaint(() => openToast(serverName));
  }

  // ----------------------------
  // Checkout: resumen colapsable mÃ³vil + siempre abierto desktop
  // ----------------------------
  const sumBtn = $('[data-summary-toggle]');
  const sumBody = $('[data-summary-body]');
  const sumIcon = $('[data-summary-icon]');

  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

  const setSummaryOpen = (open) => {
    if (!sumBtn || !sumBody) return;

    sumBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    sumBody.style.display = open ? 'block' : 'none';
    if (sumIcon) sumIcon.textContent = open ? 'â–´' : 'â–¾';
  };

  const syncSummary = () => {
    if (!sumBtn || !sumBody) return;

    if (isDesktop()) {
      sumBody.style.display = 'block';
      sumBtn.setAttribute('aria-expanded', 'true');
    } else {
      setSummaryOpen(false);
    }
  };

  if (sumBtn && sumBody) {
    syncSummary();
    window.addEventListener('resize', syncSummary);

    sumBtn.addEventListener('click', () => {
      if (isDesktop()) return;
      const expanded = sumBtn.getAttribute('aria-expanded') === 'true';
      setSummaryOpen(!expanded);
    });
  }

  // ----------------------------
  // Checkout: anti doble submit + loading
  // ----------------------------
  const checkoutForm = $('[data-checkout-form]');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      const btn = $('[data-checkout-submit]', checkoutForm);
      if (!btn) return;

      if (btn.disabled || btn.getAttribute('aria-busy') === 'true') {
        e.preventDefault();
        return;
      }

      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');

      const label = $('[data-checkout-label]', btn);
      const loading = $('[data-checkout-loading]', btn);
      if (label) label.classList.add('hidden');
      if (loading) loading.classList.remove('hidden');
      if (loading) loading.classList.add('inline-flex');
    });
  }

  // ---------------------------------------------
  // Preserve scroll para POSTs (carrito, etc.)
  // ---------------------------------------------
  const SCROLL_KEY = 'nr_preserve_scroll';

  const saveScroll = () => {
    try {
      sessionStorage.setItem(
        SCROLL_KEY,
        JSON.stringify({
          path: location.pathname,
          y: window.scrollY,
        })
      );
    } catch (_) {}
  };

  const restoreScroll = () => {
    try {
      const raw = sessionStorage.getItem(SCROLL_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      sessionStorage.removeItem(SCROLL_KEY);
      if (data?.path === location.pathname && Number.isFinite(data?.y)) {
        window.scrollTo(0, data.y);
      }
    } catch (_) {}
  };

  restoreScroll();

  document.addEventListener(
    'submit',
    (e) => {
      const form = e.target as HTMLElement | null;
      if (form?.dataset?.preserveScroll === '1') saveScroll();
    },
    true
  );

  // ---------------------------------------------
  // Carrito: eliminar Ã­tem sin recargar (fade + collapse)
  // ---------------------------------------------
  const formatARS = (value) => {
    const n = Number(value || 0);
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `$ ${Math.round(n)}`;
    }
  };

    const showMiniToast = (msg) => {
      const t = document.createElement('div');
      t.className = 'alert-success';
      t.textContent = msg;

      t.style.position = 'fixed';
      t.style.left = '50%';
      t.style.bottom = '14px';
      t.style.transform = 'translateX(-50%) translateY(8px)';
      t.style.zIndex = '9999';
      t.style.maxWidth = 'calc(100% - 24px)';
      t.style.opacity = '0';
      t.style.transition = 'opacity 160ms ease, transform 160ms ease';

      document.body.appendChild(t);

      requestAnimationFrame(() => {
        t.style.opacity = '1';
        t.style.transform = 'translateX(-50%) translateY(0)';
      });

      window.setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(-50%) translateY(8px)';
        window.setTimeout(() => t.remove(), 220);
      }, 1600);
    };

    // ---------------------------------------------
    // Carrito: habilitar/deshabilitar checkout segÃºn stock (sin recargar)
    // ---------------------------------------------
    const updateCartCheckoutState = () => {
      const btn = document.querySelector<HTMLElement>('[data-checkout-btn]');
      const warn = document.querySelector<HTMLElement>('[data-stock-warning]');
      if (!btn) return;

      let hasIssue = false;

      document.querySelectorAll<HTMLInputElement>('form[data-cart-qty] [data-qty-input]').forEach((input) => {
        if (hasIssue) return;

        const max = parseInt(input.getAttribute('max') || '0', 10);
        const val = parseInt(input.value || '0', 10);

        // si estÃ¡ disabled (sin stock) => bloquea checkout
        if (input.disabled) {
          hasIssue = true;
          return;
        }

        if (!Number.isFinite(max) || max <= 0) {
          hasIssue = true;
          return;
        }

        if (Number.isFinite(val) && val > max) {
          hasIssue = true;
        }
      });

      if (hasIssue) {
        btn.classList.add('opacity-50', 'pointer-events-none');
        btn.setAttribute('aria-disabled', 'true');
        btn.setAttribute('tabindex', '-1');
        if (warn) warn.classList.remove('hidden');
      } else {
        btn.classList.remove('opacity-50', 'pointer-events-none');
        btn.setAttribute('aria-disabled', 'false');
        btn.setAttribute('tabindex', '0');
        if (warn) warn.classList.add('hidden');
      }
    };

    // ---------------------------------------------
    // Copy to clipboard (para WhatsApp, etc.)
    // ---------------------------------------------
    const copyToClipboard = async (text) => {

    const str = String(text ?? '');
    if (!str) return false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(str);
        return true;
      }
    } catch (_) {}

    try {
      const ta = document.createElement('textarea');
      ta.value = str;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (_) {
      return false;
    }
  };

  document.addEventListener('click', async (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest('[data-copy-target]');
    if (!btn) return;

    e.preventDefault();

    const sel = btn.getAttribute('data-copy-target');
    if (!sel) return;

    const el = document.querySelector<HTMLElement>(sel);
    if (!el) return;

    const text = (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
      ? el.value
      : (el.textContent || '');
    const ok = await copyToClipboard(text);

    showMiniToast(ok ? (btn.getAttribute('data-copy-toast') || 'Copiado âœ…') : 'No se pudo copiar');
  });

  const setNavbarCartCount = (count) => {
    const cartLink = document.querySelector<HTMLAnchorElement>('a[aria-label="Carrito"]');
    if (!cartLink) return;

    const next = Math.max(0, parseInt(count, 10) || 0);
    let badge = cartLink.querySelector<HTMLElement>('[data-cart-count]');

    if (next <= 0) {
      badge?.remove();
      return;
    }

    if (!badge) {
      badge = document.createElement('span');
      badge.setAttribute('data-cart-count', '1');

      badge.style.position = 'absolute';
      badge.style.top = '-0.5rem';
      badge.style.right = '-0.5rem';
      badge.style.minWidth = '1rem';
      badge.style.height = '1rem';
      badge.style.padding = '0 0.25rem';
      badge.style.borderRadius = '9999px';
      badge.style.background = '#0284c7';
      badge.style.color = '#fff';
      badge.style.fontSize = '10px';
      badge.style.lineHeight = '1rem';
      badge.style.fontWeight = '800';
      badge.style.display = 'flex';
      badge.style.alignItems = 'center';
      badge.style.justifyContent = 'center';
      badge.style.border = '2px solid #fff';

      cartLink.appendChild(badge);
    }

    badge.textContent = String(next);
  };

  const animateCollapseRemove = (el: HTMLElement | null) =>
    new Promise<void>((resolve) => {
      if (!el) return resolve();

      el.style.overflow = 'hidden';
      el.style.willChange = 'height, opacity';
      const h = el.offsetHeight;
      el.style.height = `${h}px`;
      el.style.opacity = '1';
      el.style.transition = 'height 220ms ease, opacity 180ms ease';

      requestAnimationFrame(() => {
        el.style.opacity = '0';
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

  const cartGrid = document.querySelector<HTMLElement>('[data-cart-grid]');
  if (cartGrid) {
    const storeUrl = cartGrid.dataset.storeUrl || '/tienda';
    const renderEmptyCart = () => {
      cartGrid.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="font-black" data-testid="empty-cart-message">Tu carrito estÃ¡ vacÃ­o.</div>
            <div class="muted" style="margin-top:4px">AgregÃ¡ productos desde la tienda.</div>
            <div style="margin-top:14px">
              <a href="${storeUrl}" class="btn-primary">Ir a la tienda</a>
            </div>
          </div>
        </div>
      `;
    };

    cartGrid.querySelectorAll<HTMLFormElement>('form[data-cart-remove]').forEach((form) => {
      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();

        const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (btn) btn.disabled = true;

        const card = form.closest<HTMLElement>('[data-cart-item]');

        try {
          const res = await fetch(form.action, {
            method: 'POST',
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              Accept: 'application/json',
            },
            body: new FormData(form),
          });

          if (!res.ok) throw new Error('bad response');
          const data = await res.json();
          if (!data?.ok) throw new Error('bad json');

          await animateCollapseRemove(card);

          const itemsCountEl = document.querySelector<HTMLElement>('[data-cart-items-count]');
          const totalEl = document.querySelector<HTMLElement>('[data-cart-total]');

          if (itemsCountEl && typeof data.itemsCount !== 'undefined') {
            const n = parseInt(data.itemsCount, 10) || 0;
            itemsCountEl.textContent = `${n} Ã­tem${n === 1 ? '' : 's'}`;
          }

          if (totalEl && typeof data.total !== 'undefined') {
            totalEl.textContent = formatARS(data.total);
          }

          if (typeof data.cartCount !== 'undefined') {
            setNavbarCartCount(data.cartCount);
          }

          showMiniToast(data.message || 'Carrito actualizado.');

          if (data.empty) {
            renderEmptyCart();
          }

        } catch (err) {
          if (btn) btn.disabled = false;
          form.submit();
        }
      });
    });

    const clearForm = cartGrid.querySelector<HTMLFormElement>('form[data-cart-clear]');
    if (clearForm) {
      const btn = clearForm.querySelector<HTMLButtonElement>('button[type="submit"]');

      clearForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();

        if (btn) btn.disabled = true;

        try {
          const res = await fetch(clearForm.action, {
            method: 'POST',
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              Accept: 'application/json',
            },
            body: new FormData(clearForm),
          });

          if (!res.ok) throw new Error('bad response');
          const data = await res.json();
          if (!data?.ok) throw new Error('bad json');

          const itemsWrap = cartGrid.querySelector<HTMLElement>('[data-cart-items-wrap]');
          const summaryWrap = cartGrid.querySelector<HTMLElement>('[data-cart-summary-wrap]');

          const fadeOut = (el: HTMLElement | null) =>
            new Promise<void>((resolve) => {
              if (!el) return resolve();
              el.style.willChange = 'opacity, transform';
              el.style.transition = 'opacity 180ms ease, transform 180ms ease';
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
              requestAnimationFrame(() => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(6px)';
              });
              window.setTimeout(resolve, 190);
            });

          await Promise.all([fadeOut(itemsWrap), fadeOut(summaryWrap)]);

          const itemsCountEl = document.querySelector<HTMLElement>('[data-cart-items-count]');
          const totalEl = document.querySelector<HTMLElement>('[data-cart-total]');

          if (itemsCountEl) itemsCountEl.textContent = '0 Ã­tems';
          if (totalEl) totalEl.textContent = formatARS(0);

          setNavbarCartCount(0);

          showMiniToast(data.message || 'Carrito vaciado.');

          renderEmptyCart();
        } catch (err) {
          if (btn) btn.disabled = false;
          clearForm.submit();
        }
      });
    }
  }

  // ---------------------------------------------
  // Carrito: control de cantidad (âˆ’ / input / +)
  // ---------------------------------------------
  document.querySelectorAll<HTMLFormElement>('form[data-cart-qty]').forEach((form) => {
    const input = form.querySelector<HTMLInputElement>('[data-qty-input]');
    const minus = form.querySelector<HTMLButtonElement>('[data-qty-minus]');
    const plus = form.querySelector<HTMLButtonElement>('[data-qty-plus]');
    if (!input) return;

    const getMax = () => {
      const m = parseInt(input.getAttribute('max') || '', 10);
      return Number.isFinite(m) && m > 0 ? m : 999;
    };

    const clamp = (n) => Math.max(1, Math.min(getMax(), n));
    const getVal = () => clamp(parseInt(input.value, 10) || 1);

    const syncButtons = () => {
      const v = getVal();
      const max = getMax();
      if (minus) minus.disabled = v <= 1;
      if (plus) plus.disabled = v >= max;
    };

    // âœ… UI instantÃ¡nea (optimista): subtotal + total sin esperar al backend
    const card = form.closest<HTMLElement>('[data-cart-item]');

    const getUnitPrice = () => {
      const v = parseFloat(card?.dataset?.unitPrice || '0');
      return Number.isFinite(v) ? v : 0;
    };

    const updateLocalLineSubtotal = (qty) => {
      const lineEl = card?.querySelector('[data-line-subtotal]');
      if (!lineEl) return;
      const q = parseInt(qty, 10) || 0;
      lineEl.textContent = formatARS(getUnitPrice() * q);
    };

    const updateLocalCartTotals = () => {
      let items = 0;
      let total = 0;

      document.querySelectorAll<HTMLInputElement>('form[data-cart-qty] [data-qty-input]').forEach((inp) => {
        const q = parseInt(inp.value || '0', 10) || 0;
        items += q;

        const c = inp.closest<HTMLElement>('[data-cart-item]');
        const unit = parseFloat(c?.dataset?.unitPrice || '0');
        if (Number.isFinite(unit)) total += unit * q;
      });

      const itemsCountEl = document.querySelector<HTMLElement>('[data-cart-items-count]');
      const totalEl = document.querySelector<HTMLElement>('[data-cart-total]');

      if (itemsCountEl) itemsCountEl.textContent = `${items} Ã­tem${items === 1 ? '' : 's'}`;
      if (totalEl) totalEl.textContent = formatARS(total);

      // badge del navbar (queda â€œvivoâ€ mientras tocas + / -)
      setNavbarCartCount(items);
    };

    const setVal = (n) => {
      const v = clamp(n);
      input.value = String(v);
      syncButtons();
      updateLocalLineSubtotal(v);
      updateLocalCartTotals();
    };

    // Inicial
    syncButtons();
    updateLocalLineSubtotal(getVal());
    updateLocalCartTotals();


    const postFormJsonQty = async (form: HTMLFormElement, { timeoutMs = 12000 } = {}) => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
          },
          body: new FormData(form),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error('bad response');
        return await res.json();
      } finally {
        window.clearTimeout(timer);
      }
    };

    const collapseRemoveCard = (card: HTMLElement | null) =>
      new Promise<void>((resolve) => {
        if (!card) return resolve();

        card.style.willChange = 'max-height, opacity, margin, padding';
        card.style.overflow = 'hidden';
        card.style.maxHeight = card.scrollHeight + 'px';
        card.style.opacity = '1';
        card.style.transition = 'max-height 220ms ease, opacity 180ms ease, margin 220ms ease, padding 220ms ease';

        requestAnimationFrame(() => {
          card.style.opacity = '0';
          card.style.maxHeight = '0px';
          card.style.marginTop = '0px';
          card.style.marginBottom = '0px';
          card.style.paddingTop = '0px';
          card.style.paddingBottom = '0px';
        });

        card.addEventListener(
          'transitionend',
          () => {
            card.remove();
            resolve();
          },
          { once: true }
        );
      });

      // âœ… BATCH / DEBOUNCE:
      // En vez de mandar 1 request por cada click, mandamos 1 solo con el valor final.
      let inFlight = false;
      let desiredQty = getVal();          // Ãºltimo valor que el usuario quiere
      let lastAppliedQty = desiredQty;    // Ãºltimo valor confirmado (servidor)
      let sendTimer = null;

      const scheduleSend = () => {
        window.clearTimeout(sendTimer);
        sendTimer = window.setTimeout(() => {
          if (inFlight) return; // al terminar el request, reprogramamos si hace falta
          sendNow();
        }, 180);
      };

      const sendNow = async () => {
        if (inFlight) return;
        if (!form.isConnected) return;

        inFlight = true;

        // aseguramos que el form mande el Ãºltimo valor
        desiredQty = clamp(desiredQty);
        setVal(desiredQty);

        const qtyWeSent = desiredQty;


        try {
          const data = await postFormJsonQty(form, { timeoutMs: 12000 });
          if (!data?.ok) throw new Error('bad json');

          const card = form.closest<HTMLElement>('[data-cart-item]');

          // âœ… eliminado por falta de stock
          if (data.removed) {
            await collapseRemoveCard(card);

            const itemsCountEl = document.querySelector<HTMLElement>('[data-cart-items-count]');
            const totalEl = document.querySelector<HTMLElement>('[data-cart-total]');

            if (itemsCountEl && typeof data.itemsCount !== 'undefined') {
              const n = parseInt(data.itemsCount, 10) || 0;
              itemsCountEl.textContent = `${n} Ã­tem${n === 1 ? '' : 's'}`;
            }
            if (totalEl && typeof data.total !== 'undefined') {
              totalEl.textContent = formatARS(data.total);
            }

            if (typeof data.cartCount !== 'undefined') {
              setNavbarCartCount(data.cartCount);
            }

            if (data.empty) {
              const cartGrid = document.querySelector<HTMLElement>('[data-cart-grid]');
              const storeUrl = cartGrid?.dataset?.storeUrl || '/tienda';

              if (cartGrid) {
                cartGrid.innerHTML = `
                  <div class="card">
                    <div class="card-body">
                      <div class="font-black" data-testid="empty-cart-message">Tu carrito estÃ¡ vacÃ­o.</div>
                      <div class="muted" style="margin-top:4px">AgregÃ¡ productos desde la tienda.</div>
                      <div style="margin-top:14px">
                        <a href="${storeUrl}" class="btn-primary">Ir a la tienda</a>
                      </div>
                    </div>
                  </div>
                `;
              }
            }

            showMiniToast(data.message || 'Producto eliminado del carrito.');
            return;
          }

          // âœ… stock mÃ¡ximo actualizado
          if (typeof data.maxStock !== 'undefined') {
            const m = parseInt(data.maxStock, 10);
            if (Number.isFinite(m) && m > 0) {
              input.setAttribute('max', String(m));
              const stockEl = card?.querySelector('[data-stock-available]');
              if (stockEl) stockEl.textContent = String(m);

              // re-clamp solo si el usuario no cambiÃ³ mientras volaba el request
              if (desiredQty === qtyWeSent) {
                desiredQty = clamp(desiredQty);
                input.value = String(desiredQty);
                syncButtons();
              }
            }
          }

          // âœ… cantidad final que quedÃ³ en servidor (clamp del backend)
          if (typeof data.quantity !== 'undefined') {
            const serverQty = parseInt(data.quantity, 10);
            if (Number.isFinite(serverQty) && serverQty > 0) {
              if (desiredQty === qtyWeSent) {
                desiredQty = serverQty;
                input.value = String(serverQty);
                syncButtons();
              }
              lastAppliedQty = serverQty;
            } else {
              lastAppliedQty = qtyWeSent;
            }
          } else {
            lastAppliedQty = qtyWeSent;
          }

          const lineEl = card?.querySelector('[data-line-subtotal]');
          if (lineEl && typeof data.lineSubtotal !== 'undefined') {
            lineEl.textContent = formatARS(data.lineSubtotal);
          }

          const itemsCountEl = document.querySelector<HTMLElement>('[data-cart-items-count]');
          const totalEl = document.querySelector<HTMLElement>('[data-cart-total]');

          if (itemsCountEl && typeof data.itemsCount !== 'undefined') {
            const n = parseInt(data.itemsCount, 10) || 0;
            itemsCountEl.textContent = `${n} Ã­tem${n === 1 ? '' : 's'}`;
          }
          if (totalEl && typeof data.total !== 'undefined') {
            totalEl.textContent = formatARS(data.total);
          }

          if (typeof data.cartCount !== 'undefined') {
            setNavbarCartCount(data.cartCount);
          }

        } catch (e) {
          if (e?.name === 'AbortError') showMiniToast('TardÃ³ mucho en actualizar. ReintentÃ¡.');
          else showMiniToast('No se pudo actualizar el carrito. ReintentÃ¡.');
        } finally {
          inFlight = false;
          updateCartCheckoutState();

          // Si el usuario siguiÃ³ tocando mientras el request estaba en vuelo,
          // reprogramamos envÃ­o con el Ãºltimo desiredQty.
          if (form.isConnected && desiredQty !== lastAppliedQty) {
            scheduleSend();
          }
        }
      };

      // Botones (+ / -) â€” NO mandan request inmediato, solo programan
      minus?.addEventListener('click', (e) => {
        e.preventDefault();
        desiredQty = clamp(getVal() - 1);
        setVal(desiredQty);
        scheduleSend();
      });

      plus?.addEventListener('click', (e) => {
        e.preventDefault();
        const max = getMax();
        const v = getVal();

        if (v >= max) {
          syncButtons();
          showMiniToast('MÃ¡ximo stock disponible.');
          return;
        }

        desiredQty = clamp(v + 1);
        setVal(desiredQty);
        scheduleSend();
      });


      // Input manual
      let t = null;
      input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          desiredQty = clamp(parseInt(input.value, 10) || 1);
          setVal(desiredQty);
          scheduleSend();
        }, 250);
      });

      


      input.addEventListener('blur', () => {
        desiredQty = clamp(parseInt(input.value, 10) || 1);
        setVal(desiredQty);
        scheduleSend();
      });






      // Inicial
      updateCartCheckoutState();


    

  });

  return {
    showMiniToast,
    setNavbarCartCount,
    formatARS,
  };
}



