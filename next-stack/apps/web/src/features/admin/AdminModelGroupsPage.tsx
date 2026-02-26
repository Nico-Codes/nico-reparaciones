import { useState } from 'react';
import { Link } from 'react-router-dom';

export function AdminModelGroupsPage() {
  const [deviceType, setDeviceType] = useState('');
  const [brand, setBrand] = useState('');

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Grupos de modelos</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Sirve para separar PS4 vs PS5, Samsung Serie A vs Serie S, etc.
            </p>
          </div>
          <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Precios
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-2">
          <div>
            <div className="text-xl font-black tracking-tight text-zinc-900">Filtro de catalogo</div>
            <p className="mt-1 text-sm text-zinc-500">Elegi tipo y marca para crear o editar grupos.</p>
          </div>
        </div>
        <div className="card-body">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-zinc-800">Tipo dispositivo</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              >
                <option value="">Elegi...</option>
                <option value="celular">Celular</option>
                <option value="tablet">Tablet</option>
                <option value="consola">Consola</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-zinc-800">Marca</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              >
                <option value="">Elegi...</option>
                <option value="samsung">Samsung</option>
                <option value="motorola">Motorola</option>
                <option value="sony">Sony</option>
              </select>
            </div>
            <button type="button" className="btn-outline !h-11 !rounded-2xl px-5 text-sm font-bold">
              Filtrar
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-body py-8 text-sm text-zinc-600">
          Elegi un tipo y una marca para administrar grupos y asignar modelos.
        </div>
      </section>
    </div>
  );
}
