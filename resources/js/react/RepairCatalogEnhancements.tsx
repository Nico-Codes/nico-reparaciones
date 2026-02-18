import { useEffect } from 'react';
import { initRepairDeviceCatalog } from '../modules/repairDeviceCatalog';
import { initRepairIssueCatalog } from '../modules/repairIssueCatalog';

export default function RepairCatalogEnhancements() {
  useEffect(() => {
    initRepairDeviceCatalog();
    initRepairIssueCatalog();
  }, []);

  return null;
}
