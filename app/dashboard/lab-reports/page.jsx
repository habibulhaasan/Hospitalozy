"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import LabReportListComponent from "@/components/lab-report/LabReportListComponent";
import { loadRecentReports, searchReports } from "@/lib/firestore/reports";

export default function LabReportsPage() {
  return (
    <PermissionGate module="reporting">
      <div className="flex justify-end px-4 pt-4">
        <a href="/dashboard/lab-reports/new" className="text-sm bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700">
          + New Report
        </a>
      </div>
      <LabReportListComponent onLoadRecentReports={loadRecentReports} onSearchReports={searchReports} />
    </PermissionGate>
  );
}