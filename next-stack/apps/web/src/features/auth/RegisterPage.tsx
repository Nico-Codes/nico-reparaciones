import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
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

  const normalizedName = useMemo(() => name.trim(), [name]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const canSubmit = normalizedName.length > 0 && normalizedEmail.length > 0 && password.trim().length >= 8;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult('');
    setPreviewToken('');

    if (!normalizedName) {
      setResult('Ingresá tu nombre para crear la cuenta.');
      return;
    }

    if (!normalizedEmail) {
      setResult('Ingresá un email válido para continuar.');
      return;
    }

    if (password.trim().length < 8) {
      setResult('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({ name: normalizedName, email: normalizedEmail, password: password.trim() });
      authStorage.setSession(res.user, res.tokens);
      setPreviewToken(res.emailVerification?.previewToken ?? '');
      setResult('Cuenta creada correctamente. Revisá tu correo para verificar la dirección si hace falta.');
    } catch (error) {
      setResult((error as { message?: string })?.message ?? 'No pudimos crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Crear cuenta" subtitle="Registrate para comprar y seguir tus pedidos.">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-wide text-sky-700">Nueva cuenta</div>
        <h2 className="text-lg font-black tracking-tight text-zinc-900">Comencemos</h2>
        <p className="mt-1 text-sm text-zinc-600">Completá tus datos para continuar.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <TextField label="Nombre" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Juan Pérez" required />
        <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" required />
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
          hint="Mínimo 8 caracteres."
          required
        />

        <Button type="submit" className="w-full justify-center" disabled={!canSubmit || loading}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-zinc-600">
        ¿Ya tenés cuenta?{' '}
        <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/auth/login">
          Ingresar
        </Link>
      </div>

      {result ? <Notice text={result} /> : null}
      {previewToken ? (
        <div className="mt-3 break-all rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <div className="font-bold">Token de vista previa para verificación (desarrollo)</div>
          {previewToken}
        </div>
      ) : null}
    </AuthLayout>
  );
}

function Notice({ text }: { text: string }) {
  return <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">{text}</div>;
}
