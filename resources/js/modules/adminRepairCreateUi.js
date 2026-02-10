export function initRepairCreateAdvancedToggle() {
  const btn = document.querySelector('[data-toggle-advanced]');
  const block = document.querySelector('[data-advanced-fields]');
  if (!btn || !block) return;

  const KEY = 'nr_repairs_adv_open';

  const setOpen = (open) => {
    block.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Ocultar campos opcionales' : 'Mostrar campos opcionales';
  };

  let open = !block.classList.contains('hidden');

  // Preferimos el estado guardado si el panel está cerrado (y blade no lo abrió por old/errors).
  try {
    const saved = localStorage.getItem(KEY);
    if (saved !== null && !open) open = (saved === '1');
  } catch (_) {}

  setOpen(open);

  btn.addEventListener('click', () => {
    open = !open;
    setOpen(open);
    try { localStorage.setItem(KEY, open ? '1' : '0'); } catch (_) {}
  });
}

export function initRepairCreateFinanceToggle() {
  const btn = document.querySelector('[data-toggle-finance]');
  const block = document.querySelector('[data-finance-advanced]');
  if (!btn || !block) return;

  const KEY = 'nr_repairs_finance_open';

  const setOpen = (open) => {
    block.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Ocultar detalle de cálculo' : 'Ver detalle de cálculo';
  };

  let open = !block.classList.contains('hidden');

  try {
    const saved = localStorage.getItem(KEY);
    if (saved !== null && !open) open = (saved === '1');
  } catch (_) {}

  setOpen(open);

  btn.addEventListener('click', () => {
    open = !open;
    setOpen(open);
    try { localStorage.setItem(KEY, open ? '1' : '0'); } catch (_) {}
  });
}

export function initRepairCreateSummaryAndPhone() {
  const summary = document.querySelector('[data-repair-create-summary]');
  if (!summary) return;

  const form = summary.closest('form') || document.querySelector('form');
  if (!form) return;

  const elName = form.querySelector('[data-repair-customer-name]') || form.querySelector('input[name="customer_name"]');
  const elPhone = form.querySelector('[data-repair-customer-phone]') || form.querySelector('input[name="customer_phone"]');
  const elStatus = form.querySelector('[data-repair-status]') || form.querySelector('select[name="status"]');

  const typeSel = form.querySelector('[data-device-type]');
  const brandSel = form.querySelector('[data-device-brand]');
  const modelSel = form.querySelector('[data-device-model]');
  const issueInp = form.querySelector('[data-issue-search]');
  const issueSel = form.querySelector('[data-issue-select]') || form.querySelector('select[name="device_issue_type_id"]');
  const repairTypeSel = form.querySelector('[data-repair-type-final]') || form.querySelector('select[name="repair_type_id"]');
  const submitBtn = form.querySelector('[data-repair-submit]');

  const sumState = summary.querySelector('[data-sum-state]');
  const sumCustomer = summary.querySelector('[data-sum-customer]');
  const sumPhone = summary.querySelector('[data-sum-phone]');
  const sumDevice = summary.querySelector('[data-sum-device]');
  const sumIssue = summary.querySelector('[data-sum-issue]');
  const sumStatus = summary.querySelector('[data-sum-status]');
  const sumWa = summary.querySelector('[data-sum-wa]');

  const labelOf = (sel) => {
    if (!sel || !sel.value) return '';
    const opt = sel.options?.[sel.selectedIndex];
    const t = (opt?.textContent || '').trim();
    if (!t || t.startsWith('-')) return '';
    return t;
  };

  // Misma lógica que backend (AdminRepairController::normalizeWhatsappPhone)
  const normalizePhoneDigits = (raw) => {
    let digits = String(raw || '').replace(/\D+/g, '');
    if (!digits) return '';

    if (digits.startsWith('54')) return digits;

    if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');

    if (digits.length >= 10 && digits.length <= 12) return '54' + digits;

    return digits;
  };

  const applyPhoneNormalization = () => {
    if (!elPhone) return;
    const digits = normalizePhoneDigits(elPhone.value);
    if (!digits) return;
    // Visual: +54XXXXXXXXXX
    elPhone.value = '+' + digits;
  };

  const update = () => {
    const customer = (elName?.value || '').trim();
    const phoneRaw = (elPhone?.value || '').trim();
    const phoneDigits = normalizePhoneDigits(phoneRaw);

    const t = labelOf(typeSel);
    const b = labelOf(brandSel);
    const m = labelOf(modelSel);

    const issue = (issueInp?.value || '').trim();
    const statusLabel = labelOf(elStatus);

    // Cliente
    if (sumCustomer) sumCustomer.textContent = customer || '—';
    if (sumPhone) sumPhone.textContent = phoneDigits ? ('+' + phoneDigits) : (phoneRaw || '—');

    // Equipo
    const device = [t, b, m].filter(Boolean).join(' · ');
    if (sumDevice) sumDevice.textContent = device || '—';

    // Falla
    if (sumIssue) sumIssue.textContent = issue ? `Falla: ${issue}` : 'Falla: —';

    // Estado
    if (sumStatus) sumStatus.textContent = `Estado: ${statusLabel || '—'}`;

    // WhatsApp
    if (sumWa) {
      if (phoneDigits && phoneDigits.length >= 10) {
        sumWa.classList.remove('hidden');
        sumWa.href = `https://wa.me/${phoneDigits}`;
      } else {
        sumWa.classList.add('hidden');
        sumWa.href = '#';
      }
    }

    const issueSelected = (issueSel?.value || '').trim();
    const repairSelected = (repairTypeSel?.value || '').trim();
    const statusOk = Boolean((elStatus?.value || '').trim());

    const ok = Boolean(customer && phoneDigits && t && b && m && issueSelected && repairSelected && statusOk);

    if (sumState) {
      sumState.textContent = ok ? 'Listo' : 'Incompleto';
      sumState.classList.toggle('badge-emerald', ok);
      sumState.classList.toggle('badge-amber', !ok);
    }

    // Bloquear submit si faltan obligatorios
    if (submitBtn) {
      submitBtn.disabled = !ok;
      submitBtn.classList.toggle('opacity-60', !ok);
      submitBtn.classList.toggle('cursor-not-allowed', !ok);
    }
  };

  // Normalizar teléfono (sin tocar mientras escribe)
  if (elPhone?.hasAttribute('data-phone-normalize')) {
    elPhone.addEventListener('blur', () => {
      applyPhoneNormalization();
      update();
    });
  }

  // Update en vivo
  const bind = (el, ev) => el && el.addEventListener(ev, update);
  [elName, elPhone, issueInp].forEach((el) => bind(el, 'input'));
  [elStatus, typeSel, brandSel, modelSel, repairTypeSel, issueSel].forEach((el) => bind(el, 'change'));

  update();
}
