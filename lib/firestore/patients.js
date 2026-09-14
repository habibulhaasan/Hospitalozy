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
  collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, limit, orderBy, startAfter
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
 * buildSearchTokens — generates prefix tokens for server-side
 * array-contains search. Stored on each patient document.
 * Example: "Rahman" → ["ra","rah","rahm","rahma","rahman"]
 * Minimum prefix length: 2 chars.
 */
function buildSearchTokens(patientData) {
  const tokens = new Set();

  function addPrefixes(str) {
    if (!str) return;
    const s = str.toLowerCase().trim();
    if (s.length >= 2) tokens.add(s);
    for (let i = 2; i <= s.length; i++) tokens.add(s.slice(0, i));
    s.split(/\s+/).forEach((word) => {
      if (word.length >= 2) tokens.add(word);
      for (let i = 2; i <= word.length; i++) tokens.add(word.slice(0, i));
    });
  }

  addPrefixes(patientData.name);
  addPrefixes(patientData.mobile);
  addPrefixes(patientData.patientId);
  addPrefixes(patientData.nid);

  return [...tokens];
}

export async function savePatient(patientData) {
  const { patientId, docId, ...rest } = patientData;
  const targetId = docId || patientId;

  // Always regenerate tokens on every save (catches name/mobile edits)
  const searchTokens = buildSearchTokens(patientData);

  if (patientId && patientId.startsWith("PT-") && targetId && targetId.startsWith("PT-")) {
    await updateDoc(doc(db, COLLECTION, targetId), { ...rest, patientId, searchTokens });
    invalidatePatientsCache();
    return patientId;
  }

  const newId = await getNextSequentialId("PT", "patients", 5);
  const key = targetId || newId;
  await setDoc(doc(db, COLLECTION, key), { ...rest, patientId: newId, searchTokens }, { merge: true });
  invalidatePatientsCache();
  return newId;
}

export async function loadPatientsPage({ cursor = null, pageSize = 20 } = {}) {
  const baseQ = query(collection(db, COLLECTION), orderBy("name"));
  const q = cursor
    ? query(baseQ, startAfter(cursor), limit(pageSize + 1))
    : query(baseQ, limit(pageSize + 1));

  const snap = await getDocs(q);
  const docs = snap.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    data: pageDocs.map((d, idx) => fromDoc(d, idx)),
    firstDoc: pageDocs[0] || null,
    lastDoc: pageDocs[pageDocs.length - 1] || null,
    hasMore,
  };
}

export async function loadPatients() {
  if (!cachedAllPatients) {
    const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
    cachedAllPatients = snap.docs.map((d, idx) => fromDoc(d, idx));
  }
  return cachedAllPatients;
}

let cachedAllPatients = null;

export function invalidatePatientsCache() {
  cachedAllPatients = null;
}

export async function searchPatients(searchText) {
  const term = (searchText || "").trim().toLowerCase();
  
  // Fetch all patients once per session to save reads, then filter locally.
  // This guarantees old patients (without searchTokens) are found perfectly
  // without burning through Firebase read quotas on every keystroke!
  if (!cachedAllPatients) {
    const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
    cachedAllPatients = snap.docs.map((d, idx) => fromDoc(d, idx));
  }
  
  if (!term) return cachedAllPatients;
  
  return cachedAllPatients.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(term) ||
      (p.mobile || "").includes(term) ||
      (p.patientId || "").toLowerCase().includes(term) ||
      (p.nid || "").toLowerCase().includes(term)
  );
}
