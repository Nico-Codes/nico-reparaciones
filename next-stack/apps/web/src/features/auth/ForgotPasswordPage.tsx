import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; tone: 'success' | 'danger' } | null>(null);
  const [previewToken, setPreviewToken] = useState('');

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setPreviewToken('');

    if (!normalizedEmail) {
      setFeedback({ text: 'Ingresa un email valido para recibir el enlace.', tone: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(normalizedEmail);
      setFeedback({ text: res.message, tone: 'success' });
      setPreviewToken(res.previewToken ?? '');
    } catch (error) {
      setFeedback({
        text: (error as { message?: string })?.message ?? 'No pudimos enviar el enlace de recuperacion.',
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Recuperar contrasena"
      subtitle="Te enviaremos un enlace seguro para restablecer el acceso a tu cuenta."
      eyebrow="Acceso"
      statusLabel="Recuperacion"
    >
      <SectionCard
        className="auth-card"
        title="Restablecer por email"
        description="Ingresa el correo asociado a tu cuenta y te mandamos un enlace para continuar."
        actions={<StatusBadge tone="warning" size="sm" label="Enlace seguro" />}
      >
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

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="w-full justify-center">
              <Link to="/auth/login">Volver a ingresar</Link>
            </Button>
            <Button type="submit" className="w-full justify-center" disabled={!normalizedEmail || loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </div>
        </form>

        {feedback ? (
          <div className={`ui-alert mt-4 ${feedback.tone === 'success' ? 'ui-alert--success' : 'ui-alert--danger'}`}>
            <div>
              <span className="ui-alert__title">
                {feedback.tone === 'success' ? 'Enlace enviado' : 'No pudimos enviar el enlace.'}
              </span>
              <div className="ui-alert__text">{feedback.text}</div>
            </div>
          </div>
        ) : null}
        {previewToken ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <div className="font-bold">Token de vista previa para restablecer (desarrollo)</div>
            <div className="mt-1 break-all">{previewToken}</div>
          </div>
        ) : null}
      </SectionCard>
    </AuthLayout>
  );
}
