/**
 * lib/firestore/doctors.js
 * ------------------------------------------------------------------
 * Backs DoctorComponent's onLoadDoctors/onSaveDoctor/onDeleteDoctor
 * (full records), AND the simpler onLoadDoctors used by Invoice,
 * LabReport, PatientBilling, and Accounting (just active doctor
 * names for a dropdown) — both read the same `doctors` collection,
 * so a doctor added once shows up everywhere.
 * ------------------------------------------------------------------ */
import { db } from "@/lib/firebase";
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter
} from "firebase/firestore";
import { getNextSequentialId } from "@/lib/firestore/counters";
import { withCache, cacheInvalidate } from "@/lib/cache";

const COLLECTION = "doctors";

/** Full doctor records — pass directly as DoctorComponent's onLoadDoctors. */
export async function loadDoctorRecords() {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Create or update — pass directly as DoctorComponent's onSaveDoctor.
 * A new doctor's ID is DOC-000001-style (via getNextSequentialId),
 * used directly as the Firestore document ID — a doctor never logs
 * into this system themselves, so there's no Auth UID to reconcile
 * with, unlike employees.js.
 */
export async function saveDoctor(doctorData) {
  if (doctorData.id) {
    const ref = doc(db, COLLECTION, doctorData.id);
    const { id, ...rest } = doctorData;
    await updateDoc(ref, rest);
    cacheInvalidate("doctors:active");
    cacheInvalidate("doctors:pathologists");
    return doctorData;
  }
  const newId = await getNextSequentialId("DOC", "doctors");
  const { id, ...rest } = doctorData;
  await setDoc(doc(db, COLLECTION, newId), rest);
  cacheInvalidate("doctors:active");
  cacheInvalidate("doctors:pathologists");
  return { ...doctorData, id: newId };
}

/** Pass directly as DoctorComponent's onDeleteDoctor. */
export async function deleteDoctor(doctor) {
  const id = typeof doctor === "string" ? doctor : doctor.id;
  await deleteDoc(doc(db, COLLECTION, id));
  cacheInvalidate("doctors:active");
  cacheInvalidate("doctors:pathologists");
  return true;
}

/**
 * Plain string[] of active doctor names — pass as the `onLoadDoctors`
 * prop on Invoice/LabReport/PatientBilling/Accounting. Those
 * components only need names for a "Referred By" dropdown, not full
 * records, so this is intentionally a lighter query than
 * loadDoctorRecords() above.
 */
export async function loadActiveDoctorNames() {
  return withCache("doctors:active", async () => {
    const snap = await getDocs(
      query(collection(db, COLLECTION), where("status", "==", "Active"), orderBy("name"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => d.name);
  });
}

export async function loadActivePathologistNames() {
  return withCache("doctors:pathologists", async () => {
    const snap = await getDocs(
      query(
        collection(db, COLLECTION),
        where("status", "==", "Active"),
        where("specialty", "==", "Pathology"),
        orderBy("name")
      )
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => d.name);
  });
}

/** Single doctor by id — occasionally useful (e.g. resolving a stored doctorId). */
export async function getDoctorById(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function loadDoctorsPage({ cursor = null, pageSize = 20 } = {}) {
  const baseQ = query(collection(db, COLLECTION), orderBy("name"));
  const q = cursor
    ? query(baseQ, startAfter(cursor), limit(pageSize + 1))
    : query(baseQ, limit(pageSize + 1));

  const snap = await getDocs(q);
  const docs = snap.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    data: pageDocs.map((d) => ({ id: d.id, ...d.data() })),
    firstDoc: pageDocs[0] || null,
    lastDoc: pageDocs[pageDocs.length - 1] || null,
    hasMore,
  };
}
