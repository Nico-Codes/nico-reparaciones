import { slugifyAdminLabel } from './admin-taxonomy.helpers';

export type RepairTypeRow = {
  id: string;
  deviceTypeId?: string | null;
  name: string;
  slug: string;
  active: boolean;
};

export function mapRepairTypeRows(items: { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }[]) {
  return items.map((item) => ({
    id: item.id,
    deviceTypeId: item.deviceTypeId ?? null,
    name: item.name,
    slug: item.slug,
    active: item.active,
  }));
}

export function buildRepairTypeCreateInput(name: string, active: boolean, deviceTypeId: string) {
  const normalizedName = name.trim();
  return { deviceTypeId: deviceTypeId || null, name: normalizedName, slug: slugifyAdminLabel(normalizedName), active };
}

export function buildRepairTypeUpdateInput(row: RepairTypeRow) {
  return {
    deviceTypeId: row.deviceTypeId ?? null,
    name: row.name.trim(),
    slug: row.slug.trim() || slugifyAdminLabel(row.name),
    active: row.active,
  };
}

export function updateRepairTypeRows(rows: RepairTypeRow[], id: string, patch: Partial<RepairTypeRow>) {
  return rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
}
