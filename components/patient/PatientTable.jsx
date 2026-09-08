import React from "react";
import PatientRow from "./PatientRow";

export default function PatientTable({ loadStatus, patients, filteredPatients, onView, onEdit }) {
  if (loadStatus === "loading") {
    return <div className="p-6 text-center text-sm text-slate-400">Loading patients…</div>;
  }
  if (loadStatus === "error") {
    return <div className="p-6 text-center text-sm text-red-500">Couldn't load the patient list — check the connection.</div>;
  }
  if (filteredPatients.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-400">
        {patients.length === 0
          ? "No patients registered yet — patients are added from the Invoice, Lab Report, or OPD Ticket screens."
          : "No patients match this search."}
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
          <th className="py-2 px-3 font-medium">Patient ID</th>
          <th className="py-2 px-3 font-medium">Name</th>
          <th className="py-2 px-3 font-medium">Mobile</th>
          <th className="py-2 px-3 font-medium">Age</th>
          <th className="py-2 px-3 font-medium">Gender</th>
          <th className="py-2 px-3 font-medium">NID</th>
          <th className="py-2 px-3 font-medium">Referred By</th>
          <th className="py-2 px-3 font-medium w-28">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredPatients.map((p, idx) => (
          <PatientRow key={p.patientId || p.id || p.docId || idx} patient={p} onView={onView} onEdit={onEdit} />
        ))}
      </tbody>
    </table>
  );
}
