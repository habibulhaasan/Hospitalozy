// lib/firebaseTemp.js
// Helper to create a Firebase Auth user from the client side without affecting the admin session.
// Uses a separate Firebase app instance (named "tempApp") so the admin stays signed in.
// This works on the Firebase Spark (free) plan because it only uses client SDK calls.

import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";

/** Returns (or creates) a secondary Firebase app instance for temporary operations */
function getTempApp() {
  const name = "tempApp";
  // Reuse if already initialized (avoid duplicate initializations on hot reload)
  const existing = getApps().find((a) => a.name === name);
  if (existing) return existing;

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  return initializeApp(firebaseConfig, name);
}

/**
 * Create a new Firebase Auth user using a temporary app.
 * The created user is signed out immediately so the current admin session remains intact.
 * Returns the new user's UID.
 */
export async function createUserTemp(email, password, displayName) {
  const tempApp = getTempApp();
  const tempAuth = getAuth(tempApp);
  const userCred = await createUserWithEmailAndPassword(tempAuth, email, password);
  const user = userCred.user;
  if (displayName) {
    await updateProfile(user, { displayName });
  }
  // Sign out the temporary app so we don't stay logged in as the new user.
  await signOut(tempAuth);
  return { uid: user.uid };
}

