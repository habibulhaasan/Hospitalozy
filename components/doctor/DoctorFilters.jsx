/**
 * components/doctor/DoctorFilters.jsx
 * ------------------------------------------------------------------
 * Search box + specialty filter dropdown above the table.
 * ------------------------------------------------------------------ */
import React from "react";
import { SPECIALTIES } from "@/data/staffReference";

export default function DoctorFilters({ search, onSearchChange, specialtyFilter, onSpecialtyChange }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 flex flex-wrap gap-2 items-center">
      <input
        className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[200px]"
        placeholder="Search by name, mobile, or BMDC no."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="border rounded px-2 py-1.5 text-sm"
        value={specialtyFilter}
        onChange={(e) => onSpecialtyChange(e.target.value)}
      >
        <option>All</option>
        {SPECIALTIES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
