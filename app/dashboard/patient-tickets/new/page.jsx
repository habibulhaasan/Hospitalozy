"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import PatientBillingComponent from "@/components/patient-billing/PatientBillingComponent";
import { lookupPatientByIdOrMobile, savePatient } from "@/lib/firestore/patients";
import { loadActiveDoctorNames } from "@/lib/firestore/doctors";
import { saveTicket } from "@/lib/firestore/tickets";

export default function NewPatientTicketPage() {
  return (
    <PermissionGate module="billing">
      <PatientBillingComponent
        onLookupPatientByIdOrMobile={lookupPatientByIdOrMobile}
        onSavePatient={savePatient}
        onLoadDoctors={loadActiveDoctorNames}
        onSaveBill={saveTicket}
      />
    </PermissionGate>
  );
}
