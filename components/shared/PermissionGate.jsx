"use client";

/**
 * components/shared/PermissionGate.jsx
 * ------------------------------------------------------------------
 * The actual "show this component only to the right user" mechanism.
 * Wrap any component/section with it and pass the module key that
 * matches EmployeeComponent's permission grid:
 *
 *   <PermissionGate module="billing">
 *     <InvoiceComponent ... />
 *   </PermissionGate>
 *
 * Renders nothing but a small message if the signed-in employee
 * doesn't have that module enabled (or isn't signed in at all).
 * `fallback` lets a page override that message, or pass `null` to
 * render nothing rather than a message.
 * ------------------------------------------------------------------ */
import React from "react";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";

export default function PermissionGate({ module, children, fallback }) {
  const { loading } = useAuth();
  const allowed = usePermission(module);

  if (loading) return null;

  if (!allowed) {
    if (fallback !== undefined) return fallback;
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <p className="text-sm text-slate-500">
          You don't have access to this section. Contact your administrator if you think this is wrong.
        </p>
      </div>
    );
  }

  return children;
}
