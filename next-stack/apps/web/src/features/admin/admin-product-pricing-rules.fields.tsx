import { CustomSelect } from '@/components/ui/custom-select';

export function ProductPricingSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-900">{label}</label>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        triggerClassName="min-h-11 rounded-2xl font-bold"
        ariaLabel={label}
      />
    </div>
  );
}

export function ProductPricingInputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-900">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
      />
    </div>
  );
}

export function ProductPricingEditableInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-black text-zinc-700">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
      />
    </div>
  );
}

export function ProductPricingEditableSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-black text-zinc-700">{label}</div>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        triggerClassName="min-h-11 rounded-2xl font-bold"
        ariaLabel={label}
      />
    </div>
  );
}
