"use client";

/**
 * components/invoice/TestPicker.jsx
 * ------------------------------------------------------------------
 * Search box over the billable-items catalog, shows the rate inline,
 * adds a line item on pick. Used to embed its own copy of the fee
 * schedule (BILLABLE_TEST_CATALOG) — now reads from
 * data/billableItems.js instead, the same file TestMasterComponent's
 * Firestore seed uses, so a price change in one place is reflected
 * everywhere rather than needing the catalog edited in two files.
 * ------------------------------------------------------------------ */
import React, { useState, useMemo, useEffect, useRef } from "react";
import { BILLABLE_ITEMS } from "@/data/billableItems";
import { formatMoney } from "@/lib/format";

export default function TestPicker({ onAdd, catalog = BILLABLE_ITEMS }) {
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
    if (!term) return [];
    return catalog.filter((t) => t.name.toLowerCase().includes(term)).slice(0, 25);
  }, [query, catalog]);

  function pick(t) {
    onAdd({ name: t.name, rate: t.price ?? t.rate, turnaround: t.turnaroundHours ?? t.turnaround ?? 24 });
    setQuery("");
    setOpen(false);
  }
  function addCustom() {
    if (!query.trim()) return;
    onAdd({ name: query.trim(), rate: 0, turnaround: 24 });
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input
        className="border rounded px-2 py-1.5 text-sm w-full"
        placeholder="Search a test to add to the bill…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && filtered.length > 0) pick(filtered[0]);
        }}
      />
      {open && query && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded shadow-lg text-sm">
          {filtered.map((t) => (
            <div
              key={t.name}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(t);
              }}
              className="px-2 py-1.5 hover:bg-slate-100 cursor-pointer flex justify-between gap-2"
            >
              <span>{t.name}</span>
              <span className="text-slate-400 whitespace-nowrap">{formatMoney(t.price ?? t.rate)}</span>
            </div>
          ))}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              addCustom();
            }}
            className="px-2 py-1.5 hover:bg-slate-100 cursor-pointer text-emerald-700 border-t border-slate-100"
          >
            + Add "{query}" as a custom item
          </div>
        </div>
      )}
    </div>
  );
}
