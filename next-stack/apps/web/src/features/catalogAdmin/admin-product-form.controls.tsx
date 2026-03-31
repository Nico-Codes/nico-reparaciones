import { CustomSelect } from '@/components/ui/custom-select';
import type { ProductSelectOption } from './admin-product-form.helpers';

export function SelectField({
  label,
  value,
  onChange,
  options,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ProductSelectOption[];
  ariaLabel: string;
}) {
  return (
    <div className="ui-field min-w-0">
      <span className="ui-field__label">{label}</span>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        className="w-full"
        triggerClassName="min-h-11 rounded-[1rem]"
        ariaLabel={ariaLabel}
      />
    </div>
  );
}

export function BooleanChoice({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <label className={`choice-card ${checked ? 'is-active' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <div>
        <div className="choice-card__title">{title}</div>
        <div className="choice-card__hint">{hint}</div>
      </div>
    </label>
  );
}
