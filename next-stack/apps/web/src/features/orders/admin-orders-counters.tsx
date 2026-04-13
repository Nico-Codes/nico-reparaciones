import type { ReactNode } from 'react';

export function AdminOrdersCounterChip({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: ReactNode;
}) {
  return (
    <div className="counter-chip">
      {icon}
      <span>{label}</span>
      <span className="counter-chip__count">{count}</span>
    </div>
  );
}
