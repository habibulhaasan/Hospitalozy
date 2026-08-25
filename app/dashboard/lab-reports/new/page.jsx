"use client";

/**
 * app/dashboard/lab-reports/new/page.jsx
 * ------------------------------------------------------------------
 * LabReportComponent takes THREE doctor-list-shaped props (Referred
 * By, Technologist, Pathologist) — in a real deployment these would
 * likely be different Firestore queries (e.g. filtered by role), but
 * nothing in this project has separate "technologist" vs "doctor"
 * records yet, so all three point at the same active-doctor-names
 * query for now. Split them out once Employee records are the real
 * source for staff names instead.
 * ------------------------------------------------------------------ */
import PermissionGate from "@/components/shared/PermissionGate";
import LabReportComponent from "@/components/lab-report/LabReportComponent";
import { lookupPatientByIdOrMobile, savePatient } from "@/lib/firestore/patients";
import { loadActiveDoctorNames } from "@/lib/firestore/doctors";
import { saveReport, lookupInvoiceForPatient } from "@/lib/firestore/reports";

export default function NewLabReportPage() {
  return (
    <PermissionGate module="reporting">
      <LabReportComponent
        onLookupPatient={lookupPatientByIdOrMobile}
        onLookupInvoice={lookupInvoiceForPatient}
        onSaveReport={saveReport}
        onLoadDoctors={loadActiveDoctorNames}
        onLoadTechnologists={loadActiveDoctorNames}
        onLoadPathologists={loadActiveDoctorNames}
      />
    </PermissionGate>
  );
}
