import { useEffect } from 'react';

type AutoPrintOnLoadProps = {
  enabled: boolean;
  delayMs?: number;
};

export default function AutoPrintOnLoad({ enabled, delayMs = 120 }: AutoPrintOnLoadProps) {
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      window.print();
    }, Math.max(0, delayMs));

    return () => {
      window.clearTimeout(timer);
    };
  }, [enabled, delayMs]);

  return null;
}

