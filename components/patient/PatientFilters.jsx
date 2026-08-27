/**
 * components/patient/PatientFilters.jsx
 * ------------------------------------------------------------------
 * Just a search box — patients don't have a category/department
 * dimension worth filtering by the way doctors (specialty) or
 * employees (department) do.
 * ------------------------------------------------------------------ */
import React from "react";

export default function PatientFilters({ search, onSearchChange }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <input
        className="border rounded px-2 py-1.5 text-sm w-full"
        placeholder="Search by Patient ID, Name, Mobile, or NID"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
