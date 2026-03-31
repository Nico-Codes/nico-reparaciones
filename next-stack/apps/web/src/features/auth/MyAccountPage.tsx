import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { authApi } from './api';
import {
  buildAccountProfileDraft,
  buildAccountProfileNotice,
  buildAccountProfileSnapshot,
  canSaveAccountPassword,
  canSaveAccountProfile,
  createEmptyAccountPasswordDraft,
  createEmptyAccountProfileDraft,
  hasAccountProfileChanges,
  normalizeAccountPasswordDraft,
  validateAccountPassword,
  validateAccountProfile,
} from './my-account.helpers';
import {
  MyAccountHeaderActions,
  MyAccountLoadingState,
  MyAccountPageError,
  MyAccountPasswordSection,
  MyAccountProfileSection,
} from './my-account.sections';
import { authStorage } from './storage';

export function MyAccountPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(() => createEmptyAccountProfileDraft());
  const [initialProfile, setInitialProfile] = useState(() => createEmptyAccountProfileDraft());
  const [emailVerified, setEmailVerified] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState(() => createEmptyAccountPasswordDraft());

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pageError, setPageError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [previewToken, setPreviewToken] = useState('');

  const profileCanSave = canSaveAccountProfile(profile, initialProfile, savingProfile);
  const passwordCanSave = canSaveAccountPassword(passwordDraft, savingPassword);

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      setLoading(true);
      setPageError('');

      try {
        const res = await authApi.account();
        if (!mounted) return;
        const nextProfile = buildAccountProfileDraft(res.user);
        setProfile(nextProfile);
        setInitialProfile(buildAccountProfileSnapshot(nextProfile));
        setEmailVerified(Boolean(res.user.emailVerified));
      } catch (e) {
        if (!mounted) return;
        setPageError(e instanceof Error ? e.message : 'No se pudieron cargar los datos de tu cuenta.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadAccount();

    return () => {
      mounted = false;
    };
  }, []);

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError('');
    setProfileNotice('');
    setPreviewToken('');

    const profileValidationError = validateAccountProfile(profile);
    if (profileValidationError) {
      setProfileError(profileValidationError);
      return;
    }

    if (!hasAccountProfileChanges(profile, initialProfile)) {
      setProfileNotice('No hay cambios para guardar en el perfil.');
      return;
    }

    setSavingProfile(true);
    try {
      const normalizedProfile = buildAccountProfileSnapshot(profile);
      const res = await authApi.updateAccount(normalizedProfile);
      authStorage.setUser(res.user);

      const nextProfile = buildAccountProfileDraft(res.user);
      setProfile(nextProfile);
      setInitialProfile(buildAccountProfileSnapshot(nextProfile));
      setEmailVerified(Boolean(res.user.emailVerified));
      setProfileNotice(buildAccountProfileNotice(res.emailVerification));

      if (res.emailVerification?.previewToken) {
        setPreviewToken(res.emailVerification.previewToken);
      }
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'No se pudo guardar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function onSavePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError('');
    setPasswordNotice('');

    const passwordValidationError = validateAccountPassword(passwordDraft);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    setSavingPassword(true);
    try {
      const normalizedPassword = normalizeAccountPasswordDraft(passwordDraft);
      const res = await authApi.updateAccountPassword({
        currentPassword: normalizedPassword.currentPassword,
        newPassword: normalizedPassword.newPassword,
      });
      setPasswordNotice(res.message || 'Contrasena actualizada correctamente.');
      setPasswordDraft(createEmptyAccountPasswordDraft());
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : 'No se pudo actualizar la contrasena.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <PageShell context="account" data-my-account-page>
      <PageHeader
        context="account"
        eyebrow="Mi cuenta"
        title="Perfil y seguridad"
        subtitle="Gestiona tus datos personales y el acceso a tu cuenta."
        actions={<MyAccountHeaderActions emailVerified={emailVerified} />}
      />

      <MyAccountPageError message={pageError} />

      {loading ? (
        <MyAccountLoadingState />
      ) : (
        <>
          <MyAccountProfileSection
            profile={profile}
            saving={savingProfile}
            canSave={profileCanSave}
            error={profileError}
            notice={profileNotice}
            previewToken={previewToken}
            onNameChange={(value) => setProfile((current) => ({ ...current, name: value }))}
            onEmailChange={(value) => setProfile((current) => ({ ...current, email: value }))}
            onSubmit={onSaveProfile}
          />

          <MyAccountPasswordSection
            passwordDraft={passwordDraft}
            saving={savingPassword}
            canSave={passwordCanSave}
            error={passwordError}
            notice={passwordNotice}
            onCurrentPasswordChange={(value) =>
              setPasswordDraft((current) => ({ ...current, currentPassword: value }))
            }
            onNewPasswordChange={(value) =>
              setPasswordDraft((current) => ({ ...current, newPassword: value }))
            }
            onConfirmPasswordChange={(value) =>
              setPasswordDraft((current) => ({ ...current, confirmPassword: value }))
            }
            onSubmit={onSavePassword}
          />
        </>
      )}
    </PageShell>
  );
}
