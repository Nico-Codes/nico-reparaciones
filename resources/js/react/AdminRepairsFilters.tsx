import { useMemo, useState } from 'react';

type StatusItem = {
  key: string;
  label: string;
};

type Props = {
  q: string;
  status: string;
  wa: string;
  statuses: StatusItem[];
  clearHref: string;
};

export default function AdminRepairsFilters({ q, status, wa, statuses, clearHref }: Props) {
  const [moreOpen, setMoreOpen] = useState(wa !== '');
  const canClear = useMemo(() => q !== '' || status !== '' || wa !== '', [q, status, wa]);

  return (
    <div className="card reveal-item">
      <div className="card-body">
        <form method="GET" className="grid gap-3 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label>Buscar</label>
            <input name="q" defaultValue={q} placeholder="Codigo, nombre, telefono..." className="h-11" />
          </div>

          <div className="sm:col-span-2">
            <label>Estado</label>
            <select name="status" defaultValue={status} className="h-11">
              <option value="">Todos</option>
              {statuses.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className={`sm:col-span-2 ${moreOpen ? '' : 'hidden'}`}>
            <label>WhatsApp</label>
            <select name="wa" defaultValue={wa} className="h-11">
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="sent">Enviado (OK)</option>
              <option value="no_phone">Sin telefono</option>
            </select>
          </div>

          <div className="sm:col-span-6 flex flex-col sm:flex-row gap-2 sm:items-center">
            <button className="btn-outline h-11 w-full justify-center sm:w-40" type="submit">
              Aplicar
            </button>

            {canClear ? (
              <a className="btn-ghost h-11 w-full justify-center sm:w-40" href={clearHref}>
                Limpiar
              </a>
            ) : null}

            <button
              type="button"
              className="btn-ghost h-11 w-full justify-center sm:w-40 sm:ml-auto"
              aria-expanded={moreOpen ? 'true' : 'false'}
              onClick={() => setMoreOpen((prev) => !prev)}>
              {moreOpen ? 'Ocultar filtros' : 'Ver filtros'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

