import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';
import { authStorage } from './storage';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

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
    <AuthLayout title="Iniciar sesión" subtitle="Conectado al API NestJS del nuevo stack">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="admin@demo.com" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="********" />
        <Button className="w-full" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</Button>
      </form>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/register">Crear cuenta</Link>
        <Link className="font-semibold text-zinc-700 hover:text-zinc-900" to="/auth/forgot-password">Olvidé mi contraseña</Link>
      </div>
      {result ? <Notice text={result} /> : null}
    </AuthLayout>
  );
}

function Field({ label, type, value, onChange, placeholder }: { label: string; type: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-zinc-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none ring-0 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        required
      />
    </label>
  );
}

function Notice({ text }: { text: string }) {
  return <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">{text}</div>;
}
