/**
 * components/invoice/TotalsPanel.jsx
 * ------------------------------------------------------------------
 * The six-row totals cascade: Total -> + Previous Due = Payable ->
 * - Discount = Net Bill -> - Received = Due. Only Previous Due,
 * Discount, and Received are inputs; Total/Payable/Net Bill/Due are
 * derived (computed in InvoiceComponent's `totals` useMemo) and just
 * displayed here.
 * ------------------------------------------------------------------ */
import React from "react";
import { formatMoney } from "@/lib/format";

export default function TotalsPanel({ totals, previousDue, setPreviousDue, discount, setDiscount, received, setReceived }) {
  return (
    <table className="text-xs w-64">
      <tbody>
        <tr>
          <td className="py-0.5 text-slate-500">Total</td>
          <td className="py-0.5 text-right font-medium">{formatMoney(totals.total)}</td>
        </tr>
        <tr>
          <td className="py-0.5 text-slate-500">Previous Due</td>
          <td className="py-0.5 text-right">
            <input
              type="number"
              className="w-24 text-right bg-transparent border-b border-slate-300 outline-none print:border-slate-300"
              value={previousDue}
              onChange={(e) => setPreviousDue(e.target.value)}
            />
          </td>
        </tr>
        <tr className="border-t border-slate-200">
          <td className="py-0.5 text-slate-500">Payable</td>
          <td className="py-0.5 text-right font-medium">{formatMoney(totals.payable)}</td>
        </tr>
        <tr>
          <td className="py-0.5 text-slate-500">Discount</td>
          <td className="py-0.5 text-right">
            <input
              type="number"
              className="w-24 text-right bg-transparent border-b border-slate-300 outline-none print:border-slate-300"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </td>
        </tr>
        <tr className="border-t border-slate-300">
          <td className="py-0.5 font-semibold">Net Bill</td>
          <td className="py-0.5 text-right font-bold">{formatMoney(totals.netBill)}</td>
        </tr>
        <tr>
          <td className="py-0.5 text-slate-500">Received</td>
          <td className="py-0.5 text-right">
            <input
              type="number"
              className="w-24 text-right bg-transparent border-b border-slate-300 outline-none print:border-slate-300"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
            />
          </td>
        </tr>
        <tr className="border-t border-slate-300">
          <td className="py-0.5 font-semibold">Due</td>
          <td className={`py-0.5 text-right font-bold ${totals.due > 0.004 ? "text-red-600" : ""}`}>
            {formatMoney(Math.max(totals.due, 0))}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
