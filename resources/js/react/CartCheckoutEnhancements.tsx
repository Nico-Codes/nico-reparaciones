import { useEffect } from 'react';
import { formatARS, setNavbarCartCount, showMiniToast } from '../shared/uiFeedback';

export default function CartCheckoutEnhancements() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const sumBtn = document.querySelector<HTMLElement>('[data-summary-toggle]');
    const sumBody = document.querySelector<HTMLElement>('[data-summary-body]');
    const sumIcon = document.querySelector<HTMLElement>('[data-summary-icon]');

    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

    const setSummaryOpen = (open: boolean) => {
      if (!sumBtn || !sumBody) return;
      sumBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      sumBody.style.display = open ? 'block' : 'none';
      if (sumIcon) sumIcon.textContent = open ? '▴' : '▾';
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
      const onResize = () => syncSummary();
      const onClick = () => {
        if (isDesktop()) return;
        const expanded = sumBtn.getAttribute('aria-expanded') === 'true';
        setSummaryOpen(!expanded);
      };
      window.addEventListener('resize', onResize);
      sumBtn.addEventListener('click', onClick);
      cleanups.push(() => {
        window.removeEventListener('resize', onResize);
        sumBtn.removeEventListener('click', onClick);
      });
    }

    const checkoutForm = document.querySelector<HTMLFormElement>('[data-checkout-form]');
    if (checkoutForm) {
      const paymentPreview = document.querySelector<HTMLElement>('[data-checkout-payment-preview]');
      const paymentLabels: Record<string, string> = {
        local: 'Pago en el local',
        mercado_pago: 'Mercado Pago',
        transferencia: 'Transferencia',
      };

      const delegateNameInput = checkoutForm.querySelector<HTMLInputElement>('[data-checkout-delegate-name]');
      const delegatePhoneInput = checkoutForm.querySelector<HTMLInputElement>('[data-checkout-delegate-phone]');
      const validationAlert = checkoutForm.querySelector<HTMLElement>('[data-checkout-validation-alert]');

      const phoneRegex = /^(?=(?:\D*\d){8,15}\D*$)[0-9+()\s-]{8,30}$/;

      const setValidationAlert = (message: string | null) => {
        if (!validationAlert) return;
        if (!message) {
          validationAlert.classList.add('hidden');
          validationAlert.textContent = '';
          return;
        }
        validationAlert.textContent = message;
        validationAlert.classList.remove('hidden');
      };

      const normalize = (value: string | null | undefined) => String(value || '').trim();

      const validateDelegateSection = (): string | null => {
        const nameValue = normalize(delegateNameInput?.value);
        const phoneValue = normalize(delegatePhoneInput?.value);

        if (nameValue === '' && phoneValue === '') return null;
        if (nameValue === '' || phoneValue === '') {
          return 'Para retiro por tercero, completa nombre y telefono de quien retira.';
        }
        if (!phoneRegex.test(phoneValue)) {
          return 'El telefono de quien retira no es valido. Usa entre 8 y 15 digitos.';
        }
        return null;
      };

      const updatePaymentPreview = () => {
        if (!paymentPreview) return;
        const selected = checkoutForm.querySelector<HTMLInputElement>('input[name="payment_method"]:checked');
        const key = selected?.value || 'local';
        paymentPreview.textContent = paymentLabels[key] || 'Pago en el local';
      };

      updatePaymentPreview();
      checkoutForm.querySelectorAll<HTMLInputElement>('input[name="payment_method"]').forEach((input) => {
        const onChange = () => updatePaymentPreview();
        input.addEventListener('change', onChange);
        cleanups.push(() => input.removeEventListener('change', onChange));
      });

      if (delegateNameInput || delegatePhoneInput) {
        const onDelegateInput = () => {
          setValidationAlert(validateDelegateSection());
        };

        delegateNameInput?.addEventListener('input', onDelegateInput);
        delegatePhoneInput?.addEventListener('input', onDelegateInput);
        cleanups.push(() => delegateNameInput?.removeEventListener('input', onDelegateInput));
        cleanups.push(() => delegatePhoneInput?.removeEventListener('input', onDelegateInput));
      }

      const onSubmit = (e: SubmitEvent) => {
        const delegateError = validateDelegateSection();
        if (delegateError) {
          e.preventDefault();
          setValidationAlert(delegateError);
          validationAlert?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        setValidationAlert(null);

        const btn = checkoutForm.querySelector<HTMLButtonElement>('[data-checkout-submit]');
        if (!btn) return;
        if (btn.disabled || btn.getAttribute('aria-busy') === 'true') {
          e.preventDefault();
          return;
        }
        btn.disabled = true;
        btn.setAttribute('aria-busy', 'true');
        const label = btn.querySelector<HTMLElement>('[data-checkout-label]');
        const loading = btn.querySelector<HTMLElement>('[data-checkout-loading]');
        label?.classList.add('hidden');
        loading?.classList.remove('hidden');
        loading?.classList.add('inline-flex');
      };
      checkoutForm.addEventListener('submit', onSubmit);
      cleanups.push(() => checkoutForm.removeEventListener('submit', onSubmit));
    }

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
      } catch (_e) {}
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
      } catch (_e) {}
    };

    restoreScroll();

    const onDocumentSubmitCapture = (e: Event) => {
      const form = e.target as HTMLElement | null;
      if (form?.dataset?.preserveScroll === '1') saveScroll();
    };
    document.addEventListener('submit', onDocumentSubmitCapture, true);
    cleanups.push(() => document.removeEventListener('submit', onDocumentSubmitCapture, true));

    const updateCartCheckoutState = () => {
      const btn = document.querySelector<HTMLElement>('[data-checkout-btn]');
      const warn = document.querySelector<HTMLElement>('[data-stock-warning]');
      if (!btn) return;

      let hasIssue = false;
      document.querySelectorAll<HTMLInputElement>('form[data-cart-qty] [data-qty-input]').forEach((input) => {
        if (hasIssue) return;
        const max = parseInt(input.getAttribute('max') || '0', 10);
        const val = parseInt(input.value || '0', 10);

        if (input.disabled) {
          hasIssue = true;
          return;
        }
        if (!Number.isFinite(max) || max <= 0) {
          hasIssue = true;
          return;
        }
        if (Number.isFinite(val) && val > max) hasIssue = true;
      });

      if (hasIssue) {
        btn.classList.add('opacity-50', 'pointer-events-none');
        btn.setAttribute('aria-disabled', 'true');
        btn.setAttribute('tabindex', '-1');
        warn?.classList.remove('hidden');
      } else {
        btn.classList.remove('opacity-50', 'pointer-events-none');
        btn.setAttribute('aria-disabled', 'false');
        btn.setAttribute('tabindex', '0');
        warn?.classList.add('hidden');
      }
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
        el.addEventListener('transitionend', () => {
          el.remove();
          resolve();
        }, { once: true });
      });

    const cartGrid = document.querySelector<HTMLElement>('[data-cart-grid]');
    if (cartGrid) {
      const storeUrl = cartGrid.dataset.storeUrl || '/tienda';
      const renderEmptyCart = () => {
        cartGrid.innerHTML = `
          <div class="card">
            <div class="card-body">
              <div class="font-black" data-testid="empty-cart-message">Tu carrito está vacío.</div>
              <div class="muted" style="margin-top:4px">Agregá productos desde la tienda.</div>
              <div style="margin-top:14px">
                <a href="${storeUrl}" class="btn-primary">Ir a la tienda</a>
              </div>
            </div>
          </div>
        `;
      };

      cartGrid.querySelectorAll<HTMLFormElement>('form[data-cart-remove]').forEach((form) => {
        const onSubmit = async (ev: SubmitEvent) => {
          ev.preventDefault();
          const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
          if (btn) btn.disabled = true;
          const card = form.closest<HTMLElement>('[data-cart-item]');

          try {
            const res = await fetch(form.action, {
              method: 'POST',
              headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
              body: new FormData(form),
            });
            if (!res.ok) throw new Error('bad response');
            const data = await res.json();
            if (!data?.ok) throw new Error('bad json');

            await animateCollapseRemove(card);

            const itemsCountEl = document.querySelector<HTMLElement>('[data-cart-items-count]');
            const totalEl = document.querySelector<HTMLElement>('[data-cart-total]');
            if (itemsCountEl && typeof data.itemsCount !== 'undefined') {
              const n = parseInt(String(data.itemsCount), 10) || 0;
              itemsCountEl.textContent = `${n} ítem${n === 1 ? '' : 's'}`;
            }
            if (totalEl && typeof data.total !== 'undefined') totalEl.textContent = formatARS(data.total);
            if (typeof data.cartCount !== 'undefined') setNavbarCartCount(data.cartCount);
            showMiniToast(data.message || 'Carrito actualizado.');
            if (data.empty) renderEmptyCart();
          } catch (_e) {
            if (btn) btn.disabled = false;
            form.submit();
          }
        };
        form.addEventListener('submit', onSubmit);
        cleanups.push(() => form.removeEventListener('submit', onSubmit));
      });

      const clearForm = cartGrid.querySelector<HTMLFormElement>('form[data-cart-clear]');
      if (clearForm) {
        const onSubmit = async (ev: SubmitEvent) => {
          ev.preventDefault();
          const btn = clearForm.querySelector<HTMLButtonElement>('button[type="submit"]');
          if (btn) btn.disabled = true;

          try {
            const res = await fetch(clearForm.action, {
              method: 'POST',
              headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
              body: new FormData(clearForm),
            });
            if (!res.ok) throw new Error('bad response');
            const data = await res.json();
            if (!data?.ok) throw new Error('bad json');

            const itemsWrap = cartGrid.querySelector<HTMLElement>('[data-cart-items-wrap]');
            const summaryWrap = cartGrid.querySelector<HTMLElement>('[data-cart-summary-wrap]');
            const fadeOut = (el: HTMLElement | null) => new Promise<void>((resolve) => {
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

            document.querySelector<HTMLElement>('[data-cart-items-count]')?.replaceChildren(document.createTextNode('0 ítems'));
            const totalEl = document.querySelector<HTMLElement>('[data-cart-total]');
            if (totalEl) totalEl.textContent = formatARS(0);
            setNavbarCartCount(0);
            showMiniToast(data.message || 'Carrito vaciado.');
            renderEmptyCart();
          } catch (_e) {
            if (btn) btn.disabled = false;
            clearForm.submit();
          }
        };

        clearForm.addEventListener('submit', onSubmit);
        cleanups.push(() => clearForm.removeEventListener('submit', onSubmit));
      }
    }

    document.querySelectorAll<HTMLFormElement>('form[data-cart-qty]').forEach((form) => {
      const input = form.querySelector<HTMLInputElement>('[data-qty-input]');
      const minus = form.querySelector<HTMLButtonElement>('[data-qty-minus]');
      const plus = form.querySelector<HTMLButtonElement>('[data-qty-plus]');
      if (!input) return;

      const getMax = () => {
        const m = parseInt(input.getAttribute('max') || '', 10);
        return Number.isFinite(m) && m > 0 ? m : 999;
      };
      const clamp = (n: number) => Math.max(1, Math.min(getMax(), n));
      const getVal = () => clamp(parseInt(input.value, 10) || 1);

      const syncButtons = () => {
        const v = getVal();
        const max = getMax();
        if (minus) minus.disabled = v <= 1;
        if (plus) plus.disabled = v >= max;
      };

      const card = form.closest<HTMLElement>('[data-cart-item]');
      const getUnitPrice = () => {
        const v = parseFloat(card?.dataset?.unitPrice || '0');
        return Number.isFinite(v) ? v : 0;
      };
      const updateLocalLineSubtotal = (qty: number) => {
        const lineEl = card?.querySelector<HTMLElement>('[data-line-subtotal]');
        if (!lineEl) return;
        lineEl.textContent = formatARS(getUnitPrice() * qty);
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
        if (itemsCountEl) itemsCountEl.textContent = `${items} ítem${items === 1 ? '' : 's'}`;
        if (totalEl) totalEl.textContent = formatARS(total);
        setNavbarCartCount(items);
      };

      const setVal = (n: number) => {
        const v = clamp(n);
        input.value = String(v);
        syncButtons();
        updateLocalLineSubtotal(v);
        updateLocalCartTotals();
      };

      syncButtons();
      updateLocalLineSubtotal(getVal());
      updateLocalCartTotals();

      const postFormJsonQty = async (f: HTMLFormElement, timeoutMs = 12000) => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(f.action, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
            body: new FormData(f),
            signal: controller.signal,
          });
          if (!res.ok) throw new Error('bad response');
          return await res.json();
        } finally {
          window.clearTimeout(timer);
        }
      };

      const collapseRemoveCard = (itemCard: HTMLElement | null) => new Promise<void>((resolve) => {
        if (!itemCard) return resolve();
        itemCard.style.willChange = 'max-height, opacity, margin, padding';
        itemCard.style.overflow = 'hidden';
        itemCard.style.maxHeight = `${itemCard.scrollHeight}px`;
        itemCard.style.opacity = '1';
        itemCard.style.transition = 'max-height 220ms ease, opacity 180ms ease, margin 220ms ease, padding 220ms ease';
        requestAnimationFrame(() => {
          itemCard.style.opacity = '0';
          itemCard.style.maxHeight = '0px';
          itemCard.style.marginTop = '0px';
          itemCard.style.marginBottom = '0px';
          itemCard.style.paddingTop = '0px';
          itemCard.style.paddingBottom = '0px';
        });
        itemCard.addEventListener('transitionend', () => {
          itemCard.remove();
          resolve();
        }, { once: true });
      });

      let inFlight = false;
      let desiredQty = getVal();
      let lastAppliedQty = desiredQty;
      let sendTimer: number | null = null;
      let inputTimer: number | null = null;

      const scheduleSend = () => {
        if (sendTimer !== null) window.clearTimeout(sendTimer);
        sendTimer = window.setTimeout(() => {
          if (inFlight) return;
          void sendNow();
        }, 180);
      };

      const sendNow = async () => {
        if (inFlight || !form.isConnected) return;
        inFlight = true;
        desiredQty = clamp(desiredQty);
        setVal(desiredQty);
        const qtyWeSent = desiredQty;

        try {
          const data = await postFormJsonQty(form, 12000);
          if (!data?.ok) throw new Error('bad json');
          const itemCard = form.closest<HTMLElement>('[data-cart-item]');

          if (data.removed) {
            await collapseRemoveCard(itemCard);
            const itemsCountEl = document.querySelector<HTMLElement>('[data-cart-items-count]');
            const totalEl = document.querySelector<HTMLElement>('[data-cart-total]');
            if (itemsCountEl && typeof data.itemsCount !== 'undefined') {
              const n = parseInt(String(data.itemsCount), 10) || 0;
              itemsCountEl.textContent = `${n} ítem${n === 1 ? '' : 's'}`;
            }
            if (totalEl && typeof data.total !== 'undefined') totalEl.textContent = formatARS(data.total);
            if (typeof data.cartCount !== 'undefined') setNavbarCartCount(data.cartCount);
            if (data.empty) {
              const cg = document.querySelector<HTMLElement>('[data-cart-grid]');
              const storeUrl = cg?.dataset?.storeUrl || '/tienda';
              if (cg) {
                cg.innerHTML = `
                  <div class="card">
                    <div class="card-body">
                      <div class="font-black" data-testid="empty-cart-message">Tu carrito está vacío.</div>
                      <div class="muted" style="margin-top:4px">Agregá productos desde la tienda.</div>
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

          if (typeof data.maxStock !== 'undefined') {
            const m = parseInt(String(data.maxStock), 10);
            if (Number.isFinite(m) && m > 0) {
              input.setAttribute('max', String(m));
              const stockEl = itemCard?.querySelector<HTMLElement>('[data-stock-available]');
              if (stockEl) stockEl.textContent = String(m);
              if (desiredQty === qtyWeSent) {
                desiredQty = clamp(desiredQty);
                input.value = String(desiredQty);
                syncButtons();
              }
            }
          }

          if (typeof data.quantity !== 'undefined') {
            const serverQty = parseInt(String(data.quantity), 10);
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

          const lineEl = itemCard?.querySelector<HTMLElement>('[data-line-subtotal]');
          if (lineEl && typeof data.lineSubtotal !== 'undefined') lineEl.textContent = formatARS(data.lineSubtotal);

          const itemsCountEl = document.querySelector<HTMLElement>('[data-cart-items-count]');
          const totalEl = document.querySelector<HTMLElement>('[data-cart-total]');
          if (itemsCountEl && typeof data.itemsCount !== 'undefined') {
            const n = parseInt(String(data.itemsCount), 10) || 0;
            itemsCountEl.textContent = `${n} ítem${n === 1 ? '' : 's'}`;
          }
          if (totalEl && typeof data.total !== 'undefined') totalEl.textContent = formatARS(data.total);
          if (typeof data.cartCount !== 'undefined') setNavbarCartCount(data.cartCount);
        } catch (e: unknown) {
          if ((e as { name?: string })?.name === 'AbortError') showMiniToast('Tardó mucho en actualizar. Reintentá.');
          else showMiniToast('No se pudo actualizar el carrito. Reintentá.');
        } finally {
          inFlight = false;
          updateCartCheckoutState();
          if (form.isConnected && desiredQty !== lastAppliedQty) scheduleSend();
        }
      };

      const onMinus = (e: Event) => {
        e.preventDefault();
        desiredQty = clamp(getVal() - 1);
        setVal(desiredQty);
        scheduleSend();
      };
      const onPlus = (e: Event) => {
        e.preventDefault();
        const max = getMax();
        const v = getVal();
        if (v >= max) {
          syncButtons();
          showMiniToast('Máximo stock disponible.');
          return;
        }
        desiredQty = clamp(v + 1);
        setVal(desiredQty);
        scheduleSend();
      };
      const onInput = () => {
        if (inputTimer !== null) window.clearTimeout(inputTimer);
        inputTimer = window.setTimeout(() => {
          desiredQty = clamp(parseInt(input.value, 10) || 1);
          setVal(desiredQty);
          scheduleSend();
        }, 250);
      };
      const onBlur = () => {
        desiredQty = clamp(parseInt(input.value, 10) || 1);
        setVal(desiredQty);
        scheduleSend();
      };

      minus?.addEventListener('click', onMinus);
      plus?.addEventListener('click', onPlus);
      input.addEventListener('input', onInput);
      input.addEventListener('blur', onBlur);
      updateCartCheckoutState();

      cleanups.push(() => {
        if (sendTimer !== null) window.clearTimeout(sendTimer);
        if (inputTimer !== null) window.clearTimeout(inputTimer);
        minus?.removeEventListener('click', onMinus);
        plus?.removeEventListener('click', onPlus);
        input.removeEventListener('input', onInput);
        input.removeEventListener('blur', onBlur);
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
