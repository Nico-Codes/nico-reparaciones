import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type CustomSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
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
}: CustomSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedIndex = useMemo(() => options.findIndex((option) => option.value === value), [options, value]);
  const displayOption = selectedIndex >= 0 ? options[selectedIndex] : options[0];

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

      <div id={`${id}-menu`} role="listbox" className={cn('nr-select-menu', !open && 'hidden', menuClassName)}>
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
      </div>
    </div>
  );
}
