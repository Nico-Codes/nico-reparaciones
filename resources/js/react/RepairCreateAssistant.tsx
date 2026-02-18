import { useEffect, useMemo, useState } from 'react';

type RepairCreateAssistantProps = {
  formSelector: string;
};

type StepState = {
  key: string;
  label: string;
  done: boolean;
  targetId: string;
};

function normalizePhone(raw: string): string {
  const digits = String(raw || '').replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('54')) return digits;
  if (digits.length >= 10) return `54${digits}`;
  return digits;
}

function hasValue(input: HTMLInputElement | HTMLSelectElement | null): boolean {
  return !!String(input?.value || '').trim();
}

export default function RepairCreateAssistant({ formSelector }: RepairCreateAssistantProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>(formSelector);
    if (!form) return;

    const rerender = () => setTick((v) => v + 1);
    form.addEventListener('input', rerender, true);
    form.addEventListener('change', rerender, true);
    return () => {
      form.removeEventListener('input', rerender, true);
      form.removeEventListener('change', rerender, true);
    };
  }, [formSelector]);

  const state = useMemo(() => {
    const form = document.querySelector<HTMLFormElement>(formSelector);
    if (!form) {
      return {
        steps: [] as StepState[],
        progress: 0,
        partsCost: '',
        finalPrice: '',
      };
    }

    const nameEl = form.querySelector<HTMLInputElement>('input[name="customer_name"]');
    const phoneEl = form.querySelector<HTMLInputElement>('input[name="customer_phone"]');
    const typeEl = form.querySelector<HTMLSelectElement>('select[name="device_type_id"]');
    const brandEl = form.querySelector<HTMLSelectElement>('select[name="device_brand_id"]');
    const modelEl = form.querySelector<HTMLSelectElement>('select[name="device_model_id"]');
    const issueEl = form.querySelector<HTMLSelectElement>('select[name="device_issue_type_id"]');
    const repairTypeEl = form.querySelector<HTMLSelectElement>('select[name="repair_type_id"]');
    const statusEl = form.querySelector<HTMLSelectElement>('select[name="status"]');
    const partsCostEl = form.querySelector<HTMLInputElement>('input[name="parts_cost"]');
    const finalPriceEl = form.querySelector<HTMLInputElement>('input[name="final_price"]');

    const phoneDigits = normalizePhone(phoneEl?.value || '');
    const steps: StepState[] = [
      { key: 'customer', label: 'Cliente', done: hasValue(nameEl) && phoneDigits.length >= 10, targetId: 'repair_create_client' },
      { key: 'device', label: 'Equipo', done: hasValue(typeEl) && hasValue(brandEl) && hasValue(modelEl), targetId: 'repair_create_client' },
      { key: 'issue', label: 'Falla', done: hasValue(issueEl) && hasValue(repairTypeEl), targetId: 'repair_create_issue' },
      { key: 'status', label: 'Estado', done: hasValue(statusEl), targetId: 'repair_create_finance' },
      {
        key: 'pricing',
        label: 'Precio',
        done: Number(partsCostEl?.value || 0) >= 0 && Number(finalPriceEl?.value || 0) > 0,
        targetId: 'repair_create_finance',
      },
    ];

    const complete = steps.filter((s) => s.done).length;
    return {
      steps,
      progress: Math.round((complete / steps.length) * 100),
      partsCost: String(partsCostEl?.value || '').trim(),
      finalPrice: String(finalPriceEl?.value || '').trim(),
    };
  }, [formSelector, tick]);

  if (!state.steps.length) return null;

  const goToBlock = (targetId: string): void => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const focusable = target.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
    );

    if (focusable) {
      window.setTimeout(() => {
        focusable.focus();
      }, 220);
    }
  };

  const nextPending = state.steps.find((s) => !s.done);

  return (
    <div className="card border border-sky-200/70 bg-gradient-to-r from-sky-50 to-white">
      <div className="card-head">
        <div className="font-black text-sky-900">Asistente de carga</div>
        <span className={`badge-${state.progress === 100 ? 'emerald' : 'sky'}`}>
          {state.progress === 100 ? 'Listo para crear' : `${state.progress}% completo`}
        </span>
      </div>
      <div className="card-body space-y-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-sky-100">
          <div
            className="h-full rounded-full bg-sky-500 transition-all duration-300 ease-out"
            style={{ width: `${state.progress}%` }}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-5">
          {state.steps.map((step) => (
            <button
              type="button"
              key={step.key}
              onClick={() => goToBlock(step.targetId)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                step.done
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-zinc-200 bg-white text-zinc-500 hover:border-sky-300 hover:text-sky-700'
              }`}
            >
              {step.done ? 'OK' : 'Pendiente'}: {step.label}
            </button>
          ))}
        </div>
        {nextPending ? (
          <div className="flex justify-end">
            <button
              type="button"
              className="btn-outline btn-sm h-9"
              onClick={() => goToBlock(nextPending.targetId)}
            >
              Ir al siguiente pendiente
            </button>
          </div>
        ) : null}
        <div className="text-xs text-zinc-600">
          Costo repuesto: <span className="font-black">{state.partsCost || '-'}</span>
          {' · '}
          Precio final: <span className="font-black">{state.finalPrice || '-'}</span>
        </div>
      </div>
    </div>
  );
}
