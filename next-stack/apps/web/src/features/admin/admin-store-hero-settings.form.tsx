import type { ReactNode } from 'react';
import type { HeroSettingsFormState } from './admin-store-hero-settings.helpers';

type AdminStoreHeroTextSettingsSectionProps = {
  form: HeroSettingsFormState;
  disabled: boolean;
  saving: boolean;
  onChange: <K extends keyof HeroSettingsFormState>(field: K, value: HeroSettingsFormState[K]) => void;
  onSave: () => void;
};

export function AdminStoreHeroTextSettingsSection({
  form,
  disabled,
  saving,
  onChange,
  onSave,
}: AdminStoreHeroTextSettingsSectionProps) {
  return (
    <section className="card overflow-hidden">
      <div className="card-body !p-0">
        <div className="border-b border-zinc-100 px-4 py-4 md:px-5">
          <h2 className="text-xl font-black tracking-tight text-zinc-900">Textos y degradado</h2>
        </div>

        <div className="space-y-4 px-4 py-4 md:px-5 md:py-5">
          <Field label="Titulo (opcional)">
            <input
              value={form.title}
              onChange={(event) => onChange('title', event.target.value)}
              placeholder="Ej: Novedades de la semana"
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </Field>

          <Field label="Texto (opcional)">
            <textarea
              value={form.text}
              onChange={(event) => onChange('text', event.target.value)}
              rows={4}
              placeholder="Ej: Ingresaron nuevos modulos y accesorios."
              className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-sm"
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Intensidad del degradado (0-100)">
              <input
                type="number"
                min={0}
                max={100}
                value={form.gradientIntensity}
                onChange={(event) => onChange('gradientIntensity', event.target.value)}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              />
            </Field>
            <Field label="Extension del degradado (px)">
              <input
                type="number"
                min={0}
                value={form.gradientExtent}
                onChange={(event) => onChange('gradientExtent', event.target.value)}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              />
            </Field>
          </div>

          <Field
            label="Color manual del degradado (hex)"
            hint="Opcional. Si lo completas, se usa este color para el degradado en todos los dispositivos. Si lo dejas vacio, el color se calcula automaticamente desde la imagen."
          >
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2">
              <input
                type="color"
                value={form.gradientColor}
                onChange={(event) => onChange('gradientColor', event.target.value)}
                className="h-8 w-14 rounded border border-zinc-200 bg-transparent p-0"
              />
              <input
                value={form.gradientColor}
                onChange={(event) => onChange('gradientColor', event.target.value)}
                placeholder="#1052BE"
                className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm"
              />
            </div>
          </Field>

          <label className="flex items-center gap-3 text-sm font-bold text-zinc-800">
            <input
              type="checkbox"
              checked={form.highContrast}
              onChange={(event) => onChange('highContrast', event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-cyan-700"
            />
            Modo contraste alto del degradado
          </label>

          <p className="text-sm text-zinc-500">
            El degradado se superpone sobre el bloque siguiente al hero y no agrega altura extra al layout.
          </p>

          <div>
            <button
              type="button"
              onClick={onSave}
              disabled={disabled}
              className="btn-primary !h-11 !rounded-2xl px-5 text-sm font-bold disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar textos'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-900">{label}</label>
      {children}
      {hint ? <p className="mt-2 text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}
