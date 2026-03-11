import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { repairsApi } from './api';
import { formatDateTime, money, repairStatusLabel, repairStatusSummary, repairStatusTone } from './repair-ui';
import type { PublicRepairLookupItem } from './types';

export function PublicRepairLookupPage() {
  const [repairId, setRepairId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [item, setItem] = useState<PublicRepairLookupItem | null>(null);

  const normalizedRepairId = useMemo(() => repairId.trim(), [repairId]);
  const normalizedCustomerPhone = useMemo(() => customerPhone.trim(), [customerPhone]);
  const canSubmit = normalizedRepairId.length > 0 && normalizedCustomerPhone.length > 0;

  async function lookupRepair() {
    if (!canSubmit) {
      setError('Ingresá el código y el teléfono con el que registraste la reparación.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    setItem(null);
    try {
      const response = await repairsApi.publicLookup({
        repairId: normalizedRepairId,
        customerPhone: normalizedCustomerPhone,
      });

      if (!response.found || !response.item) {
        setMessage(response.message ?? 'No encontramos una reparación con esos datos.');
        return;
      }

      setItem(response.item);
      if (response.message) setMessage(response.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos consultar la reparación.');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await lookupRepair();
  }

  return (
    <PageShell context="store" className="px-4 py-4 md:py-5">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          context="store"
          eyebrow="Servicio técnico"
          title="Consultar reparación"
          subtitle="Ingresá el código y el teléfono que dejaste en el local para seguir el estado del equipo."
          actions={<StatusBadge tone="info" label="Seguimiento público" />}
        />

        <SectionCard
          title="Buscá tu caso"
          description="Normalizamos espacios y guiones del teléfono para que no tengas que escribirlo exactamente igual."
          tone="info"
        >
          <div className="ui-alert ui-alert--info mb-4">
            <div>
              <span className="ui-alert__title">Tip rápido</span>
              <div className="ui-alert__text">Podés copiar el código desde el comprobante, email o WhatsApp recibido.</div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Código de reparación"
                value={repairId}
                onChange={(event) => setRepairId(event.target.value)}
                placeholder="Ej: NR-8F2K1"
                hint="Te lo entregamos en el comprobante o mensaje de seguimiento."
                required
              />
              <TextField
                label="Teléfono"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Ej: 341 555-0000"
                hint="Debe coincidir con el número usado al ingresar el equipo."
                required
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading || !canSubmit}>
                <Search className="h-4 w-4" />
                {loading ? 'Buscando...' : 'Buscar reparación'}
              </Button>
              <Button asChild variant="outline">
                <Link to="/store">Ir a la tienda</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/repairs">Mis reparaciones</Link>
              </Button>
            </div>
          </form>
        </SectionCard>

        {error ? (
          <div className="ui-alert ui-alert--danger">
            <div>
              <span className="ui-alert__title">No pudimos completar la consulta.</span>
              <div className="ui-alert__text">{error}</div>
            </div>
          </div>
        ) : null}

        {!error && message && !item ? (
          <EmptyState
            title="No encontramos esa reparación"
            description={message}
            actions={
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => void lookupRepair()}>
                  Reintentar búsqueda
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/store">Volver a la tienda</Link>
                </Button>
              </div>
            }
          />
        ) : null}

        {item ? (
          <SectionCard
            title={`Seguimiento ${item.id}`}
            description={repairStatusSummary(item.status)}
            actions={<StatusBadge tone={repairStatusTone(item.status)} label={repairStatusLabel(item.status)} />}
          >
            {message ? (
              <div className="ui-alert ui-alert--success mb-4">
                <div>
                  <span className="ui-alert__title">Consulta actualizada</span>
                  <div className="ui-alert__text">{message}</div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Cliente" value={item.customerName} />
              <Info label="Teléfono" value={item.customerPhoneMasked ?? 'No informado'} />
              <Info label="Equipo" value={[item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || 'No informado'} />
              <Info label="Falla reportada" value={item.issueLabel ?? 'No informada'} />
              <Info label="Presupuesto" value={money(item.quotedPrice)} />
              <Info label="Total final" value={money(item.finalPrice)} />
              <Info label="Creada" value={formatDateTime(item.createdAt)} />
              <Info label="Última actualización" value={formatDateTime(item.updatedAt)} />
            </div>
          </SectionCard>
        ) : null}
      </div>
    </PageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-800">{value}</div>
    </div>
  );
}
