/**
 * lib/firestore/patients.js
 * ------------------------------------------------------------------
 * One `patients` collection shared by InvoiceComponent, LabReportComponent
 * (via onLookupPatient), PatientBillingComponent, and PatientComponent
 * (the patient list/detail screen) — a patient registered on any one
 * of them is findable from the others, which is the whole point of a
 * shared Patient ID.
 * ------------------------------------------------------------------ */
import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, limit, orderBy,
} from "firebase/firestore";
import { getNextSequentialId } from "@/lib/firestore/counters";

const COLLECTION = "patients";

function fromDoc(d) {
  return { patientId: d.id, ...d.data() };
}

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
  if (byId.exists()) return fromDoc(byId);

  // Fall back to mobile number or NID — whichever matches.
  for (const field of ["mobile", "nid"]) {
    const snap = await getDocs(
      query(collection(db, COLLECTION), where(field, "==", trimmed), limit(1))
    );
    if (!snap.empty) return fromDoc(snap.docs[0]);
  }
  return null;
}

/**
 * Pass directly as onSavePatient. A new patient's ID is
 * PAT-000001-style (via getNextSequentialId) — used directly as the
 * Firestore document ID, not Firestore's own random auto-generated
 * one. Patients have no Auth account at all, so (unlike employees)
 * there's no UID to keep separate from this — the Patient ID IS the
 * document ID, full stop.
 */
export async function savePatient(patientData) {
  const { patientId, ...rest } = patientData;
  if (patientId) {
    await updateDoc(doc(db, COLLECTION, patientId), rest);
    return patientId;
  }
  const newId = await getNextSequentialId("PAT", "patients");
  await setDoc(doc(db, COLLECTION, newId), rest);
  return newId;
}

/** Pass directly as PatientComponent's onLoadPatients. */
export async function loadPatients() {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
  return snap.docs.map(fromDoc);
}

/**
 * Pass directly as PatientComponent's onSearchPatients. Client-side
 * text filter after a full fetch — same caveat as the other
 * search*() functions in this project: fine at one hospital's
 * volume, swap for a real search index at real scale.
 */
export async function searchPatients(searchText) {
  const term = (searchText || "").trim().toLowerCase();
  if (!term) return loadPatients();
  const all = await loadPatients();
  return all.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(term) ||
      (p.mobile || "").includes(term) ||
      (p.patientId || "").toLowerCase().includes(term) ||
      (p.nid || "").toLowerCase().includes(term)
  );
}
