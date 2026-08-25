/**
 * functions/employees.js
 * ------------------------------------------------------------------
 * The server-side half of lib/firestore/employees.js. These three
 * Cloud Functions are the only place `firebase-admin`'s auth methods
 * get called — deliberately never from the client, for the reasons
 * documented in EmployeeComponent and lib/firestore/employees.js.
 *
 * Deploy with the Firebase CLI: `firebase deploy --only functions`
 * (requires the Blaze/pay-as-you-go plan — Cloud Functions don't run
 * on the free Spark plan).
 *
 * Each function checks that the CALLER is an authenticated admin
 * before doing anything — without that check, any signed-in user
 * could call these directly and create or disable arbitrary accounts.
 * Adjust `requireAdmin` below to match how you actually mark someone
 * as an admin (a custom claim is usually cleanest; this checks a
 * Firestore field on the caller's own employee record as a simpler
 * starting point).
 * ------------------------------------------------------------------ */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

async function requireAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
  }
  const snap = await admin.firestore()
    .collection("employees")
    .where("uid", "==", context.auth.uid)
    .limit(1)
    .get();
  const caller = snap.docs[0]?.data();
  if (!caller || caller.role !== "Admin") {
    throw new functions.https.HttpsError("permission-denied", "Admin role required.");
  }
}

/** Called by lib/firestore/employees.js::createEmployeeAccount. */
exports.createEmployeeAccount = functions.https.onCall(async (data, context) => {
  await requireAdmin(context);
  const { email, password, displayName } = data;
  if (!email || !password || password.length < 6) {
    throw new functions.https.HttpsError("invalid-argument", "Email and a 6+ character password are required.");
  }
  const userRecord = await admin.auth().createUser({ email, password, displayName });
  return { uid: userRecord.uid };
});

/** Called by lib/firestore/employees.js::setEmployeeTemporaryPassword. */
exports.setTemporaryPassword = functions.https.onCall(async (data, context) => {
  await requireAdmin(context);
  const { uid, password } = data;
  if (!uid || !password || password.length < 6) {
    throw new functions.https.HttpsError("invalid-argument", "uid and a 6+ character password are required.");
  }
  await admin.auth().updateUser(uid, { password });
  return { success: true };
});

/** Called by lib/firestore/employees.js::setEmployeeAccountDisabled. */
exports.setAccountDisabled = functions.https.onCall(async (data, context) => {
  await requireAdmin(context);
  const { uid, disabled } = data;
  if (!uid || typeof disabled !== "boolean") {
    throw new functions.https.HttpsError("invalid-argument", "uid and a boolean `disabled` are required.");
  }
  await admin.auth().updateUser(uid, { disabled });
  return { success: true };
});
