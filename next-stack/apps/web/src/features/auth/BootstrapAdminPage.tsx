import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';
import { authStorage } from './storage';

export function BootstrapAdminPage() {
  const [setupKey, setSetupKey] = useState('nico-dev-admin');
  const [name, setName] = useState('admin');
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('adminadmin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await authApi.bootstrapAdmin({ setupKey, name, email, password });
      authStorage.setSession(res.user, res.tokens);
      setMessage(`Admin listo: ${res.user.email} (${res.user.role})`);
    } catch (error) {
      setMessage((error as { message?: string })?.message ?? 'Error creando admin');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Bootstrap Admin (dev)" subtitle="Solo para entorno local/desarrollo">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Setup Key" value={setupKey} onChange={setSetupKey} />
        <Field label="Nombre" value={name} onChange={setName} />
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} />
        <Button className="w-full" disabled={loading}>{loading ? 'Creando admin...' : 'Crear / Promover Admin'}</Button>
      </form>
      <div className="mt-4 text-sm">
        <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/login">Ir a login</Link>
      </div>
      {message ? <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">{message}</div> : null}
    </AuthLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-zinc-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        required
      />
    </label>
  );
}
