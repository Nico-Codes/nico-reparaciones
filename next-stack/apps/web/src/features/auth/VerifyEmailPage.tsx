import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';
import { authStorage } from './storage';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [token, setToken] = useState(tokenFromQuery);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const user = authStorage.getUser();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await authApi.confirmVerifyEmail(token);
      setMessage(res.message);
    } catch (error) {
      setMessage((error as { message?: string })?.message ?? 'Error al verificar correo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Verifica tu correo" subtitle="Es un paso rápido para proteger tu cuenta y confirmar pedidos.">
      <div className="mb-4">
        <div className="text-xs font-black uppercase tracking-wide text-sky-700">Verificación</div>
        <h2 className="text-lg font-black tracking-tight text-zinc-900">Confirma tu email</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Pega el token de verificación enviado a{' '}
          <span className="font-semibold text-zinc-900">{user?.email ?? 'tu correo'}</span>.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-600">Token de verificación</span>
          <textarea
            rows={3}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            required
          />
        </label>

        <button className="btn-primary h-11 w-full justify-center" disabled={loading}>
          {loading ? 'Verificando...' : 'Verificar correo'}
        </button>
      </form>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Link to="/auth/login" className="btn-outline h-11 w-full justify-center">
          Volver a ingresar
        </Link>
        <Link to="/auth/register" className="btn-ghost h-11 w-full justify-center">
          Crear otra cuenta
        </Link>
      </div>

      {message ? <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">{message}</div> : null}
    </AuthLayout>
  );
}
