import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [token, setToken] = useState(tokenFromQuery);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
    <AuthLayout title="Verificar correo" subtitle="Confirmación de email usando token del backend">
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-zinc-700">Token de verificación</span>
          <textarea
            rows={3}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            required
          />
        </label>
        <Button className="w-full" disabled={loading}>{loading ? 'Verificando...' : 'Verificar correo'}</Button>
      </form>
      <div className="mt-4 text-sm">
        <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/login">Volver a login</Link>
      </div>
      {message ? <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">{message}</div> : null}
    </AuthLayout>
  );
}
