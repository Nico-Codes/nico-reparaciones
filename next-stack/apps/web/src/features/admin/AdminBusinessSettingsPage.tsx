import { useState } from 'react';
import { Link } from 'react-router-dom';

export function AdminBusinessSettingsPage() {
  const [shopWhatsapp, setShopWhatsapp] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopHours, setShopHours] = useState('');
  const [ticketPaper, setTicketPaper] = useState('80');
  const [orderDelayHours, setOrderDelayHours] = useState('24');
  const [repairDelayDays, setRepairDelayDays] = useState('3');
  const [storeHeroTitle, setStoreHeroTitle] = useState('');
  const [storeHeroText, setStoreHeroText] = useState('');

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Datos del negocio</h1>
            <p className="mt-1 text-sm text-zinc-600">Informacion base usada en mensajes y comprobantes.</p>
          </div>
          <Link to="/admin/configuraciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver a configuracion
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="card-body space-y-4 p-4 md:p-5">
          <Field label='WhatsApp del local (opcional)' hint='Se usa para el boton "Escribir por WhatsApp".'>
            <input
              value={shopWhatsapp}
              onChange={(e) => setShopWhatsapp(e.target.value)}
              placeholder="Ej: +54 341 5550000"
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </Field>

          <Field label="Direccion del local (opcional)" hint="Placeholder: {shop_address}">
            <textarea
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              rows={3}
              placeholder="Ej: Av. San Martin 123"
              className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm"
            />
          </Field>

          <Field label="Horarios (opcional)" hint="Placeholder: {shop_hours}">
            <textarea
              value={shopHours}
              onChange={(e) => setShopHours(e.target.value)}
              rows={3}
              placeholder="Ej: Lun a Vie 9-13 / 16-20"
              className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm"
            />
          </Field>

          <Field label="Papel ticket por defecto" hint='Se usa en "Confirmar e imprimir" y en reimpresion de ventas rapidas.'>
            <select
              value={ticketPaper}
              onChange={(e) => setTicketPaper(e.target.value)}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            >
              <option value="80">80 mm</option>
              <option value="58">58 mm</option>
              <option value="a4">A4</option>
            </select>
          </Field>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xl font-black tracking-tight text-zinc-900">Alertas operativas (dashboard)</div>
            <p className="mt-1 text-sm text-zinc-600">Define cuando un pedido o reparacion se considera demorado.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-900">Pedido demorado (horas)</label>
                <input
                  type="number"
                  min={0}
                  value={orderDelayHours}
                  onChange={(e) => setOrderDelayHours(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                />
                <p className="mt-2 text-sm text-zinc-500">Estados: pendiente, confirmado, preparando.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-900">Reparacion demorada (dias)</label>
                <input
                  type="number"
                  min={0}
                  value={repairDelayDays}
                  onChange={(e) => setRepairDelayDays(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                />
                <p className="mt-2 text-sm text-zinc-500">Estados: recibido, diagnosticando, esperando aprobacion, reparando.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
            Portada de tienda: la imagen se cambia desde <span className="font-black">Configuracion &gt; Identidad visual &gt; Fondo portada tienda</span>.
          </div>

          <Field label="Titulo portada tienda (opcional)">
            <input
              value={storeHeroTitle}
              onChange={(e) => setStoreHeroTitle(e.target.value)}
              placeholder="Ej: Novedades de la semana"
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </Field>

          <Field label="Texto portada tienda (opcional)">
            <textarea
              value={storeHeroText}
              onChange={(e) => setStoreHeroText(e.target.value)}
              rows={3}
              placeholder="Ej: Ingresaron nuevos modulos, cables y accesorios."
              className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm"
            />
          </Field>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <button type="button" className="btn-outline !h-11 !rounded-xl px-5 text-sm font-bold">
              Cancelar
            </button>
            <button type="button" className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold">
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
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-900">{label}</label>
      {children}
      {hint ? <p className="mt-2 text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}

