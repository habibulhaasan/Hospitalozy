"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import LabReportListComponent from "@/components/lab-report/LabReportListComponent";
import { loadRecentReports, searchReports, updateReportStatus, markReportPrinted, loadReportsPage } from "@/lib/firestore/reports";
import { loadActivePathologistNames, loadActiveDoctorNames } from "@/lib/firestore/doctors";
import { loadMedicalTechnologistNames } from "@/lib/firestore/employees";

export default function LabReportsPage() {
  return (
    <PermissionGate module="reporting">
      <LabReportListComponent 
        onLoadReportsPage={loadReportsPage}
        onLoadRecentReports={loadRecentReports} 
        onSearchReports={searchReports}
        onUpdateStatus={updateReportStatus}
        onMarkPrinted={markReportPrinted} 
        onLoadDoctors={loadActiveDoctorNames}
        onLoadTechnologists={loadMedicalTechnologistNames}
        onLoadPathologists={loadActivePathologistNames}
      />
    </PermissionGate>
  );
}
