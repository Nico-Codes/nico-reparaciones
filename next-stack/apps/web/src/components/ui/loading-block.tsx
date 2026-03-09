import { cn } from '@/lib/utils';

export function LoadingBlock({
  label = 'Cargando contenido',
  lines = 3,
  className,
}: {
  label?: string;
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('loading-block', className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }).map((_, index) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className={cn('loading-block__line', index === 0 && 'loading-block__line--wide', index === lines - 1 && 'loading-block__line--short')}
        />
      ))}
    </div>
  );
}
