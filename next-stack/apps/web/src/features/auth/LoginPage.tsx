import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';
import { authStorage } from './storage';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const from = typeof (location.state as { from?: unknown } | null)?.from === 'string'
    ? ((location.state as { from?: string }).from ?? '')
    : '';

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const normalizedPassword = useMemo(() => password.trim(), [password]);
  const normalizedTwoFactorCode = useMemo(() => twoFactorCode.trim(), [twoFactorCode]);
  const canSubmit = normalizedEmail.length > 0 && normalizedPassword.length > 0 && (!needsTwoFactor || normalizedTwoFactorCode.length > 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult('');

    if (!normalizedEmail || !normalizedPassword) {
      setResult('Ingresá tu email y contraseña para continuar.');
      return;
    }

    if (needsTwoFactor && !normalizedTwoFactorCode) {
      setResult('Ingresá el código 2FA para completar el acceso.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({
        email: normalizedEmail,
        password: normalizedPassword,
        twoFactorCode: normalizedTwoFactorCode || undefined,
      });
      authStorage.setSession(res.user, res.tokens);
      setNeedsTwoFactor(false);
      const fallback = res.user.role === 'ADMIN' ? '/admin' : '/store';
      const target =
        from &&
        from.startsWith('/') &&
        !from.startsWith('/auth/') &&
        !from.startsWith('/api/')
          ? from
          : fallback;
      navigate(target, { replace: true });
    } catch (error) {
      const message = (error as { message?: string })?.message ?? 'No pudimos iniciar sesión.';
      if (message.toLowerCase().includes('2fa')) setNeedsTwoFactor(true);
      setResult(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Ingresar" subtitle="Accedé para ver tus pedidos y reparaciones.">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-wide text-sky-700">Cuenta</div>
        <h2 className="text-lg font-black tracking-tight text-zinc-900">Iniciá sesión</h2>
        <p className="mt-1 text-sm text-zinc-600">Usá tu email y contraseña.</p>
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
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
          autoComplete="current-password"
          required
        />
        {needsTwoFactor ? (
          <TextField
            label="Código 2FA"
            type="text"
            value={twoFactorCode}
            onChange={(event) => setTwoFactorCode(event.target.value)}
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        ) : null}

        <div className="text-right text-sm">
          <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/forgot-password">
            Olvidé mi contraseña
          </Link>
        </div>

        <Button type="submit" className="w-full justify-center" disabled={!canSubmit || loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-zinc-600">
        ¿No tenés cuenta?{' '}
        <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/register">
          Crear cuenta
        </Link>
      </div>

      {result ? <Notice text={result} tone="danger" /> : null}
    </AuthLayout>
  );
}

function Notice({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'danger' }) {
  const className =
    tone === 'danger'
      ? 'mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'
      : 'mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800';

  return <div className={className}>{text}</div>;
}
