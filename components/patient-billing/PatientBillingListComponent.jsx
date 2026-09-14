"use client";

import React, { useState, useMemo, useEffect } from "react";
import Field from "@/components/shared/Field";
import Barcode from "@/components/shared/Barcode";
import Pagination from "@/components/shared/Pagination";
import { fmtDate, fmt12h } from "@/lib/format";
import { OPD_DEPARTMENTS as SPECIALTIES, DEPARTMENT_BN } from "@/data/opdDepartments";

/* fmtDate/fmt12h, Field, and the barcode renderer, plus the OPD
 * department list, were previously all duplicated directly in this
 * file (identically to PatientBillingComponent.jsx) — now imported
 * from the shared lib/data/components modules instead. `BillBarcode`
 * below is a thin alias so the rest of this file doesn't need
 * renaming throughout. */
const defaultHospital = {
  nameBn: "উপজেলা স্বাস্থ্য কমপ্লেক্স",
  nameEn: "Upazila Health Complex",
  address: "",
  contact: "",
  email: "",
};
function BillBarcode({ value }) {
  return <Barcode value={value} />;
}

/**
 * Firebase hookup — backend-agnostic, same pattern as the other list
 * components in this project.
 *
 *   onLoadRecentTickets(limit) => return the most recent N saved
 *     tickets (shape matches what PatientBillingComponent's
 *     onSaveBill receives: billNo, billDateTime, hospital,
 *     department, roomNo, healthId, visitFrom, visitTo,
 *     validUntilDate, patient, paymentAmount, printedBy). Populates
 *     the list on mount, before any search.
 *
 *   onSearchTickets(query) => return matching tickets for
 *     query = { text, department, dateFrom, dateTo }, where `text`
 *     matches against patient name, patient ID, or mobile.
 *
 * hospital details are read from each record first (the ticket
 * component already saves the hospital object per ticket), falling
 * back to this component's own props only for older records that
 * predate that field being saved.
 */
