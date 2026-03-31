export type DeviceTypeOpt = { id: string; name: string; slug: string; active: boolean };
export type BrandOpt = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };
export type GroupRow = { id: string; name: string; slug: string; active: boolean };
export type ModelRow = { id: string; name: string; slug: string; active: boolean; deviceModelGroupId: string | null };

export type ModelGroupOption = {
  value: string;
  label: string;
};

export function buildModelGroupDeviceTypeOptions(deviceTypes: DeviceTypeOpt[]): ModelGroupOption[] {
  return [{ value: '', label: 'Elegí...' }, ...deviceTypes.map((type) => ({ value: type.id, label: type.name }))];
}

export function buildModelGroupBrandOptions(brands: BrandOpt[]): ModelGroupOption[] {
  return [{ value: '', label: 'Elegí...' }, ...brands.map((brand) => ({ value: brand.id, label: brand.name }))];
}

export function buildModelGroupOptions(groups: GroupRow[]): ModelGroupOption[] {
  return [{ value: '', label: '- sin grupo -' }, ...groups.map((group) => ({ value: group.id, label: group.name }))];
}

export function patchModelGroup(groups: GroupRow[], id: string, patch: Partial<GroupRow>) {
  return groups.map((group) => (group.id === id ? { ...group, ...patch } : group));
}
