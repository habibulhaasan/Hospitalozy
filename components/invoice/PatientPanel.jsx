"use client";

/**
 * components/invoice/PatientPanel.jsx
 * ------------------------------------------------------------------
 * Existing/new patient toggle, lookup, and the registration form.
 * Pulled out of InvoiceComponent's builder UI — this exact panel is
 * also duplicated (by necessity, separate artifact files) in
 * PatientBillingComponent; if you consolidate those two into one
 * codebase, this file is what both should import instead of each
 * keeping their own copy.
 * ------------------------------------------------------------------ */
import React from "react";
import SearchableSelect from "@/components/shared/SearchableSelect";
import AsyncSearchableSelect from "@/components/shared/AsyncSearchableSelect";

export default function PatientPanel({
  patient,
  setPatient,
  patientMode,
  setPatientMode,
  lookupQuery,
  setLookupQuery,
  lookupStatus,
  onLookupPatient,
  onSearchPatients,
  onSelectPatient,
  doctorOptions,
  savePatientStatus,
  onSavePatient,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <button
          onClick={() => setPatientMode("existing")}
          className={`text-xs px-3 py-1 rounded-full border ${patientMode === "existing" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-300"}`}
        >
          Existing Patient
        </button>
        <button
          onClick={() => setPatientMode("new")}
          className={`text-xs px-3 py-1 rounded-full border ${patientMode === "new" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-300"}`}
        >
          New Patient
        </button>
      </div>

      {patientMode === "existing" && (
        <div className="mb-3">
          <label className="text-xs text-slate-500 block mb-1">
            Search Existing Patient
          </label>
          <AsyncSearchableSelect
            onSearch={async (query) => {
              if (!onSearchPatients) return [];
              const results = await onSearchPatients(query);
              return Array.isArray(results) ? results : [];
            }}
            onSelect={(selectedItem) => {
              if (onSelectPatient) {
                onSelectPatient(selectedItem);
              }
            }}
            placeholder="Type Patient ID, Name, Mobile, or NID to search…"
            emptyHint="No matching patient found."
            renderItem={(item) => {
              const ageParts = [
                item.ageY ? `${item.ageY}Y` : '',
                item.ageM ? `${item.ageM}M` : '',
                item.ageD ? `${item.ageD}D` : ''
              ].filter(Boolean).join(' ') || "—";

              return (
                <div className="flex justify-between items-center gap-2 py-0.5">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800">
                      {item.name || "Unnamed Patient"}{" "}
                      <span className="text-xs text-slate-400 font-normal">({item.patientId})</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      Age: {ageParts} | Mobile: {item.mobile || "—"}
                    </span>
                  </div>
                  {item.gender && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">
                      {item.gender}
                    </span>
                  )}
                </div>
              );
            }}
          />
          {lookupStatus === "found" && <p className="text-xs text-emerald-600 mt-1">Patient selected — details filled in below.</p>}
          {lookupStatus === "not-found" && <p className="text-xs text-amber-600 mt-1">No patient found — switch to "New Patient" to register them.</p>}
          {lookupStatus === "error" && <p className="text-xs text-red-600 mt-1">Lookup failed — check the connection and try again.</p>}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          className="border rounded px-2 py-1.5 text-sm col-span-2"
          placeholder="Patient name"
          value={patient.name}
          onChange={(e) => setPatient({ ...patient, name: e.target.value })}
        />
        <input
          className="border rounded px-2 py-1.5 text-sm"
          placeholder="Mobile number"
          value={patient.mobile}
          onChange={(e) => setPatient({ ...patient, mobile: e.target.value })}
        />
        <select
          className="border rounded px-2 py-1.5 text-sm"
          value={patient.gender}
          onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
        >
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <div className="col-span-2 md:col-span-1">
          <label className="text-[10px] text-slate-400 block mb-0.5">DOB (optional)</label>
          <input
            type="date"
            className="border rounded px-2 py-1.5 text-sm w-full"
            value={patient.dob}
            onChange={(e) => setPatient({ ...patient, dob: e.target.value })}
          />
        </div>
        <div className="col-span-2 md:col-span-2">
          <label className="text-[10px] text-slate-400 block mb-0.5">Age (auto-filled from DOB, or enter manually)</label>
          <div className="flex gap-1.5">
            <input
              className="border rounded px-2 py-1.5 text-sm w-full"
              placeholder="Y"
              value={patient.ageY}
              onChange={(e) => setPatient({ ...patient, ageY: e.target.value })}
            />
            <input
              className="border rounded px-2 py-1.5 text-sm w-full"
              placeholder="M"
              value={patient.ageM}
              onChange={(e) => setPatient({ ...patient, ageM: e.target.value })}
            />
            <input
              className="border rounded px-2 py-1.5 text-sm w-full"
              placeholder="D"
              value={patient.ageD}
              onChange={(e) => setPatient({ ...patient, ageD: e.target.value })}
            />
          </div>
        </div>
        <input
          className="border rounded px-2 py-1.5 text-sm"
          placeholder="NID / BRN (optional)"
          value={patient.nid}
          onChange={(e) => setPatient({ ...patient, nid: e.target.value })}
        />

        <textarea
          className="border rounded px-2 py-1.5 text-sm col-span-2 md:col-span-3"
          placeholder="Address"
          rows={1}
          value={patient.address}
          onChange={(e) => setPatient({ ...patient, address: e.target.value })}
        />
        <div>
          <SearchableSelect
            value={patient.referredBy}
            onChange={(v) => setPatient({ ...patient, referredBy: v })}
            options={doctorOptions}
            placeholder="Referred by (doctor)"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {patient.patientId && (
          <span className="text-xs bg-slate-100 border border-slate-300 rounded px-2 py-1">
            Patient ID: <b>{patient.patientId}</b>
          </span>
        )}
        <button
          onClick={onSavePatient}
          disabled={!patient.name.trim() || savePatientStatus === "saving"}
          className="text-sm bg-slate-800 disabled:bg-slate-300 text-white px-3 py-1.5 rounded"
        >
          {savePatientStatus === "saving" ? "Saving…" : patient.patientId ? "Update Patient Info" : "Register Patient"}
        </button>
        {savePatientStatus === "saved" && <span className="text-xs text-emerald-600">Saved ✓</span>}
        {savePatientStatus === "error" && <span className="text-xs text-red-600">Save failed</span>}
      </div>
    </div>
  );
}
