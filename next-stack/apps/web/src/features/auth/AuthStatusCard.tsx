import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authApi } from './api';
import { authStorage } from './storage';
import type { AuthUser } from './types';

export function AuthStatusCard() {
  const [user, setUser] = useState<AuthUser | null>(() => authStorage.getUser());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [previewToken, setPreviewToken] = useState<string>('');

  async function refreshSession() {
    setLoading(true);
    setMessage('');
    try {
      const current = await authApi.me();
      setUser(current.user);
      authStorage.setSession(current.user, {
        accessToken: authStorage.getAccessToken() ?? '',
        refreshToken: authStorage.getRefreshToken() ?? '',
        tokenType: 'Bearer',
        expiresIn: 900,
        refreshExpiresAt: new Date().toISOString(),
      });
      setMessage('Sesión verificada con /auth/me');
    } catch {
      try {
        const refreshed = await authApi.refresh();
        authStorage.setSession(refreshed.user, refreshed.tokens);
        setUser(refreshed.user);
        setMessage('Access token renovado con refresh token');
      } catch (error) {
        authStorage.clear();
        setUser(null);
        setMessage((error as { message?: string })?.message ?? 'No hay sesión válida');
      }
    } finally {
      setLoading(false);
    }
  }

  async function requestVerify() {
    setLoading(true);
    setMessage('');
    setPreviewToken('');
    try {
      const res = await authApi.requestVerifyEmail();
      setPreviewToken(res.previewToken ?? '');
      setMessage(`Verificación: ${res.status}`);
    } catch (error) {
      setMessage((error as { message?: string })?.message ?? 'Error solicitando verificación');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-zinc-500">Auth Next</div>
          <div className="text-lg font-black text-zinc-900">Estado de sesión</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refreshSession} disabled={loading}>
            {loading ? 'Validando...' : 'Validar sesión'}
          </Button>
          {user ? (
            <Button variant="outline" onClick={() => { authStorage.clear(); setUser(null); setMessage('Sesión local eliminada'); }}>
              Cerrar sesión local
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm font-bold text-zinc-700">Usuario actual</div>
          {user ? (
            <div className="mt-2 space-y-1 text-sm">
              <div><span className="font-semibold">Nombre:</span> {user.name}</div>
              <div><span className="font-semibold">Email:</span> {user.email}</div>
              <div><span className="font-semibold">Rol:</span> {user.role}</div>
              <div><span className="font-semibold">Verificado:</span> {user.emailVerified ? 'Sí' : 'No'}</div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-zinc-600">Sin sesión local.</div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm font-bold text-zinc-700">Pruebas rápidas</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" asChild><Link to="/auth/login">Login</Link></Button>
            <Button size="sm" variant="outline" asChild><Link to="/auth/register">Registro</Link></Button>
            <Button size="sm" variant="outline" asChild><Link to="/auth/forgot-password">Olvidé contraseña</Link></Button>
            <Button size="sm" variant="outline" asChild><Link to="/auth/verify-email">Verificar email</Link></Button>
            <Button size="sm" variant="outline" asChild><Link to="/auth/bootstrap-admin">Bootstrap admin</Link></Button>
            {user ? <Button size="sm" variant="outline" onClick={requestVerify}>Pedir verificación</Button> : null}
          </div>
          {previewToken ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 break-all">
              <div className="font-bold">Preview token (dev):</div>
              {previewToken}
            </div>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">{message}</div>
      ) : null}
      {user && user.role !== 'ADMIN' ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Tu sesión actual es `USER`. La ruta `/admin` en el frontend Next está protegida y requiere rol `ADMIN`.
        </div>
      ) : null}
    </div>
  );
}
