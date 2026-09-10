"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { REPORTABLE_PARAMETERS as TEST_CATALOG } from "@/data/reportableParameters";
import AsyncSearchableSelect from "@/components/shared/AsyncSearchableSelect";
import SearchableSelect from "@/components/shared/SearchableSelect";

/* TEST_CATALOG now imported from data/reportableParameters.js — the
 * canonical source also used by TestMasterComponent's price seed
 * (via data/billableItems.js's reportParameters links) and by
 * LabReportListComponent for reprints. This file used to carry its
 * own embedded copy of this exact array; that duplication is what
 * data/reportableParameters.js replaces. */

const CATEGORIES = [...new Set(TEST_CATALOG.map((t) => t.cat))];

/* Which specimen a category is drawn from, by default. Per-test
 * overrides below handle the exceptions inside a mixed category. */
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

/* Quick-add panels — bundles of tests commonly ordered together. */
const PANELS = {
  CBC: [
    "Hemoglobin (Hb%)",
    "RBC Count",
    "PCV / Hematocrit (Hct)",
    "MCV",
    "MCH",
    "MCHC",
    "Total Count of WBC (TC)",
    "Neutrophil (DC)",
    "Lymphocyte (DC)",
    "Monocyte (DC)",
    "Eosinophil (DC)",
    "Basophil (DC)",
    "Platelet Count",
    "ESR",
  ],
  "Urine R/M/E": TEST_CATALOG.filter((t) => t.cat === "Urine R/M/E").map((t) => t.name),
};
PANELS.General = [...PANELS.CBC, ...PANELS["Urine R/M/E"]];

/* "General" is a virtual catalog tab (not a real `cat` value) that
 * bundles the tests done on a routine/regular basis — currently
 * CBC + full Urine R/M/E — so they're all one click away without
 * hunting through Hematology/Urine R/M/E separately. */
const GENERAL_TEST_NAMES = PANELS.General;
const TAB_CATEGORIES = ["General", ...CATEGORIES];

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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// SearchableSelect is now imported from @/components/shared/SearchableSelect

const DEFAULT_PATIENT = {
  name: "",
  age: "",
  sex: "M",
  regNo: "",
  referredBy: "",
  collectionDate: todayISO(),
  reportDate: todayISO(),
};

/**
 * Firebase hookup:
 * This component stays backend-agnostic — pass in your own async
 * functions as props and it will call them at the right moments.
 *
 *   onLookupPatient(regNo) => return { name, age, sex } for a match
 *     (patient master record), or null/undefined if not found.
 *
 *   onLookupInvoice(regNo) => return { referredBy, collectionDate }
 *     sourced from that patient's invoice, or null/undefined if none.
 *     Only fields present on the returned object are applied — leave
 *     a field out (or return null) to keep whatever the user typed.
 *
 *   onSearchBillingSource(text) => the usual way a report actually
 *     gets started: search by Invoice No., OPD Ticket No., patient
 *     name, or mobile, and pick the right one from a dropdown instead
 *     of retyping patient details a technologist already entered at
 *     billing. Return an array shaped like
 *     lib/firestore/billingSources.js::searchBillingSources's output
 *     — each result populates regNo/name/sex/age/referredBy/
 *     collectionDate in one click. Leave unset and this search box
 *     just doesn't return anything, falling back to the manual
 *     Reg/Patient ID + Lookup flow below it.
 *
 *   onSaveReport({ hospitalName, patient, technologist, pathologist, tests })
 *     => persist the report however you like. Awaited; throw to
 *     surface a "Save failed" state.
 *
 *   onLoadDoctors() / onLoadTechnologists() / onLoadPathologists()
 *     => each return a string[] of names to populate the searchable
 *     dropdowns. Called once on mount. Leave unset and the dropdowns
 *     just work as free-text fields with nothing to suggest.
 */
