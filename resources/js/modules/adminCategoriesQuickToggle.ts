type CategoryToggleResponse = {
  active?: boolean;
  message?: string;
};

type CategoriesToggleOptions = {
  showMiniToast?: (message: string) => void;
};

export function initAdminCategoriesQuickToggle({ showMiniToast }: CategoriesToggleOptions): void {
  const root = document.querySelector<HTMLElement>('[data-admin-categories]');
  if (!root) return;

  const postFormJson = async (form: HTMLFormElement): Promise<CategoryToggleResponse> => {
    const res = await fetch(form.action, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
      body: new FormData(form),
    });

    let data: CategoryToggleResponse | null = null;
    try {
      data = (await res.json()) as CategoryToggleResponse;
    } catch (_e) {}

    if (!res.ok) {
      const msg = data?.message || (res.status === 419 ? 'Sesion expirada (CSRF)' : 'No se pudo completar');
      throw new Error(msg);
    }

    return data ?? {};
  };

  const updateActiveUI = (btn: HTMLElement, active: boolean | undefined): void => {
    const on = !!active;
    btn.textContent = on ? 'Activa' : 'Inactiva';
    btn.classList.toggle('badge-emerald', on);
    btn.classList.toggle('badge-zinc', !on);
  };

  root.addEventListener(
    'submit',
    async (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!form.hasAttribute('data-admin-category-toggle')) return;

      e.preventDefault();
      const btn =
        form.querySelector<HTMLElement>('[data-active-btn]') ||
        form.querySelector<HTMLElement>('button[type="submit"]');

      try {
        const data = await postFormJson(form);
        if (btn) updateActiveUI(btn, data?.active);
        if (typeof showMiniToast === 'function') showMiniToast(data?.message || 'Actualizado');
      } catch (err) {
        if (typeof showMiniToast === 'function') {
          showMiniToast(err instanceof Error ? err.message : 'Error');
        }
      }
    },
    true
  );
}
