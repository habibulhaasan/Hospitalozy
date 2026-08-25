"use client";

/**
 * components/shared/MultiSearchableSelect.jsx
 * ------------------------------------------------------------------
 * Multi-value searchable combobox with removable chips — search,
 * pick several, Backspace on an empty search box removes the last
 * chip, anything typed that isn't in the list can be added as a
 * custom entry. Originally built just for DoctorComponent's
 * Qualifications field; generalized here with an `itemLabel` prop so
 * the "+ Add as custom ___" wording fits wherever else this gets used
 * (skills, tags, symptoms — anything that's "pick several, allow
 * custom").
 * ------------------------------------------------------------------ */
import React, { useState, useMemo, useEffect, useRef } from "react";

export default function MultiSearchableSelect({ values, onChange, options, placeholder, itemLabel = "item" }) {
  const [query, setQuery] = useState("");
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
    const term = query.trim().toLowerCase();
    return options.filter((o) => !values.includes(o) && (!term || o.toLowerCase().includes(term)));
  }, [query, options, values]);

  function addValue(v) {
    if (!values.includes(v)) onChange([...values, v]);
    setQuery("");
  }
  function removeValue(v) {
    onChange(values.filter((x) => x !== v));
  }

  const alreadyExact = options.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex flex-wrap gap-1 border rounded px-2 py-1.5 min-h-[38px]">
        {values.map((v) => (
          <span key={v} className="bg-slate-100 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            {v}
            <button onClick={() => removeValue(v)} className="text-slate-400 hover:text-red-500">✕</button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[100px] text-sm outline-none"
          placeholder={values.length ? "" : placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered.length > 0) {
              e.preventDefault();
              addValue(filtered[0]);
            } else if (e.key === "Backspace" && !query && values.length) {
              removeValue(values[values.length - 1]);
            }
          }}
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded shadow-lg text-sm">
          {filtered.map((o) => (
            <div
              key={o}
              onMouseDown={(e) => {
                e.preventDefault();
                addValue(o);
              }}
              className="px-2 py-1.5 hover:bg-slate-100 cursor-pointer"
            >
              {o}
            </div>
          ))}
          {query.trim() && !alreadyExact && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                addValue(query.trim());
              }}
              className="px-2 py-1.5 hover:bg-slate-100 cursor-pointer text-emerald-700 border-t border-slate-100"
            >
              + Add "{query.trim()}" as a custom {itemLabel}
            </div>
          )}
          {filtered.length === 0 && !query.trim() && (
            <div className="px-2 py-1.5 text-xs text-slate-400">All matching {itemLabel}s already added.</div>
          )}
        </div>
      )}
    </div>
  );
}
