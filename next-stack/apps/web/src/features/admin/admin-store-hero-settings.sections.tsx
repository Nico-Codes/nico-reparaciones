import { Link } from 'react-router-dom';
export { AdminStoreHeroAssetsSection } from './admin-store-hero-settings.assets';
export { AdminStoreHeroTextSettingsSection } from './admin-store-hero-settings.form';

type AdminStoreHeroAlertsProps = {
  error: string;
  success: string;
};

export function AdminStoreHeroHeader() {
  return (
    <section className="store-hero">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Portada de tienda</h1>
          <p className="mt-1 text-sm text-zinc-600">Administra la imagen principal que se muestra al entrar a la tienda.</p>
        </div>
        <Link to="/admin/configuraciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
          Volver a configuracion
        </Link>
      </div>
    </section>
  );
}

export function AdminStoreHeroAlerts({ error, success }: AdminStoreHeroAlertsProps) {
  return (
    <>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</div> : null}
    </>
  );
}
