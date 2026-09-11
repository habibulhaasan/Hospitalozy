"use client";

/**
 * app/dashboard/invoices/new/page.jsx
 * ------------------------------------------------------------------
 * Same pattern as doctors/page.jsx — gate by the "billing" module,
 * wire the component's props to the real Firestore layer. Patient
 * lookup/save is shared with LabReport and PatientBilling (same
 * lib/firestore/patients.js), which is the whole point of a shared
 * Patient ID across the suite.
 * ------------------------------------------------------------------ */
import PermissionGate from "@/components/shared/PermissionGate";
import InvoiceComponent from "@/components/invoice/InvoiceComponent";
import { lookupPatientByIdOrMobile, searchPatients, savePatient } from "@/lib/firestore/patients";
import { loadActiveDoctorNames } from "@/lib/firestore/doctors";
import { loadActiveAgents } from "@/lib/firestore/agents";
import { saveInvoice } from "@/lib/firestore/invoices";

export default function NewInvoicePage() {
  return (
    <PermissionGate module="billing">
      <InvoiceComponent
        onLookupPatientByIdOrMobile={lookupPatientByIdOrMobile}
        onSearchPatients={searchPatients}
        onSavePatient={savePatient}
        onLoadDoctors={loadActiveDoctorNames}
        onLoadAgents={loadActiveAgents}
        onSaveInvoice={saveInvoice}
      />
    </PermissionGate>
  );
}