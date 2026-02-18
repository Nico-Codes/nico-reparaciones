import { useState, type FormEvent } from 'react';

type QuickSaleScanProps = {
  addUrl: string;
  ticketUrl: string;
  csrfToken: string;
  ticketContainerId: string;
};

type StatusState = {
  ok: boolean;
  message: string;
} | null;

function beep(): void {
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.start();
    setTimeout(() => {
      osc.stop();
      void ctx.close();
    }, 80);
  } catch (_e) {}
}

export default function QuickSaleScan({
  addUrl,
  ticketUrl,
  csrfToken,
  ticketContainerId,
}: QuickSaleScanProps) {
  const [code, setCode] = useState('');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  const refreshTicket = async (): Promise<void> => {
    const ticketContainer = document.getElementById(ticketContainerId);
    if (!ticketContainer) return;

    const response = await fetch(ticketUrl, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
    });
    if (!response.ok) return;

    ticketContainer.innerHTML = await response.text();
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const codeTrim = String(code || '').trim();
    if (codeTrim === '') {
      setStatus({ ok: false, message: 'Ingresa un codigo para escanear o agregar.' });
      return;
    }

    setBusy(true);
    try {
      const payload = new FormData();
      payload.append('_token', csrfToken);
      payload.append('code', codeTrim);
      payload.append('quantity', String(Math.max(1, qty || 1)));

      const response = await fetch(addUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: payload,
        credentials: 'same-origin',
      });

      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setStatus({ ok: false, message: data.message || 'No se pudo agregar el producto.' });
        return;
      }

      await refreshTicket();
      setStatus({ ok: true, message: data.message || 'Producto agregado.' });
      beep();
      setCode('');
      setQty(1);
    } catch (_e) {
      setStatus({ ok: false, message: 'Error de red al agregar el producto.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-body">
      <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-[1fr_140px_auto] sm:items-end">
        <div className="grid gap-1">
          <label>Codigo (SKU o barcode)</label>
          <input
            name="code"
            className="h-11"
            placeholder="Ej: CAB-USB-C-001 o 7791234567890"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <label>Cantidad</label>
          <input
            type="number"
            min={1}
            max={999}
            name="quantity"
            value={qty}
            className="h-11"
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || '1', 10) || 1))}
          />
        </div>
        <button className="btn-primary h-11 w-full justify-center sm:w-auto" type="submit" disabled={busy} aria-busy={busy}>
          Agregar
        </button>
      </form>

      {status && (
        <div
          className={
            status.ok
              ? 'mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
              : 'mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800'
          }
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
