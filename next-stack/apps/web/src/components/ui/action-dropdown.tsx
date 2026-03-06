import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TriggerRenderArgs = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  menuId: string;
};

type ActionDropdownProps = {
  renderTrigger: (args: TriggerRenderArgs) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  className?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
};

export function ActionDropdown({
  renderTrigger,
  children,
  className,
  menuClassName,
  align = 'right',
}: ActionDropdownProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!rootRef.current?.contains(target)) setOpen(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {renderTrigger({
        open,
        toggle: () => setOpen((prev) => !prev),
        close: () => setOpen(false),
        triggerRef,
        menuId: id,
      })}
      <div
        id={id}
        role="menu"
        className={cn(
          'dropdown-menu top-full',
          align === 'left' ? 'left-0 right-auto' : 'right-0 left-auto',
          open ? 'is-open' : 'hidden',
          menuClassName,
        )}
      >
        {typeof children === 'function' ? children(() => setOpen(false)) : children}
      </div>
    </div>
  );
}
