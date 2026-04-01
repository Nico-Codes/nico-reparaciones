import { slugifyAdminLabel } from './admin-taxonomy.helpers';

export type DeviceTypeRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

export function buildDeviceTypeCreateInput(name: string, active: boolean) {
  return { name: name.trim(), active };
}

export function buildDeviceTypeDisplaySlug(row: DeviceTypeRow) {
  return row.slug || slugifyAdminLabel(row.name) || '-';
}

export function updateDeviceTypeRows(rows: DeviceTypeRow[], id: string, patch: Partial<DeviceTypeRow>) {
  return rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
}

export function buildDeviceTypeUpdateInput(row: DeviceTypeRow) {
  return { name: row.name.trim(), active: row.active };
}
