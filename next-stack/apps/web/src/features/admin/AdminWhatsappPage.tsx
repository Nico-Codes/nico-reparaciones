import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { whatsappApi, type WhatsappLogItem, type WhatsappTemplateItem } from './whatsappApi';

export function AdminWhatsappPage() {
  const [templates, setTemplates] = useState<WhatsappTemplateItem[]>([]);
  const [logs, setLogs] = useState<WhatsappLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logFilter, setLogFilter] = useState({ q: '', channel: '', status: '' });
  const [logForm, setLogForm] = useState({
    channel: 'general',
    templateKey: '',
    phone: '',
    recipient: '',
    status: 'SENT',
    message: '',
  });

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [t, l] = await Promise.all([
        whatsappApi.templates(),
        whatsappApi.logs({ q: logFilter.q || undefined, channel: logFilter.channel || undefined, status: logFilter.status || undefined }),
      ]);
      setTemplates(t.items);
      setLogs(l.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando WhatsApp');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function reloadLogs() {
    try {
      const l = await whatsappApi.logs({ q: logFilter.q || undefined, channel: logFilter.channel || undefined, status: logFilter.status || undefined });
      setLogs(l.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando logs');
    }
  }

  async function saveTemplates() {
    setSavingTemplates(true);
    setError('');
    setSuccess('');
    try {
      await whatsappApi.saveTemplates(templates.map((t) => ({ templateKey: t.templateKey, body: t.body, enabled: t.enabled })));
      setSuccess('Plantillas de WhatsApp guardadas');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando plantillas');
    } finally {
      setSavingTemplates(false);
    }
  }

  async function createManualLog(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await whatsappApi.createLog({
        channel: logForm.channel || 'general',
        templateKey: logForm.templateKey || null,
        phone: logForm.phone || null,
        recipient: logForm.recipient || null,
        status: logForm.status || 'SENT',
        message: logForm.message || null,
      });
      setLogs((prev) => [res.item, ...prev].slice(0, 200));
      setLogForm((p) => ({ ...p, phone: '', recipient: '', message: '' }));
      setSuccess('Log registrado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error registrando log');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">WhatsApp: Plantillas y Logs (Next)</h1>
            <p className="mt-1 text-sm text-zinc-600">Editá mensajes base y registrá/consultá acciones enviadas.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/admin">Volver a admin</Link></Button>
            <Button onClick={() => void saveTemplates()} disabled={loading || savingTemplates}>
              {savingTemplates ? 'Guardando...' : 'Guardar plantillas'}
            </Button>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
        {success ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</div> : null}

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Plantillas WhatsApp</div>
            {loading ? (
              <div className="mt-3 rounded-xl border border-zinc-200 p-3 text-sm">Cargando...</div>
            ) : (
              <div className="mt-3 space-y-4">
                {templates.map((t) => (
                  <div key={t.templateKey} className="rounded-xl border border-zinc-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-black text-zinc-900">{t.label}</div>
                        <div className="text-xs text-zinc-500">{t.description}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {t.placeholders.map((p) => (
                            <span key={p} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-bold text-zinc-700">{p}</span>
                          ))}
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={t.enabled}
                          onChange={(e) => setTemplates((prev) => prev.map((x) => (x.templateKey === t.templateKey ? { ...x, enabled: e.target.checked } : x)))}
                        />
                        Habilitada
                      </label>
                    </div>
                    <textarea
                      rows={5}
                      value={t.body}
                      onChange={(e) => setTemplates((prev) => prev.map((x) => (x.templateKey === t.templateKey ? { ...x, body: e.target.value } : x)))}
                      className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Registrar log manual</div>
              <form className="mt-3 grid gap-2" onSubmit={(e) => void createManualLog(e)}>
                <div className="grid grid-cols-2 gap-2">
                  <input value={logForm.channel} onChange={(e) => setLogForm((p) => ({ ...p, channel: e.target.value }))} placeholder="channel" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                  <select value={logForm.status} onChange={(e) => setLogForm((p) => ({ ...p, status: e.target.value }))} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm">
                    <option value="SENT">SENT</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FAILED">FAILED</option>
                    <option value="OPENED">OPENED</option>
                  </select>
                </div>
                <select value={logForm.templateKey} onChange={(e) => setLogForm((p) => ({ ...p, templateKey: e.target.value }))} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm">
                  <option value="">Sin plantilla</option>
                  {templates.map((t) => <option key={t.templateKey} value={t.templateKey}>{t.label}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input value={logForm.recipient} onChange={(e) => setLogForm((p) => ({ ...p, recipient: e.target.value }))} placeholder="Destinatario" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                  <input value={logForm.phone} onChange={(e) => setLogForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Teléfono" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                </div>
                <textarea value={logForm.message} onChange={(e) => setLogForm((p) => ({ ...p, message: e.target.value }))} rows={3} placeholder="Mensaje enviado / nota..." className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
                <Button className="w-full">Guardar log</Button>
              </form>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Logs WhatsApp</div>
                <Button variant="outline" onClick={() => void reloadLogs()}>Actualizar logs</Button>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <input value={logFilter.q} onChange={(e) => setLogFilter((p) => ({ ...p, q: e.target.value }))} placeholder="Buscar..." className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                <input value={logFilter.channel} onChange={(e) => setLogFilter((p) => ({ ...p, channel: e.target.value }))} placeholder="Canal" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                <select value={logFilter.status} onChange={(e) => setLogFilter((p) => ({ ...p, status: e.target.value }))} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm">
                  <option value="">Todos</option>
                  <option value="SENT">SENT</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                  <option value="OPENED">OPENED</option>
                </select>
              </div>
              <div className="mt-2">
                <Button variant="outline" onClick={() => void reloadLogs()}>Aplicar filtros</Button>
              </div>

              <div className="mt-3 max-h-[32rem] space-y-2 overflow-auto pr-1">
                {loading ? (
                  <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando...</div>
                ) : logs.length === 0 ? (
                  <div className="rounded-xl border border-zinc-200 p-3 text-sm">Sin logs.</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-zinc-200 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-black text-zinc-900">{log.recipient || log.phone || 'Sin destinatario'}</div>
                          <div className="text-xs text-zinc-500">
                            {(log.templateKey || 'manual')} · {log.channel} · {new Date(log.createdAt).toLocaleString('es-AR')}
                          </div>
                        </div>
                        <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">{log.status}</span>
                      </div>
                      {log.message ? <div className="mt-2 text-sm text-zinc-700 line-clamp-3">{log.message}</div> : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </section>
        </div>
      </div>
    </div>
  );
}

