/**
 * components/shared/Field.jsx
 * ------------------------------------------------------------------
 * "Label: value" row matching the hospital's original ticket format
 * (PatientTicket.jsx). Used by PatientBillingComponent and
 * PatientBillingListComponent — kept identical between the two so a
 * reprint looks exactly like the original.
 * ------------------------------------------------------------------ */
import React from "react";

export default function Field({ label, value, labelWidth = "w-40" }) {
  return (
    <div className="flex text-sm leading-6">
      <span className={`font-semibold text-gray-800 ${labelWidth}`}>{label}</span>
      <span className="text-gray-900">: {value || "-"}</span>
    </div>
  );
}
