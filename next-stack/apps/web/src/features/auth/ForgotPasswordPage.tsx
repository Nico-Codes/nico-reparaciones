import { useState } from 'react';
import { Link } from 'react-router-dom';
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
    <AuthLayout title="Recuperar contraseña" subtitle="Te enviaremos un enlace seguro para restablecerla.">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-wide text-sky-700">Acceso</div>
        <h2 className="text-lg font-black tracking-tight text-zinc-900">Restablecer por email</h2>
        <p className="mt-1 text-sm text-zinc-600">Ingresa tu correo para continuar.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-600">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            placeholder="tu@email.com"
            required
          />
        </label>

        <button className="btn-primary h-11 w-full justify-center" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-zinc-600">
        <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/login">
          Volver a ingresar
        </Link>
      </div>

      {message ? <Notice text={message} /> : null}
      {previewToken ? (
        <div className="mt-3 break-all rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <div className="font-bold">Preview token reset (dev)</div>
          {previewToken}
        </div>
      ) : null}
    </AuthLayout>
  );
}

function Notice({ text }: { text: string }) {
  return <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">{text}</div>;
}
