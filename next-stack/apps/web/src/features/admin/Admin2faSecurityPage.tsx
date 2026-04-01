import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/ui/page-shell';
import { adminSecurityApi, type AdminTwoFactorStatus } from './adminSecurityApi';
import {
  buildTwoFactorQrUrl,
  hasPendingTwoFactorSetup,
  normalizeTwoFactorCode,
  resolveTwoFactorAccountEmail,
  resolveTwoFactorActionError,
  resolveTwoFactorActionSuccess,
  resolveTwoFactorEnabled,
  resolveTwoFactorGenerateError,
  resolveTwoFactorGenerateSuccess,
  resolveTwoFactorLoadError,
  validateTwoFactorCode,
} from './admin-2fa-security.helpers';
import {
  Admin2faSecurityEmpty,
  Admin2faSecurityFeedback,
  Admin2faSecurityHeader,
  Admin2faSecurityLoading,
  Admin2faSecurityStatusCard,
} from './admin-2fa-security.sections';

export function Admin2faSecurityPage() {
  const [status, setStatus] = useState<AdminTwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [generatedSecret, setGeneratedSecret] = useState('');
  const [copiedOtpUrl, setCopiedOtpUrl] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await adminSecurityApi.twoFactorStatus();
      setStatus(response);
    } catch (cause) {
      setStatus(null);
      setError(resolveTwoFactorLoadError(cause));
    } finally {
      setLoading(false);
    }
  }

  async function generateSecret() {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await adminSecurityApi.twoFactorGenerate();
      setGeneratedSecret(response.secret);
      setMessage(resolveTwoFactorGenerateSuccess());
      await load();
    } catch (cause) {
      setError(resolveTwoFactorGenerateError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  async function enable2fa() {
    const validationError = validateTwoFactorCode(code, 'enable');
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await adminSecurityApi.twoFactorEnable(normalizeTwoFactorCode(code));
      setCode('');
      setGeneratedSecret('');
      setCopiedOtpUrl(false);
      setMessage(resolveTwoFactorActionSuccess('enable'));
      await load();
    } catch (cause) {
      setError(resolveTwoFactorActionError(cause, 'enable'));
    } finally {
      setSubmitting(false);
    }
  }

  async function disable2fa() {
    const validationError = validateTwoFactorCode(code, 'disable');
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await adminSecurityApi.twoFactorDisable(normalizeTwoFactorCode(code));
      setCode('');
      setGeneratedSecret('');
      setCopiedOtpUrl(false);
      setMessage(resolveTwoFactorActionSuccess('disable'));
      await load();
    } catch (cause) {
      setError(resolveTwoFactorActionError(cause, 'disable'));
    } finally {
      setSubmitting(false);
    }
  }

  const enabled = resolveTwoFactorEnabled(status);
  const accountEmail = resolveTwoFactorAccountEmail(status);
  const qrUrl = useMemo(() => buildTwoFactorQrUrl(status?.otpauthUrl ?? null), [status?.otpauthUrl]);
  const canSubmitCode = normalizeTwoFactorCode(code).length >= 6;
  const hasPendingSetup = hasPendingTwoFactorSetup(status, generatedSecret);

  async function copyOtpUrl() {
    if (!status?.otpauthUrl) return;
    try {
      await navigator.clipboard.writeText(status.otpauthUrl);
      setCopiedOtpUrl(true);
      setMessage('URL otpauth copiada al portapapeles.');
      setTimeout(() => setCopiedOtpUrl(false), 1500);
    } catch {
      setError('No pudimos copiar la URL otpauth.');
    }
  }

  return (
    <PageShell context="admin" className="space-y-6" data-admin-2fa-page>
      <Admin2faSecurityHeader enabled={enabled} />
      <Admin2faSecurityFeedback error={error} message={message} />

      {loading ? (
        <Admin2faSecurityLoading />
      ) : !status ? (
        <Admin2faSecurityEmpty onRetry={() => void load()} />
      ) : (
        <Admin2faSecurityStatusCard
          status={status}
          accountEmail={accountEmail}
          enabled={enabled}
          generatedSecret={generatedSecret}
          copiedOtpUrl={copiedOtpUrl}
          qrUrl={qrUrl}
          code={code}
          submitting={submitting}
          canSubmitCode={canSubmitCode}
          hasPendingSetup={hasPendingSetup}
          onCodeChange={(value) => setCode(normalizeTwoFactorCode(value))}
          onGenerateSecret={() => void generateSecret()}
          onEnable={() => void enable2fa()}
          onDisable={() => void disable2fa()}
          onCopyOtpUrl={() => void copyOtpUrl()}
        />
      )}
    </PageShell>
  );
}