export default function LabReportComponent({
  onLookupPatient = async () => null,
  onLookupInvoice = async () => null,
  onSearchBillingSource = async () => [],
  onSaveReport = async (payload) => {
    console.log("onSaveReport not wired up yet — payload:", payload);
  },
  onLoadDoctors = async () => [],
  onLoadTechnologists = async () => [],
  onLoadPathologists = async () => [],
} = {}) {
  const [patient, setPatient] = useState(DEFAULT_PATIENT);
  const [hospitalName, setHospitalName] = useState("Upazila Health Complex");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [showLetterhead, setShowLetterhead] = useState(true);
  const [letterheadSpace, setLetterheadSpace] = useState(40); // mm reserved when using preprinted letterhead
  const [technologist, setTechnologist] = useState("");
  const [pathologist, setPathologist] = useState("");
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [technologistOptions, setTechnologistOptions] = useState([]);
  const [pathologistOptions, setPathologistOptions] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("General");
  const [selected, setSelected] = useState([]); // array of {name, result}
  const [extraPages, setExtraPages] = useState([]); // free-text pages for tests outside the catalog
  const [lookupStatus, setLookupStatus] = useState(""); // "", "loading", "found", "not-found", "error"
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "saved", "error"
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    onLoadDoctors().then(setDoctorOptions).catch(() => {});
    onLoadTechnologists().then(setTechnologistOptions).catch(() => {});
    onLoadPathologists().then(setPathologistOptions).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCatalog = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term) {
      return TEST_CATALOG.filter((t) => t.name.toLowerCase().includes(term));
    }
    if (activeCat === "General") {
      return TEST_CATALOG.filter((t) => GENERAL_TEST_NAMES.includes(t.name));
    }
    return TEST_CATALOG.filter((t) => t.cat === activeCat);
  }, [search, activeCat]);

  function toggleTest(test) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.name === test.name);
      if (exists) return prev.filter((s) => s.name !== test.name);
      return [...prev, { name: test.name, result: "" }];
    });
  }

  function updateResult(name, value) {
    setSelected((prev) =>
      prev.map((s) => (s.name === name ? { ...s, result: value } : s))
    );
  }

  function removeTest(name) {
    setSelected((prev) => prev.filter((s) => s.name !== name));
  }

  function addPanel(panelName) {
    const names = PANELS[panelName] || [];
    setSelected((prev) => {
      const existingNames = new Set(prev.map((s) => s.name));
      const additions = names
        .filter((n) => !existingNames.has(n))
        .map((n) => ({ name: n, result: "" }));
      return [...prev, ...additions];
    });
  }

  function newRowId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function addExtraPage() {
    setExtraPages((prev) => [
      ...prev,
      {
        id: newRowId(),
        title: `Additional Tests ${prev.length + 1}`,
        rows: [{ id: newRowId(), name: "", result: "", unit: "", normal: "" }],
      },
    ]);
  }

  function removeExtraPage(pageId) {
    setExtraPages((prev) => prev.filter((p) => p.id !== pageId));
  }

  function updateExtraPageTitle(pageId, title) {
    setExtraPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, title } : p)));
  }

  function addExtraRow(pageId) {
    setExtraPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? { ...p, rows: [...p.rows, { id: newRowId(), name: "", result: "", unit: "", normal: "" }] }
          : p
      )
    );
  }

  function updateExtraRow(pageId, rowId, field, value) {
    setExtraPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? { ...p, rows: p.rows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)) }
          : p
      )
    );
  }

  function removeExtraRow(pageId, rowId) {
    setExtraPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, rows: p.rows.filter((r) => r.id !== rowId) } : p))
    );
  }

  function handlePrint() {
    window.print();
  }

  function handleReset() {
    setPatient(DEFAULT_PATIENT);
    setSelected([]);
    setExtraPages([]);
    setSearch("");
    setActiveCat("General");
    setTechnologist("");
    setPathologist("");
    setLookupStatus("");
    setSaveStatus("");
    setConfirmingReset(false);
  }

  async function handleLookupPatient() {
    if (!patient.regNo) return;
    setLookupStatus("loading");
    try {
      const [patientRecord, invoice] = await Promise.all([
        onLookupPatient(patient.regNo),
        onLookupInvoice(patient.regNo),
      ]);
      if (!patientRecord && !invoice) {
        setLookupStatus("not-found");
        return;
      }
      setPatient((prev) => ({
        ...prev,
        ...(patientRecord || {}),
        referredBy: (invoice && invoice.referredBy) || prev.referredBy,
        collectionDate: (invoice && invoice.collectionDate) || prev.collectionDate,
        regNo: prev.regNo,
      }));
      setLookupStatus("found");
    } catch (err) {
      console.error(err);
      setLookupStatus("error");
    }
  }

  function handleSelectBillingSource(item) {
    const ageParts = [
      item.ageY && `${item.ageY}Y`,
      item.ageM && `${item.ageM}M`,
      item.ageD && `${item.ageD}D`,
    ].filter(Boolean);
    setPatient((prev) => ({
      ...prev,
      regNo: item.patientId || prev.regNo,
      name: item.patientName || prev.name,
      sex: item.gender === "Female" ? "F" : item.gender === "Male" ? "M" : prev.sex,
      age: ageParts.length ? ageParts.join(" ") : prev.age,
      referredBy: item.referredBy || prev.referredBy,
      collectionDate: item.collectionDate || prev.collectionDate,
    }));
    setLookupStatus("found");
  }

  async function handleSaveReport() {
    setSaveStatus("saving");
    try {
      await onSaveReport({
        hospitalName,
        hospitalAddress,
        patient: { ...patient, referredBy: patient.referredBy || "Self" },
        technologist,
        pathologist,
        tests: selected,
        extraPages,
      });
      setSaveStatus("saved");
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  }

  const selectedByCat = useMemo(() => {
    const groups = {};
    selected.forEach((s) => {
      const test = TEST_CATALOG.find((t) => t.name === s.name);
      const cat = test ? test.cat : "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ ...s, test });
    });
    return groups;
  }, [selected]);

  const specimenSummary = useMemo(() => {
    const specimens = new Set();
    selected.forEach((s) => {
      const test = TEST_CATALOG.find((t) => t.name === s.name);
      specimens.add(specimenFor(test));
    });
    return [...specimens].join(", ");
  }, [selected]);

  const categoryEntries = Object.entries(selectedByCat);

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

      {/* ============ BUILDER UI (hidden on print) ============ */}
      <div className="no-print max-w-6xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Hospital & Patient Details
          </h2>
          <div className="flex items-center gap-2 mb-3">
            <input
              id="show-letterhead"
              type="checkbox"
              checked={showLetterhead}
              onChange={(e) => setShowLetterhead(e.target.checked)}
            />
            <label htmlFor="show-letterhead" className="text-xs text-slate-600">
              Print hospital name & address (turn off if using preprinted letterhead paper)
            </label>
            {!showLetterhead && (
              <span className="flex items-center gap-1 text-xs text-slate-500 ml-2">
                Reserve
                <input
                  type="number"
                  min="0"
                  className="border rounded px-1.5 py-0.5 w-14 text-xs"
                  value={letterheadSpace}
                  onChange={(e) => setLetterheadSpace(Number(e.target.value) || 0)}
                />
                mm blank space at top
              </span>
            )}
          </div>
          <div className="mb-3">
            <label className="text-xs text-slate-500 block mb-1">
              Find Patient via Invoice No. or OPD Ticket No.
            </label>
            <AsyncSearchableSelect
              onSearch={onSearchBillingSource}
              onSelect={handleSelectBillingSource}
              placeholder="Search by Invoice No., Ticket No., patient name, or mobile…"
              emptyHint="No matching invoice or OPD ticket found."
              renderItem={(item) => (
                <div className="flex justify-between gap-2">
                  <span>
                    {item.refNo} — {item.patientName || "Unknown patient"}
                  </span>
                  <span className="text-slate-400 text-xs whitespace-nowrap">{item.source}</span>
                </div>
              )}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Or enter the Reg / Patient ID directly below if you already know it.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              className="border rounded px-2 py-1.5 text-sm col-span-2 md:col-span-4"
              placeholder="Hospital / Facility name"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              disabled={!showLetterhead}
            />
            <input
              className="border rounded px-2 py-1.5 text-sm col-span-2 md:col-span-4"
              placeholder="Hospital address / location"
              value={hospitalAddress}
              onChange={(e) => setHospitalAddress(e.target.value)}
              disabled={!showLetterhead}
            />
            <input
              className="border rounded px-2 py-1.5 text-sm"
              placeholder="Patient name"
              value={patient.name}
              onChange={(e) => setPatient({ ...patient, name: e.target.value })}
            />
            <input
              className="border rounded px-2 py-1.5 text-sm"
              placeholder="Age"
              value={patient.age}
              onChange={(e) => setPatient({ ...patient, age: e.target.value })}
            />
            <select
              className="border rounded px-2 py-1.5 text-sm"
              value={patient.sex}
              onChange={(e) => setPatient({ ...patient, sex: e.target.value })}
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
            <div className="flex gap-1.5">
              <input
                className="border rounded px-2 py-1.5 text-sm flex-1"
                placeholder="Reg / Patient ID"
                value={patient.regNo}
                onChange={(e) => setPatient({ ...patient, regNo: e.target.value })}
              />
              <button
                onClick={handleLookupPatient}
                disabled={!patient.regNo || lookupStatus === "loading"}
                className="text-xs px-2.5 rounded border border-slate-300 bg-slate-50 disabled:opacity-50 whitespace-nowrap"
              >
                {lookupStatus === "loading" ? "Looking up…" : "Lookup"}
              </button>
            </div>

            <div className="col-span-2 md:col-span-2">
              <SearchableSelect
                value={patient.referredBy}
                onChange={(v) => setPatient({ ...patient, referredBy: v })}
                options={doctorOptions}
                placeholder="Referred by (leave blank for Self)"
              />
            </div>

            <input
              type="date"
              className="border rounded px-2 py-1.5 text-sm"
              value={patient.collectionDate}
              onChange={(e) => setPatient({ ...patient, collectionDate: e.target.value })}
            />
            <input
              type="date"
              className="border rounded px-2 py-1.5 text-sm"
              value={patient.reportDate}
              onChange={(e) => setPatient({ ...patient, reportDate: e.target.value })}
            />
          </div>
          {lookupStatus === "found" && (
            <p className="text-xs text-emerald-600 mt-2">Patient found — details filled in below.</p>
          )}
          {lookupStatus === "not-found" && (
            <p className="text-xs text-amber-600 mt-2">No patient found for this ID — enter details manually.</p>
          )}
          {lookupStatus === "error" && (
            <p className="text-xs text-red-600 mt-2">Lookup failed — check the connection and try again.</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Reported By
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Medical Technologist</label>
              <SearchableSelect
                value={technologist}
                onChange={setTechnologist}
                options={technologistOptions}
                placeholder="Search or type a name"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Pathologist</label>
              <SearchableSelect
                value={pathologist}
                onChange={setPathologist}
                options={pathologistOptions}
                placeholder="Search or type a name"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Add Tests to Report
          </h2>
          <input
            className="border rounded px-2 py-1.5 text-sm w-full mb-3"
            placeholder="Search a test by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {!search && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {TAB_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    activeCat === c
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-600 border-slate-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          {!search && activeCat === "General" && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => addPanel("CBC")}
                className="text-xs px-2.5 py-1 rounded-full border bg-amber-50 border-amber-300 text-amber-800 font-medium"
              >
                + Add CBC Panel (14 tests)
              </button>
              <button
                onClick={() => addPanel("Urine R/M/E")}
                className="text-xs px-2.5 py-1 rounded-full border bg-amber-50 border-amber-300 text-amber-800 font-medium"
              >
                + Add Urine R/M/E Panel ({PANELS["Urine R/M/E"].length} tests)
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto pr-1">
            {filteredCatalog.map((t) => {
              const isSel = selected.some((s) => s.name === t.name);
              return (
                <button
                  key={t.name}
                  onClick={() => toggleTest(t)}
                  className={`text-left text-xs px-2 py-1.5 rounded border ${
                    isSel
                      ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  {isSel ? "✓ " : "+ "}
                  {t.name}
                </button>
              );
            })}
            {filteredCatalog.length === 0 && (
              <div className="text-xs text-slate-400 col-span-full">No matching test.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selected.length} test{selected.length !== 1 ? "s" : ""} · {extraPages.length} extra page{extraPages.length !== 1 ? "s" : ""} — enter results directly in the report view below.
          </span>
          <div className="flex items-center gap-2">
            {saveStatus === "saved" && <span className="text-xs text-emerald-600">Saved ✓</span>}
            {saveStatus === "error" && <span className="text-xs text-red-600">Save failed</span>}
            {confirmingReset ? (
              <span className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 rounded px-2 py-1">
                Clear everything?
                <button onClick={handleReset} className="text-red-700 font-semibold underline">
                  Yes, reset
                </button>
                <button onClick={() => setConfirmingReset(false)} className="text-slate-500 underline">
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmingReset(true)}
                className="text-sm bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded"
              >
                Reset Report
              </button>
            )}
            <button
              onClick={addExtraPage}
              className="text-sm bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded"
            >
              + Add Extra Page
            </button>
            <button
              onClick={handleSaveReport}
              disabled={(selected.length === 0 && extraPages.length === 0) || saveStatus === "saving"}
              className="text-sm bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-1.5 rounded"
            >
              {saveStatus === "saving" ? "Saving…" : "Save Report"}
            </button>
            <button
              onClick={handlePrint}
              disabled={selected.length === 0 && extraPages.length === 0}
              className="text-sm bg-slate-800 disabled:bg-slate-300 text-white px-4 py-1.5 rounded"
            >
              Print Report
            </button>
          </div>
        </div>
      </div>

      {/* ============ PRINTABLE REPORT ============ *
       * Each category (and each extra page) is its own A4 sheet with
       * its own header/patient-info strip repeated at the top — so a
       * physical page never depends on the one before it, and no
       * single sheet's content is allowed to run past one A4 page.
       * Results are entered directly into this view (no separate
       * editing list) so what's typed is exactly what will print.
       * Only the very last sheet carries the signature block. */}
      {(() => {
        const allPages = [
          ...categoryEntries.map(([cat, items]) => ({ type: "category", key: cat, title: cat, items })),
          ...extraPages.map((p) => ({ type: "extra", key: p.id, title: p.title, rows: p.rows, pageId: p.id })),
        ];
        const pagesToRender = allPages.length > 0 ? allPages : [{ type: "empty", key: "empty" }];

        return pagesToRender.map((page, idx) => {
          const isLast = idx === pagesToRender.length - 1;
          return (
            <div
              key={page.key}
              className="print-page bg-white shadow-lg my-4 mx-auto print:my-0 print:shadow-none flex flex-col"
              style={{
                width: "210mm",
                minHeight: "297mm",
                maxHeight: "297mm",
                padding: "12mm 14mm",
                boxSizing: "border-box",
                overflow: "hidden",
                ...(isLast ? {} : { breakAfter: "page", pageBreakAfter: "always" }),
              }}
            >
              {showLetterhead ? (
                <div className="text-center border-b-2 border-slate-800 pb-2 mb-3">
                  <div className="text-lg font-bold tracking-wide">{hospitalName || "Hospital Name"}</div>
                  {hospitalAddress && <div className="text-[10px] text-slate-500">{hospitalAddress}</div>}
                  <div className="text-[10px] text-slate-500">Pathology & Diagnostic Report</div>
                </div>
              ) : (
                <div style={{ minHeight: `${letterheadSpace}mm` }} />
              )}

              {/* Patient info — 4 lines rather than one packed row */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs border-b border-slate-200 pb-2 mb-3">
                <div><span className="text-slate-500">Name:</span> <b>{patient.name || "—"}</b></div>
                <div><span className="text-slate-500">Reg / ID:</span> <b>{patient.regNo || "—"}</b></div>
                <div><span className="text-slate-500">Age / Sex:</span> <b>{patient.age || "—"} / {patient.sex === "M" ? "Male" : "Female"}</b></div>
                <div><span className="text-slate-500">Referred By:</span> <b>{patient.referredBy || "Self"}</b></div>
                <div><span className="text-slate-500">Collected:</span> <b>{patient.collectionDate || "—"}</b></div>
                <div><span className="text-slate-500">Reported:</span> <b>{patient.reportDate || "—"}</b></div>
                <div className="col-span-2"><span className="text-slate-500">Specimen:</span> <b>{specimenSummary || "—"}</b></div>
              </div>

              {page.type === "empty" && (
                <div className="text-sm text-slate-400 italic py-10 text-center">
                  No tests added yet — select tests above, or add an extra page, to build the report.
                </div>
              )}

              {page.type === "category" && (
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-wide bg-slate-100 px-2 py-1 mb-1">
                    {page.title}
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="text-left text-[10px] text-slate-500 border-b border-slate-300">
                        <th className="py-1 pr-2 font-medium">Test Name</th>
                        <th className="py-1 pr-2 font-medium w-28">Result</th>
                        <th className="py-1 font-medium w-52">Normal Value</th>
                        <th className="no-print py-1 font-medium w-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.items.map(({ name, result, test }) => {
                        const flag = flagFor(test, patient.sex, result);
                        return (
                          <tr key={name} className="border-b border-slate-100">
                            <td className="py-1 pr-2">{name}</td>
                            <td className="py-1 pr-2">
                              <span className="inline-flex items-center gap-1">
                                <input
                                  className={`w-16 bg-transparent border-b border-slate-300 outline-none font-semibold print:border-slate-300 ${
                                    flag === "H" || flag === "L" ? "text-red-600" : ""
                                  }`}
                                  value={result}
                                  onChange={(e) => updateResult(name, e.target.value)}
                                />
                                {test?.unit && <span className="text-slate-400">{test.unit}</span>}
                              </span>
                            </td>
                            <td className="py-1 text-slate-500">{formatRange(test)}</td>
                            <td className="no-print py-1 text-center">
                              <button
                                onClick={() => removeTest(name)}
                                className="text-slate-300 hover:text-red-500"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {page.type === "extra" && (
                <div className="flex-1">
                  <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 mb-1">
                    <input
                      className="text-xs font-bold uppercase tracking-wide bg-transparent border-none outline-none flex-1 print:p-0"
                      value={page.title}
                      onChange={(e) => updateExtraPageTitle(page.pageId, e.target.value)}
                    />
                    <button
                      onClick={() => removeExtraPage(page.pageId)}
                      className="no-print text-[10px] text-slate-400 hover:text-red-500 whitespace-nowrap"
                    >
                      Remove page
                    </button>
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="text-left text-[10px] text-slate-500 border-b border-slate-300">
                        <th className="py-1 pr-2 font-medium">Test Name</th>
                        <th className="py-1 pr-2 font-medium w-24">Result</th>
                        <th className="py-1 pr-2 font-medium w-16">Unit</th>
                        <th className="py-1 font-medium w-40">Normal Value</th>
                        <th className="no-print py-1 font-medium w-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.rows.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100">
                          <td className="py-1 pr-2">
                            <input
                              className="w-full bg-transparent border-b border-slate-200 outline-none print:border-slate-300"
                              placeholder="Test name"
                              value={row.name}
                              onChange={(e) => updateExtraRow(page.pageId, row.id, "name", e.target.value)}
                            />
                          </td>
                          <td className="py-1 pr-2">
                            <input
                              className="w-full bg-transparent border-b border-slate-200 outline-none font-semibold print:border-slate-300"
                              value={row.result}
                              onChange={(e) => updateExtraRow(page.pageId, row.id, "result", e.target.value)}
                            />
                          </td>
                          <td className="py-1 pr-2">
                            <input
                              className="w-full bg-transparent border-b border-slate-200 outline-none print:border-slate-300"
                              value={row.unit}
                              onChange={(e) => updateExtraRow(page.pageId, row.id, "unit", e.target.value)}
                            />
                          </td>
                          <td className="py-1">
                            <input
                              className="w-full bg-transparent border-b border-slate-200 outline-none text-slate-500 print:border-slate-300"
                              placeholder="Normal value"
                              value={row.normal}
                              onChange={(e) => updateExtraRow(page.pageId, row.id, "normal", e.target.value)}
                            />
                          </td>
                          <td className="no-print py-1 text-center">
                            <button
                              onClick={() => removeExtraRow(page.pageId, row.id)}
                              className="text-slate-300 hover:text-red-500"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={() => addExtraRow(page.pageId)}
                    className="no-print text-xs text-slate-500 mt-2"
                  >
                    + Add Row
                  </button>
                </div>
              )}

              {isLast && (
                <>
                  <div className="flex justify-between items-end mt-auto pt-8 text-xs">
                    <div className="text-center">
                      <div className="text-xs mb-6">{technologist || "\u00A0"}</div>
                      <div className="border-t border-slate-400 pt-1 w-40">Lab Technologist</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs mb-6">{pathologist || "\u00A0"}</div>
                      <div className="border-t border-slate-400 pt-1 w-40">Pathologist / Consultant</div>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-400 text-center mt-3">
                    Reference ranges are general adult values (with a broad pediatric band where noted) and may vary by analyzer/method — correlate clinically.
                  </div>
                </>
              )}

              <div className="text-[9px] text-slate-300 text-right mt-1">
                Page {idx + 1} of {pagesToRender.length}
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}
