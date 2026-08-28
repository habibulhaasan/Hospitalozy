"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Barcode from "@/components/shared/Barcode";
import { formatMoney, numberToWordsBDT, fmtDate, fmtDateTime } from "@/lib/format";

/* numberToWordsBDT/formatMoney/fmtDate/fmtDateTime and the barcode
 * renderer were previously all duplicated directly in this file
 * (identically to InvoiceComponent's own copies) — now imported from
 * the shared lib/format.js and components/shared/Barcode.jsx instead.
 * InvoiceBarcode below is a thin alias so the rest of the file
 * doesn't need renaming throughout. */
function InvoiceBarcode({ value }) {
  return <Barcode value={value} />;
}

const STATUS_STYLE = {
  PAID: "bg-emerald-50 text-emerald-700",
  DUE: "bg-red-50 text-red-700",
  FREE: "bg-slate-100 text-slate-600",
};

/**
 * Firebase hookup — backend-agnostic, same pattern as the other
 * components in this project.
 *
 *   onLoadRecentInvoices(limit) => return the most recent N saved
 *     invoices (shape matches what the Invoice component's
 *     onSaveInvoice receives: invoiceNumber, billDateTime,
 *     hospitalName, hospitalAddress, patient, lineItems, totals,
 *     status, deliveryDateTime). Populates the list on mount, before
 *     any search — e.g. `orderBy("billDateTime", "desc").limit(50)`.
 *
 *   onSearchInvoices(query) => return matching invoices for
 *     query = { text, dateFrom, dateTo, status }. `text` should
 *     match against invoice number, patient name, patient ID, or
 *     mobile — however that's best done on your backend (Firestore
 *     doesn't do free-text search natively, so this is often an
 *     Algolia/Typesense index or a few separate `where()` queries
 *     merged client-side).
 *
 * Note on historical fidelity: hospitalName/hospitalAddress are read
 * from each saved record first, falling back to this component's own
 * props only for older records saved before the Invoice component
 * started including them — so a reprint always shows what the
 * hospital's details actually were at billing time, not whatever
 * they've since been changed to.
 */
