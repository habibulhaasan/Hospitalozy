"use client";

import React, { useState, useEffect, useMemo } from "react";
import { formatMoney, fmtDate } from "@/lib/format";

function isoDate(d) {
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d;
}

export default function CommissionComponent({
  onLoadCommissions = async () => [],
  onUpdateCommission = async () => true,
  onLoadAgents = async () => [],
} = {}) {
  const [dateFrom, setDateFrom] = useState(isoDate(startOfMonth()));
  const [dateTo, setDateTo] = useState(isoDate(new Date()));
  const [agentFilter, setAgentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [invoices, setInvoices] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [agentOptions, setAgentOptions] = useState([]);

  const [editInvoice, setEditInvoice] = useState(null);
  const [draftPct, setDraftPct] = useState("");
  const [draftStatus, setDraftStatus] = useState("");

  useEffect(() => {
    onLoadAgents().then((agents) => setAgentOptions(Array.isArray(agents) ? agents : []));
  }, [onLoadAgents]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, agentFilter, statusFilter]);

  async function loadData() {
    setLoadStatus("loading");
    try {
      const results = await onLoadCommissions({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        agentId: agentFilter || undefined,
        status: statusFilter,
      });
      setInvoices(results);
      setLoadStatus("loaded");
    } catch (err) {
      console.error(err);
      setLoadStatus("error");
    }
  }

  function handleOpenEdit(inv) {
    setEditInvoice(inv);
    setDraftPct(inv.agentCommissionPercent?.toString() || "0");
    setDraftStatus(inv.commissionStatus || "Draft");
  }

  async function handleSaveEdit() {
    if (!editInvoice) return;
    const p = parseFloat(draftPct) || 0;
    try {
      await onUpdateCommission(editInvoice.id, {
        agentCommissionPercent: p,
        commissionStatus: draftStatus,
      });
      setInvoices(prev => prev.map(inv => {
        if (inv.id === editInvoice.id) {
          return { ...inv, agentCommissionPercent: p, commissionStatus: draftStatus };
        }
        return inv;
      }));
      setEditInvoice(null);
    } catch (err) {
      console.error("Failed to update commission", err);
    }
  }

  // Calculate totals
  const totalNetBill = useMemo(() => invoices.reduce((acc, inv) => acc + (inv.totals?.netBill || 0), 0), [invoices]);
  const totalCommission = useMemo(() => invoices.reduce((acc, inv) => {
    const net = inv.totals?.netBill || 0;
    const pct = inv.agentCommissionPercent || 0;
    return acc + (net * pct / 100);
  }, 0), [invoices]);

  const disbursedCommission = useMemo(() => invoices.reduce((acc, inv) => {
    if (inv.commissionStatus === "Disbursed") {
      const net = inv.totals?.netBill || 0;
      const pct = inv.agentCommissionPercent || 0;
      return acc + (net * pct / 100);
    }
    return acc;
  }, 0), [invoices]);

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Header & Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h1 className="text-base font-semibold mb-4">Agent Commissions</h1>
          
          <div className="flex items-center gap-3 flex-wrap">
            <input type="date" className="border rounded px-3 py-1.5 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span className="text-slate-400">to</span>
            <input type="date" className="border rounded px-3 py-1.5 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            
            <select className="border rounded px-3 py-1.5 text-sm" value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
              <option value="">All Agents</option>
              {agentOptions.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select className="border rounded px-3 py-1.5 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Calculated">Calculated</option>
              <option value="Disbursed">Disbursed</option>
            </select>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-xs text-slate-500 font-medium">Referred Net Revenue</div>
            <div className="text-2xl font-bold mt-1 text-slate-800">{formatMoney(totalNetBill)}</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-xs text-slate-500 font-medium">Calculated Commission (Total)</div>
            <div className="text-2xl font-bold mt-1 text-slate-800">{formatMoney(totalCommission)}</div>
          </div>
          <div className="bg-white rounded-lg border border-emerald-200 p-4">
            <div className="text-xs text-emerald-600 font-medium">Disbursed Commission</div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">{formatMoney(disbursedCommission)}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          {loadStatus === "loading" && <div className="p-8 text-center text-sm text-slate-400">Loading...</div>}
          {loadStatus === "error" && <div className="p-8 text-center text-sm text-red-500">Failed to load.</div>}
          {loadStatus === "loaded" && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs text-left">
                <tr>
                  <th className="py-3 px-4 font-medium">Invoice No.</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Agent</th>
                  <th className="py-3 px-4 font-medium text-right">Net Bill</th>
                  <th className="py-3 px-4 font-medium text-right">Share (%)</th>
                  <th className="py-3 px-4 font-medium text-right">Commission</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan="8" className="py-8 text-center text-slate-400 text-sm">No commissions found for these filters.</td></tr>
                ) : (
                  invoices.map((inv) => {
                    const net = inv.totals?.netBill || 0;
                    const pct = inv.agentCommissionPercent || 0;
                    const amount = net * pct / 100;
                    
                    return (
                      <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-4 text-xs font-mono">{inv.invoiceNumber}</td>
                        <td className="py-2 px-4 whitespace-nowrap">{fmtDate(inv.billDateTime)}</td>
                        <td className="py-2 px-4 font-medium">{inv.agentName || "Unknown"}</td>
                        <td className="py-2 px-4 text-right">{formatMoney(net)}</td>
                        <td className="py-2 px-4 text-right font-semibold text-blue-600">{pct}%</td>
                        <td className="py-2 px-4 text-right font-bold text-slate-700">{formatMoney(amount)}</td>
                        <td className="py-2 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            inv.commissionStatus === "Disbursed" ? "bg-emerald-50 text-emerald-700" :
                            inv.commissionStatus === "Calculated" ? "bg-blue-50 text-blue-700" :
                            "bg-orange-50 text-orange-700"
                          }`}>
                            {inv.commissionStatus || "Draft"}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <button onClick={() => handleOpenEdit(inv)} className="text-xs text-blue-600 hover:underline">Edit</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-5 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-sm">Update Commission</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-xs text-slate-600">
                Invoice: <b>{editInvoice.invoiceNumber}</b><br/>
                Net Bill: <b>{formatMoney(editInvoice.totals?.netBill || 0)}</b>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Commission Share (%)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={draftPct}
                  onChange={(e) => setDraftPct(e.target.value)}
                />
                <div className="text-xs text-slate-400 mt-1">
                  Amount: <b>{formatMoney((editInvoice.totals?.netBill || 0) * (parseFloat(draftPct) || 0) / 100)}</b>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value)}
                >
                  <option value="Draft">Draft</option>
                  <option value="Calculated">Calculated</option>
                  <option value="Disbursed">Disbursed</option>
                </select>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 rounded-b-lg">
              <button onClick={() => setEditInvoice(null)} className="px-3 py-1.5 text-sm border rounded text-slate-600 bg-white">Cancel</button>
              <button onClick={handleSaveEdit} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

