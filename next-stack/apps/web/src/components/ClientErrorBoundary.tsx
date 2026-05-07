import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientError } from '@/lib/client-telemetry';

type ClientErrorBoundaryProps = {
  children: ReactNode;
};

type ClientErrorBoundaryState = {
  hasError: boolean;
};

export class ClientErrorBoundary extends Component<ClientErrorBoundaryProps, ClientErrorBoundaryState> {
  state: ClientErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError({
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: info.componentStack ?? undefined,
      source: 'react-boundary',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container-page py-8">
          <section className="section-card">
            <div className="section-card__body space-y-3">
              <p className="section-card__eyebrow">Error de interfaz</p>
              <h1 className="section-card__title">No pudimos mostrar esta pantalla.</h1>
              <p className="text-sm text-slate-600">Recargá la página. Si vuelve a pasar, el error quedó registrado para revisión.</p>
              <button type="button" className="ui-btn ui-btn--primary" onClick={() => window.location.reload()}>
                Recargar
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
