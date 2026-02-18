import { useEffect } from 'react';

type ProductPricingSimulatorProps = {
  rootId: string;
};

export default function ProductPricingSimulator({ rootId }: ProductPricingSimulatorProps) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const resolveUrl = root.getAttribute('data-resolve-url');
    const categoryEl = root.querySelector('[data-sim-category]') as HTMLSelectElement | null;
    const productEl = root.querySelector('[data-sim-product]') as HTMLSelectElement | null;
    const costEl = root.querySelector('[data-sim-cost]') as HTMLInputElement | null;
    const runBtn = root.querySelector('[data-sim-run]') as HTMLButtonElement | null;
    const resultEl = root.querySelector('[data-sim-result]') as HTMLElement | null;

    if (!resolveUrl || !categoryEl || !costEl || !runBtn || !resultEl) return;

    const formatMoney = (value: unknown): string => {
      const n = Number(value || 0);
      return `$ ${n.toLocaleString('es-AR')}`;
    };

    const onRun = async () => {
      const categoryId = Number(categoryEl.value || 0);
      const cost = Number(costEl.value || 0);
      const productId = Number(productEl?.value || 0);

      if (!categoryId) {
        resultEl.textContent = 'Selecciona una categoria para simular.';
        return;
      }

      if (cost < 0 || Number.isNaN(cost)) {
        resultEl.textContent = 'Ingresa un costo valido.';
        return;
      }

      const params = new URLSearchParams({
        category_id: String(categoryId),
        cost_price: String(Math.round(cost)),
      });

      if (productId > 0) params.set('product_id', String(productId));

      runBtn.disabled = true;
      resultEl.textContent = 'Simulando...';

      try {
        const response = await fetch(`${resolveUrl}?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('request_failed');

        const data = (await response.json()) as {
          ok?: boolean;
          margin_percent?: number;
          recommended_price?: number;
          rule?: { name?: string };
        };
        if (!data || data.ok !== true) throw new Error('invalid_response');

        const margin = Number(data.margin_percent || 0);
        const recommended = Number(data.recommended_price || 0);
        const ruleName = data.rule?.name ? data.rule.name : 'Margen por defecto';

        resultEl.textContent = '';
        const line1 = document.createElement('div');
        line1.className = 'font-black text-zinc-900';
        line1.textContent = `Precio recomendado: ${formatMoney(recommended)}`;

        const line2 = document.createElement('div');
        line2.className = 'mt-1';
        line2.textContent = `Margen aplicado: ${margin}%`;

        const line3 = document.createElement('div');
        line3.className = 'mt-1 text-xs text-zinc-500';
        line3.textContent = `Regla: ${ruleName}`;

        resultEl.append(line1, line2, line3);
      } catch (_error) {
        resultEl.textContent = 'No se pudo simular en este momento.';
      } finally {
        runBtn.disabled = false;
      }
    };

    runBtn.addEventListener('click', onRun);
    return () => runBtn.removeEventListener('click', onRun);
  }, [rootId]);

  return null;
}
