/**
 * lib/firestore/patients.js
 * ------------------------------------------------------------------
 * One `patients` collection shared by InvoiceComponent, LabReportComponent
 * (via onLookupPatient), and PatientBillingComponent — a patient
 * registered on any one of them is findable from the others, which
 * is the whole point of a shared Patient ID.
 * ------------------------------------------------------------------ */
import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, limit,
} from "firebase/firestore";

const COLLECTION = "patients";

/**
 * Pass directly as onLookupPatientByIdOrMobile (Invoice, PatientBilling)
 * or onLookupPatient (LabReport — same idea, narrower field set).
 * Tries Patient ID first (doc ID lookup, cheap), then falls back to a
 * mobile-number query.
 */
export async function lookupPatientByIdOrMobile(query_) {
  const trimmed = (query_ || "").trim();
  if (!trimmed) return null;

  // Try as a direct document ID first (fast path when the exact
  // Patient ID was typed or scanned).
  const byId = await getDoc(doc(db, COLLECTION, trimmed));
  if (byId.exists()) return { patientId: byId.id, ...byId.data() };

  // Fall back to mobile number or NID — whichever matches.
  for (const field of ["mobile", "nid"]) {
    const snap = await getDocs(
      query(collection(db, COLLECTION), where(field, "==", trimmed), limit(1))
    );
    if (!snap.empty) {
      const d = snap.docs[0];
      return { patientId: d.id, ...d.data() };
    }
  }
  return null;
}

/**
 * Pass directly as onSavePatient. Creates a new patient (Firestore
 * assigns the doc ID, used as the Patient ID shown on invoices/
 * reports/tickets) if patientData.patientId is empty, or updates the
 * existing record otherwise. Returns the patientId either way.
 */
export async function savePatient(patientData) {
  const { patientId, ...rest } = patientData;
  if (patientId) {
    await updateDoc(doc(db, COLLECTION, patientId), rest);
    return patientId;
  }
  const ref = await addDoc(collection(db, COLLECTION), rest);
  return ref.id;
}
