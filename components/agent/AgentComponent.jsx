"use client";

import React, { useState, useMemo, useEffect } from "react";

const BLANK_AGENT = {
  name: "",
  phone: "",
  address: "",
  defaultCommissionPercent: 10,
  note: "",
  status: "Active",
};

export default function AgentComponent({
  onLoadAgents = async () => [],
  onSaveAgent = async (data) => data,
  onDeleteAgent = async () => true,
} = {}) {
  const [agents, setAgents] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(BLANK_AGENT);
  const [saveStatus, setSaveStatus] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    onLoadAgents()
      .then((list) => {
        setAgents(Array.isArray(list) ? list : []);
        setLoadStatus("loaded");
      })
      .catch(() => setLoadStatus("error"));
  }, [onLoadAgents]);

  const filteredAgents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return agents.filter((a) => {
      const matchesTerm =
        !term ||
        (a.name || "").toLowerCase().includes(term) ||
        (a.phone || "").includes(term) ||
        (a.id || "").toLowerCase().includes(term);
      const matchesStatus = statusFilter === "All" || a.status === statusFilter;
      return matchesTerm && matchesStatus;
    });
  }, [agents, search, statusFilter]);

  function openAddModal() {
    setDraft({ ...BLANK_AGENT, id: "" });
    setSaveStatus("");
    setModalOpen(true);
  }

  function openEditModal(agent) {
    setDraft({ ...agent });
    setSaveStatus("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setDraft(BLANK_AGENT);
    setSaveStatus("");
  }

  async function handleSaveAgent() {
    if (!draft.name.trim()) return;
    setSaveStatus("saving");
    try {
      const saved = await onSaveAgent(draft);
      setAgents((prev) => {
        const exists = prev.some((a) => a.id === saved.id);
        return exists ? prev.map((a) => (a.id === saved.id ? saved : a)) : [...prev, saved];
      });
      closeModal();
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  }

  async function handleDeleteAgent(id) {
    try {
      await onDeleteAgent(id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
    setConfirmDeleteId(null);
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Agents / Middlemen</h1>
            <p className="text-xs text-slate-500">{agents.length} agent{agents.length !== 1 ? "s" : ""} on record</p>
          </div>
          <button onClick={openAddModal} className="text-sm bg-slate-800 text-white px-4 py-2 rounded font-medium hover:bg-slate-700">
            + Add Agent
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
          <input
            className="flex-1 border rounded px-3 py-1.5 text-sm"
            placeholder="Search by name, ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border rounded px-3 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          {loadStatus === "loading" && <div className="p-8 text-center text-sm text-slate-400">Loading...</div>}
          {loadStatus === "error" && <div className="p-8 text-center text-sm text-red-500">Failed to load agents.</div>}
          {loadStatus === "loaded" && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs text-left">
                <tr>
                  <th className="py-3 px-4 font-medium">Agent ID</th>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Phone</th>
                  <th className="py-3 px-4 font-medium text-right">Default %</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">No agents found.</td>
                  </tr>
                ) : (
                  filteredAgents.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-4 text-xs font-mono">{a.id}</td>
                      <td className="py-2 px-4 font-medium">
                        {a.name}
                        {a.note && <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={a.note}>{a.note}</div>}
                      </td>
                      <td className="py-2 px-4">{a.phone || "—"}</td>
                      <td className="py-2 px-4 text-right font-semibold">{a.defaultCommissionPercent}%</td>
                      <td className="py-2 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${a.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(a)} className="text-xs text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => setConfirmDeleteId(a.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DELETE CONFIRM */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full">
            <h3 className="font-semibold text-red-600">Delete Agent</h3>
            <p className="text-sm mt-2 text-slate-600">Are you sure you want to delete this agent? This cannot be undone.</p>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDeleteAgent(confirmDeleteId)} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-semibold">{draft.id ? "Edit Agent" : "New Agent"}</h2>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              {saveStatus === "error" && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">Failed to save agent.</div>}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Default Share (%)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={draft.defaultCommissionPercent}
                    onChange={(e) => setDraft({ ...draft, defaultCommissionPercent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Note</label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm h-20"
                  value={draft.note}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button onClick={closeModal} className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded hover:bg-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveAgent}
                disabled={!draft.name.trim() || saveStatus === "saving"}
                className="px-4 py-2 text-sm bg-slate-800 text-white rounded font-medium hover:bg-slate-900 disabled:bg-slate-300 transition-colors"
              >
                {saveStatus === "saving" ? "Saving..." : "Save Agent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

