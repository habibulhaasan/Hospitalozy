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

export default function TotalsPanel({ totals, previousDue, setPreviousDue, discount, setDiscount, received, setReceived, paymentMode = "paid", setPaymentMode = () => {} }) {
  return (
    <table className="text-xs w-72">
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
              className="w-24 text-right bg-white border border-slate-300 rounded px-1 py-0.5 outline-none print:border-none print:p-0 print:m-0 print:bg-transparent"
              value={previousDue}
              onChange={(e) => setPreviousDue(Number(e.target.value) || 0)}
            />
          </td>
        </tr>
        <tr className="border-t border-slate-200">
          <td className="py-0.5 font-medium">Payable</td>
          <td className="py-0.5 text-right font-medium">{formatMoney(totals.payable)}</td>
        </tr>
        <tr>
          <td className="py-0.5 text-slate-500">Discount</td>
          <td className="py-0.5 text-right">
            <input
              type="number"
              className="w-24 text-right bg-white border border-slate-300 rounded px-1 py-0.5 outline-none print:border-none print:p-0 print:m-0 print:bg-transparent"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
          </td>
        </tr>
        <tr className="border-t border-slate-300">
          <td className="py-0.5 font-semibold">Net Bill</td>
          <td className="py-0.5 text-right font-bold">{formatMoney(totals.netBill)}</td>
        </tr>
        <tr>
          <td className="py-0.5 text-slate-500 align-middle">
            <div className="flex items-center gap-2">
              <span>Received</span>
              <div className="no-print flex gap-1 bg-slate-100 rounded p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentMode("paid")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${paymentMode === "paid" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentMode("partial"); setReceived(totals.received || 0); }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${paymentMode === "partial" ? "bg-amber-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}
                >
                  Part
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("due")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${paymentMode === "due" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}
                >
                  Due
                </button>
              </div>
            </div>
          </td>
          <td className="py-0.5 text-right align-middle">
            {paymentMode === "partial" ? (
              <input
                type="number"
                className="w-24 text-right bg-white border border-slate-300 rounded px-1 py-0.5 outline-none print:border-none print:p-0 print:m-0 print:bg-transparent"
                value={received}
                onChange={(e) => setReceived(Number(e.target.value) || 0)}
              />
            ) : (
              <div className="w-24 ml-auto text-right bg-slate-50 border border-slate-200 rounded px-1 py-0.5 print:border-none print:bg-transparent print:p-0 print:m-0">
                {formatMoney(totals.received || 0)}
              </div>
            )}
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
