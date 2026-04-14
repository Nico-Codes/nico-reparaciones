export type DeviceTypeItem = { id: string; name: string; slug: string; active: boolean };
export type BrandItem = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };
export type ModelItem = {
  id: string;
  brandId: string;
  deviceModelGroupId?: string | null;
  name: string;
  slug: string;
  active: boolean;
  brand: { id: string; name: string; slug: string };
};
export type IssueItem = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getDefaultDeviceTypeId(deviceTypes: DeviceTypeItem[]) {
  return deviceTypes.find((item) => item.active)?.id || '';
}

export function getActiveBrands(brands: BrandItem[]) {
  return brands.filter((brand) => brand.active);
}

export function getFilteredModels(models: ModelItem[], selectedBrandId: string) {
  return selectedBrandId ? models.filter((model) => model.brandId === selectedBrandId) : [];
}

export function buildDeviceTypeOptions(deviceTypes: DeviceTypeItem[]) {
  return [
    { value: '', label: 'Elegi...' },
    ...deviceTypes.map((type) => ({ value: type.id, label: type.name })),
  ];
}

export function buildBrandOptions(brands: BrandItem[]) {
  return [
    { value: '', label: 'Sin marca activa' },
    ...brands.map((brand) => ({
      value: brand.id,
      label: brand.active ? brand.name : `${brand.name} (inactiva)`,
    })),
  ];
}
