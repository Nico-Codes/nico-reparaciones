import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from './api';
import { readRepairCalculationScope, sortRowsByFocusId } from './admin-repair-calculation-context';
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
  const [searchParams] = useSearchParams();
  const initialScope = useMemo(() => readRepairCalculationScope(searchParams), [searchParams]);
  const [deviceTypes, setDeviceTypes] = useState<Array<{ id: string; name: string; slug: string; active: boolean }>>([]);
  const [deviceType, setDeviceType] = useState('');
  const [newName, setNewName] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [rows, setRows] = useState<RepairTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sortedRows = useMemo(() => sortRowsByFocusId(rows, initialScope.deviceIssueTypeId), [rows, initialScope.deviceIssueTypeId]);
  const deviceTypeOptions = useMemo(
    () => [{ value: '', label: 'Elegi...' }, ...deviceTypes.map((item) => ({ value: item.id, label: item.name }))],
    [deviceTypes],
  );

  useEffect(() => {
    let mounted = true;
    async function loadDeviceTypes() {
      try {
        const response = await adminApi.deviceTypes();
        if (!mounted) return;
        const activeTypes = response.items.filter((item) => item.active);
        setDeviceTypes(activeTypes);
        setDeviceType((current) =>
          current ||
          (initialScope.deviceTypeId && activeTypes.some((item) => item.id === initialScope.deviceTypeId)
            ? initialScope.deviceTypeId
            : activeTypes[0]?.id ?? ''),
        );
      } catch (cause) {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'Error cargando tipos de dispositivo');
      }
    }
    void loadDeviceTypes();
    return () => {
      mounted = false;
    };
  }, [initialScope.deviceTypeId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await deviceCatalogApi.issues(deviceType || undefined);
      setRows(mapRepairTypeRows(res.items));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando tipos de reparacion');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!deviceType) {
      setRows([]);
      return;
    }
    void load();
  }, [deviceType]);

  async function createRow() {
    if (!deviceType || !newName.trim()) return;
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      await deviceCatalogApi.createIssue(buildRepairTypeCreateInput(newName, newActive, deviceType));
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
      await deviceCatalogApi.updateIssue(row.id, buildRepairTypeUpdateInput({ ...row, deviceTypeId: deviceType || row.deviceTypeId }));
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
      deviceType={deviceType}
      deviceTypeOptions={deviceTypeOptions}
      newActive={newActive}
      rows={sortedRows}
      loading={loading}
      creating={creating}
      savingId={savingId}
      deletingId={deletingId}
      error={error}
      success={success}
      focusedId={initialScope.deviceIssueTypeId}
      onDeviceTypeChange={setDeviceType}
      onNewNameChange={setNewName}
      onNewActiveChange={setNewActive}
      onCreate={() => void createRow()}
      onRowChange={(id, patch) => setRows((current) => updateRepairTypeRows(current, id, patch))}
      onSave={(row) => void saveRow(row)}
      onDelete={(id) => void deleteRow(id)}
    />
  );
}
