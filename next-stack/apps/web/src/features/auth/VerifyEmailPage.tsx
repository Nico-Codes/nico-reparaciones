import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from './api';
import { authStorage } from './storage';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const user = authStorage.getUser();
  const navigate = useNavigate();

  async function handleResend() {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await authApi.requestVerifyEmail();
      setMessage(res.previewToken ? `Correo reenviado. Token preview: ${res.previewToken}` : 'Correo de verificación reenviado.');
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No se pudo reenviar el correo de verificación.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmToken() {
    if (!tokenFromQuery) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await authApi.confirmVerifyEmail(tokenFromQuery);
      setMessage(res.message || 'Correo verificado correctamente.');
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Error al verificar correo.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    authStorage.clear();
    navigate('/auth/login');
  }

  return (
    <div className="store-shell">
      <div className="mx-auto max-w-[760px] px-4 py-5 md:py-7">
        <section className="store-hero mx-auto mb-4 max-w-[420px]">
          <div className="space-y-2">
            <h1 className="text-2xl font-black leading-tight tracking-tight text-zinc-900">
              Verifica tu correo
            </h1>
            <p className="text-sm leading-relaxed text-zinc-700">
              Es un paso rápido para proteger tu cuenta y confirmar pedidos.
            </p>
          </div>
        </section>

        <section className="card mx-auto max-w-[420px]">
          <div className="card-body space-y-4">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-sky-700">Verificación</div>
              <h2 className="text-lg font-black tracking-tight text-zinc-900">Confirma tu email</h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                {tokenFromQuery
                  ? 'Recibimos un enlace de verificación. Confirma el correo con un toque.'
                  : (
                    <>
                      Te enviamos un enlace de verificación a{' '}
                      <span className="font-black text-zinc-900">{user?.email ?? 'tu correo'}</span>.
                    </>
                  )}
              </p>
            </div>

            <div className="space-y-2">
              {tokenFromQuery ? (
                <button
                  type="button"
                  onClick={() => void handleConfirmToken()}
                  disabled={loading}
                  className="btn-primary flex h-11 w-full items-center justify-center rounded-2xl text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Verificando...' : 'Confirmar email'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={loading}
                  className="btn-primary flex h-11 w-full items-center justify-center rounded-2xl text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Enviando...' : 'Reenviar correo de verificación'}
                </button>
              )}

              <Link to="/orders" className="btn-outline flex h-11 w-full items-center justify-center rounded-2xl text-sm font-bold">
                Cambiar email en mi cuenta
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="btn-ghost flex h-11 w-full items-center justify-center rounded-2xl text-sm font-bold text-zinc-900"
              >
                Cerrar sesión
              </button>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}
            {message ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">{message}</div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
