import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminSecurityApi, type AdminTwoFactorStatus } from './adminSecurityApi';

export function Admin2faSecurityPage() {
  const [status, setStatus] = useState<AdminTwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [generatedSecret, setGeneratedSecret] = useState('');
  const [copiedOtpUrl, setCopiedOtpUrl] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await adminSecurityApi.twoFactorStatus();
      setStatus(res);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Error cargando 2FA');
    } finally {
      setLoading(false);
    }
  }

  async function generateSecret() {
    setSubmitting(true);
    setResult('');
    try {
      const res = await adminSecurityApi.twoFactorGenerate();
      setGeneratedSecret(res.secret);
      setResult('Secreto 2FA generado. Configúralo en tu app TOTP y valida con un código.');
      await load();
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Error generando 2FA');
    } finally {
      setSubmitting(false);
    }
  }

  async function enable2fa() {
    setSubmitting(true);
    setResult('');
    try {
      await adminSecurityApi.twoFactorEnable(code);
      setCode('');
      setGeneratedSecret('');
      setCopiedOtpUrl(false);
      setResult('2FA activado correctamente');
      await load();
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Error activando 2FA');
    } finally {
      setSubmitting(false);
    }
  }

  async function disable2fa() {
    setSubmitting(true);
    setResult('');
    try {
      await adminSecurityApi.twoFactorDisable(code);
      setCode('');
      setGeneratedSecret('');
      setCopiedOtpUrl(false);
      setResult('2FA desactivado');
      await load();
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Error desactivando 2FA');
    } finally {
      setSubmitting(false);
    }
  }

  const enabled = status?.enabled ?? false;
  const accountEmail = status?.accountEmail ?? 'admin@admin.com';
  const qrUrl = status?.otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(status.otpauthUrl)}`
    : null;

  async function copyOtpUrl() {
    if (!status?.otpauthUrl) return;
    try {
      await navigator.clipboard.writeText(status.otpauthUrl);
      setCopiedOtpUrl(true);
      setTimeout(() => setCopiedOtpUrl(false), 1500);
    } catch {
      setResult('No se pudo copiar la URL otpauth');
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Seguridad 2FA (Admin)</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Activa verificación TOTP para reforzar el acceso al panel admin.
            </p>
          </div>
          <Link to="/admin/configuraciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver a configuración
          </Link>
        </div>
      </section>

      {result ? <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800">{result}</div> : null}

      <section className="card overflow-hidden">
        <div className="card-body !p-0">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-4 md:px-5">
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-900">Estado actual</h2>
              <p className="mt-1 text-sm text-zinc-500">Cuenta: {accountEmail}</p>
            </div>
            <span className="inline-flex h-7 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-black text-zinc-800">
              {enabled ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div className="space-y-4 px-4 py-4 md:px-5 md:py-5">
            <div className={`rounded-2xl px-4 py-4 text-sm ${enabled ? 'border border-emerald-300 bg-emerald-50 text-emerald-900' : 'border border-amber-300 bg-amber-50 text-amber-900'}`}>
              {enabled
                ? 'Tu panel admin tiene 2FA activo. Se pedirá código TOTP al iniciar sesión.'
                : 'Tu panel admin aún no tiene doble factor. Actívalo para bloquear accesos aunque filtren tu contraseña.'}
            </div>

            {!enabled ? (
              <>
                <button
                  type="button"
                  onClick={() => void generateSecret()}
                  disabled={loading || submitting}
                  className="btn-primary !h-11 w-full !rounded-2xl text-sm font-bold"
                >
                  {submitting ? 'Procesando...' : 'Generar secreto 2FA'}
                </button>

                {(status?.hasPendingSecret || generatedSecret) ? (
                  <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div>
                      <div className="text-sm font-black text-zinc-900">Configura tu app autenticadora</div>
                      <div className="mt-1 text-sm text-zinc-600">Copia el secreto o usa la URL `otpauth://`.</div>
                    </div>
                    {qrUrl ? (
                      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                        <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
                          <img
                            src={qrUrl}
                            alt="QR 2FA"
                            className="h-40 w-40 rounded-lg object-contain sm:h-44 sm:w-44"
                          />
                        </div>
                        <div className="text-sm text-zinc-600">
                          Escanea este QR con Google Authenticator, Authy u otra app TOTP compatible.
                        </div>
                      </div>
                    ) : null}
                    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900">
                      {generatedSecret || status?.pendingSecretMasked || '(secreto oculto)'}
                    </div>
                    {status?.otpauthUrl ? (
                      <div className="space-y-2">
                        <textarea
                          readOnly
                          value={status.otpauthUrl}
                          rows={3}
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={() => void copyOtpUrl()}
                          className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold"
                        >
                          {copiedOtpUrl ? 'URL copiada' : 'Copiar URL otpauth'}
                        </button>
                      </div>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Código de 6 dígitos"
                        className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
                      />
                      <button type="button" onClick={() => void enable2fa()} disabled={submitting || code.trim().length < 6} className="btn-primary !h-11 !rounded-2xl px-4 text-sm font-bold">
                        Activar 2FA
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-black text-zinc-900">Desactivar 2FA</div>
                <p className="text-sm text-zinc-600">Ingresa un código TOTP actual para confirmar la desactivación.</p>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Código de 6 dígitos"
                    className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
                  />
                  <button type="button" onClick={() => void disable2fa()} disabled={submitting || code.trim().length < 6} className="btn-outline !h-11 !rounded-2xl px-4 text-sm font-bold">
                    Desactivar 2FA
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
