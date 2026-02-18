import { useEffect } from 'react';
import { initAdminProductsQuickActions } from '../modules/adminProductsQuickActions';
import { initAdminCategoriesQuickToggle } from '../modules/adminCategoriesQuickToggle';
import { showMiniToast } from '../shared/uiFeedback';

export default function AdminQuickActionsEnhancements() {
  useEffect(() => {
    initAdminProductsQuickActions({ showMiniToast });
    initAdminCategoriesQuickToggle({ showMiniToast });
  }, []);

  return null;
}
