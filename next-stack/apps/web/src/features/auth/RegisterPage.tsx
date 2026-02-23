import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';
import { authStorage } from './storage';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [previewToken, setPreviewToken] = useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult('');
    setPreviewToken('');
    try {
      const res = await authApi.register({ name, email, password });
      authStorage.setSession(res.user, res.tokens);
      setPreviewToken(res.emailVerification?.previewToken ?? '');
      setResult(`Registro OK. Usuario creado (${res.user.role}).`);
    } catch (error) {
      setResult((error as { message?: string })?.message ?? 'Error al registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Crear cuenta" subtitle="Registro contra el API nuevo (NestJS)">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Nombre" type="text" value={name} onChange={setName} placeholder="Nicolás" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="nico@mail.com" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Min 8 caracteres" />
        <Button className="w-full" disabled={loading}>{loading ? 'Creando...' : 'Crear cuenta'}</Button>
      </form>
      <div className="mt-4 text-sm">
        <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/login">Ya tengo cuenta</Link>
      </div>
      {result ? <Notice text={result} /> : null}
      {previewToken ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 break-all">
          <div className="font-bold">Preview token verificación (dev)</div>
          {previewToken}
        </div>
      ) : null}
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
        className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        required
      />
    </label>
  );
}

function Notice({ text }: { text: string }) {
  return <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">{text}</div>;
}
