import { useEffect } from 'react';
import { initAdminOrdersStatusAndWhatsapp } from '../modules/adminOrdersStatusAndWhatsapp';
import { lockScroll, unlockScroll } from '../shared/scrollLock';
import { showMiniToast } from '../shared/uiFeedback';

export default function AdminOrdersStatusEnhancements() {
  useEffect(() => {
    const afterPaint = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn));
    initAdminOrdersStatusAndWhatsapp({ afterPaint, lockScroll, unlockScroll, showMiniToast });
  }, []);

  return null;
}
