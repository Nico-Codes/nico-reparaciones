import { describe, expect, it } from 'vitest';
import {
  buildAccountProfileDraft,
  buildAccountProfileNotice,
  buildAccountProfileSnapshot,
  canSaveAccountPassword,
  canSaveAccountProfile,
  createEmptyAccountPasswordDraft,
  hasAccountProfileChanges,
  normalizeAccountPasswordDraft,
  validateAccountPassword,
  validateAccountProfile,
} from './my-account.helpers';

describe('my-account.helpers', () => {
  it('builds account drafts and normalized profile snapshots', () => {
    const draft = buildAccountProfileDraft({ name: ' Nico ', email: 'NICO@MAIL.COM ' });

    expect(draft).toEqual({ name: ' Nico ', email: 'NICO@MAIL.COM ' });
    expect(buildAccountProfileSnapshot(draft)).toEqual({ name: 'Nico', email: 'nico@mail.com' });
  });

  it('detects profile changes and save availability from normalized values', () => {
    const initialProfile = { name: 'Nico', email: 'nico@mail.com' };

    expect(hasAccountProfileChanges({ name: ' Nico ', email: 'NICO@MAIL.COM ' }, initialProfile)).toBe(false);
    expect(canSaveAccountProfile({ name: ' Nico ', email: 'NICO@MAIL.COM ' }, initialProfile, false)).toBe(false);
    expect(canSaveAccountProfile({ name: ' Nico B ', email: 'NICO@MAIL.COM ' }, initialProfile, false)).toBe(true);
    expect(canSaveAccountProfile({ name: ' Nico B ', email: 'NICO@MAIL.COM ' }, initialProfile, true)).toBe(false);
  });

  it('validates profile inputs and returns a save notice', () => {
    expect(validateAccountProfile({ name: '   ', email: 'nico@mail.com' })).toBe(
      'Ingresa un nombre para guardar el perfil.',
    );
    expect(validateAccountProfile({ name: 'Nico', email: '   ' })).toBe(
      'Ingresa un correo valido para guardar el perfil.',
    );
    expect(validateAccountProfile({ name: 'Nico', email: 'nico@mail.com' })).toBeNull();
    expect(buildAccountProfileNotice()).toBe('Perfil guardado correctamente.');
    expect(buildAccountProfileNotice({ required: true, status: 'PENDING' })).toBe(
      'Perfil guardado. El nuevo correo requiere verificacion.',
    );
  });

  it('normalizes password drafts and validates the password flow', () => {
    expect(createEmptyAccountPasswordDraft()).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    expect(
      normalizeAccountPasswordDraft({
        currentPassword: ' actual ',
        newPassword: ' nueva123 ',
        confirmPassword: ' nueva123 ',
      }),
    ).toEqual({
      currentPassword: 'actual',
      newPassword: 'nueva123',
      confirmPassword: 'nueva123',
    });

    expect(
      validateAccountPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }),
    ).toBe('Completa los tres campos para actualizar la contrasena.');

    expect(
      validateAccountPassword({
        currentPassword: 'actual',
        newPassword: 'corta',
        confirmPassword: 'corta',
      }),
    ).toBe('La nueva contrasena debe tener al menos 8 caracteres.');

    expect(
      validateAccountPassword({
        currentPassword: 'actual',
        newPassword: 'nueva123',
        confirmPassword: 'distinta',
      }),
    ).toBe('La confirmacion no coincide con la nueva contrasena.');

    expect(
      validateAccountPassword({
        currentPassword: 'actual',
        newPassword: 'nueva123',
        confirmPassword: 'nueva123',
      }),
    ).toBeNull();

    expect(
      canSaveAccountPassword(
        {
          currentPassword: ' actual ',
          newPassword: ' nueva123 ',
          confirmPassword: ' nueva123 ',
        },
        false,
      ),
    ).toBe(true);

    expect(
      canSaveAccountPassword(
        {
          currentPassword: ' actual ',
          newPassword: ' nueva123 ',
          confirmPassword: ' nueva123 ',
        },
        true,
      ),
    ).toBe(false);
  });
});
