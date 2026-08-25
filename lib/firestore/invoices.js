/**
 * lib/firestore/invoices.js
 * ------------------------------------------------------------------
 * Backs InvoiceComponent's onSaveInvoice, InvoiceListComponent's
 * onLoadRecentInvoices/onSearchInvoices, and AccountingComponent's
 * onLoadInvoices — all three read the same `invoices` collection.
 * ------------------------------------------------------------------ */
import { db } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, query, where, orderBy, limit as fsLimit, Timestamp,
} from "firebase/firestore";

const COLLECTION = "invoices";

function toTimestamp(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  return Timestamp.fromDate(d);
}
function fromTimestamp(ts) {
  return ts?.toDate ? ts.toDate() : new Date(ts);
}

function fromDoc(d) {
  const data = d.data();
  return { ...data, invoiceNumber: data.invoiceNumber || d.id, billDateTime: fromTimestamp(data.billDateTime) };
}

/** Pass directly as InvoiceComponent's onSaveInvoice. */
export async function saveInvoice(payload) {
  await addDoc(collection(db, COLLECTION), {
    ...payload,
    billDateTime: toTimestamp(payload.billDateTime),
    deliveryDateTime: payload.deliveryDateTime ? toTimestamp(payload.deliveryDateTime) : null,
    // Denormalized fields for cheap querying without a composite index
    // on nested `patient.*` — Firestore can't query into a map field
    // efficiently otherwise.
    patientName: payload.patient?.name || "",
    patientMobile: payload.patient?.mobile || "",
    patientId: payload.patient?.patientId || "",
  });
  return true;
}

/** Pass directly as InvoiceListComponent's onLoadRecentInvoices. */
export async function loadRecentInvoices(limitCount = 50) {
  const snap = await getDocs(
    query(collection(db, COLLECTION), orderBy("billDateTime", "desc"), fsLimit(limitCount))
  );
  return snap.docs.map(fromDoc);
}

/**
 * Pass directly as InvoiceListComponent's onSearchInvoices, or
 * AccountingComponent's onLoadInvoices (same query shape covers both —
 * Accounting always sends a date range, InvoiceList's search is
 * optional per field).
 *
 * NOTE: `text` (free-text search across name/mobile/ID/invoice no.)
 * is NOT a native Firestore capability — this does client-side
 * filtering after a date/status-scoped fetch, which is fine at one
 * hospital's volume. For real free-text search at scale, put an
 * Algolia/Typesense index in front of this collection instead.
 */
export async function searchInvoices({ text, status, referredBy, dateFrom, dateTo } = {}) {
  const clauses = [];
  if (status) clauses.push(where("status", "==", status));
  if (referredBy) clauses.push(where("patient.referredBy", "==", referredBy));
  if (dateFrom) clauses.push(where("billDateTime", ">=", toTimestamp(dateFrom)));
  if (dateTo) clauses.push(where("billDateTime", "<=", toTimestamp(new Date(dateTo).setHours(23, 59, 59, 999))));

  const snap = await getDocs(query(collection(db, COLLECTION), ...clauses, orderBy("billDateTime", "desc")));
  let results = snap.docs.map(fromDoc);

  const term = (text || "").trim().toLowerCase();
  if (term) {
    results = results.filter(
      (inv) =>
        (inv.invoiceNumber || "").toLowerCase().includes(term) ||
        (inv.patientName || "").toLowerCase().includes(term) ||
        (inv.patientId || "").toLowerCase().includes(term) ||
        (inv.patientMobile || "").includes(term)
    );
  }
  return results;
}
