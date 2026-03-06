import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { CART_ADDED_EVENT, type CartAddedDetail } from './storage';

const AUTO_CLOSE_MS = 4500;

export function CartAddedPopup() {
  const location = useLocation();
  const timeoutRef = useRef<number | null>(null);
  const bodyOverflowRef = useRef<string>('');
  const bodyPaddingRightRef = useRef<string>('');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('Agregado al carrito');
  const [productName, setProductName] = useState('Producto');

  const close = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(false);
  };

  useEffect(() => {
    const onCartAdded = (event: Event) => {
      const detail = (event as CustomEvent<CartAddedDetail>).detail;
      setTitle('Agregado al carrito');
      setProductName(detail?.productName?.trim() || 'Producto');
      setOpen(true);

      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setOpen(false);
        timeoutRef.current = null;
      }, AUTO_CLOSE_MS);
    };

    window.addEventListener(CART_ADDED_EVENT, onCartAdded as EventListener);
    return () => {
      window.removeEventListener(CART_ADDED_EVENT, onCartAdded as EventListener);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    close();
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    const body = document.body;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    bodyOverflowRef.current = body.style.overflow;
    bodyPaddingRightRef.current = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = bodyOverflowRef.current;
      document.body.style.paddingRight = bodyPaddingRightRef.current;
    };
  }, [open]);

  return (
    <div
      id="cartAddedOverlay"
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ease-out ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={open ? 'false' : 'true'}
    >
      <div className="absolute inset-0 bg-zinc-950/40" onClick={close} />

      <div
        id="cartAddedSheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cartAddedTitle"
        className={`absolute bottom-0 left-0 right-0 mx-auto w-full max-w-xl transform transition-transform duration-300 ease-out will-change-transform ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="rounded-t-3xl bg-white p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-black text-zinc-900" id="cartAddedTitle">{title}</div>
              <div className="mt-0.5 truncate text-sm text-zinc-600" id="cartAddedName">{productName}</div>
            </div>

            <button type="button" className="icon-btn" onClick={close} aria-label="Cerrar">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <Link to="/carrito" className="btn-primary flex-1 justify-center" onClick={close}>Ver carrito</Link>
            <button type="button" className="btn-outline flex-1 justify-center" onClick={close}>Seguir</button>
          </div>
        </div>
      </div>
    </div>
  );
}
