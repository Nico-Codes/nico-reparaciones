import { useEffect, useMemo, useState } from 'react';
import { whatsappApi, type WhatsappLogItem } from './whatsappApi';
import {
  buildRecentWhatsappLogs,
  buildWhatsappTemplatesSaveInput,
  buildWhatsappTemplatesState,
  createDefaultWhatsappTemplates,
} from './admin-whatsapp.helpers';
import {
  AdminWhatsappActions,
  AdminWhatsappFeedback,
  AdminWhatsappHero,
  AdminWhatsappLogsSection,
  AdminWhatsappTemplatesSection,
  AdminWhatsappVariablesSection,
} from './admin-whatsapp.sections';

export function AdminWhatsappPage() {
  const initialTemplates = useMemo(() => createDefaultWhatsappTemplates(), []);
  const [templates, setTemplates] = useState<Record<string, string>>(initialTemplates);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState<WhatsappLogItem[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await whatsappApi.templates({ channel: 'repairs' });
      setTemplates(buildWhatsappTemplatesState(response.items));
      await loadLogs();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando WhatsApp');
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const response = await whatsappApi.logs({ channel: 'repairs' });
      setLogs(buildRecentWhatsappLogs(response.items));
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  async function saveTemplates() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await whatsappApi.saveTemplates({
        channel: 'repairs',
        items: buildWhatsappTemplatesSaveInput(templates),
      });
      setSuccess('Plantillas guardadas');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error guardando plantillas');
    } finally {
      setSaving(false);
    }
  }

  function patchTemplate(templateKey: string, body: string) {
    setTemplates((current) => ({ ...current, [templateKey]: body }));
  }

  return (
    <div className="store-shell space-y-5">
      <AdminWhatsappHero />
      <AdminWhatsappFeedback error={error} success={success} />
      <AdminWhatsappVariablesSection />
      <AdminWhatsappTemplatesSection
        loading={loading}
        saving={saving}
        templates={templates}
        onChange={patchTemplate}
      />
      <AdminWhatsappActions
        loading={loading}
        saving={saving}
        onReset={() => setTemplates(initialTemplates)}
        onSave={() => void saveTemplates()}
      />
      <AdminWhatsappLogsSection
        logsLoading={logsLoading}
        logs={logs}
        onRefresh={() => void loadLogs()}
      />
    </div>
  );
}
