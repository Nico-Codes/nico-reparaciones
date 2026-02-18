export function initAdminModelGroups(): void {
  const root = document.querySelector<HTMLElement>('[data-admin-model-groups]');
  if (!root) return;

  const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.getAttribute('content');

  root.querySelectorAll<HTMLSelectElement>('select[data-model-id]').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const modelId = sel.getAttribute('data-model-id');
      const deviceModelGroupId = sel.value || '';
      if (!modelId) return;

      try {
        const res = await fetch(`/admin/grupos-modelos/modelo/${modelId}/asignar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { 'X-CSRF-TOKEN': token } : {}),
          },
          body: JSON.stringify({ device_model_group_id: deviceModelGroupId || null }),
        });

        if (!res.ok) {
          sel.classList.add('ring-2', 'ring-red-400');
          setTimeout(() => sel.classList.remove('ring-2', 'ring-red-400'), 1200);
          return;
        }

        sel.classList.add('ring-2', 'ring-emerald-400');
        setTimeout(() => sel.classList.remove('ring-2', 'ring-emerald-400'), 600);
      } catch (_e) {
        sel.classList.add('ring-2', 'ring-red-400');
        setTimeout(() => sel.classList.remove('ring-2', 'ring-red-400'), 1200);
      }
    });
  });
}
