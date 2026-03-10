import { cn } from '@/lib/utils';

export type ProgressStepState = 'done' | 'current' | 'upcoming' | 'danger';

export type ProgressStepItem = {
  key: string;
  label: string;
  description?: string;
  state: ProgressStepState;
};

export function ProgressSteps({
  items,
  className,
}: {
  items: ProgressStepItem[];
  className?: string;
}) {
  return (
    <ol className={cn('progress-steps', className)} data-reveal>
      {items.map((item) => (
        <li key={item.key} className={cn('progress-step', `is-${item.state}`)}>
          <span className="progress-step__marker" aria-hidden="true" />
          <div className="progress-step__body">
            <div className="progress-step__title">{item.label}</div>
            {item.description ? (
              <div className="progress-step__description">{item.description}</div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