export default function InvoiceListComponent({
  onLoadRecentInvoices = async () => [],
  onSearchInvoices = async () => [],
  hospitalName: fallbackHospitalName = "Upazila Health Complex",
  hospitalAddress: fallbackHospitalAddress = "",
} = {}) {
  const [invoices, setInvoices] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading"); // "loading" | "loaded" | "error"
  const [mode, setMode] = useState("recent"); // "recent" | "search"

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchStatus, setSearchStatus] = useState(""); // "", "searching", "error"

  const [selected, setSelected] = useState(null); // the invoice record currently being viewed/reprinted

  useEffect(() => {
    onLoadRecentInvoices(50)
      .then((list) => {
        setInvoices(Array.isArray(list) ? list : []);
        setLoadStatus("loaded");
      })
      .catch(() => setLoadStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch() {
    setMode("search");
    setSearchStatus("searching");
    try {
      const results = await onSearchInvoices({
        text: searchText.trim(),
        status: statusFilter === "All" ? undefined : statusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setInvoices(Array.isArray(results) ? results : []);
      setSearchStatus("");
    } catch (err) {
      console.error(err);
      setSearchStatus("error");
    }
  }

  async function handleBackToRecent() {
    setMode("recent");
    setSearchText("");
    setStatusFilter("All");
    setDateFrom("");
    setDateTo("");
    setLoadStatus("loading");
    try {
      const list = await onLoadRecentInvoices(50);
      setInvoices(Array.isArray(list) ? list : []);
      setLoadStatus("loaded");
    } catch (err) {
      console.error(err);
      setLoadStatus("error");
    }
  }

  const displayedInvoices = useMemo(() => {
    // Client-side status filter also applies to the "recent" list —
    // onSearchInvoices already applied it server-side for search mode.
    if (mode !== "recent" || statusFilter === "All") return invoices;
    return invoices.filter((inv) => inv.status === statusFilter);
  }, [invoices, mode, statusFilter]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 auto !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { size: A4; margin: 0; }
      `}</style>

      {/* ============ LIST / SEARCH UI (hidden on print) ============ */}
      <div className="no-print max-w-5xl mx-auto p-4 space-y-4">
        {/* Header card — title + New Invoice button */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Invoices</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === "recent" ? "Showing recent invoices." : `Showing search results — ${displayedInvoices.length} match${displayedInvoices.length !== 1 ? "es" : ""}.`}
            </p>
          </div>
          <Link
            href="/dashboard/invoices/new"
            className="text-sm bg-slate-800 text-white px-4 py-1.5 rounded hover:bg-slate-700 transition-colors"
          >
            + New Invoice
          </Link>
        </div>

                {/* Search / filter card */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[220px]"
              placeholder="Search by Patient ID, Mobile, Name, or Invoice No."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <select className="border rounded px-2 py-1.5 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>PAID</option>
              <option>DUE</option>
              <option>FREE</option>
            </select>
            <input type="date" className="border rounded px-2 py-1.5 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From date" />
            <input type="date" className="border rounded px-2 py-1.5 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To date" />
            <button onClick={handleSearch} disabled={searchStatus === "searching"} className="text-sm bg-slate-800 disabled:bg-slate-300 text-white px-4 py-1.5 rounded">
              {searchStatus === "searching" ? "Searching…" : "Search"}
            </button>
            {mode === "search" && (
              <button onClick={handleBackToRecent} className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded">
                Back to Recent
              </button>
            )}
          </div>
          {searchStatus === "error" && <p className="text-xs text-red-600 mt-2">Search failed — check the connection and try again.</p>}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          {loadStatus === "loading" && <div className="p-6 text-center text-sm text-slate-400">Loading invoices…</div>}
          {loadStatus === "error" && <div className="p-6 text-center text-sm text-red-500">Couldn't load invoices — check the connection.</div>}
          {loadStatus === "loaded" && displayedInvoices.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-400">No invoices found.</div>
          )}
          {loadStatus === "loaded" && displayedInvoices.length > 0 && (
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-3 font-medium">Invoice No.</th>
                  <th className="py-2 px-3 font-medium">Bill Date</th>
                  <th className="py-2 px-3 font-medium">Patient</th>
                  <th className="py-2 px-3 font-medium">Patient ID</th>
                  <th className="py-2 px-3 font-medium">Mobile</th>
                  <th className="py-2 px-3 font-medium text-right">Net Bill</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedInvoices.map((inv) => (
                  <tr key={inv.invoiceNumber} className="border-b border-slate-100">
                    <td className="py-2 px-3 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{fmtDate(inv.billDateTime)}</td>
                    <td className="py-2 px-3 font-medium">{inv.patient?.name || "—"}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{inv.patient?.patientId || "—"}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{inv.patient?.mobile || "—"}</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatMoney(inv.totals?.netBill)}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[inv.status] || "bg-slate-100 text-slate-600"}`}>{inv.status}</span>
                    </td>
                    <td className="py-2 px-3">
                      <button onClick={() => setSelected(inv)} className="text-xs text-slate-600 hover:text-slate-900 underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ============ VIEW / REPRINT OVERLAY ============ */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto">
          <div className="no-print sticky top-0 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between max-w-[210mm] mx-auto">
            <span className="text-sm font-medium">Invoice {selected.invoiceNumber}</span>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="text-sm bg-slate-800 text-white px-4 py-1.5 rounded">Print / Reprint</button>
              <button onClick={() => setSelected(null)} className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded">Close</button>
            </div>
          </div>

          <div
            className="print-page bg-white shadow-lg my-4 mx-auto print:my-0 print:shadow-none relative"
            style={{ width: "210mm", minHeight: "297mm", padding: "12mm 14mm", boxSizing: "border-box" }}
          >
            <div className={`absolute top-[12mm] right-[14mm] border-2 rounded px-4 py-1 text-lg font-bold tracking-widest ${
              selected.status === "PAID" ? "bg-emerald-50 border-emerald-500 text-emerald-700"
              : selected.status === "DUE" ? "bg-red-50 border-red-500 text-red-700"
              : "bg-slate-100 border-slate-400 text-slate-600"
            }`}>
              {selected.status}
            </div>

            <div className="text-center border-b-2 border-slate-800 pb-2 mb-3">
              <div className="text-xl font-bold tracking-wide">{selected.hospitalName || fallbackHospitalName}</div>
              {(selected.hospitalAddress || fallbackHospitalAddress) && (
                <div className="text-xs text-slate-500">{selected.hospitalAddress || fallbackHospitalAddress}</div>
              )}
              <div className="text-xs text-slate-500">Invoice / Money Receipt</div>
            </div>

            <div className="flex justify-between text-xs mb-3">
              <div>
                <div>Invoice No: <b>{selected.invoiceNumber}</b></div>
                <div>Bill Time: <b>{fmtDateTime(selected.billDateTime)}</b></div>
                <div>Expected Delivery: <b>{fmtDateTime(selected.deliveryDateTime)}</b></div>
              </div>
              <InvoiceBarcode value={selected.invoiceNumber} />
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs border-y border-slate-200 py-2 mb-3">
              <div><span className="text-slate-500">Patient ID:</span> <b>{selected.patient?.patientId || "—"}</b></div>
              <div><span className="text-slate-500">Name:</span> <b>{selected.patient?.name || "—"}</b></div>
              <div><span className="text-slate-500">Mobile:</span> <b>{selected.patient?.mobile || "—"}</b></div>
              <div>
                <span className="text-slate-500">Age:</span>{" "}
                <b>{selected.patient?.ageY || "0"}Y {selected.patient?.ageM || "0"}M {selected.patient?.ageD || "0"}D</b>{" "}
                <span className="text-slate-500">/ Gender:</span> <b>{selected.patient?.gender || "—"}</b>
              </div>
              <div><span className="text-slate-500">NID/BRN:</span> <b>{selected.patient?.nid || "—"}</b></div>
              <div><span className="text-slate-500">Referred By:</span> <b>{selected.patient?.referredBy || "—"}</b></div>
              <div className="col-span-2"><span className="text-slate-500">Address:</span> <b>{selected.patient?.address || "—"}</b></div>
            </div>

            <table className="w-full text-xs border-collapse mb-3">
              <thead>
                <tr className="text-left text-[10px] text-slate-500 border-b-2 border-slate-400">
                  <th className="py-1 pr-2 font-medium w-8">Sl.</th>
                  <th className="py-1 pr-2 font-medium">Test Name</th>
                  <th className="py-1 pr-2 font-medium w-20 text-right">Rate</th>
                  <th className="py-1 pr-2 font-medium w-14 text-right">Qty</th>
                  <th className="py-1 font-medium w-24 text-right">Bill</th>
                </tr>
              </thead>
              <tbody>
                {(selected.lineItems || []).map((it, idx) => (
                  <tr key={it.id || idx} className="border-b border-slate-100">
                    <td className="py-1 pr-2">{idx + 1}</td>
                    <td className="py-1 pr-2">{it.name}</td>
                    <td className="py-1 pr-2 text-right">{formatMoney(it.rate)}</td>
                    <td className="py-1 pr-2 text-right">{it.qty}</td>
                    <td className="py-1 text-right font-semibold">{formatMoney((Number(it.rate) || 0) * (Number(it.qty) || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-2">
              <table className="text-xs w-64">
                <tbody>
                  <tr>
                    <td className="py-0.5 text-slate-500">Total</td>
                    <td className="py-0.5 text-right font-medium">{formatMoney(selected.totals?.total)}</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <td className="py-0.5 text-slate-500">Payable</td>
                    <td className="py-0.5 text-right font-medium">{formatMoney(selected.totals?.payable)}</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <td className="py-0.5 font-semibold">Net Bill</td>
                    <td className="py-0.5 text-right font-bold">{formatMoney(selected.totals?.netBill)}</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <td className="py-0.5 font-semibold">Due</td>
                    <td className={`py-0.5 text-right font-bold ${(selected.totals?.due || 0) > 0.004 ? "text-red-600" : ""}`}>
                      {formatMoney(Math.max(selected.totals?.due || 0, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-xs italic border-t border-slate-200 pt-2 mb-8">
              In Words: {numberToWordsBDT(selected.totals?.netBill)}
            </div>

            <div className="flex justify-between items-end absolute bottom-[12mm] left-[14mm] right-[14mm] text-xs">
              <div className="text-center">
                <div className="border-t border-slate-400 pt-1 w-40">Cashier / Receptionist</div>
              </div>
              <div className="text-center">
                <div className="border-t border-slate-400 pt-1 w-40">Patient / Attendant Signature</div>
              </div>
            </div>

            <div className="no-print text-[10px] text-amber-600 text-center mt-2">Reprint — original bill time shown above.</div>
          </div>
        </div>
      )}
    </div>
  );
}
