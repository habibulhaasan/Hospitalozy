"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { REPORTABLE_PARAMETERS as TEST_CATALOG } from "@/data/reportableParameters";

/* TEST_CATALOG now imported from the same shared file
 * LabReportComponent uses — see the note there. This is the file
 * that most needed the fix: reprints depend on this exact catalog
 * matching what the original report was built from. */

/* Quick lookup by name — saved report records only store {name,
 * result}, so this is what maps a result back to its category, unit,
 * and reference range for display. */
const TEST_BY_NAME = Object.fromEntries(TEST_CATALOG.map((t) => [t.name, t]));

const STATUS_STYLE = {
  Draft: "bg-red-50 text-orange-700",
  Pending: "bg-yellow-50 text-yellow-700",
  Completed: "bg-slate-100 text-slate-800",
  Delivered: "bg-emerald-50 text-emerald-700",
};

const CATEGORY_SPECIMEN = {
  Hematology: "Blood",
  Coagulation: "Blood",
  Biochemistry: "Blood",
  Endocrine: "Blood",
  Serology: "Blood",
  "Tumor Marker": "Blood",
  "Urine & Stool": "Urine",
  "Urine R/M/E": "Urine",
  "Blood Bank": "Blood",
  "Culture & Sensitivity": "Blood",
  Histopathology: "Tissue/Biopsy",
};
const SPECIMEN_OVERRIDES = {
  "Stool R/M/E": "Stool",
  "Urine Culture & Sensitivity": "Urine",
  "Stool Culture & Sensitivity": "Stool",
  "Wound Swab Culture & Sensitivity": "Wound Swab",
  "Sputum Culture & Sensitivity": "Sputum",
};
function specimenFor(test) {
  if (!test) return "";
  return SPECIMEN_OVERRIDES[test.name] || CATEGORY_SPECIMEN[test.cat] || "Blood";
}

function getRange(test, sex) {
  if (!test || !test.numeric) return null;
  if (test.numeric.A) return test.numeric.A;
  if (sex === "F" && test.numeric.F) return test.numeric.F;
  if (test.numeric.M) return test.numeric.M;
  return null;
}

/* Normal-value column text — shows every applicable bucket (adult
 * male / adult female / child) together, unit included, rather than
 * resolving to a single number. The reader picks whichever applies. */
function formatRange(test) {
  if (!test) return "—";
  if (!test.numeric) return test.normalText || "—";
  const unitSuffix = test.unit ? ` ${test.unit}` : "";
  const parts = [];
  if (test.numeric.A) {
    parts.push(`${test.numeric.A[0]} – ${test.numeric.A[1]}${unitSuffix}`);
  } else {
    if (test.numeric.M) parts.push(`M: ${test.numeric.M[0]}–${test.numeric.M[1]}${unitSuffix}`);
    if (test.numeric.F) parts.push(`F: ${test.numeric.F[0]}–${test.numeric.F[1]}${unitSuffix}`);
  }
  if (test.numeric.C) parts.push(`Child: ${test.numeric.C[0]}–${test.numeric.C[1]}${unitSuffix}`);
  return parts.join("  |  ");
}

function flagFor(test, sex, resultValue) {
  const range = getRange(test, sex);
  if (!range || resultValue === "" || resultValue === undefined) return null;
  const val = parseFloat(resultValue);
  if (Number.isNaN(val)) return null;
  if (val < range[0]) return "L";
  if (val > range[1]) return "H";
  return "N";
}

function fmtDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Firebase hookup — backend-agnostic, same pattern as the other
 * components in this project.
 *
 *   onLoadRecentReports(limit) => return the most recent N saved
 *     reports (shape matches what the Lab Report component's
 *     onSaveReport receives: hospitalName, hospitalAddress, patient,
 *     technologist, pathologist, tests: [{name, result}], extraPages).
 *     Populates the list on mount, before any search.
 *
 *   onSearchReports(query) => return matching reports for
 *     query = { text, dateFrom, dateTo }, where `text` matches
 *     against patient name, patient ID/reg no, or mobile.
 *
 * hospitalName/hospitalAddress are read from each record first
 * (the Lab Report component already saves these per-report), falling
 * back to this component's own props only for older records that
 * predate that field being saved.
 */
