"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import LabReportListComponent from "@/components/lab-report/LabReportListComponent";
import { loadRecentReports, searchReports, updateReportStatus, markReportPrinted } from "@/lib/firestore/reports";

export default function LabReportsPage() {
  return (
    <PermissionGate module="reporting">
      <LabReportListComponent 
        onLoadRecentReports={loadRecentReports} 
        onSearchReports={searchReports}
        onUpdateStatus={updateReportStatus}
        onMarkPrinted={markReportPrinted} 
      />
    </PermissionGate>
  );
}
