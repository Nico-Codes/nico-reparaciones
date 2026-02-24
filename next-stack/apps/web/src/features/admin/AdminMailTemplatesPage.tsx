import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mailTemplatesApi, type MailTemplateItem } from './mailTemplatesApi';

export function AdminMailTemplatesPage() {
  const [items, setItems] = useState<MailTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await mailTemplatesApi.list();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando plantillas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await mailTemplatesApi.save(items.map((i) => ({ templateKey: i.templateKey, subject: i.subject, body: i.body, enabled: i.enabled })));
      setSuccess('Plantillas guardadas');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando plantillas');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="store-shell">
      <div className="page-head store-hero">
          <div>
            <div className="page-title">Plantillas de correo</div>
            <div className="page-subtitle">Editá asunto y cuerpo de emails del sistema sin tocar código.</div>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/settings" className="btn-outline h-11 justify-center px-4">Volver a Config</Link>
            <button className="btn-primary h-11 justify-center px-4" type="button" onClick={() => void save()} disabled={loading || saving}>
              {saving ? 'Guardando...' : 'Guardar plantillas'}
            </button>
          </div>
      </div>

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
        {success ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</div> : null}

        {loading ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm">Cargando plantillas...</div>
        ) : (
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <section key={item.templateKey} className="card">
                <div className="card-body p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-zinc-900">{item.label}</h2>
                    <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.placeholders.map((p) => (
                        <span key={p} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-bold text-zinc-700">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) =>
                        setItems((prev) => prev.map((x) => (x.templateKey === item.templateKey ? { ...x, enabled: e.target.checked } : x)))
                      }
                    />
                    Habilitada
                  </label>
                </div>

                <div className="mt-4 grid gap-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold text-zinc-700">Asunto</span>
                    <input
                      value={item.subject}
                      onChange={(e) =>
                        setItems((prev) => prev.map((x) => (x.templateKey === item.templateKey ? { ...x, subject: e.target.value } : x)))
                      }
                      className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-bold text-zinc-700">Cuerpo</span>
                    <textarea
                      rows={8}
                      value={item.body}
                      onChange={(e) =>
                        setItems((prev) => prev.map((x) => (x.templateKey === item.templateKey ? { ...x, body: e.target.value } : x)))
                      }
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-mono"
                    />
                  </label>
                </div>
                </div>
              </section>
            ))}
          </div>
        )}
    </div>
  );
}


