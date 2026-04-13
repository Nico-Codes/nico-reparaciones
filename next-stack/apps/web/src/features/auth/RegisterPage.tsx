import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';
import { authStorage } from './storage';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; tone: 'success' | 'danger' } | null>(null);
  const [previewToken, setPreviewToken] = useState('');

  const normalizedName = useMemo(() => name.trim(), [name]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const canSubmit = normalizedName.length > 0 && normalizedEmail.length > 0 && password.trim().length >= 8;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setPreviewToken('');

    if (!normalizedName) {
      setFeedback({ text: 'Ingresa tu nombre para crear la cuenta.', tone: 'danger' });
      return;
    }

    if (!normalizedEmail) {
      setFeedback({ text: 'Ingresa un email valido para continuar.', tone: 'danger' });
      return;
    }

    if (password.trim().length < 8) {
      setFeedback({ text: 'La contrasena debe tener al menos 8 caracteres.', tone: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({ name: normalizedName, email: normalizedEmail, password: password.trim() });
      authStorage.setSession(res.user, res.tokens);
      setPreviewToken(res.emailVerification?.previewToken ?? '');
      setFeedback({
        text: 'Cuenta creada correctamente. Revisa tu correo para verificar la direccion si hace falta.',
        tone: 'success',
      });
    } catch (error) {
      setFeedback({
        text: (error as { message?: string })?.message ?? 'No pudimos crear la cuenta.',
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Crea tu cuenta para comprar, seguir pedidos y consultar reparaciones desde un solo lugar."
      eyebrow="Nueva cuenta"
      statusLabel="Registro"
    >
      <SectionCard
        title="Completa tus datos"
        description="Esta cuenta te va a servir para compras, seguimiento y verificacion por email."
        actions={<StatusBadge tone="info" size="sm" label="Alta web" />}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <TextField
            label="Nombre"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Juan Perez"
            autoComplete="name"
            required
          />
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
            hint="Minimo 8 caracteres."
            autoComplete="new-password"
            required
          />

          <Button type="submit" className="w-full justify-center" disabled={!canSubmit || loading}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="mt-4 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
          Ya tenes cuenta?{' '}
          <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/login">
            Ingresa
          </Link>
        </div>

        {feedback ? (
          <div className={`ui-alert mt-4 ${feedback.tone === 'success' ? 'ui-alert--success' : 'ui-alert--danger'}`}>
            <div>
              <span className="ui-alert__title">
                {feedback.tone === 'success' ? 'Cuenta creada' : 'No pudimos crear la cuenta.'}
              </span>
              <div className="ui-alert__text">{feedback.text}</div>
            </div>
          </div>
        ) : null}
        {previewToken ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <div className="font-bold">Token de vista previa para verificacion (desarrollo)</div>
            <div className="mt-1 break-all">{previewToken}</div>
          </div>
        ) : null}
      </SectionCard>
    </AuthLayout>
  );
}
