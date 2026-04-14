import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export type CustomSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type CustomSelectMenuAction = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  helperText?: string;
};

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  ariaLabel?: string;
  name?: string;
  menuAction?: CustomSelectMenuAction;
};

function firstEnabledIndex(options: CustomSelectOption[]) {
  return Math.max(
    0,
    options.findIndex((option) => !option.disabled),
  );
}

export function CustomSelect({
  value,
  onChange,
  options,
  disabled = false,
  className,
  triggerClassName,
  menuClassName,
  ariaLabel,
  name,
  menuAction,
}: CustomSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  const selectedIndex = useMemo(() => options.findIndex((option) => option.value === value), [options, value]);
  const displayOption = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
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

  useLayoutEffect(() => {
    if (!open) return;

    const menuOffset = 6;
    const syncMenuPosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const width = Math.min(Math.max(rect.width, 200), window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(rect.left, viewportPadding),
        Math.max(viewportPadding, window.innerWidth - viewportPadding - width),
      );
      const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
      const availableAbove = rect.top - viewportPadding;
      const openAbove = availableBelow < 220 && availableAbove > availableBelow;
      const maxHeight = Math.max(160, Math.min(openAbove ? availableAbove - menuOffset : availableBelow - menuOffset, 320));

      setMenuStyle({
        position: 'fixed',
        left,
        width,
        maxHeight,
        zIndex: 520,
        ...(openAbove
          ? { top: Math.max(viewportPadding, rect.top - maxHeight - menuOffset) }
          : { top: Math.max(viewportPadding, rect.bottom + menuOffset) }),
      });
    };

    syncMenuPosition();

    const handleViewportResize = () => {
      setOpen(false);
    };

    const handleViewportScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener('resize', handleViewportResize);
    window.addEventListener('scroll', handleViewportScroll, true);

    return () => {
      window.removeEventListener('resize', handleViewportResize);
      window.removeEventListener('scroll', handleViewportScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const nextIndex = selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : firstEnabledIndex(options);
    setActiveIndex(nextIndex);
  }, [open, options, selectedIndex]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const menu = open && menuStyle && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          id={`${id}-menu`}
          role="listbox"
          className={cn('nr-select-menu', 'nr-select-menu--portal', menuClassName)}
          style={menuStyle}
        >
          {options.map((option, index) => (
            <button
              key={`${option.value}-${option.label}`}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              className={cn(
                'nr-select-option',
                option.value === value && 'is-selected',
                option.disabled && 'is-disabled',
              )}
              onClick={() => {
                if (!option.disabled) selectValue(option.value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  let next = index + 1;
                  while (next < options.length && options[next]?.disabled) next += 1;
                  setActiveIndex(next < options.length ? next : index);
                  return;
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  let prev = index - 1;
                  while (prev >= 0 && options[prev]?.disabled) prev -= 1;
                  setActiveIndex(prev >= 0 ? prev : index);
                  return;
                }
                if (event.key === 'Home') {
                  event.preventDefault();
                  setActiveIndex(firstEnabledIndex(options));
                  return;
                }
                if (event.key === 'End') {
                  event.preventDefault();
                  let last = options.length - 1;
                  while (last >= 0 && options[last]?.disabled) last -= 1;
                  setActiveIndex(last >= 0 ? last : index);
                  return;
                }
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (!option.disabled) selectValue(option.value);
                }
              }}
            >
              {option.label}
            </button>
          ))}
          {menuAction ? (
            <div className="nr-select-menu-footer">
              <button
                type="button"
                className="nr-select-menu-action"
                disabled={menuAction.disabled}
                onClick={() => {
                  setOpen(false);
                  menuAction.onSelect();
                  triggerRef.current?.focus();
                }}
              >
                {menuAction.label}
              </button>
              {menuAction.helperText ? (
                <div className="nr-select-menu-note">{menuAction.helperText}</div>
              ) : null}
            </div>
          ) : null}
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={rootRef} className={cn('nr-select', open && 'is-open', disabled && 'is-disabled', className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        type="button"
        className={cn('nr-select-trigger', triggerClassName)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={`${id}-menu`}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="nr-select-label">{displayOption?.label ?? ''}</span>
        <span className="nr-select-caret" aria-hidden="true" />
      </button>
      {menu}
    </div>
  );
}
