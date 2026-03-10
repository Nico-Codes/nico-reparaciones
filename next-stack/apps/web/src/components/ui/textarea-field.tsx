import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
  wrapperClassName?: string;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, hint, error, trailing, className, wrapperClassName, id, ...props },
  ref,
) {
  const resolvedId = id ?? props.name ?? undefined;

  return (
    <label className={cn('ui-field', wrapperClassName)}>
      {label ? <span className="ui-field__label">{label}</span> : null}
      <span className={cn('ui-field__control', error && 'is-error')}>
        <textarea
          ref={ref}
          id={resolvedId}
          className={cn('ui-textarea', className)}
          {...props}
        />
        {trailing ? <span className="ui-field__trailing ui-field__trailing--top">{trailing}</span> : null}
      </span>
      {error ? <span className="ui-field__error">{error}</span> : hint ? <span className="ui-field__hint">{hint}</span> : null}
    </label>
  );
});
