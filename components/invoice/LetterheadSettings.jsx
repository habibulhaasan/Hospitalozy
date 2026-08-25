/**
 * components/invoice/LetterheadSettings.jsx
 * ------------------------------------------------------------------
 * The "print hospital name & address / reserve blank space for
 * pre-printed letterhead" toggle. Small enough it might seem
 * unnecessary to split out, but it's identical logic to the Lab
 * Report and Patient Billing components' letterhead toggle — worth
 * keeping as its own file so all three can eventually share it
 * instead of three copies drifting apart.
 * ------------------------------------------------------------------ */
import React from "react";

export default function LetterheadSettings({
  showLetterhead,
  setShowLetterhead,
  letterheadSpace,
  setLetterheadSpace,
  hospitalName,
  setHospitalName,
  hospitalAddress,
  setHospitalAddress,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <input
          id="show-letterhead-inv"
          type="checkbox"
          checked={showLetterhead}
          onChange={(e) => setShowLetterhead(e.target.checked)}
        />
        <label htmlFor="show-letterhead-inv" className="text-xs text-slate-600">
          Print hospital name & address (turn off if using preprinted letterhead paper)
        </label>
        {!showLetterhead && (
          <span className="flex items-center gap-1 text-xs text-slate-500 ml-2">
            Reserve
            <input
              type="number"
              min="0"
              className="border rounded px-1.5 py-0.5 w-14 text-xs"
              value={letterheadSpace}
              onChange={(e) => setLetterheadSpace(Number(e.target.value) || 0)}
            />
            mm blank space at top
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          className="border rounded px-2 py-1.5 text-sm"
          placeholder="Hospital / Facility name"
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
          disabled={!showLetterhead}
        />
        <input
          className="border rounded px-2 py-1.5 text-sm"
          placeholder="Hospital address / location"
          value={hospitalAddress}
          onChange={(e) => setHospitalAddress(e.target.value)}
          disabled={!showLetterhead}
        />
      </div>
    </div>
  );
}
