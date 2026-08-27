/**
 * components/doctor/DoctorRow.jsx
 * ------------------------------------------------------------------
 * One row in the doctor table — split out of DoctorComponent so the
 * per-row delete-confirm state and markup aren't tangled up with the
 * table/list/modal logic around it.
 * ------------------------------------------------------------------ */
import React from "react";

export default function DoctorRow({ doctor, isConfirmingDelete, onView, onEdit, onRequestDelete, onConfirmDelete, onCancelDelete }) {
  return (
    <tr className="border-b border-slate-100 align-top">
      <td className="py-2 px-3 text-xs text-slate-500 font-mono whitespace-nowrap">{doctor.id}</td>
      <td className="py-2 px-3 font-medium">{doctor.name}</td>
      <td className="py-2 px-3">{doctor.specialty || "—"}</td>
      <td className="py-2 px-3">{doctor.designation || "—"}</td>
      <td className="py-2 px-3">
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {(doctor.qualifications || []).length === 0 && <span className="text-slate-400">—</span>}
          {(doctor.qualifications || []).map((q) => (
            <span key={q} className="bg-slate-100 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap">
              {q}
            </span>
          ))}
        </div>
      </td>
      <td className="py-2 px-3 whitespace-nowrap">{doctor.mobile || "—"}</td>
      <td className="py-2 px-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${doctor.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {doctor.status || "Active"}
        </span>
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <button onClick={() => onView(doctor)} className="text-xs text-slate-500 hover:text-slate-800">
            View
          </button>
          <button onClick={() => onEdit(doctor)} className="text-xs text-slate-500 hover:text-slate-800">
            Edit
          </button>
          {isConfirmingDelete ? (
            <span className="flex items-center gap-1 text-xs bg-red-50 border border-red-200 rounded px-1.5 py-0.5 whitespace-nowrap">
              <button onClick={() => onConfirmDelete(doctor.id)} className="text-red-700 font-semibold underline">Yes</button>
              <button onClick={onCancelDelete} className="text-slate-500 underline">No</button>
            </span>
          ) : (
            <button onClick={() => onRequestDelete(doctor.id)} className="text-xs text-slate-400 hover:text-red-500">
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
