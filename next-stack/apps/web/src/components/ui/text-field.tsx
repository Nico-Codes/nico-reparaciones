import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
  wrapperClassName?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, leadingIcon, trailing, className, wrapperClassName, id, ...props },
  ref,
) {
  const resolvedId = id ?? props.name ?? undefined;

  return (
    <label className={cn('ui-field', wrapperClassName)}>
      {label ? <span className="ui-field__label">{label}</span> : null}
      <span className={cn('ui-field__control', leadingIcon && 'ui-field__control--with-icon', error && 'is-error')}>
        {leadingIcon ? <span className="ui-field__icon">{leadingIcon}</span> : null}
        <input
          ref={ref}
          id={resolvedId}
          className={cn('ui-input', className)}
          {...props}
        />
        {trailing ? <span className="ui-field__trailing">{trailing}</span> : null}
      </span>
      {error ? <span className="ui-field__error">{error}</span> : hint ? <span className="ui-field__hint">{hint}</span> : null}
    </label>
  );
});
