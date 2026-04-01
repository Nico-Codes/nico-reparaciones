import { slugifyAdminLabel } from './admin-taxonomy.helpers';

export type RepairTypeRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

export function mapRepairTypeRows(items: { id: string; name: string; slug: string; active: boolean }[]) {
  return items.map((item) => ({ id: item.id, name: item.name, slug: item.slug, active: item.active }));
}

export function buildRepairTypeCreateInput(name: string, active: boolean) {
  const normalizedName = name.trim();
  return { name: normalizedName, slug: slugifyAdminLabel(normalizedName), active };
}

export function buildRepairTypeUpdateInput(row: RepairTypeRow) {
  return {
    name: row.name.trim(),
    slug: row.slug.trim() || slugifyAdminLabel(row.name),
    active: row.active,
  };
}

export function updateRepairTypeRows(rows: RepairTypeRow[], id: string, patch: Partial<RepairTypeRow>) {
  return rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
}
