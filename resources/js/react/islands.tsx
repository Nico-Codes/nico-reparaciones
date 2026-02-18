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
import PricingRuleCreateMode from './PricingRuleCreateMode';
import OrderShowWhatsappLog from './OrderShowWhatsappLog';
import RepairShowWhatsappLog from './RepairShowWhatsappLog';
import AutoPrintOnLoad from './AutoPrintOnLoad';
import ProductLabelBarcode from './ProductLabelBarcode';
import StoreSearchSuggestions from './StoreSearchSuggestions';
import CartCheckoutEnhancements from './CartCheckoutEnhancements';
import ShellUi from './ShellUi';
import RepairCatalogEnhancements from './RepairCatalogEnhancements';
import GlobalUiEnhancements from './GlobalUiEnhancements';
import AdminQuickActionsEnhancements from './AdminQuickActionsEnhancements';
import RepairCreateUiEnhancements from './RepairCreateUiEnhancements';
import AdminModelGroupsEnhancements from './AdminModelGroupsEnhancements';
import AdminAssetUploadEnhancements from './AdminAssetUploadEnhancements';
import GlobalFormEnhancements from './GlobalFormEnhancements';
import ProductQtyEnhancements from './ProductQtyEnhancements';
import AddToCartEnhancements from './AddToCartEnhancements';
import GlobalCopyActionsEnhancements from './GlobalCopyActionsEnhancements';
import AdminOrdersStatusEnhancements from './AdminOrdersStatusEnhancements';
import StoreVisualEnhancements from './StoreVisualEnhancements';

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

  const pricingModeNodes = document.querySelectorAll<HTMLElement>('[data-react-pricing-rule-create-mode]');
  pricingModeNodes.forEach((node, index) => {
    createRoot(node).render(
      <PricingRuleCreateMode
        selector={node.dataset.selector || '[data-pricing-create-form]'}
      />
    );
  });

  const orderShowNodes = document.querySelectorAll<HTMLElement>('[data-react-order-show-whatsapp-log]');
  orderShowNodes.forEach((node, index) => {
    createRoot(node).render(
      <OrderShowWhatsappLog
        rootSelector={node.dataset.rootSelector || '#order_whatsapp'}
      />
    );
  });

  const repairShowNodes = document.querySelectorAll<HTMLElement>('[data-react-repair-show-whatsapp-log]');
  repairShowNodes.forEach((node, index) => {
    createRoot(node).render(
      <RepairShowWhatsappLog
        rootSelector={node.dataset.rootSelector || 'body'}
        csrfToken={node.dataset.csrfToken || ''}
      />
    );
  });

  const autoPrintNodes = document.querySelectorAll<HTMLElement>('[data-react-auto-print]');
  autoPrintNodes.forEach((node, index) => {
    const enabled = (node.dataset.enabled || '0') === '1';
    const delayMs = Number(node.dataset.delayMs || '120');

    createRoot(node).render(
      <AutoPrintOnLoad enabled={enabled} delayMs={Number.isFinite(delayMs) ? delayMs : 120} />
    );
  });

  const productLabelNodes = document.querySelectorAll<HTMLElement>('[data-react-product-label-barcode]');
  productLabelNodes.forEach((node, index) => {
    createRoot(node).render(
      <ProductLabelBarcode
        rootSelector={node.dataset.rootSelector || '[data-react-product-label-barcode]'}
      />
    );
  });

  const storeSearchNodes = document.querySelectorAll<HTMLElement>('[data-react-store-search-suggestions]');
  storeSearchNodes.forEach((node, index) => {
    createRoot(node).render(
      <StoreSearchSuggestions
        rootSelector={node.dataset.rootSelector || '[data-store-search]'}
      />
    );
  });

  const cartCheckoutNodes = document.querySelectorAll<HTMLElement>('[data-react-cart-checkout-enhancements]');
  cartCheckoutNodes.forEach((node, index) => {
    createRoot(node).render(<CartCheckoutEnhancements />);
  });

  const shellUiNodes = document.querySelectorAll<HTMLElement>('[data-react-shell-ui]');
  shellUiNodes.forEach((node, index) => {
    createRoot(node).render(<ShellUi />);
  });

  const repairCatalogNodes = document.querySelectorAll<HTMLElement>('[data-react-repair-catalog-enhancements]');
  repairCatalogNodes.forEach((node, index) => {
    createRoot(node).render(<RepairCatalogEnhancements />);
  });

  const globalUiNodes = document.querySelectorAll<HTMLElement>('[data-react-global-ui-enhancements]');
  globalUiNodes.forEach((node, index) => {
    createRoot(node).render(<GlobalUiEnhancements />);
  });

  const adminQuickActionsNodes = document.querySelectorAll<HTMLElement>('[data-react-admin-quick-actions-enhancements]');
  adminQuickActionsNodes.forEach((node, index) => {
    createRoot(node).render(<AdminQuickActionsEnhancements />);
  });

  const repairCreateUiNodes = document.querySelectorAll<HTMLElement>('[data-react-repair-create-ui-enhancements]');
  repairCreateUiNodes.forEach((node, index) => {
    createRoot(node).render(<RepairCreateUiEnhancements />);
  });

  const modelGroupsNodes = document.querySelectorAll<HTMLElement>('[data-react-admin-model-groups-enhancements]');
  modelGroupsNodes.forEach((node, index) => {
    createRoot(node).render(<AdminModelGroupsEnhancements />);
  });

  const assetUploadNodes = document.querySelectorAll<HTMLElement>('[data-react-admin-asset-upload-enhancements]');
  assetUploadNodes.forEach((node, index) => {
    createRoot(node).render(<AdminAssetUploadEnhancements />);
  });

  const globalFormNodes = document.querySelectorAll<HTMLElement>('[data-react-global-form-enhancements]');
  globalFormNodes.forEach((node, index) => {
    createRoot(node).render(<GlobalFormEnhancements />);
  });

  const qtyNodes = document.querySelectorAll<HTMLElement>('[data-react-product-qty-enhancements]');
  qtyNodes.forEach((node, index) => {
    createRoot(node).render(<ProductQtyEnhancements />);
  });

  const addToCartNodes = document.querySelectorAll<HTMLElement>('[data-react-add-to-cart-enhancements]');
  addToCartNodes.forEach((node, index) => {
    createRoot(node).render(<AddToCartEnhancements />);
  });

  const copyNodes = document.querySelectorAll<HTMLElement>('[data-react-copy-actions-enhancements]');
  copyNodes.forEach((node, index) => {
    createRoot(node).render(<GlobalCopyActionsEnhancements />);
  });

  const adminOrdersNodes = document.querySelectorAll<HTMLElement>('[data-react-admin-orders-status-enhancements]');
  adminOrdersNodes.forEach((node, index) => {
    createRoot(node).render(<AdminOrdersStatusEnhancements />);
  });

  const storeVisualNodes = document.querySelectorAll<HTMLElement>('[data-react-store-visual-enhancements]');
  storeVisualNodes.forEach((node, index) => {
    createRoot(node).render(<StoreVisualEnhancements />);
  });
}
