import { useEffect, useMemo, useState } from 'react';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import {
  buildRepairTypeCreateInput,
  buildRepairTypeUpdateInput,
  mapRepairTypeRows,
  type RepairTypeRow,
  updateRepairTypeRows,
} from './admin-repair-types.helpers';
import { AdminRepairTypesLayout } from './admin-repair-types.sections';

export function AdminRepairTypesPage() {
  const [newName, setNewName] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [rows, setRows] = useState<RepairTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sortedRows = useMemo(() => rows, [rows]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await deviceCatalogApi.issues();
      setRows(mapRepairTypeRows(res.items));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando tipos de reparacion');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createRow() {
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      await deviceCatalogApi.createIssue(buildRepairTypeCreateInput(newName, newActive));
      setNewName('');
      setNewActive(true);
      setSuccess('Tipo creado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el tipo');
    } finally {
      setCreating(false);
    }
  }

  async function saveRow(row: RepairTypeRow) {
    setSavingId(row.id);
    setError('');
    setSuccess('');
    try {
      await deviceCatalogApi.updateIssue(row.id, buildRepairTypeUpdateInput(row));
      setSuccess('Tipo guardado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el tipo');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(id: string) {
    setDeletingId(id);
    setError('');
    setSuccess('');
    try {
      await deviceCatalogApi.deleteIssue(id);
      setSuccess('Tipo eliminado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el tipo');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminRepairTypesLayout
      newName={newName}
      newActive={newActive}
      rows={sortedRows}
      loading={loading}
      creating={creating}
      savingId={savingId}
      deletingId={deletingId}
      error={error}
      success={success}
      onNewNameChange={setNewName}
      onNewActiveChange={setNewActive}
      onCreate={() => void createRow()}
      onRowChange={(id, patch) => setRows((current) => updateRepairTypeRows(current, id, patch))}
      onSave={(row) => void saveRow(row)}
      onDelete={(id) => void deleteRow(id)}
    />
  );
}
