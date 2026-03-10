import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { authApi } from './api';
import { authStorage } from './storage';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const user = authStorage.getUser();
  const navigate = useNavigate();

  async function handleResend() {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await authApi.requestVerifyEmail();
      setMessage(res.previewToken ? `Correo reenviado. Token de vista previa: ${res.previewToken}` : 'Correo de verificación reenviado.');
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No se pudo reenviar el correo de verificación.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmToken() {
    if (!tokenFromQuery) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await authApi.confirmVerifyEmail(tokenFromQuery);
      setMessage(res.message || 'Correo verificado correctamente.');
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No se pudo verificar el correo.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    authStorage.clear();
    navigate('/auth/login');
  }

  return (
    <PageShell context="account" className="space-y-6">
      <PageHeader
        context="account"
        eyebrow="Verificación"
        title="Confirmá tu correo"
        subtitle={tokenFromQuery ? 'Recibimos un enlace de verificación. Confirmá el correo con un toque.' : 'Te enviamos un enlace para confirmar tu cuenta y proteger los pedidos.'}
        actions={
          user?.email ? <StatusBadge tone="warning" label={user.email} /> : null
        }
      />

      <SectionCard title="Correo electrónico" description="Este paso confirma la titularidad de la cuenta y habilita un seguimiento más confiable.">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-zinc-700">
            {tokenFromQuery
              ? 'Usá el botón principal para confirmar la dirección vinculada a tu cuenta.'
              : (
                <>
                  Te enviamos un enlace de verificación a <span className="font-black text-zinc-900">{user?.email ?? 'tu correo'}</span>.
                </>
              )}
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {tokenFromQuery ? (
              <Button type="button" onClick={() => void handleConfirmToken()} disabled={loading} className="w-full justify-center sm:col-span-2">
                {loading ? 'Verificando...' : 'Confirmar correo'}
              </Button>
            ) : (
              <Button type="button" onClick={() => void handleResend()} disabled={loading} className="w-full justify-center sm:col-span-2">
                {loading ? 'Enviando...' : 'Reenviar correo de verificación'}
              </Button>
            )}

            <Button asChild variant="outline" className="w-full justify-center">
              <Link to="/mi-cuenta">Cambiar email en mi cuenta</Link>
            </Button>

            <Button type="button" variant="ghost" className="w-full justify-center" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>

          {error ? (
            <div className="ui-alert ui-alert--danger">
              <div>
                <span className="ui-alert__title">No pudimos completar la verificación.</span>
                <div className="ui-alert__text">{error}</div>
              </div>
            </div>
          ) : null}
          {message ? (
            <div className="ui-alert ui-alert--success">
              <div>
                <span className="ui-alert__title">Proceso actualizado</span>
                <div className="ui-alert__text">{message}</div>
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </PageShell>
  );
}
