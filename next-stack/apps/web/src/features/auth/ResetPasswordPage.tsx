import { useMemo, useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';
import { useSearchParams } from 'react-router-dom';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await authApi.resetPassword({ token, password });
      setMessage(res.message);
    } catch (error) {
      setMessage((error as { message?: string })?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Restablecer contraseña" subtitle="Define una nueva contraseña para volver a ingresar.">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-wide text-sky-700">Seguridad</div>
        <h2 className="text-lg font-black tracking-tight text-zinc-900">Nueva contraseña</h2>
        <p className="mt-1 text-sm text-zinc-600">Guarda una contraseña segura.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-600">Token</span>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-600">Nueva contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            placeholder="********"
            required
          />
        </label>

        <button className="btn-primary h-11 w-full justify-center" disabled={loading}>
          {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
        </button>
      </form>

      {message ? <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">{message}</div> : null}
    </AuthLayout>
  );
}
