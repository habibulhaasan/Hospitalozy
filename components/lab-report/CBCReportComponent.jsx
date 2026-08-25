"use client";

import React, { useState } from "react";

/* ------------------------------------------------------------------ *
 * Complete Blood Count (CBC) — standalone report component
 * Fixed panel, standard adult reference ranges. Confirm/adjust with
 * your lab's analyzer-specific ranges before real patient use.
 * ------------------------------------------------------------------ */
const CBC_PANEL = [
  { key: "hb", name: "Hemoglobin (Hb%)", unit: "g/dL", numeric: { M: [13.5, 17.5], F: [12.0, 15.5] } },
  { key: "rbc", name: "RBC Count", unit: "million/µL", numeric: { M: [4.5, 5.9], F: [4.0, 5.2] } },
  { key: "pcv", name: "PCV / Hematocrit", unit: "%", numeric: { M: [40, 52], F: [36, 48] } },
  { key: "mcv", name: "MCV", unit: "fL", numeric: { A: [80, 100] } },
  { key: "mch", name: "MCH", unit: "pg", numeric: { A: [27, 33] } },
  { key: "mchc", name: "MCHC", unit: "g/dL", numeric: { A: [32, 36] } },
  { key: "tc", name: "Total WBC Count (TC)", unit: "/µL", numeric: { A: [4000, 11000] } },
  { key: "neutrophil", name: "Neutrophil", unit: "%", numeric: { A: [40, 75] } },
  { key: "lymphocyte", name: "Lymphocyte", unit: "%", numeric: { A: [20, 45] } },
  { key: "monocyte", name: "Monocyte", unit: "%", numeric: { A: [2, 10] } },
  { key: "eosinophil", name: "Eosinophil", unit: "%", numeric: { A: [1, 6] } },
  { key: "basophil", name: "Basophil", unit: "%", numeric: { A: [0, 1] } },
  { key: "platelet", name: "Platelet Count", unit: "/µL", numeric: { A: [150000, 450000] } },
  { key: "esr", name: "ESR", unit: "mm/1st hr", numeric: { M: [0, 15], F: [0, 20] } },
];

function getRange(test, sex) {
  if (sex === "F" && test.numeric.F) return test.numeric.F;
  if (test.numeric.M) return test.numeric.M;
  return test.numeric.A;
}

function formatRange(test, sex) {
  const r = getRange(test, sex);
  return `${r[0]} – ${r[1]} ${test.unit}`.trim();
}

function flagFor(test, sex, value) {
  if (value === "" || value === undefined) return null;
  const val = parseFloat(value);
  if (Number.isNaN(val)) return null;
  const r = getRange(test, sex);
  if (val < r[0]) return "L";
  if (val > r[1]) return "H";
  return "N";
}

export default function CBCReportComponent() {
  const [hospitalName, setHospitalName] = useState("Upazila Health Complex");
  const [patient, setPatient] = useState({
    name: "",
    age: "",
    sex: "M",
    regNo: "",
    referredBy: "",
    collectionDate: "",
    reportDate: "",
  });
  const [results, setResults] = useState({});

  function updateResult(key, value) {
    setResults((prev) => ({ ...prev, [key]: value }));
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { size: A4; margin: 14mm 12mm; }
      `}</style>

      {/* ============ BUILDER UI (hidden on print) ============ */}
      <div className="no-print max-w-3xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Hospital & Patient Details
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              className="border rounded px-2 py-1.5 text-sm col-span-2 md:col-span-4"
              placeholder="Hospital / Facility name"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
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
            <input
              className="border rounded px-2 py-1.5 text-sm"
              placeholder="Reg / Patient ID"
              value={patient.regNo}
              onChange={(e) => setPatient({ ...patient, regNo: e.target.value })}
            />
            <input
              className="border rounded px-2 py-1.5 text-sm"
              placeholder="Referred by (doctor)"
              value={patient.referredBy}
              onChange={(e) => setPatient({ ...patient, referredBy: e.target.value })}
            />
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
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              CBC Results
            </h2>
            <button
              onClick={handlePrint}
              className="text-sm bg-slate-800 text-white px-4 py-1.5 rounded"
            >
              Print Report
            </button>
          </div>
          <div className="space-y-1.5">
            {CBC_PANEL.map((test) => {
              const flag = flagFor(test, patient.sex, results[test.key]);
              return (
                <div
                  key={test.key}
                  className="flex items-center gap-2 text-sm border-b border-slate-100 pb-1.5"
                >
                  <span className="flex-1">{test.name}</span>
                  <input
                    className={`border rounded px-2 py-1 text-sm w-28 ${
                      flag === "H" || flag === "L" ? "border-red-400 text-red-700" : ""
                    }`}
                    placeholder="Result"
                    value={results[test.key] || ""}
                    onChange={(e) => updateResult(test.key, e.target.value)}
                  />
                  <span className="text-xs text-slate-400 w-40">
                    {formatRange(test, patient.sex)}
                  </span>
                  {flag && flag !== "N" && (
                    <span className="text-xs font-semibold text-red-600 w-4">{flag}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============ PRINTABLE REPORT ============ */}
      <div className="print-page max-w-3xl mx-auto bg-white shadow-lg my-4 p-8 print:my-0 print:shadow-none print:max-w-none">
        <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
          <div className="text-xl font-bold tracking-wide">{hospitalName || "Hospital Name"}</div>
          <div className="text-xs text-slate-500 mt-0.5">Complete Blood Count (CBC) Report</div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-4">
          <div><span className="text-slate-500">Patient Name:</span> <b>{patient.name || "—"}</b></div>
          <div><span className="text-slate-500">Reg / ID:</span> <b>{patient.regNo || "—"}</b></div>
          <div><span className="text-slate-500">Age / Sex:</span> <b>{patient.age || "—"} / {patient.sex === "M" ? "Male" : "Female"}</b></div>
          <div><span className="text-slate-500">Referred By:</span> <b>{patient.referredBy || "—"}</b></div>
          <div><span className="text-slate-500">Collection Date:</span> <b>{patient.collectionDate || "—"}</b></div>
          <div><span className="text-slate-500">Report Date:</span> <b>{patient.reportDate || "—"}</b></div>
        </div>

        <table className="w-full text-sm border-collapse mb-4">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-300">
              <th className="py-1 pr-2 font-medium">Test Name</th>
              <th className="py-1 pr-2 font-medium w-24">Result</th>
              <th className="py-1 pr-2 font-medium w-14">Flag</th>
              <th className="py-1 font-medium w-48">Normal Value</th>
            </tr>
          </thead>
          <tbody>
            {CBC_PANEL.map((test) => {
              const value = results[test.key] || "";
              const flag = flagFor(test, patient.sex, value);
              return (
                <tr key={test.key} className="border-b border-slate-100">
                  <td className="py-1 pr-2">{test.name}</td>
                  <td className={`py-1 pr-2 font-semibold ${flag === "H" || flag === "L" ? "text-red-600" : ""}`}>
                    {value || "—"}
                  </td>
                  <td className="py-1 pr-2 font-semibold text-red-600">
                    {flag === "H" ? "High" : flag === "L" ? "Low" : ""}
                  </td>
                  <td className="py-1 text-slate-500">{formatRange(test, patient.sex)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-between items-end mt-16 text-sm">
          <div className="text-center">
            <div className="border-t border-slate-400 pt-1 w-40">Lab Technologist</div>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-400 pt-1 w-40">Pathologist / Consultant</div>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 text-center mt-6">
          Reference ranges are general adult values and may vary by analyzer/method — correlate clinically.
        </div>
      </div>
    </div>
  );
}
