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
      subtitle="Entra con tu cuenta para seguir pedidos, reparaciones y tu perfil."
      eyebrow="Cuenta"
      statusLabel={needsTwoFactor ? '2FA requerida' : 'Acceso'}
    >
      <SectionCard
        className="auth-card"
        title="Entrar a tu cuenta"
        description="Usa tu email y contrasena para continuar. Si tenes 2FA activa, te pediremos el codigo en este mismo paso."
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

        <form className="auth-form" onSubmit={onSubmit}>
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

        <div className="auth-link-row">
          <span>Olvidaste tu contrasena?</span>
          <Link className="auth-inline-link" to="/auth/forgot-password">
            Recuperarla
          </Link>
        </div>

        <div className="auth-link-row auth-link-row--compact">
          <span>No tenes cuenta todavia?</span>
          <Link className="auth-inline-link" to="/auth/register">
            Crear cuenta
          </Link>
        </div>
      </SectionCard>
    </AuthLayout>
  );
}
