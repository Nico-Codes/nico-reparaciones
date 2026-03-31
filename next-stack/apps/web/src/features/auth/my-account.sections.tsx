import type { FormEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import type { AccountPasswordDraft, AccountProfileDraft } from './my-account.helpers';

type AccountAlertProps = {
  tone: 'danger' | 'success';
  title: string;
  message: string;
};

type MyAccountHeaderActionsProps = {
  emailVerified: boolean;
};

type MyAccountPageErrorProps = {
  message: string;
};

type MyAccountProfileSectionProps = {
  profile: AccountProfileDraft;
  saving: boolean;
  canSave: boolean;
  error: string;
  notice: string;
  previewToken: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

type MyAccountPasswordSectionProps = {
  passwordDraft: AccountPasswordDraft;
  saving: boolean;
  canSave: boolean;
  error: string;
  notice: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function AccountAlert({ tone, title, message }: AccountAlertProps) {
  if (!message) return null;

  return (
    <div className={`ui-alert ui-alert--${tone} mt-4`}>
      <div>
        <span className="ui-alert__title">{title}</span>
        <div className="ui-alert__text">{message}</div>
      </div>
    </div>
  );
}

export function MyAccountHeaderActions({ emailVerified }: MyAccountHeaderActionsProps) {
  return (
    <>
      <StatusBadge
        tone={emailVerified ? 'success' : 'warning'}
        label={emailVerified ? 'Correo verificado' : 'Correo pendiente'}
      />
      <Button variant="outline" asChild>
        <Link to="/orders">Ver pedidos</Link>
      </Button>
    </>
  );
}

export function MyAccountPageError({ message }: MyAccountPageErrorProps) {
  if (!message) return null;

  return (
    <SectionCard tone="info" className="border-rose-200 bg-rose-50">
      <div className="text-sm font-semibold text-rose-700">{message}</div>
    </SectionCard>
  );
}

export function MyAccountLoadingState() {
  return (
    <SectionCard title="Cargando cuenta" description="Preparando tus datos personales.">
      <LoadingBlock lines={4} />
    </SectionCard>
  );
}

export function MyAccountProfileSection({
  profile,
  saving,
  canSave,
  error,
  notice,
  previewToken,
  onNameChange,
  onEmailChange,
  onSubmit,
}: MyAccountProfileSectionProps) {
  return (
    <SectionCard
      title="Perfil"
      description="Estos datos se usan para identificar tu cuenta y las notificaciones."
      actions={<StatusBadge tone="info" size="sm" label="Cuenta activa" />}
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <TextField
          label="Nombre"
          value={profile.name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Tu nombre"
          autoComplete="name"
          required
        />
        <TextField
          label="Correo electronico"
          type="email"
          value={profile.email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          required
        />
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <Button type="submit" disabled={!canSave}>
            {saving ? 'Guardando perfil...' : 'Guardar perfil'}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/auth/verify-email">Verificar correo</Link>
          </Button>
        </div>
      </form>

      <AccountAlert
        tone="danger"
        title="No pudimos guardar el perfil."
        message={error}
      />
      <AccountAlert
        tone="success"
        title="Perfil actualizado"
        message={notice}
      />

      {previewToken ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <div className="font-bold">Token de vista previa para verificacion (desarrollo)</div>
          <div className="mt-1 break-all">{previewToken}</div>
        </div>
      ) : null}
    </SectionCard>
  );
}

export function MyAccountPasswordSection({
  passwordDraft,
  saving,
  canSave,
  error,
  notice,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: MyAccountPasswordSectionProps) {
  return (
    <SectionCard
      title="Contrasena"
      description="Actualiza tu clave de acceso para mantener la cuenta protegida."
    >
      <form className="grid gap-4 md:grid-cols-3" onSubmit={onSubmit}>
        <TextField
          label="Contrasena actual"
          type="password"
          value={passwordDraft.currentPassword}
          onChange={(event) => onCurrentPasswordChange(event.target.value)}
          placeholder="********"
          autoComplete="current-password"
          required
        />
        <TextField
          label="Nueva contrasena"
          type="password"
          value={passwordDraft.newPassword}
          onChange={(event) => onNewPasswordChange(event.target.value)}
          placeholder="********"
          autoComplete="new-password"
          hint="Usa al menos 8 caracteres."
          required
        />
        <TextField
          label="Confirmar nueva contrasena"
          type="password"
          value={passwordDraft.confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          placeholder="********"
          autoComplete="new-password"
          required
        />
        <div className="md:col-span-3 flex flex-wrap gap-3">
          <Button type="submit" disabled={!canSave}>
            {saving ? 'Actualizando contrasena...' : 'Actualizar contrasena'}
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/repairs">Ver reparaciones</Link>
          </Button>
        </div>
      </form>

      <AccountAlert
        tone="danger"
        title="No pudimos actualizar la contrasena."
        message={error}
      />
      <AccountAlert
        tone="success"
        title="Contrasena actualizada"
        message={notice}
      />
    </SectionCard>
  );
}
