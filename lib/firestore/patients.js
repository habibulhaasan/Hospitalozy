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

function fromDoc(d, index = 0) {
  const data = d.data() || {};
  let patientId = data.patientId || d.id;

  // If patientId is a raw Firestore UID (no hyphen like PT-00001), format for display
  if (!patientId || !patientId.includes("-")) {
    const num = String(index + 1).padStart(5, "0");
    patientId = `PT-${num}`;
  }

  return {
    ...data,
    patientId,
    docId: d.id,
  };
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

  // Fall back to patientId field, mobile number, or NID — whichever matches.
  for (const field of ["patientId", "mobile", "nid"]) {
    const snap = await getDocs(
      query(collection(db, COLLECTION), where(field, "==", trimmed), limit(1))
    );
    if (!snap.empty) return fromDoc(snap.docs[0]);
  }
  return null;
}

/**
 * Pass directly as onSavePatient. A new patient's ID is
 * PT-00001-style (via getNextSequentialId) — used directly as the
 * Firestore document ID, not Firestore's own random auto-generated
 * one. Patients have no Auth account at all, so (unlike employees)
 * there's no UID to keep separate from this — the Patient ID IS the
 * document ID, full stop.
 */
export async function savePatient(patientData) {
  const { patientId, docId, ...rest } = patientData;
  const targetId = docId || patientId;

  // If a sequential PT- ID already exists, update the document
  if (patientId && patientId.startsWith("PT-") && targetId && targetId.startsWith("PT-")) {
    await updateDoc(doc(db, COLLECTION, targetId), { ...rest, patientId });
    return patientId;
  }

  // Generate a sequential PT- id
  const newId = await getNextSequentialId("PT", "patients", 5);
  
  // If editing an old legacy record with a non-PT- doc ID, target its doc ID to merge
  const key = targetId || newId;

  // Write newId into patientId data field so it overrides the random docId in fromDoc
  await setDoc(doc(db, COLLECTION, key), { ...rest, patientId: newId }, { merge: true });
  return newId;
}

/** Pass directly as PatientComponent's onLoadPatients. */
export async function loadPatients() {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
  return snap.docs.map((d, idx) => fromDoc(d, idx));
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