export default function PatientBillingListComponent({
  onLoadRecentTickets = async () => [],
  onSearchTickets = async () => [],
  onLoadTicketsPage = async () => ({}),
  hospital: fallbackHospital = defaultHospital,
} = {}) {
  const [tickets, setTickets] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading"); // "loading" | "loaded" | "error"
  const [mode, setMode] = useState("recent"); // "recent" | "search"

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [cursorStack, setCursorStack] = useState([]);
  const [lastRawDoc, setLastRawDoc] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchStatus, setSearchStatus] = useState(""); // "", "searching", "error"

  const [selected, setSelected] = useState(null); // the ticket record currently being viewed/reprinted

  useEffect(() => {
    loadPage(null, 1, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPage(cursor, pageNum, stack) {
    setPageLoading(true);
    if (tickets.length === 0) setLoadStatus("loading");
    try {
      const result = await onLoadTicketsPage({ cursor });
      setTickets(result.data);
      setHasMore(result.hasMore);
      setCurrentPage(pageNum);
      setCursorStack(stack);
      setLastRawDoc(result.lastDoc);
      setLoadStatus("loaded");
    } catch {
      setLoadStatus("error");
    } finally {
      setPageLoading(false);
    }
  }

  function handleNext() {
    loadPage(lastRawDoc, currentPage + 1, [...cursorStack, lastRawDoc]);
  }

  function handlePrev() {
    const newStack = cursorStack.slice(0, -1);
    const cursor = newStack.length > 0 ? newStack[newStack.length - 1] : null;
    loadPage(cursor, currentPage - 1, newStack);
  }

  async function handleSearch() {
    setMode("search");
    setSearchStatus("searching");
    try {
      const results = await onSearchTickets({
        text: searchText.trim(),
        department: departmentFilter === "All" ? undefined : departmentFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setTickets(Array.isArray(results) ? results : []);
      setSearchStatus("");
    } catch (err) {
      console.error(err);
      setSearchStatus("error");
    }
  }

  function handleBackToRecent() {
    setMode("recent");
    setSearchText("");
    setDepartmentFilter("All");
    setDateFrom("");
    setDateTo("");
    loadPage(null, 1, []);
  }

  const displayedTickets = useMemo(() => {
    // Client-side department filter also applies to the "recent" list
    // — onSearchTickets already applied it server-side for search mode.
    if (mode !== "recent" || departmentFilter === "All") return tickets;
    return tickets.filter((t) => t.department === departmentFilter);
  }, [tickets, mode, departmentFilter]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area {
            width: 100% !important;
            min-height: auto !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0.4in !important;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* ============ LIST / SEARCH UI (hidden on print) ============ */}
      <div className="no-print max-w-5xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h1 className="text-base font-semibold mb-3">Patient Billing Tickets</h1>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[220px]"
              placeholder="Search by Patient ID, Mobile, Name, or Ticket No."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <select className="border rounded px-2 py-1.5 text-sm" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option>All</option>
              {SPECIALTIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input type="date" className="border rounded px-2 py-1.5 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From date" />
            <input type="date" className="border rounded px-2 py-1.5 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To date" />
            <button onClick={handleSearch} disabled={searchStatus === "searching"} className="text-sm bg-gray-800 disabled:bg-gray-300 text-white px-4 py-1.5 rounded">
              {searchStatus === "searching" ? "Searching…" : "Search"}
            </button>
            {mode === "search" && (
              <button onClick={handleBackToRecent} className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded">
                Back to Recent
              </button>
            )}
          </div>
          {searchStatus === "error" && <p className="text-xs text-red-600 mt-2">Search failed — check the connection and try again.</p>}
          <p className="text-xs text-gray-400 mt-2">
            {mode === "recent" ? "Showing recent tickets." : `Showing search results — ${displayedTickets.length} match${displayedTickets.length !== 1 ? "es" : ""}.`}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          {loadStatus === "loading" && <div className="p-6 text-center text-sm text-gray-400">Loading tickets…</div>}
          {loadStatus === "error" && <div className="p-6 text-center text-sm text-red-500">Couldn't load tickets — check the connection.</div>}
          {loadStatus === "loaded" && displayedTickets.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">No tickets found.</div>
          )}
          {loadStatus === "loaded" && displayedTickets.length > 0 && (
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                  <th className="py-2 px-3 font-medium">Ticket No.</th>
                  <th className="py-2 px-3 font-medium">Bill Date</th>
                  <th className="py-2 px-3 font-medium">Patient</th>
                  <th className="py-2 px-3 font-medium">Patient ID</th>
                  <th className="py-2 px-3 font-medium">Mobile</th>
                  <th className="py-2 px-3 font-medium">Department</th>
                  <th className="py-2 px-3 font-medium">Room</th>
                  <th className="py-2 px-3 font-medium text-right">Fee</th>
                  <th className="py-2 px-3 font-medium w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedTickets.map((t) => (
                  <tr key={t.billNo} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-mono text-xs">{t.billNo}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{fmtDate(t.billDateTime)}</td>
                    <td className="py-2 px-3 font-medium">{t.patient?.name || "—"}</td>
                    <td className="py-2 px-3 text-xs text-gray-400">{t.patient?.patientId || "—"}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{t.patient?.mobile || "—"}</td>
                    <td className="py-2 px-3">
                      {t.department || "—"}
                      {t.department && DEPARTMENT_BN[t.department] && <span className="text-gray-400"> ({DEPARTMENT_BN[t.department]})</span>}
                    </td>
                    <td className="py-2 px-3">{t.roomNo || "—"}</td>
                    <td className="py-2 px-3 text-right">৳{Number(t.paymentAmount || 0).toLocaleString("en-BD")}</td>
                    <td className="py-2 px-3">
                      <button onClick={() => setSelected(t)} className="text-xs text-gray-600 hover:text-gray-900 underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {mode === "recent" && (
          <Pagination
            currentPage={currentPage}
            hasMore={hasMore}
            onPrev={handlePrev}
            onNext={handleNext}
            loading={pageLoading}
            totalOnPage={tickets.length}
          />
        )}
      </div>

      {/* ============ VIEW / REPRINT OVERLAY ============ */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto print:static print:bg-transparent print:overflow-visible">
          <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between max-w-[8.27in] mx-auto">
            <span className="text-sm font-medium">{selected.patient?.name || "Ticket"} — {selected.billNo}</span>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="text-sm bg-gray-800 text-white px-4 py-1.5 rounded">Print / Reprint</button>
              <button onClick={() => setSelected(null)} className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded">Close</button>
            </div>
          </div>

          <div
            className="print-area bg-white mx-auto my-4 print:my-0 shadow-sm print:shadow-none border border-gray-300 print:border-0"
            style={{ width: "8.27in", minHeight: "11.69in", padding: "0.5in", boxSizing: "border-box" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-gray-800 pb-3">
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                <div className="w-20 h-20 rounded-full border-2 border-green-700 flex items-center justify-center text-[9px] text-center text-green-800 font-semibold">
                  GOVT
                </div>
              </div>
              <div className="flex-1 text-center px-4">
                <h1 className="text-xl font-bold text-gray-900">{(selected.hospital || fallbackHospital).nameBn}</h1>
                <h2 className="text-base font-bold text-gray-900 mt-0.5">{(selected.hospital || fallbackHospital).nameEn}</h2>
                {(selected.hospital || fallbackHospital).address && (
                  <p className="text-xs text-gray-600 mt-1">Address: {(selected.hospital || fallbackHospital).address}</p>
                )}
                {((selected.hospital || fallbackHospital).contact || (selected.hospital || fallbackHospital).email) && (
                  <p className="text-xs text-gray-600">
                    {(selected.hospital || fallbackHospital).contact && `Contact: ${(selected.hospital || fallbackHospital).contact}`}
                    {(selected.hospital || fallbackHospital).contact && (selected.hospital || fallbackHospital).email && " | "}
                    {(selected.hospital || fallbackHospital).email && `Email: ${(selected.hospital || fallbackHospital).email}`}
                  </p>
                )}
              </div>
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                <div className="w-20 h-20 rounded-full border-2 border-green-700 flex items-center justify-center text-[9px] text-center text-green-800 font-semibold">
                  SEAL
                </div>
              </div>
            </div>

            {/* Ticket title row */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col items-start shrink-0">
                <BillBarcode value={selected.billNo} />
                <span className="text-[11px] font-semibold text-gray-800 mt-0.5">{selected.billNo}</span>
              </div>
              <h3 className="flex-1 text-center text-lg font-bold tracking-wide">OPD TICKET</h3>
              <div className="shrink-0 flex flex-col items-center">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Room No.</span>
                <div className="border-2 border-gray-800 rounded-md px-4 py-2 min-w-[80px] text-center">
                  <span className="text-2xl font-bold text-gray-900">{selected.roomNo || "-"}</span>
                </div>
              </div>
            </div>

            {/* Patient info */}
            <div className="grid grid-cols-2 gap-x-6 mt-4">
              <div>
                <Field label="Name" value={selected.patient?.name} labelWidth="w-20" />
                <Field label="Age" value={`${selected.patient?.ageY || "0"}Y ${selected.patient?.ageM || "0"}M ${selected.patient?.ageD || "0"}D`} labelWidth="w-20" />
                <Field label="Gender" value={selected.patient?.gender} labelWidth="w-20" />
                <Field label="NID" value={selected.patient?.nid} labelWidth="w-20" />
              </div>
              <div>
                <Field label="Patient ID" value={selected.patient?.patientId} labelWidth="w-24" />
                <Field label="Health ID" value={selected.healthId} labelWidth="w-24" />
                <Field label="Contact" value={selected.patient?.mobile} labelWidth="w-24" />
                <div className="flex text-sm leading-6">
                  <span className="font-semibold text-gray-800 w-24">Visit Date</span>
                  <span className="text-gray-900">
                    : {fmtDate(selected.billDateTime)}
                    {selected.visitFrom && ` from ${fmt12h(selected.visitFrom)}`}
                    {selected.visitTo && ` to ${fmt12h(selected.visitTo)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex text-sm leading-6 mt-1">
              <span className="font-semibold text-gray-800 w-20">Dept.</span>
              <span className="text-gray-900">
                : {selected.department || "-"}
                {selected.department && DEPARTMENT_BN[selected.department] && ` (${DEPARTMENT_BN[selected.department]})`}
              </span>
            </div>

            <hr className="border-t border-gray-800 mt-3" />

            {/* Rx area — blank, same as the original ticket */}
            <div className="flex mt-4" style={{ minHeight: "8in" }}>
              <div className="w-[30%] pr-4" />
              <div className="w-px bg-gray-400 mr-6" />
              <div className="flex-1">
                <span className="text-2xl italic font-serif">℞</span>
                <div className="mt-4 text-sm text-gray-300 select-none">
                  {/* this reprint doesn't carry the doctor's handwritten Rx — that only exists on the original paper copy */}
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="flex justify-end mt-6">
              <div className="text-center">
                <div className="w-56 border-t border-gray-800 pt-1">
                  <span className="text-sm text-gray-800">Doctor's Signature</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 border-t border-gray-300 pt-2">
              <p className="text-xs text-center text-gray-700">
                Note: This ticket is usable until {fmtDate(selected.validUntilDate)}
                {selected.visitFrom && ` from ${fmt12h(selected.visitFrom)}`}
                {selected.visitTo && ` to ${fmt12h(selected.visitTo)}`}
              </p>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Powered By: Hospitalozy</span>
                <span>Printed By: {selected.printedBy || "-"} (reprint)</span>
              </div>
              <div className="no-print text-[10px] text-amber-600 text-center mt-2">Reprint — original visit date/time shown above.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
