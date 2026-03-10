import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { repairsApi } from './api';
import { formatDateTime, money, repairCode, repairStatusLabel, repairStatusSummary, repairStatusTone } from './repair-ui';
import type { RepairItem } from './types';

export function MyRepairsPage() {
  const [items, setItems] = useState<RepairItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    repairsApi
      .my()
      .then((res) => {
        if (active) setItems(res.items);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar tus reparaciones.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageShell context="account">
      <PageHeader
        context="account"
        eyebrow="Servicio técnico"
        title="Mis reparaciones"
        subtitle="Seguimiento de equipos, presupuestos y estados del servicio desde tu cuenta."
        actions={
          <Button variant="outline" asChild>
            <Link to="/reparacion">Consulta pública</Link>
          </Button>
        }
      />

      {error ? (
        <SectionCard tone="info" className="border-rose-200 bg-rose-50">
          <div className="text-sm font-semibold text-rose-700">{error}</div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Seguimiento técnico"
        description="Lista de equipos ingresados con su estado actual, última actualización y precio de referencia."
        actions={items.length > 0 ? <StatusBadge tone="info" size="sm" label={`${items.length} casos`} /> : null}
      >
        {loading ? (
          <LoadingBlock lines={5} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-5 w-5" />}
            title="Todavía no tenés reparaciones asociadas"
            description="Cuando ingreses un equipo o quede vinculado a tu cuenta, vas a poder seguir el caso desde acá."
            actions={
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/reparacion">Consultar reparación</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/store">Ir a la tienda</Link>
                </Button>
              </div>
            }
          />
        ) : (
          <div className="account-list">
            {items.map((repair) => {
              const displayPrice = repair.finalPrice ?? repair.quotedPrice;
              const deviceLabel = [repair.deviceBrand, repair.deviceModel].filter(Boolean).join(' ') || 'Equipo sin identificar';
              return (
                <article key={repair.id} className="account-record">
                  <div className="account-record__top">
                    <div className="account-record__heading">
                      <div className="account-record__title-row">
                        <div className="account-record__title">{repairCode(repair.id)}</div>
                        <StatusBadge
                          tone={repairStatusTone(repair.status)}
                          size="sm"
                          label={repairStatusLabel(repair.status)}
                        />
                      </div>
                      <div className="account-record__meta">
                        <span>{deviceLabel}</span>
                        <span>{formatDateTime(repair.updatedAt)}</span>
                      </div>
                      <div className="account-record__description">
                        {repairStatusSummary(repair.status)}
                      </div>
                    </div>

                    <div className="account-record__aside">
                      <span className="account-record__label">Importe de referencia</span>
                      <div className="account-record__value">{money(displayPrice)}</div>
                    </div>
                  </div>

                  <div className="account-record__actions">
                    <div className="account-record__actions-group">
                      <StatusBadge
                        tone={repair.issueLabel ? 'neutral' : 'warning'}
                        size="sm"
                        label={repair.issueLabel || 'Falla pendiente de cargar'}
                      />
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/repairs/${repair.id}`}>Ver detalle</Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
