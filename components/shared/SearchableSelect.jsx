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
    return options.filter((o) => {
      if (typeof o === "string") return o.toLowerCase().includes(term);
      const quals = Array.isArray(o.qualifications) ? o.qualifications.join(" ") : (o.qualifications || "");
      const textToSearch = `${o.name || ""} ${quals} ${o.specialty || ""} ${o.id || ""} ${o.employeeId || ""} ${o.designation || ""} ${o.phone || ""}`;
      return textToSearch.toLowerCase().includes(term);
    });
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
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded shadow-lg text-sm">
          {filtered.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-slate-400">
              {emptyHint || "No match — your typed text will be used as-is."}
            </div>
          )}
          {filtered.map((o, idx) => {
            const isObj = typeof o === "object";
            const val = isObj ? o.name : o;
            
            let renderedItem = val;
            if (isObj && o.id && (o.specialty || o.qualifications)) {
              const quals = Array.isArray(o.qualifications) 
                ? o.qualifications.join(", ") 
                : o.qualifications;
                
              renderedItem = (
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800">
                    {o.name} <span className="text-xs text-slate-400 font-normal">({o.id})</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {o.specialty || "General"} {quals ? `| ${quals}` : ""}
                  </span>
                </div>
              );
            } else if (isObj && o.employeeId) {
              renderedItem = (
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800">
                    {o.name} <span className="text-xs text-slate-400 font-normal">({o.employeeId})</span>
                  </span>
                  {(o.designation || o.department) && (
                    <span className="text-xs text-slate-500">
                      {o.designation || ""} {o.department ? `| ${o.department}` : ""}
                    </span>
                  )}
                </div>
              );
            } else if (isObj && o.id && String(o.id).startsWith("AGT-")) {
              renderedItem = (
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800">
                    {o.name} <span className="text-xs text-slate-400 font-normal">({o.id})</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {o.phone ? `Phone: ${o.phone}` : "No phone"} | {o.defaultCommissionPercent}% share
                  </span>
                </div>
              );
            }

            return (
              <div
                key={isObj ? (o.id || o.employeeId || o.name) : o + idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(val);
                  setOpen(false);
                }}
                className="px-2 py-1.5 hover:bg-slate-100 cursor-pointer"
              >
                {renderedItem}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
