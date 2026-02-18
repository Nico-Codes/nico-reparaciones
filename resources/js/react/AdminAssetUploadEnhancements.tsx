import { useEffect } from 'react';
import { initAdminAssetUploadDropzones } from '../modules/adminAssetUploadDropzones';

export default function AdminAssetUploadEnhancements() {
  useEffect(() => {
    initAdminAssetUploadDropzones();
  }, []);

  return null;
}
