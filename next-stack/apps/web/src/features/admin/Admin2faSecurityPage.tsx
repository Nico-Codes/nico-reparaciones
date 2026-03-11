import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { adminSecurityApi, type AdminTwoFactorStatus } from './adminSecurityApi';

export function Admin2faSecurityPage() {
  const [status, setStatus] = useState<AdminTwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [generatedSecret, setGeneratedSecret] = useState('');
  const [copiedOtpUrl, setCopiedOtpUrl] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await adminSecurityApi.twoFactorStatus();
      setStatus(response);
    } catch (cause) {
      setStatus(null);
      setError(cause instanceof Error ? cause.message : 'No pudimos cargar el estado de 2FA.');
    } finally {
      setLoading(false);
    }
  }

  async function generateSecret() {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await adminSecurityApi.twoFactorGenerate();
      setGeneratedSecret(response.secret);
      setMessage('Se generó un secreto nuevo. Configuralo en tu app TOTP y validalo con un código actual.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos generar el secreto 2FA.');
    } finally {
      setSubmitting(false);
    }
  }

  async function enable2fa() {
    if (code.trim().length < 6) {
      setError('Ingresá un código TOTP válido de 6 dígitos.');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await adminSecurityApi.twoFactorEnable(code);
      setCode('');
      setGeneratedSecret('');
      setCopiedOtpUrl(false);
      setMessage('2FA activado correctamente.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos activar 2FA.');
    } finally {
      setSubmitting(false);
    }
  }

  async function disable2fa() {
    if (code.trim().length < 6) {
      setError('Ingresá un código TOTP válido de 6 dígitos para desactivar 2FA.');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await adminSecurityApi.twoFactorDisable(code);
      setCode('');
      setGeneratedSecret('');
      setCopiedOtpUrl(false);
      setMessage('2FA desactivado correctamente.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos desactivar 2FA.');
    } finally {
      setSubmitting(false);
    }
  }

  const enabled = status?.enabled ?? false;
  const accountEmail = status?.accountEmail ?? 'admin@admin.com';
  const qrUrl = status?.otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(status.otpauthUrl)}`
    : null;

  async function copyOtpUrl() {
    if (!status?.otpauthUrl) return;
    try {
      await navigator.clipboard.writeText(status.otpauthUrl);
      setCopiedOtpUrl(true);
      setMessage('URL otpauth copiada al portapapeles.');
      setTimeout(() => setCopiedOtpUrl(false), 1500);
    } catch {
      setError('No pudimos copiar la URL otpauth.');
    }
  }

  return (
    <PageShell context="admin" className="space-y-6" data-admin-2fa-page>
      <PageHeader
        context="admin"
        eyebrow="Seguridad"
        title="Autenticación de dos factores"
        subtitle="Activá verificación TOTP para reforzar el acceso al panel administrativo."
        actions={
          <>
            <StatusBadge tone={enabled ? 'success' : 'warning'} label={enabled ? '2FA activo' : '2FA inactivo'} />
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/configuraciones">Volver a configuración</Link>
            </Button>
          </>
        }
      />

      {error ? (
        <div className="ui-alert ui-alert--danger">
          <div>
            <span className="ui-alert__title">No pudimos completar la acción.</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}
      {message ? (
        <div className="ui-alert ui-alert--success">
          <div>
            <span className="ui-alert__title">Estado actualizado</span>
            <div className="ui-alert__text">{message}</div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <SectionCard title="Cargando seguridad" description="Traemos el estado actual del factor extra para esta cuenta.">
          <LoadingBlock label="Cargando estado de 2FA" lines={4} />
        </SectionCard>
      ) : !status ? (
        <EmptyState
          title="No pudimos recuperar el estado de 2FA"
          description="Probá actualizar la página o revisá la configuración de seguridad."
          actions={
            <Button type="button" onClick={() => void load()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <SectionCard
          title="Estado actual"
          description={`Cuenta administradora: ${accountEmail}`}
          actions={<StatusBadge tone={enabled ? 'success' : 'warning'} label={enabled ? 'Protegida' : 'Pendiente'} />}
        >
          <div
            className={`rounded-2xl px-4 py-4 text-sm ${
              enabled ? 'border border-emerald-300 bg-emerald-50 text-emerald-900' : 'border border-amber-300 bg-amber-50 text-amber-900'
            }`}
          >
            {enabled
              ? 'El panel ya exige un código TOTP además de la contraseña al iniciar sesión.'
              : 'Todavía no hay doble factor activo. Configuralo para sumar una capa real de seguridad.'}
          </div>

          {!enabled ? (
            <div className="space-y-4">
              <Button type="button" onClick={() => void generateSecret()} disabled={loading || submitting}>
                {submitting ? 'Procesando...' : 'Generar secreto 2FA'}
              </Button>

              {status.hasPendingSecret || generatedSecret ? (
                <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div>
                    <div className="text-sm font-black text-zinc-900">Configurá tu app autenticadora</div>
                    <div className="mt-1 text-sm text-zinc-600">Escaneá el QR o copiá la URL `otpauth://` en tu app TOTP preferida.</div>
                  </div>

                  {qrUrl ? (
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                      <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
                        <img src={qrUrl} alt="QR de autenticación 2FA" className="h-40 w-40 rounded-lg object-contain sm:h-44 sm:w-44" />
                      </div>
                      <div className="text-sm text-zinc-600">Compatible con Google Authenticator, Authy y cualquier app TOTP estándar.</div>
                    </div>
                  ) : null}

                  <TextField
                    label="Secreto generado"
                    value={generatedSecret || status.pendingSecretMasked || '(secreto oculto)'}
                    readOnly
                  />

                  {status.otpauthUrl ? (
                    <div className="space-y-2">
                      <TextAreaField
                        label="URL otpauth"
                        value={status.otpauthUrl}
                        rows={3}
                        readOnly
                      />
                      <Button type="button" variant="outline" onClick={() => void copyOtpUrl()}>
                        {copiedOtpUrl ? 'URL copiada' : 'Copiar URL otpauth'}
                      </Button>
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <TextField
                      label="Código TOTP"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="123456"
                      inputMode="numeric"
                    />
                    <div className="sm:self-end">
                      <Button type="button" onClick={() => void enable2fa()} disabled={submitting || code.trim().length < 6}>
                        Activar 2FA
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-900">Desactivar 2FA</div>
              <p className="text-sm text-zinc-600">Ingresá un código TOTP actual para confirmar la desactivación.</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <TextField
                  label="Código TOTP"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                />
                <div className="sm:self-end">
                  <Button type="button" variant="outline" onClick={() => void disable2fa()} disabled={submitting || code.trim().length < 6}>
                    Desactivar 2FA
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </PageShell>
  );
}
