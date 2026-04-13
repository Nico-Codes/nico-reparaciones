import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; tone: 'success' | 'danger' } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await authApi.resetPassword({ token, password });
      setFeedback({ text: res.message, tone: 'success' });
    } catch (error) {
      setFeedback({
        text: (error as { message?: string })?.message ?? 'No pudimos actualizar la contrasena.',
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Restablecer contrasena"
      subtitle="Defini una nueva contrasena para volver a ingresar con seguridad."
      eyebrow="Seguridad"
      statusLabel={token.trim() ? 'Token cargado' : 'Token manual'}
    >
      <SectionCard
        className="auth-card"
        title="Nueva contrasena"
        description="Pega el token recibido y elegi una clave nueva para la cuenta."
        actions={token.trim() ? <StatusBadge tone="info" size="sm" label="Token listo" /> : <StatusBadge tone="warning" size="sm" label="Token requerido" />}
      >
        <form className="auth-form" onSubmit={onSubmit}>
          <TextAreaField
            label="Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={3}
            placeholder="Pega aca el token del enlace o del mail"
            required
          />

          <TextField
            label="Nueva contrasena"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            autoComplete="new-password"
            required
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="w-full justify-center">
              <Link to="/auth/login">Volver a ingresar</Link>
            </Button>
            <Button type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? 'Actualizando...' : 'Guardar nueva contrasena'}
            </Button>
          </div>
        </form>

        {feedback ? (
          <div className={`ui-alert mt-4 ${feedback.tone === 'success' ? 'ui-alert--success' : 'ui-alert--danger'}`}>
            <div>
              <span className="ui-alert__title">
                {feedback.tone === 'success' ? 'Contrasena actualizada' : 'No pudimos actualizar la contrasena.'}
              </span>
              <div className="ui-alert__text">{feedback.text}</div>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </AuthLayout>
  );
}
