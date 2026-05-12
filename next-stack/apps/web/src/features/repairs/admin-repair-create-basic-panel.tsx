import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { CustomSelect } from '@/components/ui/custom-select';
import { TextField } from '@/components/ui/text-field';
import type {
  AdminRepairCreateFormErrors,
  AdminRepairCreateFormValues,
} from './admin-repair-create.helpers';

export type AdminRepairCreateBasicSectionProps = {
  loadingTypes: boolean;
  loadingBrands: boolean;
  loadingModels: boolean;
  submitting: boolean;
  deviceTypeOptions: Array<{ value: string; label: string }>;
  brandOptions: Array<{ value: string; label: string }>;
  modelOptions: Array<{ value: string; label: string }>;
  values: AdminRepairCreateFormValues;
  fieldErrors: AdminRepairCreateFormErrors;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onDeviceTypeIdChange: (value: string) => void;
  onDeviceBrandIdChange: (value: string) => void;
  onDeviceModelIdChange: (value: string) => void;
};

export function AdminRepairCreateBasicPanel({
  loadingTypes,
  loadingBrands,
  loadingModels,
  submitting,
  deviceTypeOptions,
  brandOptions,
  modelOptions,
  values,
  fieldErrors,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onDeviceTypeIdChange,
  onDeviceBrandIdChange,
  onDeviceModelIdChange,
}: AdminRepairCreateBasicSectionProps) {
  return (
    <SectionCard
      title="Datos basicos"
      description="Carga lo minimo para abrir rapido el caso: cliente y equipo exacto."
      actions={<StatusBadge label="Paso 1" tone="neutral" size="sm" />}
      className="repair-create-card"
      bodyClassName="space-y-5"
      data-admin-repair-create-basic
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <TextField
          label="Nombre del cliente *"
          value={values.customerName}
          onChange={(event) => onCustomerNameChange(event.target.value)}
          placeholder="Ej: Nicolas Perez"
          autoComplete="name"
          error={fieldErrors.customerName}
          maxLength={190}
          disabled={submitting}
        />
        <TextField
          label="Telefono"
          value={values.customerPhone}
          onChange={(event) => onCustomerPhoneChange(event.target.value)}
          placeholder="Ej: 11 5555-1234"
          autoComplete="tel"
          inputMode="tel"
          error={fieldErrors.customerPhone}
          hint="Opcional. Si lo cargas, validamos un minimo de 6 digitos."
          maxLength={60}
          disabled={submitting}
        />
        <div className="ui-field">
          <span className="ui-field__label">Tipo de equipo</span>
          <CustomSelect
            value={values.deviceTypeId}
            onChange={onDeviceTypeIdChange}
            options={deviceTypeOptions}
            disabled={loadingTypes || submitting}
            className="w-full"
            triggerClassName="min-h-11 rounded-[1rem]"
            ariaLabel="Seleccionar tipo de equipo"
          />
          <span className="ui-field__hint">Define que marcas y fallas se muestran en el formulario.</span>
        </div>
        <div className="ui-field">
          <span className="ui-field__label">Marca exacta del catalogo</span>
          <CustomSelect
            value={values.deviceBrandId}
            onChange={onDeviceBrandIdChange}
            options={brandOptions}
            disabled={loadingBrands || submitting}
            className="w-full"
            triggerClassName="min-h-11 rounded-[1rem]"
            ariaLabel="Seleccionar marca exacta del catalogo"
          />
          <span className="ui-field__hint">Ayuda al calculo y a la busqueda automatica de repuestos.</span>
        </div>
        <div className="ui-field">
          <span className="ui-field__label">Modelo exacto del catalogo</span>
          <CustomSelect
            value={values.deviceModelId}
            onChange={onDeviceModelIdChange}
            options={modelOptions}
            disabled={loadingModels || !values.deviceBrandId || submitting}
            className="w-full"
            triggerClassName="min-h-11 rounded-[1rem]"
            ariaLabel="Seleccionar modelo exacto del catalogo"
          />
          <span className="ui-field__hint">Se habilita cuando elegis una marca exacta y mejora la precision del calculo.</span>
        </div>
      </div>
    </SectionCard>
  );
}
