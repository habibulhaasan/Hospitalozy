/**
 * components/invoice/LineItemsTable.jsx
 * ------------------------------------------------------------------
 * The Sl./Test Name/Rate/Qty/Bill table inside the printable invoice.
 * Rate and Qty are editable inputs (styled to look plain on paper —
 * see PrintableInvoice's print CSS); the remove column is hidden on
 * print via the same `.no-print` class used throughout this project.
 * ------------------------------------------------------------------ */
import React from "react";
import { formatMoney } from "@/lib/format";

export default function LineItemsTable({ lineItems, onUpdateItem, onRemoveItem }) {
  return (
    <table className="w-full text-xs border-collapse mb-3">
      <thead>
        <tr className="text-left text-[10px] text-slate-500 border-b-2 border-slate-400">
          <th className="py-1 pr-2 font-medium w-8">Sl.</th>
          <th className="py-1 pr-2 font-medium">Test Name</th>
          <th className="py-1 pr-2 font-medium w-20 text-right">Rate</th>
          <th className="py-1 pr-2 font-medium w-14 text-right">Qty</th>
          <th className="py-1 font-medium w-24 text-right">Bill</th>
          <th className="no-print py-1 w-6"></th>
        </tr>
      </thead>
      <tbody>
        {lineItems.length === 0 && (
          <tr>
            <td colSpan={6} className="text-center text-slate-400 italic py-6">
              No tests added yet — search and add tests above.
            </td>
          </tr>
        )}
        {lineItems.map((it, idx) => (
          <tr key={it.id} className="border-b border-slate-100">
            <td className="py-1 pr-2">{idx + 1}</td>
            <td className="py-1 pr-2">{it.name}</td>
            <td className="py-1 pr-2 text-right">
              <input
                type="number"
                className="w-16 text-right bg-white border border-slate-300 rounded px-1 py-0.5 outline-none print:border-none print:p-0 print:m-0 print:bg-transparent"
                value={it.rate}
                onChange={(e) => onUpdateItem(it.id, "rate", e.target.value)}
              />
            </td>
            <td className="py-1 pr-2 text-right">
              <input
                type="number"
                min="1"
                className="w-10 text-right bg-white border border-slate-300 rounded px-1 py-0.5 outline-none print:border-none print:p-0 print:m-0 print:bg-transparent"
                value={it.qty}
                onChange={(e) => onUpdateItem(it.id, "qty", e.target.value)}
              />
            </td>
            <td className="py-1 text-right font-semibold">{formatMoney((Number(it.rate) || 0) * (Number(it.qty) || 0))}</td>
            <td className="no-print py-1 text-center">
              <button onClick={() => onRemoveItem(it.id)} className="text-slate-300 hover:text-red-500">✕</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
