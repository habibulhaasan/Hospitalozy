/**
 * lib/firestore/counters.js
 * ------------------------------------------------------------------
 * Firestore has no native auto-increment, so a clean numeric ID with
 * a prefix (DOC-000001, PAT-000001, EMP-000001) needs something to
 * atomically hand out the next number. This is that something — one
 * counter document per entity type (`counters/doctors`,
 * `counters/patients`, `counters/employees`), incremented inside a
 * transaction so two people registering a patient at the same moment
 * can't both get PAT-000042.
 *
 * Deliberately NOT the Firestore document ID for every entity: it IS
 * the doc ID for doctors and patients (simplest — see doctors.js and
 * patients.js), but for employees it's a separate `employeeId` FIELD,
 * because an employee's doc ID needs to be their Firebase Auth `uid`
 * once they have a login account (see employees.js's own doc comment
 * for why). An employee's human-facing ID and their Auth UID are two
 * different things, on purpose — the UID is an internal
 * implementation detail, EMP-000001 is what a person actually sees.
 * ------------------------------------------------------------------ */
import { db } from "@/lib/firebase";
import { doc, runTransaction } from "firebase/firestore";

/**
 * Atomically returns the next "<PREFIX>-000123"-style ID for a given
 * counter name. `counterName` is just the collection this is counting
 * for ("doctors", "patients", "employees") — doesn't have to match
 * the prefix string, though in practice it always will here.
 */
export async function getNextSequentialId(prefix, counterName, padLength = 6) {
  const counterRef = doc(db, "counters", counterName);
  const next = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);
    const current = snap.exists() ? snap.data().value || 0 : 0;
    const nextVal = current + 1;
    transaction.set(counterRef, { value: nextVal }, { merge: true });
    return nextVal;
  });
  return `${prefix}-${String(next).padStart(padLength, "0")}`;
}
