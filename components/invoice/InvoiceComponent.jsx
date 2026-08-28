"use client";

/**
 * components/invoice/InvoiceComponent.jsx
 * ------------------------------------------------------------------
 * Orchestrator only — all state and the handlers that talk to
 * onLookupPatientByIdOrMobile/onSavePatient/onLoadDoctors/onSaveInvoice
 * live here. Markup is split across LetterheadSettings, PatientPanel,
 * TestPicker, LineItemsTable, TotalsPanel, and PrintableInvoice. This
 * file used to be ~1060 lines doing all of it at once (data catalog
 * included); now it's the composition root and nothing else.
 *
 * In this project, pass lib/firestore's functions directly:
 *   <InvoiceComponent
 *     onLookupPatientByIdOrMobile={lookupPatientByIdOrMobile}
 *     onSavePatient={savePatient}
 *     onLoadDoctors={loadActiveDoctorNames}
 *     onSaveInvoice={saveInvoice}
 *   />
 * ------------------------------------------------------------------ */
import React, { useState, useMemo, useEffect } from "react";
import LetterheadSettings from "./LetterheadSettings";
import PatientPanel from "./PatientPanel";
import TestPicker from "./TestPicker";
import PrintableInvoice from "./PrintableInvoice";
import { DEFAULT_PATIENT, newId, defaultInvoiceNumber } from "./invoiceShape";
import { calcAgeFromDOB } from "@/lib/format";

