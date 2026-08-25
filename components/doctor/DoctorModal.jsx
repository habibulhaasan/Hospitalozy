/**
 * components/doctor/DoctorModal.jsx
 * ------------------------------------------------------------------
 * The add/edit form. Takes the draft record and a setter — doesn't
 * know how saving actually happens (that's DoctorComponent's job via
 * onSave/onClose), so this file is pure form markup.
 * ------------------------------------------------------------------ */
import React from "react";
import SearchableSelect from "@/components/shared/SearchableSelect";
import MultiSearchableSelect from "@/components/shared/MultiSearchableSelect";
import { DESIGNATIONS, SPECIALTIES, QUALIFICATIONS } from "@/data/staffReference";

export default function DoctorModal({ draft, setDraft, saveStatus, onSave, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold">{draft.id ? "Edit Doctor" : "Add Doctor"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <div className="p-5 space-y-3">
          {draft.id && (
            <div className="text-xs text-slate-400">Doctor ID: <span className="font-mono">{draft.id}</span></div>
          )}

          <div>
            <label className="text-xs text-slate-500 block mb-1">Name *</label>
            <input
              className="border rounded px-2 py-1.5 text-sm w-full"
              placeholder="Dr. Full Name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Designation</label>
              <SearchableSelect
                value={draft.designation}
                onChange={(v) => setDraft({ ...draft, designation: v })}
                options={DESIGNATIONS}
                placeholder="Search or type"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Specialty / Department</label>
              <SearchableSelect
                value={draft.specialty}
                onChange={(v) => setDraft({ ...draft, specialty: v })}
                options={SPECIALTIES}
                placeholder="Search or type"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Qualifications</label>
            <MultiSearchableSelect
              values={draft.qualifications}
              onChange={(v) => setDraft({ ...draft, qualifications: v })}
              options={QUALIFICATIONS}
              placeholder="Search and add (MBBS, FCPS, MD…)"
              itemLabel="qualification"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">BMDC Reg. No.</label>
              <input
                className="border rounded px-2 py-1.5 text-sm w-full"
                value={draft.bmdc}
                onChange={(e) => setDraft({ ...draft, bmdc: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Mobile</label>
              <input
                className="border rounded px-2 py-1.5 text-sm w-full"
                value={draft.mobile}
                onChange={(e) => setDraft({ ...draft, mobile: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Email (optional)</label>
              <input
                className="border rounded px-2 py-1.5 text-sm w-full"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Chamber / Room No.</label>
              <input
                className="border rounded px-2 py-1.5 text-sm w-full"
                value={draft.chamber}
                onChange={(e) => setDraft({ ...draft, chamber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Consultation Fee</label>
              <input
                type="number"
                className="border rounded px-2 py-1.5 text-sm w-full"
                value={draft.fee}
                onChange={(e) => setDraft({ ...draft, fee: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Status</label>
              <select
                className="border rounded px-2 py-1.5 text-sm w-full"
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Available Days / Time (optional)</label>
            <input
              className="border rounded px-2 py-1.5 text-sm w-full"
              placeholder="e.g. Sat–Thu, 5:00 PM – 8:00 PM"
              value={draft.availableTime}
              onChange={(e) => setDraft({ ...draft, availableTime: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
          {saveStatus === "error" && <span className="text-xs text-red-600 mr-auto">Save failed — try again.</span>}
          <button onClick={onClose} className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!draft.name.trim() || saveStatus === "saving"}
            className="text-sm bg-slate-800 disabled:bg-slate-300 text-white px-4 py-1.5 rounded"
          >
            {saveStatus === "saving" ? "Saving…" : draft.id ? "Save Changes" : "Add Doctor"}
          </button>
        </div>
      </div>
    </div>
  );
}
