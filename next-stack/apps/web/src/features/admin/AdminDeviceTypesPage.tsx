import { useEffect, useState } from 'react';
import { adminApi } from './api';
import { buildDeviceTypeCreateInput, buildDeviceTypeUpdateInput, type DeviceTypeRow, updateDeviceTypeRows } from './admin-device-types.helpers';
import { AdminDeviceTypesLayout } from './admin-device-types.sections';

export function AdminDeviceTypesPage() {
  const [newName, setNewName] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [rows, setRows] = useState<DeviceTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.deviceTypes();
      setRows(res.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando tipos de dispositivo');
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
      await adminApi.createDeviceType(buildDeviceTypeCreateInput(newName, newActive));
      setNewName('');
      setNewActive(true);
      setSuccess('Tipo de dispositivo creado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el tipo de dispositivo');
    } finally {
      setCreating(false);
    }
  }

  async function saveRow(row: DeviceTypeRow) {
    setSavingId(row.id);
    setError('');
    setSuccess('');
    try {
      await adminApi.updateDeviceType(row.id, buildDeviceTypeUpdateInput(row));
      setSuccess('Tipo de dispositivo actualizado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el tipo');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AdminDeviceTypesLayout
      newName={newName}
      newActive={newActive}
      rows={rows}
      loading={loading}
      creating={creating}
      savingId={savingId}
      error={error}
      success={success}
      onNewNameChange={setNewName}
      onNewActiveChange={setNewActive}
      onCreate={() => void createRow()}
      onRowChange={(id, patch) => setRows((current) => updateDeviceTypeRows(current, id, patch))}
      onSave={(row) => void saveRow(row)}
    />
  );
}
