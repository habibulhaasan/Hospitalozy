/**
 * lib/firestore/billingSources.js
 * ------------------------------------------------------------------
 * Backs LabReportComponent's new "find patient via Invoice/OPD
 * Ticket" search — a lab report's patient is almost always someone
 * who was already billed (either an itemized Invoice or an OPD
 * Ticket), so instead of a technologist retyping patient details by
 * hand, they search by invoice/ticket number (or the patient's name
 * or mobile) and the report pulls the patient, referring doctor, and
 * collection date straight from whichever billing record they pick.
 *
 * Deliberately its own file rather than a method on invoices.js or
 * tickets.js — it composes both of those (searchInvoices +
 * searchTickets already exist for the Invoice/Ticket List
 * components) into one unified result shape rather than duplicating
 * either search's query logic.
 * ------------------------------------------------------------------ */
import { searchInvoices } from "@/lib/firestore/invoices";
import { searchTickets } from "@/lib/firestore/tickets";

function isoDateOf(d) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/**
 * searchBillingSources — finds billing records to attach to a lab report.
 *
 * @param {string} text — invoice/ticket no., patient name, or mobile
 * @param {object} options
 * @param {"invoice"|"ticket"|"both"} options.source — which collection to search. Default "invoice".
 * @param {string|null} options.dateFrom — ISO date string lower bound. Default: 90 days ago.
 *   Pass "2000-01-01" to search all records with no effective date limit.
 */
export async function searchBillingSources(text, { source = "invoice", dateFrom } = {}) {
  const term = (text || "").trim();
  if (!term) return [];

  // 90-day rolling default
  const effectiveDateFrom = dateFrom || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  })();

  const runInvoices = source === "invoice" || source === "both";
  const runTickets  = source === "ticket"  || source === "both";

  const [invoices, tickets] = await Promise.all([
    runInvoices ? searchInvoices({ text: term, dateFrom: effectiveDateFrom }) : Promise.resolve([]),
    runTickets  ? searchTickets({ text: term, dateFrom: effectiveDateFrom })  : Promise.resolve([]),
  ]);

  const fromInvoices = invoices.map((inv) => ({
    key: `invoice:${inv.invoiceNumber}`,
    source: "Invoice",
    refNo: inv.invoiceNumber,
    patientId: inv.patient?.patientId || inv.patientId || "",
    patientName: inv.patient?.name || inv.patientName || "",
    mobile: inv.patient?.mobile || inv.patientMobile || "",
    gender: inv.patient?.gender || "",
    ageY: inv.patient?.ageY || "",
    ageM: inv.patient?.ageM || "",
    ageD: inv.patient?.ageD || "",
    referredBy: inv.patient?.referredBy || "",
    collectionDate: isoDateOf(inv.billDateTime),
  }));

  const fromTickets = tickets.map((t) => ({
    key: `ticket:${t.billNo}`,
    source: "OPD Ticket",
    refNo: t.billNo,
    patientId: t.patient?.patientId || t.patientId || "",
    patientName: t.patient?.name || t.patientName || "",
    mobile: t.patient?.mobile || t.patientMobile || "",
    gender: t.patient?.gender || "",
    ageY: t.patient?.ageY || "",
    ageM: t.patient?.ageM || "",
    ageD: t.patient?.ageD || "",
    referredBy: t.patient?.referredBy || "",
    collectionDate: isoDateOf(t.billDateTime),
  }));

  return [...fromInvoices, ...fromTickets];
}
