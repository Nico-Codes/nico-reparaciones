import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva('ui-badge', {
  variants: {
    tone: {
      neutral: 'ui-badge--neutral',
      info: 'ui-badge--info',
      accent: 'ui-badge--accent',
      success: 'ui-badge--success',
      warning: 'ui-badge--warning',
      danger: 'ui-badge--danger',
    },
    size: {
      sm: 'ui-badge--sm',
      md: 'ui-badge--md',
    },
  },
  defaultVariants: {
    tone: 'neutral',
    size: 'md',
  },
});

export type StatusBadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof statusBadgeVariants> & {
    label: string;
  };

export function StatusBadge({ label, tone, size, className, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone, size }), className)} {...props}>
      {label}
    </span>
  );
}
