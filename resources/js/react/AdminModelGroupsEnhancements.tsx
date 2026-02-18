import { useEffect } from 'react';
import { initAdminModelGroups } from '../modules/adminModelGroups';

export default function AdminModelGroupsEnhancements() {
  useEffect(() => {
    initAdminModelGroups();
  }, []);

  return null;
}
