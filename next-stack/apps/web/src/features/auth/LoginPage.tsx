import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';
import { authStorage } from './storage';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult('');
    try {
      const res = await authApi.login({ email, password });
      authStorage.setSession(res.user, res.tokens);
      setResult(`Login OK (${res.user.role})`);
    } catch (error) {
      setResult((error as { message?: string })?.message ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Ingresar" subtitle="Accede para ver tus pedidos y reparaciones.">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-wide text-sky-700">Cuenta</div>
        <h2 className="text-lg font-black tracking-tight text-zinc-900">Inicia sesión</h2>
        <p className="mt-1 text-sm text-zinc-600">Usa tu email y contraseña.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="********" />

        <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <input type="checkbox" className="h-4 w-4 rounded border-zinc-300" />
          Recordarme
        </label>

        <div className="text-right text-sm">
          <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/forgot-password">
            Olvidé mi contraseña
          </Link>
        </div>

        <button className="btn-primary h-11 w-full justify-center" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-zinc-600">
        No tienes cuenta?{' '}
        <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/register">
          Crear cuenta
        </Link>
      </div>

      {result ? <Notice text={result} /> : null}
    </AuthLayout>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-zinc-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        required
      />
    </label>
  );
}

function Notice({ text }: { text: string }) {
  return <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">{text}</div>;
}
