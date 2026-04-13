import {
  AdminRepairCreateBasicPanel,
  type AdminRepairCreateBasicSectionProps,
} from './admin-repair-create-basic-panel';
import {
  AdminRepairCreateDiagnosisPanel,
  type AdminRepairCreateDiagnosisSectionProps,
} from './admin-repair-create-diagnosis-panel';
import {
  AdminRepairCreateSubmitPanel,
  type AdminRepairCreateSubmitSectionProps,
} from './admin-repair-create-submit-panel';

export function AdminRepairCreateBasicSection(props: AdminRepairCreateBasicSectionProps) {
  return <AdminRepairCreateBasicPanel {...props} />;
}

export function AdminRepairCreateDiagnosisSection(props: AdminRepairCreateDiagnosisSectionProps) {
  return <AdminRepairCreateDiagnosisPanel {...props} />;
}

export function AdminRepairCreateSubmitSection(props: AdminRepairCreateSubmitSectionProps) {
  return <AdminRepairCreateSubmitPanel {...props} />;
}
