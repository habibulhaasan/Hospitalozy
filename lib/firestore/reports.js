/**
 * lib/firestore/reports.js
 * ------------------------------------------------------------------
 * Backs LabReportComponent's onSaveReport/onLookupInvoice, and
 * LabReportListComponent's onLoadRecentReports/onSearchReports.
 * ------------------------------------------------------------------ */
import { db } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, query, where, orderBy, limit as fsLimit,
} from "firebase/firestore";
import { searchInvoices } from "@/lib/firestore/invoices";

const COLLECTION = "reports";

function fromDoc(d) {
  return { id: d.id, ...d.data() };
}

/** Pass directly as LabReportComponent's onSaveReport. */
export async function saveReport(payload) {
  await addDoc(collection(db, COLLECTION), {
    ...payload,
    // Denormalized for querying — see the same note in invoices.js.
    patientName: payload.patient?.name || "",
    patientRegNo: payload.patient?.regNo || "",
    reportDate: payload.patient?.reportDate || "",
  });
  return true;
}

/**
 * Pass directly as LabReportComponent's onLookupInvoice — pulls the
 * most recent invoice for this patient ID and surfaces the fields the
 * report cares about (referring doctor, collection date), so a
 * technologist doesn't have to re-type what billing already captured.
 */
export async function lookupInvoiceForPatient(patientId) {
  if (!patientId) return null;
  const invoices = await searchInvoices({ text: patientId });
  const match = invoices.find((inv) => inv.patientId === patientId);
  if (!match) return null;
  return {
    referredBy: match.patient?.referredBy || "",
    collectionDate: match.billDateTime ? match.billDateTime.toISOString().slice(0, 10) : "",
  };
}

/** Pass directly as LabReportListComponent's onLoadRecentReports. */
export async function loadRecentReports(limitCount = 50) {
  const snap = await getDocs(
    query(collection(db, COLLECTION), orderBy("reportDate", "desc"), fsLimit(limitCount))
  );
  return snap.docs.map(fromDoc);
}

/**
 * Pass directly as LabReportListComponent's onSearchReports. Same
 * client-side text-filter caveat as searchInvoices() — fine at one
 * hospital's volume, swap for a real search index at real scale.
 */
export async function searchReports({ text, dateFrom, dateTo } = {}) {
  const clauses = [];
  if (dateFrom) clauses.push(where("reportDate", ">=", dateFrom));
  if (dateTo) clauses.push(where("reportDate", "<=", dateTo));

  const snap = await getDocs(query(collection(db, COLLECTION), ...clauses, orderBy("reportDate", "desc")));
  let results = snap.docs.map(fromDoc);

  const term = (text || "").trim().toLowerCase();
  if (term) {
    results = results.filter(
      (rep) =>
        (rep.patientName || "").toLowerCase().includes(term) ||
        (rep.patientRegNo || "").toLowerCase().includes(term) ||
        (rep.patient?.mobile || "").includes(term)
    );
  }
  return results;
}
