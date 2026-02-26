import { Link } from 'react-router-dom';

export function AdminRepairPricingRuleCreatePage() {
  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Crear regla</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Mas especifico implica mayor prioridad (Modelo &gt; Grupo &gt; Marca &gt; Generico).
            </p>
          </div>
          <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver
          </Link>
        </div>
      </section>

      <section className="card mx-auto w-full max-w-[720px]">
        <div className="card-body space-y-4 md:space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tipo de dispositivo *">
              <select className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option>Elegi...</option>
                <option>Celular</option>
                <option>Tablet</option>
                <option>Notebook</option>
              </select>
            </Field>
            <Field label="Reparacion final *">
              <select className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option>Elegi...</option>
                <option>Modulo</option>
                <option>Bateria</option>
                <option>Pin de carga</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Marca (opcional)">
              <select className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option>-</option>
                <option>Samsung</option>
                <option>Motorola</option>
              </select>
            </Field>
            <Field label="Grupo (opcional)">
              <select className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option>-</option>
                <option>G</option>
                <option>A</option>
              </select>
            </Field>
          </div>

          <Field label="Modelo (opcional)" help="Si eliges modelo, pisa marca y grupo.">
            <select className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
              <option>-</option>
              <option>G30</option>
              <option>A30</option>
            </select>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Modo *" help="Modo margen activo: porcentaje + minimo de ganancia.">
              <select className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option>Margen (porcentaje + minimo)</option>
                <option>Precio fijo</option>
                <option>Margen + envio</option>
              </select>
            </Field>
            <Field label="Envio sugerido" help="Si no hay envio, coloca 0.">
              <input defaultValue="10000" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Porcentaje de ganancia (ej 0.25 = 25%)">
              <input defaultValue="0.25" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </Field>
            <Field label="Minimo de ganancia">
              <input defaultValue="24000" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </Field>
          </div>

          <Field label="Prioridad (avanzado)" help="Si hay empate de especificidad, gana mayor prioridad.">
            <input defaultValue="0" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm md:max-w-[340px]" />
          </Field>

          <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
            <input type="checkbox" defaultChecked className="h-4 w-4" />
            Activa
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Cancelar
            </Link>
            <button type="button" className="btn-primary !h-10 !rounded-xl px-5 text-sm font-bold">
              Guardar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-zinc-800">{label}</label>
      {children}
      {help ? <p className="mt-1.5 text-xs text-zinc-500">{help}</p> : null}
    </div>
  );
}
