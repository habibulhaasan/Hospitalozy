"use client";

/**
 * app/dashboard/patients/page.jsx
 * ------------------------------------------------------------------
 * No <PermissionGate> wrapper here on purpose — firestore.rules
 * already treats /patients/{docId} as readable/writable by any
 * signed-in employee (not gated to one specific module), since
 * patient lookup is shared across Billing and Reporting. This page
 * matches that same decision rather than adding a gate the rules
 * don't actually enforce.
 * ------------------------------------------------------------------ */
import PatientComponent from "@/components/patient/PatientComponent";
import { loadPatients, searchPatients, savePatient } from "@/lib/firestore/patients";
import { loadActiveDoctorNames } from "@/lib/firestore/doctors";

export default function PatientsPage() {
  return (
    <PatientComponent
      onLoadPatients={loadPatients}
      onSearchPatients={searchPatients}
      onSavePatient={savePatient}
      onLoadDoctors={loadActiveDoctorNames}
    />
  );
}
