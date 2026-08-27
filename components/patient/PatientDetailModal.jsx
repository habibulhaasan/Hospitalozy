/**
 * components/patient/PatientDetailModal.jsx
 * ------------------------------------------------------------------
 * Read-only detail view — same "separate from Edit" reasoning as
 * DoctorDetailModal and Employee's view modal.
 * ------------------------------------------------------------------ */
import React from "react";

export default function PatientDetailModal({ patient, onClose, onEdit }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold">{patient.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <div className="p-5 space-y-2 text-sm">
          <div className="text-xs text-slate-400 mb-2">Patient ID: <span className="font-mono text-slate-600">{patient.patientId}</span></div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div><span className="text-slate-500">Mobile:</span> <b>{patient.mobile || "—"}</b></div>
            <div><span className="text-slate-500">Gender:</span> <b>{patient.gender || "—"}</b></div>
            <div><span className="text-slate-500">Age:</span> <b>{patient.ageY || "0"}Y {patient.ageM || "0"}M {patient.ageD || "0"}D</b></div>
            <div><span className="text-slate-500">Date of Birth:</span> <b>{patient.dob || "—"}</b></div>
            <div><span className="text-slate-500">NID / BRN:</span> <b>{patient.nid || "—"}</b></div>
            <div><span className="text-slate-500">Referred By:</span> <b>{patient.referredBy || "Self"}</b></div>
            <div className="col-span-2"><span className="text-slate-500">Address:</span> <b>{patient.address || "—"}</b></div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-200">
          <button onClick={onClose} className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded">Close</button>
          <button onClick={() => onEdit(patient)} className="text-sm bg-slate-800 text-white px-4 py-1.5 rounded">Edit</button>
        </div>
      </div>
    </div>
  );
}
