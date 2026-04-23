import {
  AlertTriangle,
  Banknote,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import type { AuthUser } from '@/features/auth/types';
import type { CartQuoteLine, CartQuoteResponse } from '@/features/cart/types';
import {
  buildCheckoutEmptyState,
  emailVerificationTone,
  formatCheckoutMoney,
} from './checkout.helpers';
import type {
  CheckoutPaymentMethodConfig,
} from './types';

type CheckoutLoadingStateProps = {
  message: string;
};

type CheckoutEmptyStateProps = {
  hasCartItems: boolean;
  hasInvalidItems: boolean;
  message: string;
};

type CheckoutFeedbackProps = {
  message: string;
};

type CheckoutPaymentSectionProps = {
  paymentMethod: string;
  paymentOptions: CheckoutPaymentMethodConfig[];
  submitting: boolean;
  onChange: (paymentMethod: string) => void;
};

type CheckoutAccountSectionProps = {
  user: AuthUser | null;
};

type CheckoutActionsProps = {
  canConfirm: boolean;
  submitting: boolean;
  onConfirm: () => void;
};

type CheckoutSummarySectionProps = {
  quote: CartQuoteResponse | null;
  items: CartQuoteLine[];
  paymentTitle: string;
  paymentSubtitle: string;
};

function CheckoutPaymentIcon({ option }: { option: CheckoutPaymentMethodConfig }) {
  const FallbackIcon = option.value === 'efectivo' ? Banknote : Landmark;

  if (option.iconUrl) {
    return (
      <img
        className="checkout-option__icon"
        src={option.iconUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
    );
  }

  return <FallbackIcon className="h-5 w-5" aria-hidden="true" />;
}

export function CheckoutLoadingState({ message }: CheckoutLoadingStateProps) {
  return (
    <PageShell context="store" className="space-y-6">
      <PageHeader
        context="store"
        eyebrow="Compra"
        title="Preparando checkout"
        subtitle="Estamos validando stock y resumen antes de mostrar la confirmacion."
        actions={<StatusBadge label="Preparando" tone="info" />}
      />
      <SectionCard>
        <LoadingBlock label={message} lines={4} />
      </SectionCard>
    </PageShell>
  );
}

export function CheckoutEmptyState({
  hasCartItems,
  hasInvalidItems,
  message,
}: CheckoutEmptyStateProps) {
  const emptyState = buildCheckoutEmptyState(hasCartItems);

  return (
    <PageShell context="store" className="space-y-6">
      <PageHeader
        context="store"
        eyebrow="Compra"
        title="Checkout"
        subtitle={emptyState.subtitle}
      />

      {message ? (
        <div className="ui-alert ui-alert--danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No pudimos preparar el checkout.</span>
            <div className="ui-alert__text">{message}</div>
          </div>
        </div>
      ) : null}

      {hasInvalidItems ? (
        <div className="ui-alert ui-alert--warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Hay productos con cambios de stock o cantidad.</span>
            <div className="ui-alert__text">
              Revisa el carrito antes de continuar para evitar un pedido incompleto.
            </div>
          </div>
        </div>
      ) : null}

      <SectionCard>
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
          actions={
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/cart">Revisar carrito</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/store">Ir a la tienda</Link>
              </Button>
            </div>
          }
        />
      </SectionCard>
    </PageShell>
  );
}

export function CheckoutFeedback({ message }: CheckoutFeedbackProps) {
  if (!message) return null;

  return (
    <div className="ui-alert ui-alert--danger">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        <span className="ui-alert__title">No pudimos confirmar el pedido.</span>
        <div className="ui-alert__text">{message}</div>
      </div>
    </div>
  );
}

export function CheckoutPaymentSection({
  paymentMethod,
  paymentOptions,
  submitting,
  onChange,
}: CheckoutPaymentSectionProps) {
  const showTransferHint = paymentMethod === 'transferencia';

  return (
    <SectionCard
      title="Pago"
      description="Elige como quieres completar la compra. El retiro siempre es en el local."
    >
      <div className="checkout-option-grid">
        {paymentOptions.map((option) => {
          const active = paymentMethod === option.value;
          return (
            <label
              key={option.value}
              className="checkout-option-wrapper cursor-pointer"
            >
              <input
                className="sr-only peer"
                type="radio"
                name="payment_method"
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                disabled={submitting}
              />
              <div className={`checkout-option ${active ? 'is-active' : ''}`}>
                <div className="checkout-option__header">
                  <span className="checkout-option__icon-shell">
                    <CheckoutPaymentIcon option={option} />
                  </span>
                  <div className="checkout-option__content">
                    <div className="checkout-option__title">{option.title}</div>
                    <div className="checkout-option__subtitle">{option.subtitle}</div>
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {showTransferHint ? (
        <div className="ui-alert ui-alert--info mt-4">
          <Landmark className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Transferencia: datos y comprobante despues de confirmar</span>
            <div className="ui-alert__text">
              El pedido se registra primero. En el detalle de tu compra veras los datos bancarios y podras cargar o enviar el comprobante por WhatsApp.
            </div>
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

export function CheckoutAccountSection({ user }: CheckoutAccountSectionProps) {
  return (
    <SectionCard
      tone="muted"
      title="Cuenta"
      description="Estos datos se usan para asociar el pedido y enviarte actualizaciones."
      actions={(
        <StatusBadge
          label={user?.emailVerified ? 'Email verificado' : 'Email pendiente'}
          tone={emailVerificationTone(user?.emailVerified)}
        />
      )}
    >
      <div className="meta-grid">
        <div className="meta-tile">
          <div className="meta-tile__label">Nombre</div>
          <div className="meta-tile__value">{user?.name ?? 'Sin cuenta cargada'}</div>
        </div>
        <div className="meta-tile">
          <div className="meta-tile__label">Email</div>
          <div className="meta-tile__value">{user?.email ?? 'Sin email'}</div>
        </div>
      </div>
      <div className="mt-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth/login">Cambiar cuenta</Link>
        </Button>
      </div>
    </SectionCard>
  );
}

export function CheckoutActions({ canConfirm, submitting, onConfirm }: CheckoutActionsProps) {
  return (
    <div className="grid gap-2 sm:flex sm:flex-row">
      <Button
        type="button"
        className="w-full sm:w-auto"
        onClick={onConfirm}
        disabled={!canConfirm}
      >
        <ShieldCheck className="h-4 w-4" />
        {submitting ? 'Procesando...' : 'Confirmar pedido'}
      </Button>
      <Button asChild variant="outline" className="w-full justify-center sm:w-auto">
        <Link to="/cart">Volver al carrito</Link>
      </Button>
    </div>
  );
}

export function CheckoutSummarySection({
  quote,
  items,
  paymentTitle,
  paymentSubtitle,
}: CheckoutSummarySectionProps) {
  const hasSpecialOrderLines = items.some((line) => line.fulfillmentMode === 'SPECIAL_ORDER');

  return (
    <SectionCard
      className="commerce-sticky"
      title="Resumen del pedido"
      description="Control final de productos, metodo de pago y total estimado."
    >
      <div className="summary-box">
        <div className="summary-box__label">Pago seleccionado</div>
        <div className="summary-box__value">{paymentTitle}</div>
        <div className="summary-box__hint">{paymentSubtitle}</div>
      </div>

      <div className="mt-4 line-list">
        {items.map((line) => (
          <div key={line.productId} className="line-item">
            <div className="line-item__main">
              <div className="flex flex-wrap items-center gap-2">
                <div className="line-item__title">{line.name}</div>
                {line.fulfillmentMode === 'SPECIAL_ORDER' ? (
                  <StatusBadge tone="accent" size="sm" label="Por encargue" />
                ) : null}
              </div>
              <div className="line-item__meta">
                {line.quantity} x {formatCheckoutMoney(line.unitPrice)}
              </div>
            </div>
            <div className="line-item__total">{formatCheckoutMoney(line.lineTotal)}</div>
          </div>
        ))}
      </div>

      {hasSpecialOrderLines ? (
        <div className="ui-alert ui-alert--info mt-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Incluye productos por encargue</span>
            <div className="ui-alert__text">
              Estas lineas se confirman contra proveedor y no dependen del stock local del negocio.
            </div>
          </div>
        </div>
      ) : null}

      <div className="summary-box mt-4">
        <div className="summary-box__label">Total</div>
        <div className="summary-box__value">{formatCheckoutMoney(quote?.totals.subtotal ?? 0)}</div>
      </div>

      <div className="ui-alert ui-alert--info mt-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <span className="ui-alert__title">Compra con retiro en local</span>
          <div className="ui-alert__text">
            Una vez confirmado, el pedido aparecera en tu cuenta y el equipo del local podra
            continuar con la gestion.
          </div>
        </div>
      </div>

      <div className="summary-box mt-4">
        <div className="summary-box__label">Importante</div>
        <div className="summary-box__hint">Si eliges transferencia, los datos y el envio del comprobante aparecen despues de confirmar el pedido.</div>
      </div>
    </SectionCard>
  );
}
