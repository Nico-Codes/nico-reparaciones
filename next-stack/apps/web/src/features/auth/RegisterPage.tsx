import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';
import { authStorage } from './storage';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [previewToken, setPreviewToken] = useState('');

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
    <AuthLayout title="Crear cuenta" subtitle="Regístrate para comprar y seguir tus pedidos.">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-wide text-sky-700">Nueva cuenta</div>
        <h2 className="text-lg font-black tracking-tight text-zinc-900">Comencemos</h2>
        <p className="mt-1 text-sm text-zinc-600">Completa tus datos para continuar.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Nombre" type="text" value={name} onChange={setName} placeholder="Juan Pérez" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="********" />
        <div className="mt-1 text-xs text-zinc-500">Mínimo 8 caracteres.</div>

        <button className="btn-primary h-11 w-full justify-center" disabled={loading}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-zinc-600">
        Ya tienes cuenta?{' '}
        <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/login">
          Ingresar
        </Link>
      </div>

      {result ? <Notice text={result} /> : null}
      {previewToken ? (
        <div className="mt-3 break-all rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <div className="font-bold">Preview token verificación (dev)</div>
          {previewToken}
        </div>
      ) : null}
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
