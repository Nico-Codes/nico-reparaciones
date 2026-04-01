import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { repairStatusLabel, repairStatusSummary, repairStatusTone } from './repair-ui';
import type { PublicRepairLookupItem } from './types';
import { buildPublicRepairLookupFacts } from './public-repair-lookup.helpers';

type PublicRepairLookupFormProps = {
  repairId: string;
  customerPhone: string;
  loading: boolean;
  canSubmit: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onRepairIdChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
};

export function PublicRepairLookupLayout({
  error,
  message,
  item,
  repairId,
  customerPhone,
  loading,
  canSubmit,
  onSubmit,
  onRepairIdChange,
  onCustomerPhoneChange,
  onRetry,
}: {
  error: string | null;
  message: string | null;
  item: PublicRepairLookupItem | null;
  repairId: string;
  customerPhone: string;
  loading: boolean;
  canSubmit: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onRepairIdChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onRetry: () => void;
}) {
  return (
    <PageShell context="store" className="px-4 py-4 md:py-5">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          context="store"
          eyebrow="Servicio tecnico"
          title="Consultar reparacion"
          subtitle="Ingresa el codigo y el telefono que dejaste en el local para seguir el estado del equipo."
          actions={<StatusBadge tone="info" label="Seguimiento publico" />}
        />

        <SectionCard
          title="Busca tu caso"
          description="Normalizamos espacios y guiones del telefono para que no tengas que escribirlo exactamente igual."
          tone="info"
        >
          <div className="ui-alert ui-alert--info mb-4">
            <div>
              <span className="ui-alert__title">Tip rapido</span>
              <div className="ui-alert__text">Podes copiar el codigo desde el comprobante, email o WhatsApp recibido.</div>
            </div>
          </div>

          <PublicRepairLookupForm
            repairId={repairId}
            customerPhone={customerPhone}
            loading={loading}
            canSubmit={canSubmit}
            onSubmit={onSubmit}
            onRepairIdChange={onRepairIdChange}
            onCustomerPhoneChange={onCustomerPhoneChange}
          />
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
            title="No encontramos esa reparacion"
            description={message}
            actions={
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={onRetry}>
                  Reintentar busqueda
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/store">Volver a la tienda</Link>
                </Button>
              </div>
            }
          />
        ) : null}

        {item ? <PublicRepairLookupResult item={item} message={message} /> : null}
      </div>
    </PageShell>
  );
}

function PublicRepairLookupForm({
  repairId,
  customerPhone,
  loading,
  canSubmit,
  onSubmit,
  onRepairIdChange,
  onCustomerPhoneChange,
}: PublicRepairLookupFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Codigo de reparacion"
          value={repairId}
          onChange={(event) => onRepairIdChange(event.target.value)}
          placeholder="Ej: NR-8F2K1"
          hint="Te lo entregamos en el comprobante o mensaje de seguimiento."
          required
        />
        <TextField
          label="Telefono"
          value={customerPhone}
          onChange={(event) => onCustomerPhoneChange(event.target.value)}
          placeholder="Ej: 341 555-0000"
          hint="Debe coincidir con el numero usado al ingresar el equipo."
          required
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading || !canSubmit}>
          <Search className="h-4 w-4" />
          {loading ? 'Buscando...' : 'Buscar reparacion'}
        </Button>
        <Button asChild variant="outline">
          <Link to="/store">Ir a la tienda</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/repairs">Mis reparaciones</Link>
        </Button>
      </div>
    </form>
  );
}

function PublicRepairLookupResult({ item, message }: { item: PublicRepairLookupItem; message: string | null }) {
  const facts = buildPublicRepairLookupFacts(item);
  return (
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
        {facts.map((fact) => (
          <Info key={fact.label} label={fact.label} value={fact.value} />
        ))}
      </div>
    </SectionCard>
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
