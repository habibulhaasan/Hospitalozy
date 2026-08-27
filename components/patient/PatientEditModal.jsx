/**
 * components/patient/PatientEditModal.jsx
 * ------------------------------------------------------------------
 * Update form — no "create" path here on purpose. New patients are
 * only ever registered from the Invoice, Lab Report, or OPD Ticket
 * screens (all three already have this exact form built in, e.g.
 * InvoiceComponent's PatientPanel) — duplicating a "register brand
 * new patient" flow here would be a second place that logic has to
 * stay in sync. This modal only ever has draft.patientId set.
 * ------------------------------------------------------------------ */
import React from "react";
import SearchableSelect from "@/components/shared/SearchableSelect";

export default function PatientEditModal({ draft, setDraft, saveStatus, onSave, onClose, doctorOptions = [] }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold">Edit Patient</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <div className="p-5 space-y-3">
          <div className="text-xs text-slate-400">Patient ID: <span className="font-mono">{draft.patientId}</span></div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Name *</label>
            <input
              className="border rounded px-2 py-1.5 text-sm w-full"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Mobile</label>
              <input
                className="border rounded px-2 py-1.5 text-sm w-full"
                value={draft.mobile}
                onChange={(e) => setDraft({ ...draft, mobile: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Gender</label>
              <select
                className="border rounded px-2 py-1.5 text-sm w-full"
                value={draft.gender}
                onChange={(e) => setDraft({ ...draft, gender: e.target.value })}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Date of Birth (optional)</label>
              <input
                type="date"
                className="border rounded px-2 py-1.5 text-sm w-full"
                value={draft.dob}
                onChange={(e) => setDraft({ ...draft, dob: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">NID / BRN (optional)</label>
              <input
                className="border rounded px-2 py-1.5 text-sm w-full"
                value={draft.nid}
                onChange={(e) => setDraft({ ...draft, nid: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Age (Y)</label>
              <input className="border rounded px-2 py-1.5 text-sm w-full" value={draft.ageY} onChange={(e) => setDraft({ ...draft, ageY: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Age (M)</label>
              <input className="border rounded px-2 py-1.5 text-sm w-full" value={draft.ageM} onChange={(e) => setDraft({ ...draft, ageM: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Age (D)</label>
              <input className="border rounded px-2 py-1.5 text-sm w-full" value={draft.ageD} onChange={(e) => setDraft({ ...draft, ageD: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Address</label>
            <textarea
              className="border rounded px-2 py-1.5 text-sm w-full"
              rows={2}
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Referred By (doctor)</label>
            <SearchableSelect
              value={draft.referredBy}
              onChange={(v) => setDraft({ ...draft, referredBy: v })}
              options={doctorOptions}
              placeholder="Leave blank for Self"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
          {saveStatus === "error" && <span className="text-xs text-red-600 mr-auto">Save failed — try again.</span>}
          <button onClick={onClose} className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded">Cancel</button>
          <button
            onClick={onSave}
            disabled={!draft.name.trim() || saveStatus === "saving"}
            className="text-sm bg-slate-800 disabled:bg-slate-300 text-white px-4 py-1.5 rounded"
          >
            {saveStatus === "saving" ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
