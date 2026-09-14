/**
 * lib/firestore/tickets.js
 * ------------------------------------------------------------------
 * Backs PatientBillingComponent's onSaveBill, and
 * PatientBillingListComponent's onLoadRecentTickets/onSearchTickets.
 * ------------------------------------------------------------------ */
import { db } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, query, where, orderBy, limit as fsLimit, Timestamp, startAfter
} from "firebase/firestore";

const COLLECTION = "tickets";

function toTimestamp(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  return Timestamp.fromDate(d);
}
function fromTimestamp(ts) {
  return ts?.toDate ? ts.toDate() : new Date(ts);
}
function fromDoc(d) {
  const data = d.data();
  return {
    ...data,
    billNo: data.billNo || d.id,
    billDateTime: fromTimestamp(data.billDateTime),
    validUntilDate: data.validUntilDate ? fromTimestamp(data.validUntilDate) : null,
  };
}

/** Pass directly as PatientBillingComponent's onSaveBill. */
export async function saveTicket(payload) {
  await addDoc(collection(db, COLLECTION), {
    ...payload,
    billDateTime: toTimestamp(payload.billDateTime),
    validUntilDate: payload.validUntilDate ? toTimestamp(payload.validUntilDate) : null,
    patientName: payload.patient?.name || "",
    patientMobile: payload.patient?.mobile || "",
    patientId: payload.patient?.patientId || "",
  });
  return true;
}

/** Pass directly as PatientBillingListComponent's onLoadRecentTickets. */
export async function loadRecentTickets(limitCount = 50) {
  const snap = await getDocs(
    query(collection(db, COLLECTION), orderBy("billDateTime", "desc"), fsLimit(limitCount))
  );
  return snap.docs.map(fromDoc);
}

/**
 * Pass directly as PatientBillingListComponent's onSearchTickets.
 * Same client-side text-filter caveat as invoices/reports.
 */
export async function searchTickets({ text, department, dateFrom, dateTo } = {}) {
  const clauses = [];
  if (department) clauses.push(where("department", "==", department));
  if (dateFrom) clauses.push(where("billDateTime", ">=", toTimestamp(dateFrom)));
  if (dateTo) clauses.push(where("billDateTime", "<=", toTimestamp(new Date(dateTo).setHours(23, 59, 59, 999))));

  const snap = await getDocs(query(collection(db, COLLECTION), ...clauses, orderBy("billDateTime", "desc")));
  let results = snap.docs.map(fromDoc);

  const term = (text || "").trim().toLowerCase();
  if (term) {
    results = results.filter(
      (t) =>
        (t.billNo || "").toLowerCase().includes(term) ||
        (t.patientName || "").toLowerCase().includes(term) ||
        (t.patientId || "").toLowerCase().includes(term) ||
        (t.patientMobile || "").includes(term)
    );
  }
  return results;
}

export async function loadTicketsPage({ cursor = null, pageSize = 20 } = {}) {
  const baseQ = query(collection(db, COLLECTION), orderBy("billDateTime", "desc"));
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
