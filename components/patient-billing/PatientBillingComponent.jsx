"use client";

import SearchableSelect from "@/components/shared/SearchableSelect";
import AsyncSearchableSelect from "@/components/shared/AsyncSearchableSelect";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Printer } from "lucide-react";

/**
 * PatientBillingComponent.jsx
 * ------------------------------------------------------------------
 * OPD registration/routing ticket for a govt. hospital — same format
 * as your original PatientTicket.jsx (bilingual header, logo/seal,
 * barcode + Room No. box, patient grid, blank Rx area, signature,
 * footer). This ticket doesn't itemize lab tests — that billing
 * happens on the separate Invoice/PatientBilling components already
 * built in this project. This one is just: register/look up the
 * patient, assign a room by department, record the flat OPD ticket
 * fee (kept internal, not printed), and hand the patient a ticket the
 * doctor then writes the actual prescription on.
 * ------------------------------------------------------------------ */

function nowTimeString() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function defaultBillNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${y}${m}${d}-${rand}`;
}

/* Age in Y/M/D from a DOB string, as of today. */
function calcAgeFromDOB(dobStr) {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let y = now.getFullYear() - dob.getFullYear();
  let m = now.getMonth() - dob.getMonth();
  let d = now.getDate() - dob.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { y, m, d };
}

// SearchableSelect is now imported from @/components/shared/SearchableSelect


/* ------------------------------------------------------------------ *
 * Test picker — search box that filters BILLABLE_TEST_CATALOG by
 * name and shows the rate inline; picking one adds it as a line
 * item. Anything typed that doesn't match the catalog can still be
 * added as a custom line (rate 0, edit inline afterwards).
 * ------------------------------------------------------------------ */
function BillBarcode({ value }) {
  const svgRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import(/* webpackIgnore: false */ "jsbarcode");
        const JsBarcode = mod.default || mod;
        if (!cancelled && svgRef.current) {
          JsBarcode(svgRef.current, value || " ", {
            format: "CODE128",
            displayValue: false,
            height: 36,
            margin: 0,
            width: 1.3,
          });
          setFailed(false);
        }
      } catch (err) {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (failed) {
    return (
      <div className="text-center">
        <div className="text-xs font-mono tracking-widest border border-slate-300 px-3 py-2 inline-block">
          {value}
        </div>
        <div className="no-print text-[9px] text-amber-600 mt-1">
          Run <code>npm install jsbarcode</code> in your project for a scannable barcode here.
        </div>
      </div>
    );
  }
  return <svg ref={svgRef} />;
}

function Field({ label, value, labelWidth = "w-40" }) {
  return (
    <div className="flex text-sm leading-6">
      <span className={`font-semibold text-gray-800 ${labelWidth}`}>{label}</span>
      <span className="text-gray-900">: {value || "-"}</span>
    </div>
  );
}


const defaultHospital = {
  nameBn: "উপজেলা স্বাস্থ্য কমপ্লেক্স",
  nameEn: "Upazila Health Complex",
  address: "",
  contact: "",
  email: "",
};

const DEFAULT_PATIENT = {
  patientId: "",
  name: "",
  mobile: "",
  ageY: "",
  ageM: "",
  ageD: "",
  dob: "",
  nid: "",
  gender: "Male",
  address: "",
  referredBy: "",
};

/* Department/room reference data now imported from
 * data/opdDepartments.js — was previously embedded directly here. */
import { OPD_DEPARTMENTS as SPECIALTIES, DEPARTMENT_BN, DEFAULT_ROOM_ASSIGNMENTS } from "@/data/opdDepartments";

/**
 * Firebase hookup — same backend-agnostic pattern as the Invoice
 * component this is functionally paired with.
 *
 *   onLookupPatientByIdOrMobile(query) / onSavePatient(patientData) /
 *   onLoadDoctors() / onSaveBill(payload) / generateBillNo() — same
 *   contracts as the Invoice component's equivalent props. If you're
 *   running both components, point them at the same Firestore
 *   collections so a patient registered here shows up there too.
 */
export default function PatientBillingComponent({
  hospital = defaultHospital,
  logoUrl = null,
  sealUrl = null,
  counterName = "Online Ticket Counter",
  roomAssignments = DEFAULT_ROOM_ASSIGNMENTS,
  rxLines = [],
  onLookupPatientByIdOrMobile = async () => null,
  onSearchPatients = async () => [],
  onSavePatient = async (patientData) => patientData.patientId || `P-${Date.now().toString().slice(-8)}`,
  onLoadDoctors = async () => [],
  onSaveBill = async (payload) => {
    console.log("onSaveBill not wired up yet — payload:", payload);
  },
  generateBillNo = defaultBillNo,
} = {}) {
  const [billNo, setBillNo] = useState(generateBillNo);
  const [billDateTime, setBillDateTime] = useState(() => new Date());
  const [department, setDepartment] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [healthId, setHealthId] = useState("");
  const [visitFrom, setVisitFrom] = useState(nowTimeString);
  const [visitTo, setVisitTo] = useState("13:30"); // 1:30 PM default

  const [patientMode, setPatientMode] = useState("new"); // "new" | "existing"
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupStatus, setLookupStatus] = useState("");
  const [patient, setPatient] = useState(DEFAULT_PATIENT);
  const [savePatientStatus, setSavePatientStatus] = useState("");
  const [doctorOptions, setDoctorOptions] = useState([]);

  const [paymentAmount, setPaymentAmount] = useState("5"); // flat OPD ticket fee, not printed

  const [confirmingReset, setConfirmingReset] = useState(false);
  const [saveBillStatus, setSaveBillStatus] = useState("");
  const [printedBy, setPrintedBy] = useState("");

  useEffect(() => {
    onLoadDoctors().then(setDoctorOptions).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Assign Room: picking a department auto-fills the room from the
  // mapping above. Still a plain editable field afterward, so a
  // one-off room change for the day doesn't require touching the map.
  function handleDepartmentChange(v) {
    setDepartment(v);
    if (roomAssignments[v]) setRoomNo(roomAssignments[v]);
  }

  useEffect(() => {
    if (!patient.dob) return;
    const age = calcAgeFromDOB(patient.dob);
    if (age) setPatient((prev) => ({ ...prev, ageY: String(age.y), ageM: String(age.m), ageD: String(age.d) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.dob]);

  async function handleLookupPatient() {
    if (!lookupQuery.trim()) return;
    setLookupStatus("loading");
    try {
      const found = await onLookupPatientByIdOrMobile(lookupQuery.trim());
      if (found) {
        setPatient((prev) => ({ ...prev, ...found }));
        setLookupStatus("found");
      } else {
        setLookupStatus("not-found");
      }
    } catch (err) {
      console.error(err);
      setLookupStatus("error");
    }
  }

  async function handleSavePatient() {
    setSavePatientStatus("saving");
    try {
      const patientId = await onSavePatient(patient);
      setPatient((prev) => ({ ...prev, patientId }));
      setSavePatientStatus("saved");
    } catch (err) {
      console.error(err);
      setSavePatientStatus("error");
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleReset() {
    setBillNo(generateBillNo());
    setBillDateTime(new Date());
    setDepartment("");
    setRoomNo("");
    setHealthId("");
    setVisitFrom(nowTimeString());
    setVisitTo("13:30");
    setPatientMode("new");
    setLookupQuery("");
    setLookupStatus("");
    setPatient(DEFAULT_PATIENT);
    setSavePatientStatus("");
    setPaymentAmount("5");
    setSaveBillStatus("");
    setConfirmingReset(false);
  }

  // Ticket validity: creation date through +3 days, always computed —
  // not a field anyone needs to set by hand.
  const validUntilDate = useMemo(() => new Date(billDateTime.getTime() + 3 * 24 * 3600 * 1000), [billDateTime]);

  const fmtDate = (d) => d.toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
  const fmt12h = (hhmm) => {
    if (!hhmm) return "";
    const [h, m] = hhmm.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  };
  const printedAt = new Date().toLocaleString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      {/* ============ BUILDER UI (hidden on print) ============ */}
      <div className="no-print max-w-3xl mx-auto mb-4 px-4 space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <button
              onClick={() => setPatientMode("existing")}
              className={`text-xs px-3 py-1 rounded-full border ${patientMode === "existing" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300"}`}
            >
              Existing Patient
            </button>
            <button
              onClick={() => setPatientMode("new")}
              className={`text-xs px-3 py-1 rounded-full border ${patientMode === "new" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300"}`}
            >
              New Patient
            </button>
          </div>

          {patientMode === "existing" && (
            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">
                Search Existing Patient
              </label>
              <AsyncSearchableSelect
                onSearch={async (query) => {
                  if (!onSearchPatients) return [];
                  const results = await onSearchPatients(query);
                  return Array.isArray(results) ? results : [];
                }}
                onSelect={(selectedItem) => {
                  if (selectedItem) {
                    setPatient((prev) => ({ ...prev, ...selectedItem }));
                    setLookupStatus("found");
                  } else {
                    setPatient(DEFAULT_PATIENT);
                    setLookupStatus("");
                  }
                }}
                placeholder="Type Patient ID, Name, Mobile, or NID to search…"
                emptyHint="No matching patient found."
                renderItem={(item) => {
                  const ageParts = [
                    item.ageY ? `${item.ageY}Y` : '',
                    item.ageM ? `${item.ageM}M` : '',
                    item.ageD ? `${item.ageD}D` : ''
                  ].filter(Boolean).join(' ') || "—";

                  return (
                    <div className="flex justify-between items-center gap-2 py-0.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">
                          {item.name || "Unnamed Patient"}{" "}
                          <span className="text-xs text-slate-400 font-normal">({item.patientId})</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          Age: {ageParts} | Mobile: {item.mobile || "—"}
                        </span>
                      </div>
                    </div>
                  );
                }}
                renderValue={(item) => item ? `${item.name} (${item.patientId})` : ""}
              />
              {lookupStatus === "found" && <p className="text-xs text-emerald-600 mt-1">Patient found — details filled in below.</p>}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input className="border rounded px-2 py-1.5 text-sm col-span-2" placeholder="Patient name" value={patient.name} onChange={(e) => setPatient({ ...patient, name: e.target.value })} />
            <input className="border rounded px-2 py-1.5 text-sm" placeholder="Mobile number" value={patient.mobile} onChange={(e) => setPatient({ ...patient, mobile: e.target.value })} />
            <select className="border rounded px-2 py-1.5 text-sm" value={patient.gender} onChange={(e) => setPatient({ ...patient, gender: e.target.value })}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <div className="col-span-2 md:col-span-1">
              <label className="text-[10px] text-gray-400 block mb-0.5">DOB (optional)</label>
              <input type="date" className="border rounded px-2 py-1.5 text-sm w-full" value={patient.dob} onChange={(e) => setPatient({ ...patient, dob: e.target.value })} />
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="text-[10px] text-gray-400 block mb-0.5">Age (auto from DOB, or manual)</label>
              <div className="flex gap-1.5">
                <input className="border rounded px-2 py-1.5 text-sm w-full" placeholder="Y" value={patient.ageY} onChange={(e) => setPatient({ ...patient, ageY: e.target.value })} />
                <input className="border rounded px-2 py-1.5 text-sm w-full" placeholder="M" value={patient.ageM} onChange={(e) => setPatient({ ...patient, ageM: e.target.value })} />
                <input className="border rounded px-2 py-1.5 text-sm w-full" placeholder="D" value={patient.ageD} onChange={(e) => setPatient({ ...patient, ageD: e.target.value })} />
              </div>
            </div>
            <input className="border rounded px-2 py-1.5 text-sm" placeholder="NID / BRN (optional)" value={patient.nid} onChange={(e) => setPatient({ ...patient, nid: e.target.value })} />
            <textarea className="border rounded px-2 py-1.5 text-sm col-span-2 md:col-span-3" placeholder="Address" rows={1} value={patient.address} onChange={(e) => setPatient({ ...patient, address: e.target.value })} />
            <div>
              <SearchableSelect value={patient.referredBy} onChange={(v) => setPatient({ ...patient, referredBy: v })} options={doctorOptions} placeholder="Referred by (doctor)" />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            {patient.patientId && <span className="text-xs bg-gray-100 border border-gray-300 rounded px-2 py-1">Patient ID: <b>{patient.patientId}</b></span>}
            <button onClick={handleSavePatient} disabled={!patient.name.trim() || savePatientStatus === "saving"} className="text-sm bg-gray-800 disabled:bg-gray-300 text-white px-3 py-1.5 rounded">
              {savePatientStatus === "saving" ? "Saving…" : patient.patientId ? "Update Patient Info" : "Register Patient"}
            </button>
            {savePatientStatus === "saved" && <span className="text-xs text-emerald-600">Saved ✓</span>}
            {savePatientStatus === "error" && <span className="text-xs text-red-600">Save failed</span>}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Visit / Ticket Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] text-gray-400 block mb-0.5">Department / Specialty</label>
              <SearchableSelect value={department} onChange={handleDepartmentChange} options={SPECIALTIES} placeholder="Search or type" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">Room No. (auto-assigned, editable)</label>
              <input className="border rounded px-2 py-1.5 text-sm w-full" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">Health ID (optional)</label>
              <input className="border rounded px-2 py-1.5 text-sm w-full" value={healthId} onChange={(e) => setHealthId(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">Visit From</label>
              <input type="time" className="border rounded px-2 py-1.5 text-sm w-full" value={visitFrom} onChange={(e) => setVisitFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">Visit To</label>
              <input type="time" className="border rounded px-2 py-1.5 text-sm w-full" value={visitTo} onChange={(e) => setVisitTo(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-gray-400 block mb-0.5">Ticket Valid Until (auto: creation date + 3 days)</label>
              <div className="border rounded px-2 py-1.5 text-sm w-full bg-gray-50 text-gray-600">{fmtDate(validUntilDate)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ticket Fee</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">৳</span>
            <input
              type="number"
              className="border rounded px-2 py-1.5 text-sm w-24"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <span className="text-xs text-gray-400">Flat OPD registration fee — recorded here, not printed on the ticket.</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between flex-wrap gap-2">
          <input
            className="border rounded px-2 py-1.5 text-sm"
            placeholder="Printed by (staff name)"
            value={printedBy}
            onChange={(e) => setPrintedBy(e.target.value)}
          />
          <div className="flex items-center gap-2">
            {saveBillStatus === "saved" && <span className="text-xs text-emerald-600">Saved ✓</span>}
            {saveBillStatus === "error" && <span className="text-xs text-red-600">Save failed</span>}
            {confirmingReset ? (
              <span className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 rounded px-2 py-1">
                Clear everything?
                <button onClick={handleReset} className="text-red-700 font-semibold underline">Yes, reset</button>
                <button onClick={() => setConfirmingReset(false)} className="text-gray-500 underline">Cancel</button>
              </span>
            ) : (
              <button onClick={() => setConfirmingReset(true)} className="text-sm bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded">
                New / Reset Ticket
              </button>
            )}
            <button
              onClick={async () => {
                setSaveBillStatus("saving");
                try {
                  await onSaveBill({ billNo, billDateTime, hospital, department, roomNo, healthId, visitFrom, visitTo, validUntilDate, patient, paymentAmount, printedBy });
                  setSaveBillStatus("saved");
                } catch (err) {
                  console.error(err);
                  setSaveBillStatus("error");
                }
              }}
              disabled={!patient.name.trim() || saveBillStatus === "saving"}
              className="text-sm bg-emerald-700 disabled:bg-gray-300 text-white px-4 py-1.5 rounded"
            >
              {saveBillStatus === "saving" ? "Saving…" : "Save Ticket"}
            </button>
            <button
              onClick={handlePrint}
              disabled={!patient.name.trim()}
              className="flex items-center gap-2 text-sm bg-gray-800 disabled:bg-gray-300 text-white px-4 py-1.5 rounded"
            >
              <Printer size={16} />
              Print Ticket
            </button>
          </div>
        </div>
      </div>

      {/* ============ PRINTABLE TICKET (matches your original format) ============ */}
      <div
        className="print-area bg-white mx-auto shadow-sm print:shadow-none border border-gray-300 print:border-0"
        style={{ width: "8.27in", minHeight: "11.69in", padding: "0.5in" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-3">
          <div className="w-20 h-20 flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="w-20 h-20 object-contain" />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-green-700 flex items-center justify-center text-[9px] text-center text-green-800 font-semibold">
                GOVT
              </div>
            )}
          </div>

          <div className="flex-1 text-center px-4">
            <h1 className="text-xl font-bold text-gray-900">{hospital.nameBn}</h1>
            <h2 className="text-base font-bold text-gray-900 mt-0.5">{hospital.nameEn}</h2>
            {hospital.address && <p className="text-xs text-gray-600 mt-1">Address: {hospital.address}</p>}
            {(hospital.contact || hospital.email) && (
              <p className="text-xs text-gray-600">
                {hospital.contact && `Contact: ${hospital.contact}`}{hospital.contact && hospital.email && " | "}{hospital.email && `Email: ${hospital.email}`}
              </p>
            )}
          </div>

          <div className="w-20 h-20 flex items-center justify-center shrink-0">
            {sealUrl ? (
              <img src={sealUrl} alt="seal" className="w-20 h-20 object-contain" />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-green-700 flex items-center justify-center text-[9px] text-center text-green-800 font-semibold">
                SEAL
              </div>
            )}
          </div>
        </div>

        {/* Ticket title row: barcode | OPD TICKET | room number */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col items-start shrink-0">
            <BillBarcode value={billNo} />
            <span className="text-[11px] font-semibold text-gray-800 mt-0.5">{billNo}</span>
          </div>

          <h3 className="flex-1 text-center text-lg font-bold tracking-wide">OPD TICKET</h3>

          <div className="shrink-0 flex flex-col items-center">
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Room No.</span>
            <div className="border-2 border-gray-800 rounded-md px-4 py-2 min-w-[80px] text-center">
              <span className="text-2xl font-bold text-gray-900">{roomNo || "-"}</span>
            </div>
          </div>
        </div>

        {/* Patient info, 2 columns */}
        <div className="grid grid-cols-2 gap-x-6 mt-4">
          <div>
            <Field label="Name" value={patient.name} labelWidth="w-20" />
            <Field label="Age" value={`${patient.ageY || "0"}Y ${patient.ageM || "0"}M ${patient.ageD || "0"}D`} labelWidth="w-20" />
            <Field label="Gender" value={patient.gender} labelWidth="w-20" />
            <Field label="NID" value={patient.nid} labelWidth="w-20" />
          </div>

          <div>
            <Field label="Patient ID" value={patient.patientId} labelWidth="w-24" />
            <Field label="Health ID" value={healthId} labelWidth="w-24" />
            <Field label="Contact" value={patient.mobile} labelWidth="w-24" />
            <div className="flex text-sm leading-6">
              <span className="font-semibold text-gray-800 w-24">Visit Date</span>
              <span className="text-gray-900">
                : {fmtDate(billDateTime)}
                {visitFrom && ` from ${fmt12h(visitFrom)}`}
                {visitTo && ` to ${fmt12h(visitTo)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex text-sm leading-6 mt-1">
          <span className="font-semibold text-gray-800 w-20">Dept.</span>
          <span className="text-gray-900">
            : {department || "-"}
            {department && DEPARTMENT_BN[department] && ` (${DEPARTMENT_BN[department]})`}
          </span>
        </div>

        <hr className="border-t border-gray-800 mt-3" />

        {/* Rx area — blank writing space, same as your original format.
            No billing content here per your instruction; this ticket
            doesn't itemize tests. */}
        <div className="flex mt-4" style={{ minHeight: "8in" }}>
          <div className="w-[30%] pr-4" />

          {/* Divider, shifted right to leave room on the left */}
          <div className="w-px bg-gray-400 mr-6" />

          {/* Right: Rx — intentionally blank for the doctor */}
          <div className="flex-1">
            <span className="text-2xl italic font-serif">℞</span>
            <div className="mt-4 space-y-2">
              {rxLines.length > 0 ? (
                rxLines.map((line, idx) => (
                  <p key={idx} className="text-sm text-gray-900">{line}</p>
                ))
              ) : (
                <div className="text-sm text-gray-300 select-none">
                  {/* intentionally blank — filled by prescribing doctor */}
                </div>
              )}
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
            Note: This ticket is usable until {fmtDate(validUntilDate)}
            {visitFrom && ` from ${fmt12h(visitFrom)}`}
            {visitTo && ` to ${fmt12h(visitTo)}`}
          </p>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>Powered By: Hospitalozy</span>
            <span>Printed By: {printedBy || "-"}, at {counterName}, {printedAt}</span>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
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
    </div>
  );
}
