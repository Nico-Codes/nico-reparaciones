import { useEffect, useMemo, useState } from 'react';
import { whatsappApi, type WhatsappLogItem } from './whatsappApi';
import {
  buildOrderWhatsappTemplatesSaveInput,
  buildOrderWhatsappTemplatesState,
  buildRecentOrderWhatsappLogs,
  createDefaultOrderWhatsappTemplates,
} from './admin-whatsapp-orders.helpers';
import {
  AdminWhatsappOrdersActions,
  AdminWhatsappOrdersFeedback,
  AdminWhatsappOrdersHero,
  AdminWhatsappOrdersLogsSection,
  AdminWhatsappOrdersTemplatesSection,
  AdminWhatsappOrdersVariablesSection,
} from './admin-whatsapp-orders.sections';

export function AdminWhatsappOrdersPage() {
  const initialTemplates = useMemo(() => createDefaultOrderWhatsappTemplates(), []);
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
      const response = await whatsappApi.templates({ channel: 'orders' });
      setTemplates(buildOrderWhatsappTemplatesState(response.items));
      await loadLogs();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando plantillas');
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const response = await whatsappApi.logs({ channel: 'orders' });
      setLogs(buildRecentOrderWhatsappLogs(response.items));
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
        channel: 'orders',
        items: buildOrderWhatsappTemplatesSaveInput(templates),
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
      <AdminWhatsappOrdersHero />
      <AdminWhatsappOrdersFeedback error={error} success={success} />
      <AdminWhatsappOrdersVariablesSection />
      <AdminWhatsappOrdersTemplatesSection
        loading={loading}
        saving={saving}
        templates={templates}
        onChange={patchTemplate}
      />
      <AdminWhatsappOrdersActions
        loading={loading}
        saving={saving}
        onReset={() => setTemplates(initialTemplates)}
        onSave={() => void saveTemplates()}
      />
      <AdminWhatsappOrdersLogsSection
        logsLoading={logsLoading}
        logs={logs}
        onRefresh={() => void loadLogs()}
      />
    </div>
  );
}
