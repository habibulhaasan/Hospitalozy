"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { formatMoney, formatMoneyShort, fmtDate, fmtDateTime, isoDate } from "@/lib/format";

/* ------------------------------------------------------------------ *
 * This file uses `recharts` for the trend/breakdown charts — run
 * `npm install recharts` in your project.
 *
 * formatMoney/formatMoneyShort/fmtDate/fmtDateTime/isoDate were
 * previously duplicated directly in this file (identically to
 * InvoiceComponent's copies) — now imported from lib/format.js.
 * Date-preset helpers below (startOfToday etc.) stay local since
 * they're specific to this component's filter bar.
 * ------------------------------------------------------------------ */

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek() {
  const d = startOfToday();
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d;
}
function startOfMonth() {
  const d = startOfToday();
  d.setDate(1);
  return d;
}
function startOfYear() {
  const d = startOfToday();
  d.setMonth(0, 1);
  return d;
}

const DATE_PRESETS = [
  { key: "today", label: "Today", from: () => startOfToday(), to: () => new Date() },
  { key: "week", label: "This Week", from: () => startOfWeek(), to: () => new Date() },
  { key: "month", label: "This Month", from: () => startOfMonth(), to: () => new Date() },
  { key: "year", label: "This Year", from: () => startOfYear(), to: () => new Date() },
  { key: "all", label: "All Time", from: () => null, to: () => null },
];

const STATUS_COLORS = { PAID: "#059669", DUE: "#dc2626", FREE: "#94a3b8" };

/* ------------------------------------------------------------------ *
 * Single-value searchable dropdown (combobox) — same pattern as the
 * other components in this project. Used for the "Referred By"
 * filter. Free typing is accepted even if it isn't in the list.
 * ------------------------------------------------------------------ */
function SearchableSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const term = (value || "").trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.toLowerCase().includes(term));
  }, [value, options]);

  return (
    <div className="relative" ref={wrapRef}>
      <input
        className="border rounded px-2 py-1.5 text-sm w-full"
        placeholder={placeholder}
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-slate-200 rounded shadow-lg text-sm">
          {filtered.length === 0 && <div className="px-2 py-1.5 text-xs text-slate-400">No match.</div>}
          {filtered.map((o) => (
            <div
              key={o}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o);
                setOpen(false);
              }}
              className="px-2 py-1.5 hover:bg-slate-100 cursor-pointer"
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`text-lg font-bold ${accent || "text-slate-800"}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/**
 * Firebase hookup — backend-agnostic, same pattern as the other
 * components in this project.
 *
 *   onLoadInvoices(filters) => return invoices matching
 *     filters = { dateFrom, dateTo, status, referredBy } (any of
 *     these may be undefined — treat that as "no constraint on this
 *     field"). Shape matches what the Invoice component saves:
 *     invoiceNumber, billDateTime, hospitalName, hospitalAddress,
 *     patient, lineItems, totals: {total, payable, netBill, due},
 *     status, deliveryDateTime.
 *
 *     This component re-queries onLoadInvoices whenever the date
 *     range, status, or Referred By filter changes, then does the
 *     rest (search text, min/max amount, all the KPI/chart maths)
 *     client-side against whatever comes back. That's fine at the
 *     scale of one hospital's invoice volume; if this ever needs to
 *     analyze years of history across multiple facilities, that's
 *     the point where server-side aggregation (scheduled rollups,
 *     BigQuery export, etc.) starts being worth the extra plumbing
 *     instead of pulling every matching invoice into the browser.
 *
 *   onLoadDoctors() => string[] for the Referred By filter dropdown
 *     — same prop shape as the Invoice/Lab Report components, so it
 *     can point at the same source.
 *
 *   getCategoryForTestName(name) => optional. Returns a category
 *     string for a line-item name, so the "Revenue by Category" chart
 *     has something to group by. Defaults to labeling everything
 *     "Uncategorized" — wire it to a lookup against your Test Master
 *     records (by name) once that's backed by a real database, rather
 *     than this component keeping its own separate copy of category
 *     data that could drift out of sync with the master list.
 */
export default function AccountingComponent({
  onLoadInvoices = async () => [],
  onLoadDoctors = async () => [],
  getCategoryForTestName = () => "Uncategorized",
} = {}) {
  const [datePreset, setDatePreset] = useState("month");
  const [dateFrom, setDateFrom] = useState(isoDate(startOfMonth()));
  const [dateTo, setDateTo] = useState(isoDate(new Date()));
  const [statusFilter, setStatusFilter] = useState("All");
  const [referredByFilter, setReferredByFilter] = useState("");
  const [doctorOptions, setDoctorOptions] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [dueOnly, setDueOnly] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading"); // "loading" | "loaded" | "error"
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    onLoadDoctors().then(setDoctorOptions).catch(() => {});
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInvoices(overrideFrom, overrideTo, overrideStatus, overrideReferredBy) {
    setLoadStatus("loading");
    try {
      const results = await onLoadInvoices({
        dateFrom: overrideFrom !== undefined ? overrideFrom : dateFrom || undefined,
        dateTo: overrideTo !== undefined ? overrideTo : dateTo || undefined,
        status: (overrideStatus !== undefined ? overrideStatus : statusFilter) === "All" ? undefined : (overrideStatus !== undefined ? overrideStatus : statusFilter),
        referredBy: (overrideReferredBy !== undefined ? overrideReferredBy : referredByFilter) || undefined,
      });
      setInvoices(Array.isArray(results) ? results : []);
      setLoadStatus("loaded");
    } catch (err) {
      console.error(err);
      setLoadStatus("error");
    }
  }

  function applyDatePreset(presetKey) {
    setDatePreset(presetKey);
    const preset = DATE_PRESETS.find((p) => p.key === presetKey);
    const from = preset.from();
    const to = preset.to();
    const fromStr = from ? isoDate(from) : "";
    const toStr = to ? isoDate(to) : "";
    setDateFrom(fromStr);
    setDateTo(toStr);
    loadInvoices(fromStr, toStr);
  }

  function handleApplyFilters() {
    setDatePreset("custom");
    loadInvoices();
  }

  // Client-side refinement on top of whatever onLoadInvoices returned
  // — cheap enough to redo on every keystroke without a new backend
  // round-trip.
  const filteredInvoices = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    const min = minAmount !== "" ? Number(minAmount) : null;
    const max = maxAmount !== "" ? Number(maxAmount) : null;
    return invoices.filter((inv) => {
      const netBill = inv.totals?.netBill || 0;
      const due = Math.max(inv.totals?.due || 0, 0);
      const matchesTerm =
        !term ||
        (inv.invoiceNumber || "").toLowerCase().includes(term) ||
        (inv.patient?.name || "").toLowerCase().includes(term) ||
        (inv.patient?.patientId || "").toLowerCase().includes(term) ||
        (inv.patient?.mobile || "").includes(term);
      const matchesMin = min === null || netBill >= min;
      const matchesMax = max === null || netBill <= max;
      const matchesDue = !dueOnly || due > 0.004;
      return matchesTerm && matchesMin && matchesMax && matchesDue;
    });
  }, [invoices, searchText, minAmount, maxAmount, dueOnly]);

  // ---- KPIs ----
  const kpis = useMemo(() => {
    let totalBilled = 0, totalNetBill = 0, totalCollected = 0, totalDue = 0, totalDiscount = 0, totalPreviousDue = 0;
    filteredInvoices.forEach((inv) => {
      const t = inv.totals || {};
      const due = Math.max(t.due || 0, 0);
      const collected = (t.netBill || 0) - due;
      totalBilled += t.total || 0;
      totalNetBill += t.netBill || 0;
      totalCollected += collected;
      totalDue += due;
      totalDiscount += (t.payable || 0) - (t.netBill || 0);
      totalPreviousDue += (t.payable || 0) - (t.total || 0);
    });
    const count = filteredInvoices.length;
    const avgBill = count ? totalNetBill / count : 0;
    const collectionRate = totalNetBill > 0 ? (totalCollected / totalNetBill) * 100 : 0;
    return { totalBilled, totalNetBill, totalCollected, totalDue, totalDiscount, totalPreviousDue, count, avgBill, collectionRate };
  }, [filteredInvoices]);

  // ---- Revenue trend (bucketed by day if range is short, else by month) ----
  const trendData = useMemo(() => {
    if (filteredInvoices.length === 0) return [];
    const dates = filteredInvoices.map((inv) => new Date(inv.billDateTime)).filter((d) => !Number.isNaN(d.getTime()));
    if (dates.length === 0) return [];
    const spanDays = (Math.max(...dates) - Math.min(...dates)) / (1000 * 3600 * 24);
    const byMonth = spanDays > 60;

    const buckets = {};
    filteredInvoices.forEach((inv) => {
      const d = new Date(inv.billDateTime);
      if (Number.isNaN(d.getTime())) return;
      const key = byMonth
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!buckets[key]) buckets[key] = { key, collected: 0, due: 0 };
      const due = Math.max(inv.totals?.due || 0, 0);
      const collected = (inv.totals?.netBill || 0) - due;
      buckets[key].collected += collected;
      buckets[key].due += due;
    });
    return Object.values(buckets)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((b) => ({
        ...b,
        label: byMonth
          ? new Date(b.key + "-01").toLocaleDateString("en-BD", { month: "short", year: "2-digit" })
          : new Date(b.key).toLocaleDateString("en-BD", { day: "2-digit", month: "short" }),
      }));
  }, [filteredInvoices]);

  // ---- Status breakdown (by amount, not just count) ----
  const statusData = useMemo(() => {
    const groups = { PAID: 0, DUE: 0, FREE: 0 };
    filteredInvoices.forEach((inv) => {
      groups[inv.status] = (groups[inv.status] || 0) + (inv.totals?.netBill || 0);
    });
    return Object.entries(groups)
      .filter(([, v]) => v > 0)
      .map(([status, value]) => ({ status, value }));
  }, [filteredInvoices]);

  // ---- Top tests by revenue ----
  const topTests = useMemo(() => {
    const totals = {};
    filteredInvoices.forEach((inv) => {
      (inv.lineItems || []).forEach((it) => {
        const bill = (Number(it.rate) || 0) * (Number(it.qty) || 0);
        totals[it.name] = (totals[it.name] || 0) + bill;
      });
    });
    return Object.entries(totals)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredInvoices]);

  // ---- Revenue by category (via the optional lookup prop) ----
  const categoryData = useMemo(() => {
    const totals = {};
    filteredInvoices.forEach((inv) => {
      (inv.lineItems || []).forEach((it) => {
        const cat = getCategoryForTestName(it.name) || "Uncategorized";
        const bill = (Number(it.rate) || 0) * (Number(it.qty) || 0);
        totals[cat] = (totals[cat] || 0) + bill;
      });
    });
    return Object.entries(totals)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredInvoices, getCategoryForTestName]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h1 className="text-base font-semibold mb-3">Accounting</h1>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => applyDatePreset(p.key)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  datePreset === p.key ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center mb-2">
            <input type="date" className="border rounded px-2 py-1.5 text-sm" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDatePreset("custom"); }} />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" className="border rounded px-2 py-1.5 text-sm" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDatePreset("custom"); }} />
            <select className="border rounded px-2 py-1.5 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>PAID</option>
              <option>DUE</option>
              <option>FREE</option>
            </select>
            <div className="w-48">
              <SearchableSelect value={referredByFilter} onChange={setReferredByFilter} options={doctorOptions} placeholder="Referred by (any)" />
            </div>
            <button onClick={handleApplyFilters} className="text-sm bg-slate-800 text-white px-4 py-1.5 rounded">Apply</button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <input
              className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[200px]"
              placeholder="Search by Patient ID, Mobile, Name, or Invoice No."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <input type="number" className="border rounded px-2 py-1.5 text-sm w-28" placeholder="Min ৳" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            <input type="number" className="border rounded px-2 py-1.5 text-sm w-28" placeholder="Max ৳" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
            <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} />
              Due only
            </label>
          </div>
        </div>

        {loadStatus === "loading" && <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-sm text-slate-400">Loading…</div>}
        {loadStatus === "error" && <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-sm text-red-500">Couldn't load invoices — check the connection.</div>}

        {loadStatus === "loaded" && (
          <>
            {/* ---- KPI cards ---- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Net Billed" value={formatMoney(kpis.totalNetBill)} sub={`${kpis.count} invoice${kpis.count !== 1 ? "s" : ""}`} />
              <KpiCard label="Collected" value={formatMoney(kpis.totalCollected)} accent="text-emerald-700" sub={`${kpis.collectionRate.toFixed(1)}% collection rate`} />
              <KpiCard label="Outstanding Due" value={formatMoney(kpis.totalDue)} accent="text-red-600" />
              <KpiCard label="Discount Given" value={formatMoney(kpis.totalDiscount)} sub={`Avg. bill ${formatMoney(kpis.avgBill)}`} />
            </div>

            {/* ---- Revenue trend ---- */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-600 mb-2">Collected vs. Due Over Time</div>
              {trendData.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-10">No data for this range.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={formatMoneyShort} />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Legend />
                    <Bar dataKey="collected" name="Collected" stackId="a" fill="#059669" />
                    <Bar dataKey="due" name="Due" stackId="a" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ---- Status breakdown ---- */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-xs font-semibold text-slate-600 mb-2">Revenue by Status</div>
                {statusData.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-10">No data.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={(d) => d.status}>
                        {statusData.map((d) => (
                          <Cell key={d.status} fill={STATUS_COLORS[d.status] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatMoney(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* ---- Top tests by revenue ---- */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-xs font-semibold text-slate-600 mb-2">Top Tests by Revenue</div>
                {topTests.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-10">No data.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topTests} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatMoneyShort} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                      <Tooltip formatter={(v) => formatMoney(v)} />
                      <Bar dataKey="revenue" fill="#334155" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ---- Revenue by category (only shown once getCategoryForTestName is wired up) ---- */}
            {categoryData.length > 0 && categoryData.some((c) => c.category !== "Uncategorized") && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-xs font-semibold text-slate-600 mb-2">Revenue by Category</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={formatMoneyShort} />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Bar dataKey="revenue" fill="#0f6b3c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ---- Invoice list — click a row for the detail view ---- */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
              <div className="px-3 pt-3 text-xs font-semibold text-slate-600">
                Invoices ({filteredInvoices.length})
              </div>
              {filteredInvoices.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">No invoices match these filters.</div>
              ) : (
                <table className="w-full text-sm min-w-[820px] mt-2">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                      <th className="py-2 px-3 font-medium">Invoice No.</th>
                      <th className="py-2 px-3 font-medium">Bill Date</th>
                      <th className="py-2 px-3 font-medium">Patient</th>
                      <th className="py-2 px-3 font-medium">Referred By</th>
                      <th className="py-2 px-3 font-medium text-right">Net Bill</th>
                      <th className="py-2 px-3 font-medium text-right">Due</th>
                      <th className="py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <tr
                        key={inv.invoiceNumber}
                        onClick={() => setSelected(inv)}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="py-2 px-3 font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{fmtDate(inv.billDateTime)}</td>
                        <td className="py-2 px-3 font-medium">{inv.patient?.name || "—"}</td>
                        <td className="py-2 px-3">{inv.patient?.referredBy || "—"}</td>
                        <td className="py-2 px-3 text-right font-semibold">{formatMoney(inv.totals?.netBill)}</td>
                        <td className={`py-2 px-3 text-right ${(inv.totals?.due || 0) > 0.004 ? "text-red-600 font-semibold" : "text-slate-400"}`}>
                          {formatMoney(Math.max(inv.totals?.due || 0, 0))}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            inv.status === "PAID" ? "bg-emerald-50 text-emerald-700" : inv.status === "DUE" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* ============ INVOICE DETAIL MODAL ============ */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-semibold">Invoice {selected.invoiceNumber}</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  selected.status === "PAID" ? "bg-emerald-50 text-emerald-700" : selected.status === "DUE" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {selected.status}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div><span className="text-slate-500">Bill Time:</span> <b>{fmtDateTime(selected.billDateTime)}</b></div>
                <div><span className="text-slate-500">Expected Delivery:</span> <b>{fmtDateTime(selected.deliveryDateTime)}</b></div>
                <div><span className="text-slate-500">Patient:</span> <b>{selected.patient?.name || "—"}</b></div>
                <div><span className="text-slate-500">Patient ID:</span> <b>{selected.patient?.patientId || "—"}</b></div>
                <div><span className="text-slate-500">Mobile:</span> <b>{selected.patient?.mobile || "—"}</b></div>
                <div><span className="text-slate-500">Referred By:</span> <b>{selected.patient?.referredBy || "—"}</b></div>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-300">
                    <th className="py-1 pr-2 font-medium">Test Name</th>
                    <th className="py-1 pr-2 font-medium text-right">Rate</th>
                    <th className="py-1 pr-2 font-medium text-right">Qty</th>
                    <th className="py-1 font-medium text-right">Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.lineItems || []).map((it, idx) => (
                    <tr key={it.id || idx} className="border-b border-slate-100">
                      <td className="py-1 pr-2">{it.name}</td>
                      <td className="py-1 pr-2 text-right">{formatMoney(it.rate)}</td>
                      <td className="py-1 pr-2 text-right">{it.qty}</td>
                      <td className="py-1 text-right font-semibold">{formatMoney((Number(it.rate) || 0) * (Number(it.qty) || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table className="text-xs w-full">
                <tbody>
                  <tr><td className="py-0.5 text-slate-500">Total</td><td className="py-0.5 text-right">{formatMoney(selected.totals?.total)}</td></tr>
                  <tr><td className="py-0.5 text-slate-500">Previous Due</td><td className="py-0.5 text-right">{formatMoney((selected.totals?.payable || 0) - (selected.totals?.total || 0))}</td></tr>
                  <tr className="border-t border-slate-200"><td className="py-0.5 text-slate-500">Payable</td><td className="py-0.5 text-right">{formatMoney(selected.totals?.payable)}</td></tr>
                  <tr><td className="py-0.5 text-slate-500">Discount</td><td className="py-0.5 text-right">{formatMoney((selected.totals?.payable || 0) - (selected.totals?.netBill || 0))}</td></tr>
                  <tr className="border-t border-slate-300"><td className="py-0.5 font-semibold">Net Bill</td><td className="py-0.5 text-right font-bold">{formatMoney(selected.totals?.netBill)}</td></tr>
                  <tr><td className="py-0.5 text-slate-500">Collected</td><td className="py-0.5 text-right text-emerald-700 font-semibold">{formatMoney((selected.totals?.netBill || 0) - Math.max(selected.totals?.due || 0, 0))}</td></tr>
                  <tr className="border-t border-slate-300">
                    <td className="py-0.5 font-semibold">Due</td>
                    <td className={`py-0.5 text-right font-bold ${(selected.totals?.due || 0) > 0.004 ? "text-red-600" : ""}`}>
                      {formatMoney(Math.max(selected.totals?.due || 0, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end px-5 py-3 border-t border-slate-200">
              <button onClick={() => setSelected(null)} className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
