import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import type { AdminTwoFactorStatus } from './adminSecurityApi';
import {
  resolveTwoFactorProtectionLabel,
  resolveTwoFactorSecretValue,
  resolveTwoFactorStatusLabel,
  resolveTwoFactorStatusMessage,
  resolveTwoFactorStatusTone,
} from './admin-2fa-security.helpers';

type Admin2faSecurityHeaderProps = {
  enabled: boolean;
};

type Admin2faSecurityFeedbackProps = {
  error: string;
  message: string;
};

type Admin2faSecurityEmptyProps = {
  onRetry: () => void;
};

type Admin2faSecurityStatusCardProps = {
  status: AdminTwoFactorStatus;
  accountEmail: string;
  enabled: boolean;
  generatedSecret: string;
  copiedOtpUrl: boolean;
  qrUrl: string | null;
  code: string;
  submitting: boolean;
  canSubmitCode: boolean;
  hasPendingSetup: boolean;
  onCodeChange: (value: string) => void;
  onGenerateSecret: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onCopyOtpUrl: () => void;
};

export function Admin2faSecurityHeader({ enabled }: Admin2faSecurityHeaderProps) {
  return (
    <PageHeader
      context="admin"
      eyebrow="Seguridad"
      title="Autenticacion de dos factores"
      subtitle="Activa verificacion TOTP para reforzar el acceso al panel administrativo."
      actions={
        <>
          <StatusBadge tone={resolveTwoFactorStatusTone(enabled)} label={resolveTwoFactorStatusLabel(enabled)} />
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/configuraciones">Volver a configuracion</Link>
          </Button>
        </>
      }
    />
  );
}

export function Admin2faSecurityFeedback({ error, message }: Admin2faSecurityFeedbackProps) {
  return (
    <>
      {error ? (
        <div className="ui-alert ui-alert--danger">
          <div>
            <span className="ui-alert__title">No pudimos completar la accion.</span>
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
    </>
  );
}

export function Admin2faSecurityLoading() {
  return (
    <SectionCard title="Cargando seguridad" description="Traemos el estado actual del factor extra para esta cuenta.">
      <LoadingBlock label="Cargando estado de 2FA" lines={4} />
    </SectionCard>
  );
}

export function Admin2faSecurityEmpty({ onRetry }: Admin2faSecurityEmptyProps) {
  return (
    <EmptyState
      title="No pudimos recuperar el estado de 2FA"
      description="Prueba actualizar la pagina o revisa la configuracion de seguridad."
      actions={
        <Button type="button" onClick={onRetry}>
          Reintentar
        </Button>
      }
    />
  );
}

export function Admin2faSecurityStatusCard({
  status,
  accountEmail,
  enabled,
  generatedSecret,
  copiedOtpUrl,
  qrUrl,
  code,
  submitting,
  canSubmitCode,
  hasPendingSetup,
  onCodeChange,
  onGenerateSecret,
  onEnable,
  onDisable,
  onCopyOtpUrl,
}: Admin2faSecurityStatusCardProps) {
  return (
    <SectionCard
      title="Estado actual"
      description={`Cuenta administradora: ${accountEmail}`}
      actions={
        <StatusBadge
          tone={resolveTwoFactorStatusTone(enabled)}
          label={resolveTwoFactorProtectionLabel(enabled)}
        />
      }
    >
      <div
        className={`rounded-2xl px-4 py-4 text-sm ${
          enabled
            ? 'border border-emerald-300 bg-emerald-50 text-emerald-900'
            : 'border border-amber-300 bg-amber-50 text-amber-900'
        }`}
      >
        {resolveTwoFactorStatusMessage(enabled)}
      </div>

      {!enabled ? (
        <div className="space-y-4">
          <Button type="button" onClick={onGenerateSecret} disabled={submitting}>
            {submitting ? 'Procesando...' : 'Generar secreto 2FA'}
          </Button>

          {hasPendingSetup ? (
            <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div>
                <div className="text-sm font-black text-zinc-900">Configura tu app autenticadora</div>
                <div className="mt-1 text-sm text-zinc-600">
                  Escanea el QR o copia la URL `otpauth://` en tu app TOTP preferida.
                </div>
              </div>

              {qrUrl ? (
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
                    <img
                      src={qrUrl}
                      alt="QR de autenticacion 2FA"
                      className="h-40 w-40 rounded-lg object-contain sm:h-44 sm:w-44"
                    />
                  </div>
                  <div className="text-sm text-zinc-600">
                    Compatible con Google Authenticator, Authy y cualquier app TOTP estandar.
                  </div>
                </div>
              ) : null}

              <TextField
                label="Secreto generado"
                value={resolveTwoFactorSecretValue(status, generatedSecret)}
                readOnly
              />

              {status.otpauthUrl ? (
                <div className="space-y-2">
                  <TextAreaField label="URL otpauth" value={status.otpauthUrl} rows={3} readOnly />
                  <Button type="button" variant="outline" onClick={onCopyOtpUrl}>
                    {copiedOtpUrl ? 'URL copiada' : 'Copiar URL otpauth'}
                  </Button>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <TextField
                  label="Codigo TOTP"
                  value={code}
                  onChange={(event) => onCodeChange(event.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                />
                <div className="sm:self-end">
                  <Button type="button" onClick={onEnable} disabled={submitting || !canSubmitCode}>
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
          <p className="text-sm text-zinc-600">Ingresa un codigo TOTP actual para confirmar la desactivacion.</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <TextField
              label="Codigo TOTP"
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              placeholder="123456"
              inputMode="numeric"
            />
            <div className="sm:self-end">
              <Button type="button" variant="outline" onClick={onDisable} disabled={submitting || !canSubmitCode}>
                Desactivar 2FA
              </Button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
