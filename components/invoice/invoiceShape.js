/**
 * components/invoice/invoiceShape.js
 * ------------------------------------------------------------------
 * Blank patient shape and id helpers, shared between InvoiceComponent
 * and (conceptually) PatientBillingComponent — both bill a patient
 * with the same core fields.
 * ------------------------------------------------------------------ */
export const DEFAULT_PATIENT = {
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

export function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}${d}-${rand}`;
}
