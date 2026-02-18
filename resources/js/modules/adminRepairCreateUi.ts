function initToggle(options: {
  buttonSelector: string;
  blockSelector: string;
  storageKey: string;
  labelOpen: string;
  labelClosed: string;
}): void {
  const btn = document.querySelector<HTMLElement>(options.buttonSelector);
  const block = document.querySelector<HTMLElement>(options.blockSelector);
  if (!btn || !block) return;

  const setOpen = (open: boolean): void => {
    block.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? options.labelOpen : options.labelClosed;
  };

  let open = !block.classList.contains('hidden');

  try {
    const saved = localStorage.getItem(options.storageKey);
    if (saved !== null && !open) open = saved === '1';
  } catch (_e) {}

  setOpen(open);

  btn.addEventListener('click', () => {
    open = !open;
    setOpen(open);
    try {
      localStorage.setItem(options.storageKey, open ? '1' : '0');
    } catch (_e) {}
  });
}

export function initRepairCreateAdvancedToggle(): void {
  initToggle({
    buttonSelector: '[data-toggle-advanced]',
    blockSelector: '[data-advanced-fields]',
    storageKey: 'nr_repairs_adv_open',
    labelOpen: 'Ocultar campos opcionales',
    labelClosed: 'Mostrar campos opcionales',
  });
}

export function initRepairCreateFinanceToggle(): void {
  initToggle({
    buttonSelector: '[data-toggle-finance]',
    blockSelector: '[data-finance-advanced]',
    storageKey: 'nr_repairs_finance_open',
    labelOpen: 'Ocultar detalle de calculo',
    labelClosed: 'Ver detalle de calculo',
  });
}

function normalizePhoneDigits(raw: unknown): string {
  let digits = String(raw || '').replace(/\D+/g, '');
  if (!digits) return '';

  if (digits.startsWith('54')) return digits;
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');

  if (digits.length >= 10 && digits.length <= 12) return `54${digits}`;
  return digits;
}

function labelOf(select: HTMLSelectElement | null): string {
  if (!select || !select.value) return '';
  const opt = select.options[select.selectedIndex];
  const text = (opt?.textContent || '').trim();
  if (!text || text.startsWith('-')) return '';
  return text;
}

export function initRepairCreateSummaryAndPhone(): void {
  const summary = document.querySelector<HTMLElement>('[data-repair-create-summary]');
  if (!summary) return;

  const form = (summary.closest('form') as HTMLFormElement | null) || document.querySelector<HTMLFormElement>('form');
  if (!form) return;

  const elName =
    form.querySelector<HTMLInputElement>('[data-repair-customer-name]') ||
    form.querySelector<HTMLInputElement>('input[name="customer_name"]');

  const elPhone =
    form.querySelector<HTMLInputElement>('[data-repair-customer-phone]') ||
    form.querySelector<HTMLInputElement>('input[name="customer_phone"]');

  const elStatus =
    form.querySelector<HTMLSelectElement>('[data-repair-status]') ||
    form.querySelector<HTMLSelectElement>('select[name="status"]');

  const typeSel = form.querySelector<HTMLSelectElement>('[data-device-type]');
  const brandSel = form.querySelector<HTMLSelectElement>('[data-device-brand]');
  const modelSel = form.querySelector<HTMLSelectElement>('[data-device-model]');
  const issueInp = form.querySelector<HTMLInputElement>('[data-issue-search]');

  const issueSel =
    form.querySelector<HTMLSelectElement>('[data-issue-select]') ||
    form.querySelector<HTMLSelectElement>('select[name="device_issue_type_id"]');

  const repairTypeSel =
    form.querySelector<HTMLSelectElement>('[data-repair-type-final]') ||
    form.querySelector<HTMLSelectElement>('select[name="repair_type_id"]');

  const submitBtn = form.querySelector<HTMLButtonElement | HTMLInputElement>('[data-repair-submit]');

  const sumState = summary.querySelector<HTMLElement>('[data-sum-state]');
  const sumCustomer = summary.querySelector<HTMLElement>('[data-sum-customer]');
  const sumPhone = summary.querySelector<HTMLElement>('[data-sum-phone]');
  const sumDevice = summary.querySelector<HTMLElement>('[data-sum-device]');
  const sumIssue = summary.querySelector<HTMLElement>('[data-sum-issue]');
  const sumStatus = summary.querySelector<HTMLElement>('[data-sum-status]');
  const sumWa = summary.querySelector<HTMLAnchorElement>('[data-sum-wa]');

  const applyPhoneNormalization = (): void => {
    if (!elPhone) return;
    const digits = normalizePhoneDigits(elPhone.value);
    if (!digits) return;
    elPhone.value = `+${digits}`;
  };

  const update = (): void => {
    const customer = (elName?.value || '').trim();
    const phoneRaw = (elPhone?.value || '').trim();
    const phoneDigits = normalizePhoneDigits(phoneRaw);

    const t = labelOf(typeSel);
    const b = labelOf(brandSel);
    const m = labelOf(modelSel);

    const issue = (issueInp?.value || '').trim();
    const statusLabel = labelOf(elStatus);

    if (sumCustomer) sumCustomer.textContent = customer || '-';
    if (sumPhone) sumPhone.textContent = phoneDigits ? `+${phoneDigits}` : phoneRaw || '-';

    const device = [t, b, m].filter(Boolean).join(' · ');
    if (sumDevice) sumDevice.textContent = device || '-';

    if (sumIssue) sumIssue.textContent = issue ? `Falla: ${issue}` : 'Falla: -';
    if (sumStatus) sumStatus.textContent = `Estado: ${statusLabel || '-'}`;

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

    if (submitBtn) {
      submitBtn.disabled = !ok;
      submitBtn.classList.toggle('opacity-60', !ok);
      submitBtn.classList.toggle('cursor-not-allowed', !ok);
    }
  };

  if (elPhone?.hasAttribute('data-phone-normalize')) {
    elPhone.addEventListener('blur', () => {
      applyPhoneNormalization();
      update();
    });
  }

  const bind = (el: Element | null, ev: string): void => {
    if (!el) return;
    el.addEventListener(ev, update);
  };

  [elName, elPhone, issueInp].forEach((el) => bind(el, 'input'));
  [elStatus, typeSel, brandSel, modelSel, repairTypeSel, issueSel].forEach((el) => bind(el, 'change'));

  update();
}
