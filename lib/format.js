/**
 * lib/format.js
 * ------------------------------------------------------------------
 * Currency, date, and number-to-words helpers — previously duplicated
 * (identically) across InvoiceComponent, InvoiceListComponent,
 * PatientBillingComponent, PatientBillingListComponent, and
 * AccountingComponent. One copy now.
 * ------------------------------------------------------------------ */

/** ৳ + two decimal places, Bangladeshi digit grouping. */
export function formatMoney(n) {
  const num = Number(n) || 0;
  return "৳" + num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Compact form for chart axes — ৳1.2L, ৳3.4k. */
export function formatMoneyShort(n) {
  const num = Number(n) || 0;
  if (Math.abs(num) >= 100000) return "৳" + (num / 100000).toFixed(1) + "L";
  if (Math.abs(num) >= 1000) return "৳" + (num / 1000).toFixed(1) + "k";
  return "৳" + num.toFixed(0);
}

/** Bangladeshi/Indian digit grouping (Lakh/Crore) — "Taka One Lakh Twenty-Five Thousand Only". */
export function numberToWordsBDT(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return "Taka Zero Only";
  const negative = num < 0;
  num = Math.abs(num);

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function twoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }
  function threeDigits(n) {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred";
      n %= 100;
      if (n) str += " ";
    }
    if (n) str += twoDigits(n);
    return str;
  }

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  const rest = num % 1000;

  const parts = [];
  if (crore) parts.push(threeDigits(crore) + " Crore");
  if (lakh) parts.push(threeDigits(lakh) + " Lakh");
  if (thousand) parts.push(threeDigits(thousand) + " Thousand");
  if (rest) parts.push(threeDigits(rest));

  return (negative ? "Minus " : "") + "Taka " + (parts.join(" ") || "Zero") + " Only";
}

export function fmtDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-BD", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** "14:30" -> "2:30 PM" — for <input type="time"> values (Patient Billing's visit times). */
export function fmt12h(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function nowTimeString() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

/** Age in Y/M/D from a DOB string, as of today — used by Invoice and PatientBilling's age auto-fill. */
export function calcAgeFromDOB(dobStr) {
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
