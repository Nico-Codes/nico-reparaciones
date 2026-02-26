import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from './api';

type SmtpState = Awaited<ReturnType<typeof adminApi.smtpStatus>>;

function badgeClass(status: SmtpState['smtpHealth']['status']) {
  if (status === 'ok') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'local') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

export function AdminSmtpSettingsPage() {
  const [email, setEmail] = useState('');
  const [data, setData] = useState<SmtpState | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.smtpStatus();
      setData(res);
      setEmail((prev) => prev || res.smtpDefaultTo || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando estado SMTP');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function sendTest() {
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminApi.smtpTest(email);
      setSuccess(
        res.status === 'dry_run'
          ? `Prueba SMTP simulada enviada a ${res.sentTo} (modo fallback/local).`
          : `Prueba SMTP enviada a ${res.sentTo}.`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la prueba SMTP');
    } finally {
      setSending(false);
    }
  }

  const smtp = data?.smtpHealth;

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Correo SMTP</h1>
            <p className="mt-1 text-sm text-zinc-600">Valida configuracion de correo y envia una prueba.</p>
          </div>
          <Link to="/admin/configuraciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver a configuracion
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="card-body space-y-4 p-4 md:p-5">
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">{error}</div> : null}
          {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">{success}</div> : null}

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl font-black tracking-tight text-zinc-900">Estado SMTP</div>
                <p className="mt-1 text-sm text-zinc-600">
                  {loading ? 'Cargando estado SMTP...' : smtp?.summary ?? 'Configuracion incompleta para envio real.'}
                </p>
                <p className="mt-2 text-sm text-zinc-700">
                  Mailer: <span className="font-black text-zinc-900">{loading ? '—' : smtp?.mailer ?? '-'}</span>
                  {' '}| From:{' '}
                  <span className="font-black text-zinc-900">{loading ? '—' : smtp?.from_address ?? '-'}</span>
                </p>
                {!loading && smtp?.issues?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
                    {smtp.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <span className={`inline-flex h-8 items-center rounded-full border px-3 text-sm font-black ${badgeClass(smtp?.status ?? 'warning')}`}>
                {loading ? 'Cargando' : smtp?.label ?? 'Incompleto'}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">Email destino para prueba</label>
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 flex-1 rounded-2xl border border-zinc-200 px-3 text-sm"
                placeholder="tu-email@dominio.com"
              />
              <button
                type="button"
                onClick={() => void sendTest()}
                disabled={sending || loading || !email.trim()}
                className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? 'Enviando...' : 'Enviar prueba SMTP'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
            Si falla, revisa variables <code>SMTP_*</code> del entorno y proveedor SMTP.
          </div>
        </div>
      </section>
    </div>
  );
}
