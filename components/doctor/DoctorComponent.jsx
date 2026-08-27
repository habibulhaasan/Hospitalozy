"use client";

/**
 * components/doctor/DoctorComponent.jsx
 * ------------------------------------------------------------------
 * Orchestrator only — state and the handlers that talk to
 * onLoadDoctors/onSaveDoctor/onDeleteDoctor now live here, all the
 * markup lives in DoctorFilters / DoctorTable / DoctorRow /
 * DoctorModal. This file used to be ~600 lines doing all of it at
 * once; splitting it out is what makes each piece independently
 * testable/customizable — e.g. swap DoctorModal's field layout
 * without touching how the list loads or filters.
 *
 * Firebase hookup — same backend-agnostic props as before:
 *   onLoadDoctors() => full array of doctor records
 *   onSaveDoctor(doctorData) => create (empty id) or update, returns saved record
 *   onDeleteDoctor(id) => delete
 *
 * In this project, pass lib/firestore/doctors.js's functions directly:
 *   <DoctorComponent
 *     onLoadDoctors={loadDoctorRecords}
 *     onSaveDoctor={saveDoctor}
 *     onDeleteDoctor={deleteDoctor}
 *   />
 * ------------------------------------------------------------------ */
import React, { useState, useMemo, useEffect } from "react";
import DoctorFilters from "./DoctorFilters";
import DoctorTable from "./DoctorTable";
import DoctorModal from "./DoctorModal";
import DoctorDetailModal from "./DoctorDetailModal";
import { BLANK_DOCTOR, generateDoctorId } from "./doctorShape";

export default function DoctorComponent({
  onLoadDoctors = async () => [],
  onSaveDoctor = async (doctorData) => ({ ...doctorData, id: doctorData.id || generateDoctorId() }),
  onDeleteDoctor = async () => true,
} = {}) {
  const [doctors, setDoctors] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");

  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(BLANK_DOCTOR);
  const [saveStatus, setSaveStatus] = useState("");

  const [viewDoctor, setViewDoctor] = useState(null); // read-only detail view — separate from the edit modal

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    onLoadDoctors()
      .then((list) => {
        setDoctors(Array.isArray(list) ? list : []);
        setLoadStatus("loaded");
      })
      .catch(() => setLoadStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDoctors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return doctors.filter((d) => {
      const matchesTerm =
        !term ||
        d.name.toLowerCase().includes(term) ||
        (d.mobile || "").includes(term) ||
        (d.bmdc || "").toLowerCase().includes(term) ||
        (d.id || "").toLowerCase().includes(term);
      const matchesSpecialty = specialtyFilter === "All" || d.specialty === specialtyFilter;
      return matchesTerm && matchesSpecialty;
    });
  }, [doctors, search, specialtyFilter]);

  function openAddModal() {
    setDraft({ ...BLANK_DOCTOR, id: "" });
    setSaveStatus("");
    setModalOpen(true);
  }
  function openEditModal(doc) {
    setDraft({ ...doc, qualifications: [...(doc.qualifications || [])] });
    setSaveStatus("");
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setDraft(BLANK_DOCTOR);
    setSaveStatus("");
  }

  async function handleSaveDoctor() {
    if (!draft.name.trim()) return;
    setSaveStatus("saving");
    try {
      const saved = await onSaveDoctor(draft);
      setDoctors((prev) => {
        const exists = prev.some((d) => d.id === saved.id);
        return exists ? prev.map((d) => (d.id === saved.id ? saved : d)) : [...prev, saved];
      });
      closeModal();
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  }

  async function handleDeleteDoctor(id) {
    try {
      await onDeleteDoctor(id);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
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
            <h1 className="text-base font-semibold">Doctors</h1>
            <p className="text-xs text-slate-500">{doctors.length} doctor{doctors.length !== 1 ? "s" : ""} on record</p>
          </div>
          <button onClick={openAddModal} className="text-sm bg-slate-800 text-white px-4 py-2 rounded font-medium">
            + Add Doctor
          </button>
        </div>

        <DoctorFilters
          search={search}
          onSearchChange={setSearch}
          specialtyFilter={specialtyFilter}
          onSpecialtyChange={setSpecialtyFilter}
        />

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <DoctorTable
            loadStatus={loadStatus}
            doctors={doctors}
            filteredDoctors={filteredDoctors}
            confirmDeleteId={confirmDeleteId}
            onView={setViewDoctor}
            onEdit={openEditModal}
            onRequestDelete={setConfirmDeleteId}
            onConfirmDelete={handleDeleteDoctor}
            onCancelDelete={() => setConfirmDeleteId(null)}
          />
        </div>
      </div>

      {viewDoctor && (
        <DoctorDetailModal
          doctor={viewDoctor}
          onClose={() => setViewDoctor(null)}
          onEdit={(doc) => {
            openEditModal(doc);
            setViewDoctor(null);
          }}
        />
      )}

      {modalOpen && (
        <DoctorModal
          draft={draft}
          setDraft={setDraft}
          saveStatus={saveStatus}
          onSave={handleSaveDoctor}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
