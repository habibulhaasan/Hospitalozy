/**
 * lib/firestore/reports.js
 * ------------------------------------------------------------------
 * Backs LabReportComponent's onSaveReport/onLookupInvoice, and
 * LabReportListComponent's onLoadRecentReports/onSearchReports.
 * ------------------------------------------------------------------ */
import { db } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, query, where, orderBy, limit as fsLimit, startAfter
} from "firebase/firestore";
import { searchInvoices } from "@/lib/firestore/invoices";

const COLLECTION = "reports";

function fromDoc(d) {
  return { id: d.id, ...d.data() };
}

export async function saveReport(payload) {
  const { id, ...data } = payload;
  const docData = {
    ...data,
    patientName: data.patient?.name || "",
    patientRegNo: data.patient?.regNo || "",
    reportDate: data.patient?.reportDate || "",
    status: data.status || "Completed",
    isPrinted: data.isPrinted || false,
  };

  if (id) {
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, COLLECTION, id), docData);
    return true;
  }

  await addDoc(collection(db, COLLECTION), docData);
  return true;
}

export async function updateReportStatus(id, status) {
  const { doc, updateDoc } = await import("firebase/firestore");
  await updateDoc(doc(db, COLLECTION, id), { status });
  return true;
}

export async function markReportPrinted(id) {
  const { doc, updateDoc } = await import("firebase/firestore");
  await updateDoc(doc(db, COLLECTION, id), { isPrinted: true });
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

export async function loadReportById(id) {
  const { doc, getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return fromDoc(snap);
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

export async function loadReportsPage({ cursor = null, pageSize = 20 } = {}) {
  const baseQ = query(collection(db, COLLECTION), orderBy("reportDate", "desc"));
  const q = cursor
    ? query(baseQ, startAfter(cursor), fsLimit(pageSize + 1))
    : query(baseQ, fsLimit(pageSize + 1));

  const snap = await getDocs(q);
  const docs = snap.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    data: pageDocs.map(fromDoc),
    firstDoc: pageDocs[0] || null,
    lastDoc: pageDocs[pageDocs.length - 1] || null,
    hasMore,
  };
}
