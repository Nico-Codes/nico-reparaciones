import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { AuthLayout } from './AuthLayout';
import { authApi } from './api';
import { authStorage } from './storage';
import { consumeGoogleReturnTo, readGoogleCallbackHash } from './google-auth.helpers';

export function GoogleAuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      const { resultToken, error: hashError } = readGoogleCallbackHash(location.hash);

      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname);
      }

      if (hashError) {
        if (!cancelled) {
          setError(hashError);
          consumeGoogleReturnTo();
        }
        return;
      }

      if (!resultToken) {
        if (!cancelled) {
          setError('No recibimos una respuesta valida desde Google');
          consumeGoogleReturnTo();
        }
        return;
      }

      try {
        const response = await authApi.googleComplete(resultToken);
        authStorage.setSession(response.user, response.tokens);
        const returnTo = consumeGoogleReturnTo('/store');
        if (!cancelled) {
          navigate(returnTo, { replace: true });
        }
      } catch (authError) {
        if (!cancelled) {
          setError((authError as { message?: string })?.message ?? 'No pudimos completar el ingreso con Google');
          consumeGoogleReturnTo();
        }
      }
    }

    void complete();

    return () => {
      cancelled = true;
    };
  }, [location.hash, navigate]);

  return (
    <AuthLayout
      eyebrow="Acceso social"
      title="Ingresando con Google"
      subtitle={
        error
          ? 'No pudimos completar el acceso social. Puedes volver al login y reintentar.'
          : 'Estamos validando tu cuenta y preparando la sesion.'
      }
      statusLabel={error ? 'Error' : 'Validando'}
      headerActions={<StatusBadge tone={error ? 'danger' : 'info'} label={error ? 'Fallido' : 'En curso'} />}
    >
      <SectionCard
        className="auth-card"
        title={error ? 'Acceso no completado' : 'Procesando acceso'}
        description={
          error
            ? 'Google devolvio una respuesta que no pudimos usar para abrir tu cuenta.'
            : 'Este paso valida la respuesta del proveedor y abre tu sesion sin pedir contrasena local.'
        }
      >
        {error ? (
          <div className="space-y-4">
            <div className="ui-alert ui-alert--danger">
              <div>
                <span className="ui-alert__title">No pudimos ingresar con Google.</span>
                <div className="ui-alert__text">{error}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/auth/login">Volver al login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/store">Ir a la tienda</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-zinc-700">
              Estamos verificando tu cuenta con Google y armando la sesion. Este paso deberia tardar solo unos segundos.
            </p>
            <div className="ui-alert ui-alert--success">
              <div>
                <span className="ui-alert__title">Validando acceso</span>
                <div className="ui-alert__text">No cierres esta ventana hasta completar la redireccion.</div>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </AuthLayout>
  );
}
