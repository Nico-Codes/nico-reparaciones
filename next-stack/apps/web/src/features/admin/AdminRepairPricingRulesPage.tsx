import { useState } from 'react';
import { Link } from 'react-router-dom';

type RepairRuleRow = {
  id: number;
  active: boolean;
  type: string;
  brand: string;
  group: string;
  model: string;
  repairType: string;
  mode: string;
  percent: string;
  min: string;
  fixed: string;
  shipping: string;
  priority: string;
};

export function AdminRepairPricingRulesPage() {
  const [rows, setRows] = useState<RepairRuleRow[]>([
    {
      id: 1,
      active: true,
      type: 'Celular',
      brand: 'Motorola',
      group: 'G',
      model: 'G30',
      repairType: 'Modulo',
      mode: 'Porcentaje',
      percent: '35',
      min: '16000',
      fixed: '',
      shipping: '0',
      priority: '10',
    },
  ]);

  function patchRow(id: number, patch: Partial<RepairRuleRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        active: true,
        type: 'Celular',
        brand: '',
        group: '',
        model: '',
        repairType: 'Modulo',
        mode: 'Porcentaje',
        percent: '0',
        min: '',
        fixed: '',
        shipping: '0',
        priority: String(prev.length * 10 + 10),
      },
    ]);
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Reglas de precios (auto)</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Configura porcentaje, minimos y precios fijos por tipo, marca, grupo y modelo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/tiposdispositivo" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Dispositivos</Link>
            <Link to="/admin/catalogodispositivos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Catalogo</Link>
            <Link to="/admin/gruposmodelos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Grupos</Link>
            <Link to="/admin/tiposreparacion" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Tipos</Link>
            <Link to="/admin/precios/crear" className="btn-primary !h-10 !rounded-xl px-4 text-sm font-bold">
              + Nueva regla
            </Link>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[1250px]">
              <div className="grid grid-cols-[0.7fr_0.9fr_0.9fr_0.9fr_0.9fr_1fr_0.9fr_0.5fr_0.7fr_0.7fr_0.7fr_0.9fr_1.1fr] gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-zinc-500">
                <div>Activo</div>
                <div>Tipo</div>
                <div>Marca</div>
                <div>Grupo</div>
                <div>Modelo</div>
                <div>Reparacion</div>
                <div>Modo</div>
                <div>%</div>
                <div>Min</div>
                <div>Fijo</div>
                <div>Envio</div>
                <div>Prioridad</div>
                <div>Acciones</div>
              </div>

              {rows.map((row) => (
                <div key={row.id} className="grid grid-cols-[0.7fr_0.9fr_0.9fr_0.9fr_0.9fr_1fr_0.9fr_0.5fr_0.7fr_0.7fr_0.7fr_0.9fr_1.1fr] gap-3 border-b border-zinc-100 px-4 py-3 text-sm">
                  <div className="flex items-center">
                    <input type="checkbox" checked={row.active} onChange={(e) => patchRow(row.id, { active: e.target.checked })} className="h-4 w-4" />
                  </div>
                  <InlineText value={row.type} onChange={(v) => patchRow(row.id, { type: v })} />
                  <InlineText value={row.brand} onChange={(v) => patchRow(row.id, { brand: v })} />
                  <InlineText value={row.group} onChange={(v) => patchRow(row.id, { group: v })} />
                  <InlineText value={row.model} onChange={(v) => patchRow(row.id, { model: v })} />
                  <InlineText value={row.repairType} onChange={(v) => patchRow(row.id, { repairType: v })} />
                  <InlineSelect value={row.mode} onChange={(v) => patchRow(row.id, { mode: v })} options={['Porcentaje', 'Fijo', 'Minimo + %']} />
                  <InlineText value={row.percent} onChange={(v) => patchRow(row.id, { percent: v })} />
                  <InlineText value={row.min} onChange={(v) => patchRow(row.id, { min: v })} />
                  <InlineText value={row.fixed} onChange={(v) => patchRow(row.id, { fixed: v })} />
                  <InlineText value={row.shipping} onChange={(v) => patchRow(row.id, { shipping: v })} />
                  <InlineText value={row.priority} onChange={(v) => patchRow(row.id, { priority: v })} />
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold">Guardar</button>
                    <button type="button" className="inline-flex h-8 items-center rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-600">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InlineText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-xl border border-zinc-200 px-2 text-sm"
    />
  );
}

function InlineSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-2 text-sm">
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  );
}
