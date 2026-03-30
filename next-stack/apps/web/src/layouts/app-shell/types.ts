export type LinkItem = {
  label: string;
  to: string;
  active?: boolean;
  icon?: string | null;
  highlight?: 'warning' | null;
  badgeCount?: number;
};

export type ShellContext = 'admin' | 'store' | 'account';
