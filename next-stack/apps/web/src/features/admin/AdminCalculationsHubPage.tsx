import { Link } from 'react-router-dom';

export function AdminCalculationsHubPage() {
  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Reglas de cálculo</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Gestión centralizada del cálculo automático para productos y reparaciones.
            </p>
          </div>
          <Link to="/admin" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver al panel
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/admin/calculos/productos"
          className="card block transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-24px_#0f172a33]"
        >
          <div className="card-body p-4 md:p-5">
            <div className="text-xl font-black tracking-tight text-zinc-900">Productos</div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Reglas por categoría, producto, rango de costo y porcentaje de margen.
            </p>
            <div className="mt-4 text-sm font-black text-sky-700">Abrir reglas de productos</div>
          </div>
        </Link>

        <Link
          to="/admin/precios"
          className="card block transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-24px_#0f172a33]"
        >
          <div className="card-body p-4 md:p-5">
            <div className="text-xl font-black tracking-tight text-zinc-900">Reparaciones</div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Reglas por tipo, marca, modelo y prioridad para cálculo automático.
            </p>
            <div className="mt-4 text-sm font-black text-sky-700">Abrir reglas de reparaciones</div>
          </div>
        </Link>
      </section>
    </div>
  );
}
