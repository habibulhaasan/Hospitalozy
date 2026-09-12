/**
 * components/invoice/PrintableInvoice.jsx
 * ------------------------------------------------------------------
 * The A4 printed output — status badge, letterhead (or reserved blank
 * space), patient grid, LineItemsTable, TotalsPanel, amount-in-words,
 * signatures. Pure presentation; InvoiceComponent owns all the state
 * this reads.
 * ------------------------------------------------------------------ */
import React from "react";
import Barcode from "@/components/shared/Barcode";
import LineItemsTable from "./LineItemsTable";
import TotalsPanel from "./TotalsPanel";
import { formatMoney, numberToWordsBDT, fmtDateTime } from "@/lib/format";

const STATUS_STYLE = {
  PAID: "bg-emerald-50 border-emerald-500 text-emerald-700",
  DUE: "bg-red-50 border-red-500 text-red-700",
  FREE: "bg-slate-100 border-slate-400 text-slate-600",
};

export default function PrintableInvoice({
  invoiceNumber,
  billDateTime,
  deliveryDateTime,
  hospitalName,
  hospitalAddress,
  showLetterhead,
  letterheadSpace,
  patient,
  lineItems,
  onUpdateItem,
  onRemoveItem,
  totals,
  status,
  previousDue,
  setPreviousDue,
  discount,
  setDiscount,
  received,
  setReceived,
  paymentMode,
  setPaymentMode,
  doctorOptions,
}) {
  return (
    <div
      className="print-page bg-white shadow-lg my-4 mx-auto print:my-0 print:shadow-none relative flex flex-col"
      style={{ width: "210mm", minHeight: "297mm", padding: "12mm 14mm", boxSizing: "border-box" }}
    >
      <div className={`absolute top-[12mm] right-[14mm] border-2 rounded px-4 py-1 text-lg font-bold tracking-widest ${STATUS_STYLE[status]}`}>
        {status}
      </div>

      {showLetterhead ? (
        <div className="text-center border-b-2 border-slate-800 pb-2 mb-3 shrink-0">
          <div className="text-xl font-bold tracking-wide">{hospitalName || "Hospital Name"}</div>
          {hospitalAddress && <div className="text-xs text-slate-500">{hospitalAddress}</div>}
          <div className="text-xs text-slate-500">Invoice / Money Receipt</div>
        </div>
      ) : (
        <div className="shrink-0" style={{ minHeight: `${letterheadSpace}mm` }} />
      )}

      <div className="flex justify-between text-xs mb-3 shrink-0">
        <div>
          <div>Invoice No: <b>{invoiceNumber}</b></div>
          <div>Bill Time: <b>{fmtDateTime(billDateTime)}</b></div>
          <div>Expected Delivery: <b>{fmtDateTime(deliveryDateTime)}</b></div>
        </div>
        <Barcode value={invoiceNumber} />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs border-y border-slate-200 py-2 mb-3 shrink-0">
        <div><span className="text-slate-500">Patient ID:</span> <b>{patient.patientId || "—"}</b></div>
        <div><span className="text-slate-500">Name:</span> <b>{patient.name || "—"}</b></div>
        <div><span className="text-slate-500">Mobile:</span> <b>{patient.mobile || "—"}</b></div>
        <div>
          <span className="text-slate-500">Age:</span>{" "}
          <b>{patient.ageY || "0"}Y {patient.ageM || "0"}M {patient.ageD || "0"}D</b>{" "}
          <span className="text-slate-500">/ Gender:</span> <b>{patient.gender}</b>
        </div>
        <div><span className="text-slate-500">NID/BRN:</span> <b>{patient.nid || "—"}</b></div>
        <div className="col-span-2"><span className="text-slate-500">Address:</span> <b>{patient.address || "—"}</b></div>
        <div className="col-span-2">
          <span className="text-slate-500">Referred By:</span>{" "}
          <b>
            {(() => {
              if (!patient.referredBy || patient.referredBy === "Self") return patient.referredBy || "—";
              const doc = (doctorOptions || []).find((d) => d.name === patient.referredBy);
              if (!doc) return patient.referredBy;
              const quals = Array.isArray(doc.qualifications) ? doc.qualifications.join(", ") : doc.qualifications;
              return [doc.name, quals, doc.specialty].filter(Boolean).join(", ");
            })()}
          </b>
        </div>
      </div>

      <div className="flex-1">
        <LineItemsTable lineItems={lineItems} onUpdateItem={onUpdateItem} onRemoveItem={onRemoveItem} />
      </div>

      <div className="flex justify-end mb-2 shrink-0">
        <TotalsPanel
          totals={totals}
          previousDue={previousDue}
          setPreviousDue={setPreviousDue}
          discount={discount}
          setDiscount={setDiscount}
          received={received}
          setReceived={setReceived}
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
        />
      </div>

      <div className="text-xs italic border-t border-slate-200 pt-2 mb-8 shrink-0">
        In Words: {numberToWordsBDT(totals.netBill)}
      </div>

      {/* mt-auto pushes signatures to the bottom of the page if it's short, or below content if it's long */}
      <div className="flex justify-between items-end text-xs mt-auto shrink-0 pt-8">
        <div className="text-center">
          <div className="border-t border-slate-400 pt-1 w-40">Cashier / Receptionist</div>
        </div>
        <div className="text-center">
          <div className="border-t border-slate-400 pt-1 w-40">Patient / Attendant Signature</div>
        </div>
      </div>
    </div>
  );
}
