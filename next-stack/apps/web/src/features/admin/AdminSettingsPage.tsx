import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { adminSettingsApi, type AdminSettingItem } from './settingsApi';

const GROUP_LABELS: Record<string, string> = {
  business: 'Negocio',
  branding: 'Branding',
  email: 'Correo',
  general: 'General',
};

export function AdminSettingsPage() {
  const [items, setItems] = useState<AdminSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await adminSettingsApi.list();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando configuración');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminSettingItem[]>();
    for (const item of items) {
      const key = item.group || 'general';
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  async function save() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminSettingsApi.save(items.map((i) => ({ key: i.key, value: i.value, group: i.group, label: i.label, type: i.type })));
      setSuccess('Configuración guardada');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando configuración');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin Configuración (Next)</h1>
            <p className="mt-1 text-sm text-zinc-600">Settings key/value editables para negocio, branding y correo.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin">Volver a admin</Link>
            </Button>
            <Button onClick={() => void save()} disabled={saving || loading}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
        {success ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</div> : null}

        {loading ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm">Cargando configuración...</div>
        ) : (
          <div className="mt-4 space-y-4">
            {grouped.map(([group, groupItems]) => (
              <section key={group} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">{GROUP_LABELS[group] || group}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {groupItems.map((item) => (
                    <SettingField
                      key={item.key}
                      item={item}
                      onChange={(value) =>
                        setItems((prev) => prev.map((x) => (x.key === item.key ? { ...x, value } : x)))
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingField({
  item,
  onChange,
}: {
  item: AdminSettingItem;
  onChange: (value: string) => void;
}) {
  const label = item.label || item.key;
  if (item.type === 'textarea') {
    return (
      <label className="block md:col-span-2">
        <span className="mb-1 block text-sm font-bold text-zinc-700">{label}</span>
        <textarea
          rows={3}
          value={item.value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-xs text-zinc-500">{item.key}</span>
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-zinc-700">{label}</span>
      <input
        type={item.type === 'email' ? 'email' : 'text'}
        value={item.value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm"
      />
      <span className="mt-1 block text-xs text-zinc-500">{item.key}</span>
    </label>
  );
}

