/**
 * lib/firestore/employees.js
 * ------------------------------------------------------------------
 * Backs EmployeeComponent. Split deliberately into two halves:
 *
 *   - Firestore profile CRUD (load/save/delete) — plain client SDK,
 *     no different from doctors.js or tests.js. One deliberate
 *     choice: an employee WITH a login account is stored at
 *     employees/{uid} (doc ID = their Firebase Auth uid) rather than
 *     an auto-generated ID, so both AuthContext's lookup and
 *     firestore.rules' permission checks can do a cheap direct get()
 *     instead of a query. An employee with no login account yet (no
 *     uid) still gets an auto-generated ID via addDoc, same as
 *     doctors/tests — there's no uid to key by until one exists.
 *
 *     That Firestore/Auth-linkage doc ID is NOT what's shown to
 *     anyone as "the employee's ID", though — a raw Firebase uid
 *     (`a1B2cD3eF4gH5...`) is meaningless to a person and shouldn't
 *     appear on a staff list. Every employee also gets a separate
 *     `employeeId` FIELD (EMP-000001-style, via getNextSequentialId),
 *     generated once at creation and never touched again regardless
 *     of whether the underlying doc later migrates from an auto-ID
 *     to a uid-keyed one. That field — not `id`, not `uid` — is what
 *     EmployeeComponent displays and searches by.
 *
 *   - Firebase Auth account actions (create/reset password/disable) —
 *     NOT plain client SDK. As documented in EmployeeComponent's own
 *     doc comment: creating another user's login via
 *     createUserWithEmailAndPassword() would sign the browser in AS
 *     that new user, logging the admin out of their own session.
 *     Setting someone else's password or disabling their account
 *     isn't something the client SDK is allowed to do at all. All
 *     three go through Cloud Functions using firebase-admin instead —
 *     see functions/employees.js for the server-side half of this
 *     file. Only sendPasswordResetEmail is safe straight from the
 *     client, same as in ResetPasswordComponent.
 * ------------------------------------------------------------------ */
import { db, auth, app } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { sendPasswordResetEmail as fbSendPasswordResetEmail } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { createUserTemp } from "@/lib/firebaseTemp";
import { getNextSequentialId } from "@/lib/firestore/counters";

const COLLECTION = "employees";
const functions = getFunctions(app);

/** Pass directly as EmployeeComponent's onLoadEmployees. */
export async function loadEmployees() {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function loadMedicalTechnologistNames() {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(
      (d) =>
        d.status === "Active" &&
        (d.designation === "Medical Technologist (Laboratory)" ||
          d.designation === "Medical Technologist" ||
          d.department === "Pathology")
    )
    .filter((d) => d.name);
}

/**
 * Pass directly as EmployeeComponent's onSaveEmployee (Firestore
 * profile only). If the record already has a `uid` (its Auth account
 * exists — either from a prior save, or because
 * onCreateEmployeeAccount just ran earlier in the same submit), the
 * doc is written at employees/{uid} so it matches firestore.rules'
 * assumption. Otherwise falls back to an auto-generated doc ID.
 *
 * A brand new employee (no `employeeId` yet, regardless of whether
 * they have a uid) gets one generated here — EMP-000001-style — and
 * it's carried forward unchanged on every subsequent update, even if
 * the underlying doc ID later changes (auto-ID -> uid-keyed once a
 * login account gets created for them).
 */
export async function saveEmployee(employeeData) {
  let toSave = employeeData;
  if (!toSave.employeeId) {
    const employeeId = await getNextSequentialId("EMP", "employees");
    toSave = { ...toSave, employeeId };
  }

  if (toSave.uid) {
    const ref = doc(db, COLLECTION, toSave.uid);
    const { id, uid, ...rest } = toSave;
    await setDoc(ref, { uid, ...rest }, { merge: true });
    // Migrating from a pre-existing auto-ID doc (this employee existed
    // before getting a login account) — move off the old doc so there
    // isn't a duplicate record sitting at two different IDs.
    if (toSave.id && toSave.id !== toSave.uid) {
      await deleteDoc(doc(db, COLLECTION, toSave.id));
    }
    return { ...toSave, id: toSave.uid };
  }
  if (toSave.id) {
    const ref = doc(db, COLLECTION, toSave.id);
    const { id, ...rest } = toSave;
    await updateDoc(ref, rest);
    return toSave;
  }
  const { id, ...rest } = toSave;
  const ref = await addDoc(collection(db, COLLECTION), rest);
  return { ...toSave, id: ref.id };
}

/**
 * Pass directly as EmployeeComponent's onDeleteEmployee. Deletes the
 * Firestore profile only — does NOT delete the Firebase Auth account.
 * If you want that to happen too, call a Cloud Function that does
 * both (admin.auth().deleteUser(uid) + the Firestore delete) instead
 * of this, so a stray Auth account never outlives its profile.
 */
export async function deleteEmployee(employee) {
  const id = typeof employee === "string" ? employee : employee.id;
  await deleteDoc(doc(db, COLLECTION, id));
  return true;
}

/**
 * Pass directly as EmployeeComponent's onCreateEmployeeAccount.
 * Calls a Cloud Function (see functions/employees.js::createEmployeeAccount)
 * that runs admin.auth().createUser() server-side. Returns { uid }.
 */
export async function createEmployeeAccount(employeeData, tempPassword) {
  const { uid } = await createUserTemp(employeeData.email, tempPassword, employeeData.name);
  return { uid };
}

/** Pass directly as EmployeeComponent's onSendPasswordResetEmail. Client-SDK-safe. */
export async function sendEmployeePasswordResetEmail(employee) {
  await fbSendPasswordResetEmail(auth, employee.email);
  return true;
}

/**
 * Pass directly as EmployeeComponent's onSetTemporaryPassword. Calls
 * a Cloud Function (see functions/employees.js::setTemporaryPassword).
 */
export async function setEmployeeTemporaryPassword(employee, newPassword) {
  const callable = httpsCallable(functions, "setTemporaryPassword");
  await callable({ uid: employee.uid, password: newPassword });
  return true;
}

/**
 * Pass directly as EmployeeComponent's onSetAccountDisabled. Calls a
 * Cloud Function (see functions/employees.js::setAccountDisabled).
 */
export async function setEmployeeAccountDisabled(employee, disabled) {
  const callable = httpsCallable(functions, "setAccountDisabled");
  await callable({ uid: employee.uid, disabled });
  return true;
}
