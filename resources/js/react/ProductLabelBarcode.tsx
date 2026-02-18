import { useEffect } from 'react';

type JsBarcodeFn = (
  element: Element,
  value: string,
  options: {
    format: string;
    displayValue: boolean;
    height: number;
    width: number;
    margin: number;
  }
) => void;

type ProductLabelBarcodeProps = {
  rootSelector: string;
};

export default function ProductLabelBarcode({ rootSelector }: ProductLabelBarcodeProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(rootSelector);
    if (!root) return;

    const value = String(root.dataset.barcodeValue || '').trim();
    const el = document.getElementById('product-barcode');
    if (!value || !el) return;

    const jsBarcode = (window as Window & { JsBarcode?: JsBarcodeFn }).JsBarcode;
    if (typeof jsBarcode !== 'function') return;

    try {
      jsBarcode(el, value, {
        format: 'CODE128',
        displayValue: false,
        height: 64,
        width: 1.7,
        margin: 0,
      });
    } catch (_e) {
      el.outerHTML = '<div style="font-size:12px;color:#6b7280;">No se pudo generar el codigo para este valor.</div>';
    }
  }, [rootSelector]);

  return null;
}

