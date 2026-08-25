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

const COLLECTION = "employees";
const functions = getFunctions(app);

/** Pass directly as EmployeeComponent's onLoadEmployees. */
export async function loadEmployees() {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Pass directly as EmployeeComponent's onSaveEmployee (Firestore
 * profile only). If the record already has a `uid` (its Auth account
 * exists — either from a prior save, or because
 * onCreateEmployeeAccount just ran earlier in the same submit), the
 * doc is written at employees/{uid} so it matches firestore.rules'
 * assumption. Otherwise falls back to an auto-generated doc ID.
 */
export async function saveEmployee(employeeData) {
  if (employeeData.uid) {
    const ref = doc(db, COLLECTION, employeeData.uid);
    const { id, uid, ...rest } = employeeData;
    await setDoc(ref, { uid, ...rest }, { merge: true });
    // Migrating from a pre-existing auto-ID doc (this employee existed
    // before getting a login account) — move off the old doc so there
    // isn't a duplicate record sitting at two different IDs.
    if (employeeData.id && employeeData.id !== employeeData.uid) {
      await deleteDoc(doc(db, COLLECTION, employeeData.id));
    }
    return { ...employeeData, id: employeeData.uid };
  }
  if (employeeData.id) {
    const ref = doc(db, COLLECTION, employeeData.id);
    const { id, ...rest } = employeeData;
    await updateDoc(ref, rest);
    return employeeData;
  }
  const { id, ...rest } = employeeData;
  const ref = await addDoc(collection(db, COLLECTION), rest);
  return { ...employeeData, id: ref.id };
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
  const callable = httpsCallable(functions, "createEmployeeAccount");
  const result = await callable({ email: employeeData.email, password: tempPassword, displayName: employeeData.name });
  return { uid: result.data.uid };
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
