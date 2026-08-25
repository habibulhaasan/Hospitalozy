"use client";

/**
 * context/AuthContext.jsx
 * ------------------------------------------------------------------
 * Wraps the whole app (see app/layout.jsx). Tracks:
 *   - `user`      — the raw Firebase Auth user (or null, signed out)
 *   - `employee`  — the matching Firestore `employees` record for
 *                   that uid, which is where `role` and `permissions`
 *                   live (see EmployeeComponent's data shape)
 *   - `loading`   — true until the very first auth check resolves,
 *                   so protected routes don't flash their "please
 *                   sign in" state before Firebase has even answered
 *
 * This is the piece that makes "show this component only to users
 * who should see it" possible — every permission check in the app
 * (the usePermission hook, <PermissionGate>, the dashboard nav) reads
 * from `employee.permissions`, which this context is the only place
 * that fetches.
 * ------------------------------------------------------------------ */
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        // Direct get() at employees/{uid} — cheap, and matches
        // firestore.rules' permission checks, which assume the same
        // thing. See lib/firestore/employees.js::saveEmployee for how
        // that doc ID gets set to the uid in the first place.
        const snap = await getDoc(doc(db, "employees", fbUser.uid));
        setEmployee(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } else {
        setEmployee(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signOut() {
    await fbSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, employee, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth() — the one hook every component/page should use to read
 * who's signed in. Throws loudly if called outside <AuthProvider> so
 * a missing provider fails fast at the call site instead of silently
 * returning null everywhere.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth() must be called inside <AuthProvider> — check app/layout.jsx.");
  }
  return ctx;
}
