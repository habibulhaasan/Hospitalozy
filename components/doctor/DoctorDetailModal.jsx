/**
 * components/doctor/DoctorDetailModal.jsx
 * ------------------------------------------------------------------
 * Read-only detail view — separate from DoctorModal (the edit form)
 * on purpose, so clicking a row to check a doctor's details doesn't
 * put you one accidental keystroke away from changing them.
 * ------------------------------------------------------------------ */
import React from "react";

export default function DoctorDetailModal({ doctor, onClose, onEdit }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold">{doctor.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <div className="p-5 space-y-2 text-sm">
          <div className="text-xs text-slate-400 mb-2">Doctor ID: <span className="font-mono text-slate-600">{doctor.id}</span></div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div><span className="text-slate-500">Designation:</span> <b>{doctor.designation || "—"}</b></div>
            <div><span className="text-slate-500">Specialty:</span> <b>{doctor.specialty || "—"}</b></div>
            <div><span className="text-slate-500">Mobile:</span> <b>{doctor.mobile || "—"}</b></div>
            <div><span className="text-slate-500">Email:</span> <b>{doctor.email || "—"}</b></div>
            <div><span className="text-slate-500">BMDC Reg. No.:</span> <b>{doctor.bmdc || "—"}</b></div>
            <div><span className="text-slate-500">Chamber / Room:</span> <b>{doctor.chamber || "—"}</b></div>
            <div><span className="text-slate-500">Consultation Fee:</span> <b>{doctor.fee ? `৳${doctor.fee}` : "—"}</b></div>
            <div><span className="text-slate-500">Status:</span> <b>{doctor.status || "Active"}</b></div>
            <div className="col-span-2"><span className="text-slate-500">Available Time:</span> <b>{doctor.availableTime || "—"}</b></div>
          </div>

          <div className="pt-2 border-t border-slate-100 mt-2">
            <span className="text-slate-500 text-xs block mb-1">Qualifications:</span>
            <div className="flex flex-wrap gap-1">
              {(doctor.qualifications || []).length === 0 && <span className="text-slate-400 text-sm">—</span>}
              {(doctor.qualifications || []).map((q) => (
                <span key={q} className="bg-slate-100 text-xs px-2 py-0.5 rounded-full">{q}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-200">
          <button onClick={onClose} className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded">Close</button>
          <button onClick={() => onEdit(doctor)} className="text-sm bg-slate-800 text-white px-4 py-1.5 rounded">Edit</button>
        </div>
      </div>
    </div>
  );
}
