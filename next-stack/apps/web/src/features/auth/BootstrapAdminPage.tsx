import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
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
    <AuthLayout title="Bootstrap Admin (dev)" subtitle="Solo para entorno local y desarrollo." eyebrow="Dev" statusLabel="Bootstrap">
      <SectionCard className="auth-card" title="Acceso tecnico" description="Este flujo solo sirve para crear o promover un admin en entorno local.">
        <form className="auth-form" onSubmit={onSubmit}>
          <Field label="Setup Key" value={setupKey} onChange={setSetupKey} />
          <Field label="Nombre" value={name} onChange={setName} />
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Contrasena" type="password" value={password} onChange={setPassword} />
          <Button className="w-full justify-center" disabled={loading}>
            {loading ? 'Creando admin...' : 'Crear / Promover Admin'}
          </Button>
        </form>

        <div className="auth-link-row">
          <span>Volver al acceso normal</span>
          <Link className="auth-inline-link" to="/auth/login">
            Ir a login
          </Link>
        </div>

        {message ? <div className="ui-alert ui-alert--info mt-4">{message}</div> : null}
      </SectionCard>
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
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      <span className="ui-field__control">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ui-input"
          required
        />
      </span>
    </label>
  );
}
