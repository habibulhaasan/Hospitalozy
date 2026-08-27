/**
 * components/doctor/DoctorTable.jsx
 * ------------------------------------------------------------------
 * The list view — loading/error/empty states plus the actual table,
 * built from DoctorRow. Takes plain data and callbacks; knows nothing
 * about Firestore or the modal.
 * ------------------------------------------------------------------ */
import React from "react";
import DoctorRow from "./DoctorRow";

export default function DoctorTable({
  loadStatus,
  doctors,
  filteredDoctors,
  confirmDeleteId,
  onView,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}) {
  if (loadStatus === "loading") {
    return <div className="p-6 text-center text-sm text-slate-400">Loading doctors…</div>;
  }
  if (loadStatus === "error") {
    return <div className="p-6 text-center text-sm text-red-500">Couldn't load the doctor list — check the connection.</div>;
  }
  if (filteredDoctors.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-400">
        {doctors.length === 0 ? '— click "+ Add Doctor" to get started.' : "No doctors match this search/filter."}
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
          <th className="py-2 px-3 font-medium">Doctor ID</th>
          <th className="py-2 px-3 font-medium">Name</th>
          <th className="py-2 px-3 font-medium">Specialty</th>
          <th className="py-2 px-3 font-medium">Designation</th>
          <th className="py-2 px-3 font-medium">Qualifications</th>
          <th className="py-2 px-3 font-medium">Mobile</th>
          <th className="py-2 px-3 font-medium">Status</th>
          <th className="py-2 px-3 font-medium w-40">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredDoctors.map((d) => (
          <DoctorRow
            key={d.id}
            doctor={d}
            isConfirmingDelete={confirmDeleteId === d.id}
            onView={onView}
            onEdit={onEdit}
            onRequestDelete={onRequestDelete}
            onConfirmDelete={onConfirmDelete}
            onCancelDelete={onCancelDelete}
          />
        ))}
      </tbody>
    </table>
  );
}
