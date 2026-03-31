import type { AuthResponse, AuthUser } from './types';

export type AccountProfileDraft = {
  name: string;
  email: string;
};

export type AccountProfileSnapshot = AccountProfileDraft;

export type AccountPasswordDraft = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function createEmptyAccountProfileDraft(): AccountProfileDraft {
  return { name: '', email: '' };
}

export function createEmptyAccountPasswordDraft(): AccountPasswordDraft {
  return { currentPassword: '', newPassword: '', confirmPassword: '' };
}

export function buildAccountProfileDraft(user?: Pick<AuthUser, 'name' | 'email'> | null): AccountProfileDraft {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
  };
}

export function normalizeAccountProfileDraft(draft: AccountProfileDraft): AccountProfileSnapshot {
  return {
    name: draft.name.trim(),
    email: draft.email.trim().toLowerCase(),
  };
}

export function buildAccountProfileSnapshot(draft: AccountProfileDraft): AccountProfileSnapshot {
  return normalizeAccountProfileDraft(draft);
}

export function normalizeAccountPasswordDraft(draft: AccountPasswordDraft): AccountPasswordDraft {
  return {
    currentPassword: draft.currentPassword.trim(),
    newPassword: draft.newPassword.trim(),
    confirmPassword: draft.confirmPassword.trim(),
  };
}

export function hasAccountProfileChanges(
  draft: AccountProfileDraft,
  initialProfile: AccountProfileSnapshot,
) {
  const normalizedDraft = normalizeAccountProfileDraft(draft);
  return normalizedDraft.name !== initialProfile.name || normalizedDraft.email !== initialProfile.email;
}

export function canSaveAccountProfile(
  draft: AccountProfileDraft,
  initialProfile: AccountProfileSnapshot,
  saving: boolean,
) {
  const normalizedDraft = normalizeAccountProfileDraft(draft);
  return (
    normalizedDraft.name.length > 0 &&
    normalizedDraft.email.length > 0 &&
    hasAccountProfileChanges(draft, initialProfile) &&
    !saving
  );
}

export function canSaveAccountPassword(draft: AccountPasswordDraft, saving: boolean) {
  const normalizedDraft = normalizeAccountPasswordDraft(draft);
  return (
    normalizedDraft.currentPassword.length > 0 &&
    normalizedDraft.newPassword.length >= 8 &&
    normalizedDraft.confirmPassword.length > 0 &&
    !saving
  );
}

export function validateAccountProfile(draft: AccountProfileDraft) {
  const normalizedDraft = normalizeAccountProfileDraft(draft);

  if (!normalizedDraft.name) {
    return 'Ingresa un nombre para guardar el perfil.';
  }

  if (!normalizedDraft.email) {
    return 'Ingresa un correo valido para guardar el perfil.';
  }

  return null;
}

export function validateAccountPassword(draft: AccountPasswordDraft) {
  const normalizedDraft = normalizeAccountPasswordDraft(draft);

  if (!normalizedDraft.currentPassword || !normalizedDraft.newPassword || !normalizedDraft.confirmPassword) {
    return 'Completa los tres campos para actualizar la contrasena.';
  }

  if (normalizedDraft.newPassword.length < 8) {
    return 'La nueva contrasena debe tener al menos 8 caracteres.';
  }

  if (normalizedDraft.newPassword !== normalizedDraft.confirmPassword) {
    return 'La confirmacion no coincide con la nueva contrasena.';
  }

  return null;
}

export function buildAccountProfileNotice(emailVerification?: AuthResponse['emailVerification']) {
  return emailVerification?.required
    ? 'Perfil guardado. El nuevo correo requiere verificacion.'
    : 'Perfil guardado correctamente.';
}
