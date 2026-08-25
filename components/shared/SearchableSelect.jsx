"use client";

/**
 * components/shared/SearchableSelect.jsx
 * ------------------------------------------------------------------
 * Single-value searchable combobox — type to filter a list, or type
 * something not in the list and it's accepted as free text. Used by
 * LabReport, Invoice, Doctor, TestMaster, Employee, PatientBilling,
 * and Accounting.
 *
 * This used to be copy-pasted into each of those files independently
 * (four slightly-diverged copies, per a quick diff) — this is now the
 * one canonical version everything imports instead.
 * ------------------------------------------------------------------ */
import React, { useState, useMemo, useEffect, useRef } from "react";

export default function SearchableSelect({ value, onChange, options, placeholder, emptyHint }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const term = (value || "").trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.toLowerCase().includes(term));
  }, [value, options]);

  return (
    <div className="relative" ref={wrapRef}>
      <input
        className="border rounded px-2 py-1.5 text-sm w-full"
        placeholder={placeholder}
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-slate-200 rounded shadow-lg text-sm">
          {filtered.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-slate-400">
              {emptyHint || "No match — your typed text will be used as-is."}
            </div>
          )}
          {filtered.map((o) => (
            <div
              key={o}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o);
                setOpen(false);
              }}
              className="px-2 py-1.5 hover:bg-slate-100 cursor-pointer"
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
