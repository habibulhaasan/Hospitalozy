/**
 * components/shared/KpiCard.jsx
 * ------------------------------------------------------------------
 * Small stat card (label, big number, optional sub-label). Used
 * across AccountingComponent's KPI row. Generic enough to reuse for
 * any future dashboard tile.
 * ------------------------------------------------------------------ */
import React from "react";

export default function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`text-lg font-bold ${accent || "text-slate-800"}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
