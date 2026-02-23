import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [previewToken, setPreviewToken] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setPreviewToken('');
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
      setPreviewToken(res.previewToken ?? '');
    } catch (error) {
      setMessage((error as { message?: string })?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Recuperar contraseña" subtitle="Solicita token de recuperación (preview en local)">
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-zinc-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            required
          />
        </label>
        <Button className="w-full" disabled={loading}>{loading ? 'Enviando...' : 'Solicitar recuperación'}</Button>
      </form>
      <div className="mt-4 text-sm">
        <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/reset-password">Ya tengo token de recuperación</Link>
      </div>
      {message ? <Notice text={message} /> : null}
      {previewToken ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 break-all">
          <div className="font-bold">Preview token reset (dev)</div>
          {previewToken}
        </div>
      ) : null}
    </AuthLayout>
  );
}

function Notice({ text }: { text: string }) {
  return <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">{text}</div>;
}
