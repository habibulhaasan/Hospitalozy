/**
 * components/patient/patientShape.js
 * ------------------------------------------------------------------
 * Same core fields as InvoiceComponent/PatientBillingComponent's
 * patient shape (invoiceShape.js's DEFAULT_PATIENT) — this is the
 * same patients collection, just browsed on its own here instead of
 * as a side-effect of billing someone. No id generator needed: new
 * patients are only ever created via Invoice/LabReport/PatientBilling's
 * "Register Patient" flow (lib/firestore/patients.js::savePatient),
 * which already handles PAT-000001-style ID generation. This screen
 * is read/update only — see PatientComponent's doc comment for why
 * there's deliberately no delete.
 * ------------------------------------------------------------------ */
export const BLANK_PATIENT = {
  patientId: "",
  name: "",
  mobile: "",
  ageY: "",
  ageM: "",
  ageD: "",
  dob: "",
  nid: "",
  gender: "Male",
  address: "",
  referredBy: "",
};
