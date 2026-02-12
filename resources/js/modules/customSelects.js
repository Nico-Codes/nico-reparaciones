const SELECT_WRAPPER_CLASS = 'nr-select';
const OPEN_CLASS = 'is-open';

function closeAll(except = null) {
  document.querySelectorAll(`.${SELECT_WRAPPER_CLASS}.${OPEN_CLASS}`).forEach((wrap) => {
    if (except && wrap === except) return;
    wrap.classList.remove(OPEN_CLASS);
    const menu = wrap.querySelector('.nr-select-menu');
    const trigger = wrap.querySelector('.nr-select-trigger');
    if (menu) menu.classList.add('hidden');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

function buildOptions(select, menu, trigger, wrap) {
  menu.innerHTML = '';

  Array.from(select.options).forEach((opt) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'nr-select-option';
    item.textContent = opt.textContent || '';
    item.dataset.value = opt.value;

    if (opt.disabled) {
      item.disabled = true;
      item.classList.add('is-disabled');
    }

    if (opt.selected) {
      item.classList.add('is-selected');
      trigger.querySelector('.nr-select-label').textContent = opt.textContent || '';
    }

    item.addEventListener('click', () => {
      if (opt.disabled) return;
      select.value = opt.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      trigger.querySelector('.nr-select-label').textContent = opt.textContent || '';
      closeAll();
      trigger.focus();
    });

    menu.appendChild(item);
  });

  if (!select.value && select.options.length > 0) {
    const first = select.options[0];
    trigger.querySelector('.nr-select-label').textContent = first?.textContent || '';
  }

  wrap.classList.toggle('is-disabled', !!select.disabled);
  trigger.disabled = !!select.disabled;
}

function enhanceSelect(select) {
  if (!(select instanceof HTMLSelectElement)) return;
  if (select.dataset.customSelectReady === '1') return;
  if (select.multiple) return;
  if (select.hasAttribute('data-native-select')) return;
  const size = Number(select.getAttribute('size') || '1');
  if (Number.isFinite(size) && size > 1) return;

  select.dataset.customSelectReady = '1';

  const wrap = document.createElement('div');
  wrap.className = SELECT_WRAPPER_CLASS;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nr-select-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `
    <span class="nr-select-label"></span>
    <span class="nr-select-caret" aria-hidden="true"></span>
  `;

  const menu = document.createElement('div');
  menu.className = 'nr-select-menu hidden';

  select.parentNode?.insertBefore(wrap, select);
  wrap.appendChild(select);
  wrap.appendChild(trigger);
  wrap.appendChild(menu);
  select.classList.add('nr-select-native');

  buildOptions(select, menu, trigger, wrap);

  trigger.addEventListener('click', () => {
    if (select.disabled) return;
    const isOpen = wrap.classList.contains(OPEN_CLASS);
    if (isOpen) {
      closeAll();
      return;
    }
    closeAll(wrap);
    wrap.classList.add(OPEN_CLASS);
    menu.classList.remove('hidden');
    trigger.setAttribute('aria-expanded', 'true');
  });

  select.addEventListener('change', () => {
    const selected = select.options[select.selectedIndex];
    trigger.querySelector('.nr-select-label').textContent = selected?.textContent || '';
    menu.querySelectorAll('.nr-select-option').forEach((btn) => {
      btn.classList.toggle('is-selected', btn.dataset.value === select.value);
    });
  });

  const observer = new MutationObserver(() => {
    buildOptions(select, menu, trigger, wrap);
  });
  observer.observe(select, { childList: true, subtree: true, attributes: true });
}

export function initCustomSelects() {
  document.querySelectorAll('select').forEach(enhanceSelect);

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Node)) return;
    const inside = target instanceof Element ? target.closest(`.${SELECT_WRAPPER_CLASS}`) : null;
    if (!inside) closeAll();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}
