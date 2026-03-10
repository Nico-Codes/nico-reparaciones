import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [previewToken, setPreviewToken] = useState('');

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setPreviewToken('');

    if (!normalizedEmail) {
      setMessage('Ingresá un email válido para recibir el enlace.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(normalizedEmail);
      setMessage(res.message);
      setPreviewToken(res.previewToken ?? '');
    } catch (error) {
      setMessage((error as { message?: string })?.message ?? 'No pudimos enviar el enlace de recuperación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Recuperar contraseña" subtitle="Te enviaremos un enlace seguro para restablecerla.">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-wide text-sky-700">Acceso</div>
        <h2 className="text-lg font-black tracking-tight text-zinc-900">Restablecer por email</h2>
        <p className="mt-1 text-sm text-zinc-600">Ingresá tu correo para continuar.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          required
        />

        <Button type="submit" className="w-full justify-center" disabled={!normalizedEmail || loading}>
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-zinc-600">
        <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/login">
          Volver a ingresar
        </Link>
      </div>

      {message ? <Notice text={message} /> : null}
      {previewToken ? (
        <div className="mt-3 break-all rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <div className="font-bold">Token de vista previa para restablecer (desarrollo)</div>
          {previewToken}
        </div>
      ) : null}
    </AuthLayout>
  );
}

function Notice({ text }: { text: string }) {
  return <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">{text}</div>;
}
