import { createRoot } from 'react-dom/client';
import HelpQuickActions from './HelpQuickActions';
import HelpFaq from './HelpFaq';
import QuickSaleScan from './QuickSaleScan';
import AdminSettingsHelp from './AdminSettingsHelp';
import ProductPricingSimulator from './ProductPricingSimulator';
import ProductFormEnhancements from './ProductFormEnhancements';
import RepairCreateAssistant from './RepairCreateAssistant';
import RepairPartsSearch from './RepairPartsSearch';
import SupplierReorder from './SupplierReorder';
import WarrantyIncidentCreateEnhancements from './WarrantyIncidentCreateEnhancements';

export function initReactIslands(): void {
  const helpNode = document.querySelector<HTMLElement>('[data-react-help-island]');
  if (helpNode) {
    const title = helpNode.dataset.title || 'Accesos rapidos';
    const subtitle = helpNode.dataset.subtitle || 'Usa estos accesos para resolver acciones frecuentes.';
    const primaryLabel = helpNode.dataset.primaryLabel || 'Ver tienda';
    const primaryHref = helpNode.dataset.primaryHref || '/tienda';
    const secondaryLabel = helpNode.dataset.secondaryLabel || 'Ingresar';
    const secondaryHref = helpNode.dataset.secondaryHref || '/login';

    createRoot(helpNode).render(
      <HelpQuickActions
        title={title}
        subtitle={subtitle}
        primaryLabel={primaryLabel}
        primaryHref={primaryHref}
        secondaryLabel={secondaryLabel}
        secondaryHref={secondaryHref}
      />
    );
  }

  const helpFaqNode = document.querySelector<HTMLElement>('[data-react-help-faq-island]');
  if (helpFaqNode) {
    const sourceId = helpFaqNode.dataset.sourceId || '';
    const sourceNode = sourceId ? document.getElementById(sourceId) : null;
    const raw = sourceNode?.textContent || '[]';

    type HelpEntry = { question?: string; answer?: string };
    let parsed: HelpEntry[] = [];
    try {
      parsed = (JSON.parse(raw) as HelpEntry[]) || [];
    } catch (_e) {
      parsed = [];
    }
    const entries = parsed
      .map((item) => ({
        question: String(item.question || '').trim(),
        answer: String(item.answer || '').trim(),
      }))
      .filter((item) => item.question !== '' || item.answer !== '');

    createRoot(helpFaqNode).render(
      <HelpFaq
        entries={entries}
        emptyDataText={helpFaqNode.dataset.emptyDataText || 'No hay contenido de ayuda disponible en este momento.'}
        emptySearchText={helpFaqNode.dataset.emptySearchText || 'No encontramos resultados para tu busqueda.'}
        searchPlaceholder={helpFaqNode.dataset.searchPlaceholder || 'Buscar problema o palabra clave...'}
      />
    );
  }

  const quickSaleNode = document.querySelector<HTMLElement>('[data-react-quick-sale-scan]');
  if (quickSaleNode) {
    createRoot(quickSaleNode).render(
      <QuickSaleScan
        addUrl={quickSaleNode.dataset.addUrl || ''}
        ticketUrl={quickSaleNode.dataset.ticketUrl || ''}
        csrfToken={quickSaleNode.dataset.csrf || ''}
        ticketContainerId={quickSaleNode.dataset.ticketContainerId || 'quickSaleTicketContainer'}
      />
    );
  }

  const adminSettingsHelpNode = document.querySelector<HTMLElement>('[data-react-admin-settings-help]');
  if (adminSettingsHelpNode) {
    createRoot(adminSettingsHelpNode).render(
      <AdminSettingsHelp
        messageInputId={adminSettingsHelpNode.dataset.messageInputId || 'helpWhatsappMessageInput'}
        messageCounterId={adminSettingsHelpNode.dataset.messageCounterId || 'helpWhatsappMessageCounter'}
        messageMinAlertId={adminSettingsHelpNode.dataset.messageMinAlertId || 'helpWhatsappMessageMinAlert'}
        messageSubmitId={adminSettingsHelpNode.dataset.messageSubmitId || 'helpWhatsappMessageSubmitBtn'}
        searchInputId={adminSettingsHelpNode.dataset.searchInputId || 'helpAdminSearchInput'}
        visibleCountId={adminSettingsHelpNode.dataset.visibleCountId || 'helpAdminVisibleCount'}
        emptySearchId={adminSettingsHelpNode.dataset.emptySearchId || 'helpAdminEmptySearch'}
        itemSelector={adminSettingsHelpNode.dataset.itemSelector || '[data-help-admin-item]'}
      />
    );
  }

  const productPricingSimulatorNode = document.querySelector<HTMLElement>('[data-react-product-pricing-simulator]');
  if (productPricingSimulatorNode) {
    createRoot(productPricingSimulatorNode).render(
      <ProductPricingSimulator
        rootId={productPricingSimulatorNode.dataset.rootId || 'productPricingSimulator'}
      />
    );
  }

  const productFormNodes = document.querySelectorAll<HTMLElement>('[data-react-product-form-enhancements]');
  productFormNodes.forEach((node, index) => {
    createRoot(node).render(
      <ProductFormEnhancements
        rootId={node.dataset.rootId || `productFormEnhancements${index}`}
      />
    );
  });

  const repairAssistantNodes = document.querySelectorAll<HTMLElement>('[data-react-repair-create-assistant]');
  repairAssistantNodes.forEach((node, index) => {
    createRoot(node).render(
      <RepairCreateAssistant
        formSelector={node.dataset.formSelector || 'form'}
      />
    );
  });

  const repairPartsSearchNodes = document.querySelectorAll<HTMLElement>('[data-react-repair-parts-search]');
  repairPartsSearchNodes.forEach((node, index) => {
    createRoot(node).render(
      <RepairPartsSearch
        rootSelector={node.dataset.rootSelector || '#repair_parts_search'}
      />
    );
  });

  const supplierReorderNodes = document.querySelectorAll<HTMLElement>('[data-react-supplier-reorder]');
  supplierReorderNodes.forEach((node, index) => {
    createRoot(node).render(
      <SupplierReorder
        formSelector={node.dataset.formSelector || '[data-supplier-reorder-form]'}
      />
    );
  });

  const warrantyNodes = document.querySelectorAll<HTMLElement>('[data-react-warranty-incident-create]');
  warrantyNodes.forEach((node, index) => {
    createRoot(node).render(
      <WarrantyIncidentCreateEnhancements
        rootSelector={node.dataset.rootSelector || 'form[action*="warranty-incidents"]'}
      />
    );
  });
}
