import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';

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
    <AuthLayout title="Restablecer contraseña" subtitle="Usa el token de recuperación generado por el backend">
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-zinc-700">Token</span>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-zinc-700">Nueva contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            required
          />
        </label>
        <Button className="w-full" disabled={loading}>{loading ? 'Actualizando...' : 'Actualizar contraseña'}</Button>
      </form>
      {message ? <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">{message}</div> : null}
    </AuthLayout>
  );
}
