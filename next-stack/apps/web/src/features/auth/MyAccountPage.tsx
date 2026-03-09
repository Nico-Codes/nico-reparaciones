import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { authApi } from './api';
import { authStorage } from './storage';

export function MyAccountPage() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [previewToken, setPreviewToken] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      setLoading(true);
      setError('');

      try {
        const res = await authApi.account();
        if (!mounted) return;
        setName(res.user.name ?? '');
        setEmail(res.user.email ?? '');
        setEmailVerified(Boolean(res.user.emailVerified));
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos de tu cuenta.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadAccount();

    return () => {
      mounted = false;
    };
  }, []);

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    setProfileNotice('');
    setPreviewToken('');

    try {
      const res = await authApi.updateAccount({ name, email });
      authStorage.setUser(res.user);
      setEmailVerified(Boolean(res.user.emailVerified));
      setProfileNotice(
        res.emailVerification?.required
          ? 'Perfil guardado. El nuevo correo requiere verificación.'
          : 'Perfil guardado correctamente.',
      );
      if (res.emailVerification?.previewToken) {
        setPreviewToken(res.emailVerification.previewToken);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function onSavePassword(event: FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    setError('');
    setPasswordNotice('');

    try {
      if (newPassword !== confirmPassword) {
        throw new Error('La confirmación no coincide con la nueva contraseña.');
      }
      const res = await authApi.updateAccountPassword({ currentPassword, newPassword });
      setPasswordNotice(res.message || 'Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <PageShell context="account">
      <PageHeader
        context="account"
        eyebrow="Mi cuenta"
        title="Perfil y seguridad"
        subtitle="Gestiona tus datos personales y el acceso a tu cuenta."
        actions={
          <>
            <StatusBadge tone={emailVerified ? 'success' : 'warning'} label={emailVerified ? 'Correo verificado' : 'Correo pendiente'} />
            <Button variant="outline" asChild>
              <Link to="/orders">Ver pedidos</Link>
            </Button>
          </>
        }
      />

      {error ? (
        <SectionCard tone="info" className="border-rose-200 bg-rose-50">
          <div className="text-sm font-semibold text-rose-700">{error}</div>
        </SectionCard>
      ) : null}

      {loading ? (
        <SectionCard title="Cargando cuenta" description="Preparando tus datos personales.">
          <LoadingBlock lines={4} />
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Perfil"
            description="Estos datos se usan para identificar tu cuenta y las notificaciones."
            actions={<StatusBadge tone="info" size="sm" label="Cuenta activa" />}
          >
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onSaveProfile}>
              <TextField
                label="Nombre"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                required
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                required
              />
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Guardando perfil...' : 'Guardar perfil'}
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/auth/verify-email">Verificar correo</Link>
                </Button>
              </div>
            </form>

            {profileNotice ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {profileNotice}
              </div>
            ) : null}

            {previewToken ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                <div className="font-bold">Token de vista previa para verificación (desarrollo)</div>
                <div className="mt-1 break-all">{previewToken}</div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Contraseña"
            description="Actualiza tu clave de acceso para mantener la cuenta protegida."
          >
            <form className="grid gap-4 md:grid-cols-3" onSubmit={onSavePassword}>
              <TextField
                label="Contraseña actual"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="********"
                autoComplete="current-password"
                required
              />
              <TextField
                label="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="********"
                autoComplete="new-password"
                required
              />
              <TextField
                label="Confirmar nueva contraseña"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="********"
                autoComplete="new-password"
                required
              />
              <div className="md:col-span-3 flex flex-wrap gap-3">
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? 'Actualizando contraseña...' : 'Actualizar contraseña'}
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/repairs">Ver reparaciones</Link>
                </Button>
              </div>
            </form>

            {passwordNotice ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {passwordNotice}
              </div>
            ) : null}
          </SectionCard>
        </>
      )}
    </PageShell>
  );
}
