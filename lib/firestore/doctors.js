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
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy,
} from "firebase/firestore";

const COLLECTION = "doctors";

/** Full doctor records — pass directly as DoctorComponent's onLoadDoctors. */
export async function loadDoctorRecords() {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Create or update — pass directly as DoctorComponent's onSaveDoctor. */
export async function saveDoctor(doctorData) {
  if (doctorData.id) {
    const ref = doc(db, COLLECTION, doctorData.id);
    const { id, ...rest } = doctorData;
    await updateDoc(ref, rest);
    return doctorData;
  }
  const { id, ...rest } = doctorData;
  const ref = await addDoc(collection(db, COLLECTION), rest);
  return { ...doctorData, id: ref.id };
}

/** Pass directly as DoctorComponent's onDeleteDoctor. */
export async function deleteDoctor(doctor) {
  const id = typeof doctor === "string" ? doctor : doctor.id;
  await deleteDoc(doc(db, COLLECTION, id));
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
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("status", "==", "Active"), orderBy("name"))
  );
  return snap.docs.map((d) => d.data().name).filter(Boolean);
}

/** Single doctor by id — occasionally useful (e.g. resolving a stored doctorId). */
export async function getDoctorById(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
