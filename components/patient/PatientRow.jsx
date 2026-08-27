/**
 * components/patient/PatientRow.jsx
 * ------------------------------------------------------------------
 * One row — View opens the read-only detail modal, Edit opens the
 * update form. No Delete button here on purpose (see PatientComponent's
 * doc comment).
 * ------------------------------------------------------------------ */
import React from "react";

export default function PatientRow({ patient, onView, onEdit }) {
  return (
    <tr className="border-b border-slate-100 align-top">
      <td className="py-2 px-3 text-xs text-slate-500 font-mono whitespace-nowrap">{patient.patientId}</td>
      <td className="py-2 px-3 font-medium">{patient.name}</td>
      <td className="py-2 px-3 whitespace-nowrap">{patient.mobile || "—"}</td>
      <td className="py-2 px-3">
        {patient.ageY || "0"}Y {patient.ageM || "0"}M {patient.ageD || "0"}D
      </td>
      <td className="py-2 px-3">{patient.gender || "—"}</td>
      <td className="py-2 px-3">{patient.nid || "—"}</td>
      <td className="py-2 px-3">{patient.referredBy || "—"}</td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <button onClick={() => onView(patient)} className="text-xs text-slate-500 hover:text-slate-800">
            View
          </button>
          <button onClick={() => onEdit(patient)} className="text-xs text-slate-500 hover:text-slate-800">
            Edit
          </button>
        </div>
      </td>
    </tr>
  );
}
