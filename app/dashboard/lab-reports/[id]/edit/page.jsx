"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PermissionGate from "@/components/shared/PermissionGate";
import LabReportComponent from "@/components/lab-report/LabReportComponent";
import { lookupPatientByIdOrMobile } from "@/lib/firestore/patients";
import { loadActiveDoctorNames, loadActivePathologistNames } from "@/lib/firestore/doctors";
import { loadMedicalTechnologistNames } from "@/lib/firestore/employees";
import { saveReport, lookupInvoiceForPatient, loadReportById } from "@/lib/firestore/reports";
import { searchBillingSources } from "@/lib/firestore/billingSources";
import { loadAppConfig } from "@/lib/firestore/settings";

export default function EditLabReportPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const reportId = unwrappedParams.id;
  const [initialReport, setInitialReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const { employee } = require("@/context/AuthContext").useAuth();

  useEffect(() => {
    Promise.all([
      loadReportById(reportId),
      loadAppConfig()
    ])
      .then(([data, config]) => {
        const canEdit = config?.technologistCanEditReports ?? true;
        const isTechnologist = employee && employee.role !== "Admin" && (
          employee.designation === "Medical Technologist (Laboratory)" ||
          employee.designation === "Medical Technologist" ||
          employee.department === "Pathology"
        );

        if (isTechnologist && !canEdit) {
          router.replace("/dashboard/lab-reports");
          return;
        }

        setInitialReport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load report", err);
        setLoading(false);
      });
  }, [reportId, employee, router]);

  if (loading) {
    return (
      <PermissionGate module="reporting">
        <div className="min-h-screen bg-slate-100 p-8 flex items-center justify-center">
          <p className="text-slate-500">Loading report...</p>
        </div>
      </PermissionGate>
    );
  }

  if (!initialReport) {
    return (
      <PermissionGate module="reporting">
        <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center gap-4">
          <p className="text-slate-500">Report not found.</p>
          <button onClick={() => router.push("/dashboard/lab-reports")} className="text-blue-600 underline text-sm">
            Back to Reports
          </button>
        </div>
      </PermissionGate>
    );
  }

  return (
    <PermissionGate module="reporting">
      <LabReportComponent
        initialReport={initialReport}
        onLookupPatient={lookupPatientByIdOrMobile}
        onLookupInvoice={lookupInvoiceForPatient}
        onSearchBillingSource={searchBillingSources}
        onSaveReport={async (payload) => {
          await saveReport(payload);
          router.push("/dashboard/lab-reports");
        }}
        onLoadDoctors={loadActiveDoctorNames}
        onLoadTechnologists={loadMedicalTechnologistNames}
        onLoadPathologists={loadActivePathologistNames}
        onLoadAppConfig={loadAppConfig}
      />
    </PermissionGate>
  );
}

