import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from './api';
import { authStorage } from './storage';

export function MyAccountPage() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

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
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await authApi.account();
        if (!mounted) return;
        setName(res.user.name ?? '');
        setEmail(res.user.email ?? '');
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando mi cuenta');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    setProfileNotice('');
    setPreviewToken('');
    try {
      const res = await authApi.updateAccount({ name, email });
      authStorage.setUser(res.user);
      setProfileNotice(
        res.emailVerification?.required
          ? 'Perfil guardado. Tu correo cambio y requiere nueva verificacion.'
          : 'Perfil guardado correctamente.',
      );
      if (res.emailVerification?.previewToken) {
        setPreviewToken(res.emailVerification.previewToken);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando perfil');
    } finally {
      setSavingProfile(false);
    }
  }

  async function onSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    setError('');
    setPasswordNotice('');
    try {
      if (newPassword !== confirmPassword) {
        throw new Error('La confirmacion no coincide con la nueva contrasena');
      }
      const res = await authApi.updateAccountPassword({ currentPassword, newPassword });
      setPasswordNotice(res.message || 'Contrasena actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error actualizando contrasena');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Mi cuenta</h1>
            <p className="mt-1 text-sm text-zinc-600">Actualiza tu perfil y tu contrasena.</p>
          </div>
          <Link to="/orders" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver a pedidos
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}

      {loading ? (
        <section className="card">
          <div className="card-body text-sm text-zinc-600">Cargando datos de la cuenta...</div>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="card-head">
              <div className="text-xl font-black tracking-tight text-zinc-900">Perfil</div>
              <p className="mt-1 text-sm text-zinc-500">Nombre y correo para tu cuenta.</p>
            </div>
            <div className="card-body">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={onSaveProfile}>
                <Field
                  label="Nombre"
                  value={name}
                  onChange={setName}
                  placeholder="Tu nombre"
                  type="text"
                  autoComplete="name"
                />
                <Field
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  placeholder="tu@email.com"
                  type="email"
                  autoComplete="email"
                />
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary !h-11 !rounded-xl px-6 text-sm font-bold"
                  >
                    {savingProfile ? 'Guardando...' : 'Guardar perfil'}
                  </button>
                </div>
              </form>
              {profileNotice ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {profileNotice}
                </div>
              ) : null}
              {previewToken ? (
                <div className="mt-3 break-all rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  <div className="font-bold">Preview token verificacion (dev)</div>
                  {previewToken}
                </div>
              ) : null}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="text-xl font-black tracking-tight text-zinc-900">Contrasena</div>
              <p className="mt-1 text-sm text-zinc-500">Cambia tu contrasena de acceso.</p>
            </div>
            <div className="card-body">
              <form className="grid gap-4 md:grid-cols-3" onSubmit={onSavePassword}>
                <Field
                  label="Contrasena actual"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="********"
                  type="password"
                  autoComplete="current-password"
                />
                <Field
                  label="Nueva contrasena"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="********"
                  type="password"
                  autoComplete="new-password"
                />
                <Field
                  label="Confirmar nueva contrasena"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="********"
                  type="password"
                  autoComplete="new-password"
                />
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="btn-primary !h-11 !rounded-xl px-6 text-sm font-bold"
                  >
                    {savingPassword ? 'Actualizando...' : 'Actualizar contrasena'}
                  </button>
                </div>
              </form>
              {passwordNotice ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {passwordNotice}
                </div>
              ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-zinc-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        required
      />
    </label>
  );
}