export default function LabReportListComponent({
  onLoadRecentReports = async () => [],
  onSearchReports = async () => [],
  onUpdateStatus = async () => true,
  onMarkPrinted = async () => true,
  onLoadDoctors = async () => [],
  onLoadTechnologists = async () => [],
  onLoadPathologists = async () => [],
  hospitalName: fallbackHospitalName = "Upazila Health Complex",
  hospitalAddress: fallbackHospitalAddress = "",
} = {}) {
  const [reports, setReports] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading"); // "loading" | "loaded" | "error"
  const [mode, setMode] = useState("recent"); // "recent" | "search"

  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchStatus, setSearchStatus] = useState(""); // "", "searching", "error"

  const [selected, setSelected] = useState(null); // the report record currently being viewed/reprinted
  const [pendingStatuses, setPendingStatuses] = useState({}); // track unsaved status changes
  const [technologistOptions, setTechnologistOptions] = useState([]);
  const [pathologistOptions, setPathologistOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);

  useEffect(() => {
    onLoadDoctors().then(setDoctorOptions).catch(() => {});
    onLoadTechnologists().then(setTechnologistOptions).catch(() => {});
    onLoadPathologists().then(setPathologistOptions).catch(() => {});
    
    onLoadRecentReports(50)
      .then((list) => {
        setReports(Array.isArray(list) ? list : []);
        setLoadStatus("loaded");
      })
      .catch(() => setLoadStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch() {
    setMode("search");
    setSearchStatus("searching");
    try {
      const results = await onSearchReports({
        text: searchText.trim(),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setReports(Array.isArray(results) ? results : []);
      setSearchStatus("");
    } catch (err) {
      console.error(err);
      setSearchStatus("error");
    }
  }

  async function handleBackToRecent() {
    setMode("recent");
    setSearchText("");
    setDateFrom("");
    setDateTo("");
    setLoadStatus("loading");
    try {
      const list = await onLoadRecentReports(50);
      setReports(Array.isArray(list) ? list : []);
      setLoadStatus("loaded");
    } catch (err) {
      console.error(err);
      setLoadStatus("error");
    }
  }

  async function handlePrint() {
    window.print();
    if (selected && selected.id && onMarkPrinted && !selected.isPrinted) {
      await onMarkPrinted(selected.id);
      // Update local state
      setReports((prev) => prev.map((r) => r.id === selected.id ? { ...r, isPrinted: true } : r));
      setSelected((prev) => ({ ...prev, isPrinted: true }));
    }
  }

  // Build the same "one category per page" structure the Lab Report
  // component prints, from the saved {name, result} pairs.
  const selectedPages = useMemo(() => {
    if (!selected) return [];
    const groups = {};
    (selected.tests || []).forEach((t) => {
      const test = TEST_BY_NAME[t.name];
      const cat = test ? test.cat : "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ ...t, test });
    });
    const categoryPages = Object.entries(groups).map(([cat, items]) => ({ type: "category", key: cat, title: cat, items }));
    const extraPages = (selected.extraPages || []).map((p) => ({ type: "extra", key: p.id, title: p.title, rows: p.rows }));
    const all = [...categoryPages, ...extraPages];
    return all.length > 0 ? all : [{ type: "empty", key: "empty" }];
  }, [selected]);

  const specimenSummary = useMemo(() => {
    if (!selected) return "";
    const specimens = new Set();
    (selected.tests || []).forEach((t) => specimens.add(specimenFor(TEST_BY_NAME[t.name])));
    return [...specimens].join(", ");
  }, [selected]);

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
        {/* Header card */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Lab Reports</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === "recent" ? "Showing recent reports." : `Showing search results — ${reports.length} match${reports.length !== 1 ? "es" : ""}.`}
            </p>
          </div>
          <Link
            href="/dashboard/lab-reports/new"
            className="text-sm bg-slate-800 text-white px-4 py-1.5 rounded hover:bg-slate-700 transition-colors"
          >
            + New Report
          </Link>
        </div>

        {/* Search card */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[220px]"
              placeholder="Search by Patient ID, Mobile, or Name"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
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
          {loadStatus === "loading" && <div className="p-6 text-center text-sm text-slate-400">Loading reports…</div>}
          {loadStatus === "error" && <div className="p-6 text-center text-sm text-red-500">Couldn't load reports — check the connection.</div>}
          {loadStatus === "loaded" && reports.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-400">No reports found.</div>
          )}
          {loadStatus === "loaded" && reports.length > 0 && (
            <table className="w-full text-sm min-w-[780px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-3 font-medium">Report Date</th>
                  <th className="py-2 px-3 font-medium">Patient</th>
                  <th className="py-2 px-3 font-medium">Reg / ID</th>
                  <th className="py-2 px-3 font-medium"># Tests</th>
                  <th className="py-2 px-3 font-medium">Technologist</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Printed?</th>
                  <th className="py-2 px-3 font-medium w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((rep, idx) => (
                  <tr key={rep.id || idx} className="border-b border-slate-100">
                    <td className="py-2 px-3 whitespace-nowrap">{fmtDate(rep.patient?.reportDate)}</td>
                    <td className="py-2 px-3 font-medium">{rep.patient?.name || "—"}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{rep.patient?.regNo || "—"}</td>
                    <td className="py-2 px-3">{(rep.tests || []).length}</td>
                    <td className="py-2 px-3">{rep.technologist || "—"}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <select 
                          className={`text-[10px] px-2 py-1 rounded-full font-semibold border-0 outline-none cursor-pointer ${
                            STATUS_STYLE[pendingStatuses[rep.id] ?? rep.status ?? "Completed"] || "bg-slate-100 text-slate-600"
                          }`}
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', textAlign: 'center' }}
                          title="Click to change status"
                          value={pendingStatuses[rep.id] ?? rep.status ?? "Completed"}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            setPendingStatuses(prev => ({ ...prev, [rep.id]: newStatus }));
                          }}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                        {pendingStatuses[rep.id] && pendingStatuses[rep.id] !== (rep.status ?? "Completed") && (
                          <button 
                            onClick={async () => {
                              const newStatus = pendingStatuses[rep.id];
                              if (onUpdateStatus) {
                                await onUpdateStatus(rep.id, newStatus);
                                setReports(reports.map(r => r.id === rep.id ? { ...r, status: newStatus } : r));
                                setPendingStatuses(prev => {
                                  const next = { ...prev };
                                  delete next[rep.id];
                                  return next;
                                });
                              }
                            }}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-medium ml-1"
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs">
                      {rep.isPrinted ? <span className="text-[10px] px-2 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700">Yes</span> : <span className="text-slate-400">No</span>}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(rep)} className="text-xs text-slate-600 hover:text-slate-900 underline">
                          View
                        </button>
                        {rep.id && (
                          <a href={`/dashboard/lab-reports/${rep.id}/edit`} className="text-xs text-blue-600 hover:text-blue-900 underline">
                            Edit
                          </a>
                        )}
                        <button 
                          onClick={() => {
                            setSelected(rep);
                            setTimeout(() => {
                              window.print();
                              if (rep.id && onMarkPrinted && !rep.isPrinted) {
                                onMarkPrinted(rep.id).then(() => {
                                  setReports((prev) => prev.map((r) => r.id === rep.id ? { ...r, isPrinted: true } : r));
                                  setSelected((prev) => prev?.id === rep.id ? { ...prev, isPrinted: true } : prev);
                                });
                              }
                            }, 500);
                          }} 
                          className="text-xs text-emerald-600 hover:text-emerald-900 underline"
                        >
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ============ MODAL FOR REPRINT ============ */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto print:static print:bg-transparent print:overflow-visible">
          <div className="no-print sticky top-0 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between max-w-[210mm] mx-auto">
            <span className="text-sm font-medium">{selected.patient?.name || "Report"} — {selected.patient?.regNo || ""}</span>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="text-sm bg-slate-800 text-white px-4 py-1.5 rounded">Print / Reprint</button>
              <button onClick={() => setSelected(null)} className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded">Close</button>
            </div>
          </div>

          {selectedPages.map((page, idx) => {
            const isLast = idx === selectedPages.length - 1;
            return (
              <div
                key={page.key}
                className="print-page bg-white shadow-lg my-4 mx-auto print:my-0 print:shadow-none flex flex-col"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  padding: "12mm 14mm",
                  boxSizing: "border-box",
                  ...(isLast ? {} : { breakAfter: "page", pageBreakAfter: "always" }),
                }}
              >
                <div className="text-center border-b-2 border-slate-800 pb-2 mb-3">
                  <div className="text-lg font-bold tracking-wide">{selected.hospitalName || fallbackHospitalName}</div>
                  {(selected.hospitalAddress || fallbackHospitalAddress) && (
                    <div className="text-[10px] text-slate-500">{selected.hospitalAddress || fallbackHospitalAddress}</div>
                  )}
                  <div className="text-[10px] text-slate-500">Pathology & Diagnostic Report</div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs border-b border-slate-200 pb-2 mb-3">
                  <div><span className="text-slate-500">Name:</span> <b>{selected.patient?.name || "—"}</b></div>
                  <div><span className="text-slate-500">Reg / ID:</span> <b>{selected.patient?.regNo || "—"}</b></div>
                  <div><span className="text-slate-500">Age / Sex:</span> <b>{selected.patient?.age || "—"} / {selected.patient?.sex === "M" ? "Male" : "Female"}</b></div>
                  <div>
                    <span className="text-slate-500">Referred By:</span>{" "}
                    <b>
                      {(() => {
                        const refBy = selected.patient?.referredBy;
                        if (!refBy || refBy === "Self") return refBy || "Self";
                        const doc = doctorOptions.find((d) => d.name === refBy);
                        if (!doc) return refBy;
                        const quals = Array.isArray(doc.qualifications) ? doc.qualifications.join(", ") : doc.qualifications;
                        return [doc.name, quals, doc.specialty].filter(Boolean).join(", ");
                      })()}
                    </b>
                  </div>
                  <div><span className="text-slate-500">Collected:</span> <b>{fmtDate(selected.patient?.collectionDate)}</b></div>
                  <div><span className="text-slate-500">Reported:</span> <b>{fmtDate(selected.patient?.reportDate)}</b></div>
                  <div className="col-span-2"><span className="text-slate-500">Specimen:</span> <b>{specimenSummary || "—"}</b></div>
                </div>

                {page.type === "empty" && (
                  <div className="text-sm text-slate-400 italic py-10 text-center">No tests recorded on this report.</div>
                )}

                {page.type === "category" && (
                  <div className="flex-1">
                    <div className="text-xs font-bold uppercase tracking-wide bg-slate-100 px-2 py-1 mb-1">{page.title}</div>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="text-left text-[10px] text-slate-500 border-b border-slate-300">
                          <th className="py-1 pr-2 font-medium">Test Name</th>
                          <th className="py-1 pr-2 font-medium w-28">Result</th>
                          <th className="py-1 font-medium w-52">Normal Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.items.map(({ name, result, test }) => {
                          const flag = flagFor(test, selected.patient?.sex, result);
                          return (
                            <tr key={name} className="border-b border-slate-100">
                              <td className="py-1 pr-2">{name}</td>
                              <td className={`py-1 pr-2 font-semibold ${flag === "H" || flag === "L" ? "text-red-600" : ""}`}>
                                {result ? `${result}${test?.unit ? " " + test.unit : ""}` : "—"}
                              </td>
                              <td className="py-1 text-slate-500">{formatRange(test)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {page.type === "extra" && (
                  <div className="flex-1">
                    <div className="text-xs font-bold uppercase tracking-wide bg-slate-100 px-2 py-1 mb-1">{page.title}</div>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="text-left text-[10px] text-slate-500 border-b border-slate-300">
                          <th className="py-1 pr-2 font-medium">Test Name</th>
                          <th className="py-1 pr-2 font-medium w-28">Result</th>
                          <th className="py-1 font-medium w-52">Normal Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(page.rows || []).map((row) => (
                          <tr key={row.id} className="border-b border-slate-100">
                            <td className="py-1 pr-2">{row.name || "—"}</td>
                            <td className="py-1 pr-2 font-semibold">{row.result ? `${row.result}${row.unit ? " " + row.unit : ""}` : "—"}</td>
                            <td className="py-1 text-slate-500">{row.normal || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-between items-start mt-auto pt-16 text-xs">
                  <div className="text-center w-56">
                    <div className="border-t border-slate-400 pt-1">
                      <div className="font-bold text-slate-800">{selected.technologist || "\u00A0"}</div>
                      {(() => {
                        const techObj = technologistOptions.find(t => t.name === selected.technologist);
                        if (!techObj && !selected.technologist) return <div className="text-slate-500">Lab Technologist</div>;
                        if (!techObj) return <div className="text-slate-500">Medical Technologist</div>;
                        return (
                          <>
                            {techObj.qualifications && <div className="text-[10px] text-slate-600">{Array.isArray(techObj.qualifications) ? techObj.qualifications.join(", ") : techObj.qualifications}</div>}
                            <div className="text-[10px] text-slate-500">{techObj.designation || "Medical Technologist"}</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="text-center w-56">
                    <div className="border-t border-slate-400 pt-1">
                      <div className="font-bold text-slate-800">{selected.pathologist || "\u00A0"}</div>
                      {(() => {
                        const pathObj = pathologistOptions.find(p => p.name === selected.pathologist);
                        if (!pathObj && !selected.pathologist) return <div className="text-slate-500">Pathologist / Consultant</div>;
                        if (!pathObj) return <div className="text-slate-500">Pathologist / Consultant</div>;
                        return (
                          <>
                            {pathObj.qualifications && <div className="text-[10px] text-slate-600">{Array.isArray(pathObj.qualifications) ? pathObj.qualifications.join(", ") : pathObj.qualifications}</div>}
                            <div className="text-[10px] text-slate-500">
                              {pathObj.designation ? `${pathObj.designation}, ` : ""}{pathObj.specialty || "Pathology"}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 text-center mt-3">
                  Reference ranges are general adult values (with a broad pediatric band where noted) and may vary by analyzer/method — correlate clinically.
                </div>

                <div className="text-[9px] text-slate-300 text-right mt-1">Page {idx + 1} of {selectedPages.length}</div>
                {idx === 0 && <div className="no-print text-[10px] text-amber-600 text-center mt-1">Reprint — original report/collection dates shown above.</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
