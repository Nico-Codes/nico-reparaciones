import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
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
      setResult('Ingresa tu email y contrasena para continuar.');
      return;
    }

    if (needsTwoFactor && !normalizedTwoFactorCode) {
      setResult('Ingresa el codigo 2FA para completar el acceso.');
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
      const message = (error as { message?: string })?.message ?? 'No pudimos iniciar sesion.';
      if (message.toLowerCase().includes('2fa')) setNeedsTwoFactor(true);
      setResult(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Ingresar"
      subtitle="Entra con tu cuenta para seguir pedidos, consultar reparaciones y gestionar tu perfil."
      eyebrow="Cuenta"
      statusLabel={needsTwoFactor ? '2FA requerida' : 'Acceso'}
    >
      <SectionCard
        title="Inicia sesion"
        description="Usa tu email y contrasena para entrar. Si tenes 2FA activa, el sistema te va a pedir el codigo al continuar."
        actions={needsTwoFactor ? <StatusBadge tone="warning" size="sm" label="Codigo 2FA" /> : undefined}
      >
        {result ? (
          <div className="ui-alert ui-alert--danger mb-4">
            <div>
              <span className="ui-alert__title">No pudimos iniciar sesion.</span>
              <div className="ui-alert__text">{result}</div>
            </div>
          </div>
        ) : null}

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
            label="Contrasena"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            autoComplete="current-password"
            required
          />
          {needsTwoFactor ? (
            <TextField
              label="Codigo 2FA"
              type="text"
              value={twoFactorCode}
              onChange={(event) => setTwoFactorCode(event.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          ) : null}

          <Button type="submit" className="w-full justify-center" disabled={!canSubmit || loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
          <span>Olvidaste tu contrasena?</span>
          <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/forgot-password">
            Recuperarla
          </Link>
        </div>
      </SectionCard>

      <SectionCard
        tone="muted"
        title="No tenes cuenta?"
        description="Podes crear una cuenta web para comprar, seguir pedidos y consultar reparaciones desde el mismo perfil."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">El registro sigue disponible, pero lo recomendamos desde este paso para mantener el acceso ordenado.</p>
          <Button asChild variant="outline" className="justify-center">
            <Link to="/auth/register">Crear cuenta</Link>
          </Button>
        </div>
      </SectionCard>
    </AuthLayout>
  );
}
