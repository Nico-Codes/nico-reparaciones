export function initAdminModelGroups() {
const root = document.querySelector('[data-admin-model-groups]');
if (!root) return;

const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

root.querySelectorAll('select[data-model-id]').forEach(sel => {
  sel.addEventListener('change', async () => {
    const modelId = sel.getAttribute('data-model-id');
    const device_model_group_id = sel.value || '';

    try {
      const res = await fetch(`/admin/grupos-modelos/modelo/${modelId}/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'X-CSRF-TOKEN': token } : {}),
        },
        body: JSON.stringify({ device_model_group_id: device_model_group_id || null }),
      });

      if (!res.ok) {
        // fallback simple
        sel.classList.add('ring-2','ring-red-400');
        setTimeout(() => sel.classList.remove('ring-2','ring-red-400'), 1200);
        return;
      }

      sel.classList.add('ring-2','ring-emerald-400');
      setTimeout(() => sel.classList.remove('ring-2','ring-emerald-400'), 600);
    } catch (e) {
      sel.classList.add('ring-2','ring-red-400');
      setTimeout(() => sel.classList.remove('ring-2','ring-red-400'), 1200);
    }
  });
});
}