export default function InvoiceComponent({
  onLookupPatientByIdOrMobile = async () => null,
  onSearchPatients = async () => [],
  onSavePatient = async (patientData) => patientData.patientId || `P-${Date.now().toString().slice(-8)}`,
  onLoadDoctors = async () => [],
  onSaveInvoice = async (payload) => {
    console.log("onSaveInvoice not wired up yet — payload:", payload);
  },
  generateInvoiceNumber = defaultInvoiceNumber,
} = {}) {
  const [hospitalName, setHospitalName] = useState("Upazila Health Complex");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [showLetterhead, setShowLetterhead] = useState(true);
  const [letterheadSpace, setLetterheadSpace] = useState(30);

  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber);
  const [billDateTime, setBillDateTime] = useState(() => new Date());

  const [patientMode, setPatientMode] = useState("new");
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupStatus, setLookupStatus] = useState("");
  const [patient, setPatient] = useState(DEFAULT_PATIENT);
  const [savePatientStatus, setSavePatientStatus] = useState("");
  const [doctorOptions, setDoctorOptions] = useState([]);

  const [lineItems, setLineItems] = useState([]);
  const [previousDue, setPreviousDue] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [received, setReceived] = useState("0");

  const [confirmingReset, setConfirmingReset] = useState(false);
  const [saveInvoiceStatus, setSaveInvoiceStatus] = useState("");

  useEffect(() => {
    onLoadDoctors().then(setDoctorOptions).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!patient.dob) return;
    const age = calcAgeFromDOB(patient.dob);
    if (age) {
      setPatient((prev) => ({ ...prev, ageY: String(age.y), ageM: String(age.m), ageD: String(age.d) }));
    }
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

  function addLineItem(item) {
    setLineItems((prev) => [...prev, { id: newId(), name: item.name, rate: item.rate, qty: 1, turnaround: item.turnaround || 24 }]);
  }
  function updateLineItem(id, field, value) {
    setLineItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }
  function removeLineItem(id) {
    setLineItems((prev) => prev.filter((it) => it.id !== id));
  }

  function handlePrint() {
    window.print();
  }

  function handleReset() {
    setInvoiceNumber(generateInvoiceNumber());
    setBillDateTime(new Date());
    setPatientMode("new");
    setLookupQuery("");
    setLookupStatus("");
    setPatient(DEFAULT_PATIENT);
    setSavePatientStatus("");
    setLineItems([]);
    setPreviousDue("0");
    setDiscount("0");
    setReceived("0");
    setSaveInvoiceStatus("");
    setConfirmingReset(false);
  }

  const totals = useMemo(() => {
    const total = lineItems.reduce((s, it) => s + (Number(it.rate) || 0) * (Number(it.qty) || 0), 0);
    const payable = total + (Number(previousDue) || 0);
    const netBill = payable - (Number(discount) || 0);
    const due = netBill - (Number(received) || 0);
    return { total, payable, netBill, due };
  }, [lineItems, previousDue, discount, received]);

  const status = useMemo(() => {
    if (totals.netBill <= 0) return "FREE";
    if (totals.due > 0.004) return "DUE";
    return "PAID";
  }, [totals]);

  const deliveryDateTime = useMemo(() => {
    const maxTurnaround = lineItems.length ? Math.max(...lineItems.map((it) => Number(it.turnaround) || 24)) : 24;
    return new Date(billDateTime.getTime() + maxTurnaround * 3600 * 1000);
  }, [lineItems, billDateTime]);

  async function handleSaveInvoice() {
    setSaveInvoiceStatus("saving");
    try {
      await onSaveInvoice({ invoiceNumber, billDateTime, hospitalName, hospitalAddress, patient, lineItems, totals, status, deliveryDateTime });
      setSaveInvoiceStatus("saved");
    } catch (err) {
      console.error(err);
      setSaveInvoiceStatus("error");
    }
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

      {/* ============ BUILDER UI (hidden on print) ============ */}
      <div className="no-print max-w-4xl mx-auto p-4 space-y-4">
        <LetterheadSettings
          showLetterhead={showLetterhead}
          setShowLetterhead={setShowLetterhead}
          letterheadSpace={letterheadSpace}
          setLetterheadSpace={setLetterheadSpace}
          hospitalName={hospitalName}
          setHospitalName={setHospitalName}
          hospitalAddress={hospitalAddress}
          setHospitalAddress={setHospitalAddress}
        />

        <PatientPanel
          patient={patient}
          setPatient={setPatient}
          patientMode={patientMode}
          setPatientMode={setPatientMode}
          lookupQuery={lookupQuery}
          setLookupQuery={setLookupQuery}
          lookupStatus={lookupStatus}
          onLookupPatient={handleLookupPatient}
          onSearchPatients={onSearchPatients}
          onSelectPatient={(p) => {
             setPatient((prev) => ({ ...prev, ...p }));
             setLookupStatus("found");
          }}
          doctorOptions={doctorOptions}
          savePatientStatus={savePatientStatus}
          onSavePatient={handleSavePatient}
        />

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Add Test to Bill</h2>
          <TestPicker onAdd={addLineItem} />
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {lineItems.length} test{lineItems.length !== 1 ? "s" : ""} on this bill — status and totals update live in the invoice below.
          </span>
          <div className="flex items-center gap-2">
            {saveInvoiceStatus === "saved" && <span className="text-xs text-emerald-600">Saved ✓</span>}
            {saveInvoiceStatus === "error" && <span className="text-xs text-red-600">Save failed</span>}
            {confirmingReset ? (
              <span className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 rounded px-2 py-1">
                Clear everything?
                <button onClick={handleReset} className="text-red-700 font-semibold underline">Yes, reset</button>
                <button onClick={() => setConfirmingReset(false)} className="text-slate-500 underline">Cancel</button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmingReset(true)}
                className="text-sm bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded"
              >
                New / Reset Invoice
              </button>
            )}
            <button
              onClick={handleSaveInvoice}
              disabled={lineItems.length === 0 || saveInvoiceStatus === "saving"}
              className="text-sm bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-1.5 rounded"
            >
              {saveInvoiceStatus === "saving" ? "Saving…" : "Save Invoice"}
            </button>
            <button
              onClick={handlePrint}
              disabled={lineItems.length === 0}
              className="text-sm bg-slate-800 disabled:bg-slate-300 text-white px-4 py-1.5 rounded"
            >
              Print Invoice
            </button>
          </div>
        </div>
      </div>

      <PrintableInvoice
        invoiceNumber={invoiceNumber}
        billDateTime={billDateTime}
        deliveryDateTime={deliveryDateTime}
        hospitalName={hospitalName}
        hospitalAddress={hospitalAddress}
        showLetterhead={showLetterhead}
        letterheadSpace={letterheadSpace}
        patient={patient}
        lineItems={lineItems}
        onUpdateItem={updateLineItem}
        onRemoveItem={removeLineItem}
        totals={totals}
        status={status}
        previousDue={previousDue}
        setPreviousDue={setPreviousDue}
        discount={discount}
        setDiscount={setDiscount}
        received={received}
        setReceived={setReceived}
      />
    </div>
  );
}
