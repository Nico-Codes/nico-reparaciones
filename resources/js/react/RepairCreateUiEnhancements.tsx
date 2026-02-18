import { useEffect } from 'react';
import {
  initRepairCreateAdvancedToggle,
  initRepairCreateFinanceToggle,
  initRepairCreateSummaryAndPhone,
} from '../modules/adminRepairCreateUi';

export default function RepairCreateUiEnhancements() {
  useEffect(() => {
    initRepairCreateAdvancedToggle();
    initRepairCreateFinanceToggle();
    initRepairCreateSummaryAndPhone();
  }, []);

  return null;
}
