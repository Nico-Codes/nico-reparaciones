import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';
import { rememberSocialReturnTo, resolvePostAuthReturnTo } from './google-auth.helpers';
import { authStorage } from './storage';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [socialProviders, setSocialProviders] = useState({ google: false, apple: false });
  const [result, setResult] = useState('');
  const from = typeof (location.state as { from?: unknown } | null)?.from === 'string'
    ? ((location.state as { from?: string }).from ?? '')
    : '';

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const normalizedPassword = useMemo(() => password.trim(), [password]);
  const normalizedTwoFactorCode = useMemo(() => twoFactorCode.trim(), [twoFactorCode]);
  const canSubmit = normalizedEmail.length > 0 && normalizedPassword.length > 0 && (!needsTwoFactor || normalizedTwoFactorCode.length > 0);
  const requestedReturnTo = useMemo(() => resolvePostAuthReturnTo(from, '/store'), [from]);
  const hasSocialProviders = socialProviders.google || socialProviders.apple;

  useEffect(() => {
    let cancelled = false;

    authApi
      .socialProviders()
      .then((providers) => {
        if (!cancelled) {
          setSocialProviders(providers);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSocialProviders({ google: false, apple: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
      const target = resolvePostAuthReturnTo(from, fallback);
      navigate(target, { replace: true });
    } catch (error) {
      const message = (error as { message?: string })?.message ?? 'No pudimos iniciar sesion.';
      if (message.toLowerCase().includes('2fa')) setNeedsTwoFactor(true);
      setResult(message);
    } finally {
      setLoading(false);
    }
  }

  function startGoogleLogin() {
    setGoogleLoading(true);
    rememberSocialReturnTo(requestedReturnTo);
    window.location.assign(authApi.googleStartUrl(requestedReturnTo));
  }

  function startAppleLogin() {
    setAppleLoading(true);
    rememberSocialReturnTo(requestedReturnTo);
    window.location.assign(authApi.appleStartUrl(requestedReturnTo));
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

        {hasSocialProviders ? (
          <>
            <div className="auth-social-divider" aria-hidden="true">
              <span>o</span>
            </div>

            {socialProviders.google ? (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-3"
                disabled={loading || googleLoading || appleLoading}
                onClick={startGoogleLogin}
              >
                <span className="auth-google-mark" aria-hidden="true">
                  <svg viewBox="0 0 18 18" className="h-4 w-4">
                    <path fill="#EA4335" d="M9 7.36v3.52h4.9c-.22 1.13-.87 2.09-1.85 2.73l3 2.33c1.75-1.61 2.76-3.98 2.76-6.79 0-.64-.06-1.27-.18-1.87H9Z" />
                    <path fill="#4285F4" d="M9 18c2.43 0 4.48-.8 5.98-2.16l-3-2.33c-.83.56-1.9.89-2.98.89-2.29 0-4.23-1.55-4.92-3.63H1v2.4A9 9 0 0 0 9 18Z" />
                    <path fill="#FBBC05" d="M4.08 10.77A5.4 5.4 0 0 1 3.8 9c0-.62.1-1.22.28-1.77V4.83H1A9 9 0 0 0 0 9c0 1.45.35 2.82 1 4.17l3.08-2.4Z" />
                    <path fill="#34A853" d="M9 3.58c1.32 0 2.5.45 3.43 1.33l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 1 4.83l3.08 2.4C4.77 5.13 6.71 3.58 9 3.58Z" />
                  </svg>
                </span>
                {googleLoading ? 'Redirigiendo a Google...' : 'Continuar con Google'}
              </Button>
            ) : null}

            {socialProviders.apple ? (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-3"
                disabled={loading || googleLoading || appleLoading}
                onClick={startAppleLogin}
              >
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M16.365 12.44c.02 2.096 1.838 2.794 1.858 2.803-.015.049-.29 1-.957 1.98-.577.848-1.176 1.693-2.119 1.71-.927.018-1.225-.55-2.285-.55-1.06 0-1.391.533-2.268.568-.911.035-1.606-.915-2.188-1.76-1.19-1.72-2.098-4.858-.876-6.986.607-1.057 1.691-1.727 2.867-1.744.894-.017 1.738.603 2.285.603.546 0 1.572-.746 2.65-.637.451.019 1.718.181 2.53 1.37-.065.04-1.51.88-1.497 2.643Zm-2.07-4.769c.484-.586.81-1.402.72-2.213-.699.028-1.546.465-2.047 1.05-.448.518-.84 1.35-.733 2.144.78.061 1.576-.395 2.06-.98Z" />
                  </svg>
                </span>
                {appleLoading ? 'Redirigiendo a Apple...' : 'Continuar con Apple'}
              </Button>
            ) : null}
          </>
        ) : null}

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
