"use client";

/**
 * components/patient/PatientComponent.jsx
 * ------------------------------------------------------------------
 * The patient list/detail/edit screen — the missing piece from
 * earlier, since patients were previously only ever created and
 * looked up as a side-effect of Invoice/LabReport/PatientBilling, with
 * nowhere to just browse "who's registered."
 *
 * Deliberately no Delete here (unlike Doctor/Employee/Test Master):
 * a patient record is referenced by invoices, lab reports, and OPD
 * tickets — hard-deleting it would either orphan that history or
 * require cascading deletes across three other collections, neither
 * of which is a decision this component should make silently. If you
 * need to deactivate a patient record, add a `status` field and a
 * toggle (same pattern as Doctor's Active/Inactive) instead of an
 * actual delete.
 *
 * Firebase hookup:
 *   onLoadPatients() => full array of patient records
 *   onSearchPatients(text) => filtered array
 *   onSavePatient(patientData) => update (patientData.patientId is
 *     always set here — see PatientEditModal's doc comment for why
 *     there's no create path)
 *   onLoadDoctors() => string[] for the Referred By field
 *
 * In this project, pass lib/firestore's functions directly:
 *   <PatientComponent
 *     onLoadPatients={loadPatients}
 *     onSearchPatients={searchPatients}
 *     onSavePatient={savePatient}
 *     onLoadDoctors={loadActiveDoctorNames}
 *   />
 * ------------------------------------------------------------------ */
import React, { useState, useEffect } from "react";
import PatientFilters from "./PatientFilters";
import PatientTable from "./PatientTable";
import PatientDetailModal from "./PatientDetailModal";
import PatientEditModal from "./PatientEditModal";
import { BLANK_PATIENT } from "./patientShape";

export default function PatientComponent({
  onLoadPatients = async () => [],
  onSearchPatients = async () => [],
  onSavePatient = async (patientData) => patientData.patientId,
  onLoadDoctors = async () => [],
} = {}) {
  const [patients, setPatients] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const [doctorOptions, setDoctorOptions] = useState([]);
  const [viewPatient, setViewPatient] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    onLoadDoctors().then(setDoctorOptions).catch(() => {});
    onLoadPatients()
      .then((list) => {
        setPatients(Array.isArray(list) ? list : []);
        setLoadStatus("loaded");
      })
      .catch(() => setLoadStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search is server-side here (unlike Doctor's client-side filter)
  // since a hospital's patient list can get large fast — debounced by
  // just re-querying on every change rather than filtering an
  // already-loaded array in memory.
  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    const handle = setTimeout(() => {
      (search.trim() ? onSearchPatients(search.trim()) : onLoadPatients())
        .then((list) => {
          if (!cancelled) {
            setPatients(Array.isArray(list) ? list : []);
            setLoadStatus("loaded");
            setSearching(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoadStatus("error");
            setSearching(false);
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openEdit(patient) {
    setEditDraft({ ...BLANK_PATIENT, ...patient });
    setSaveStatus("");
  }

  async function handleSave() {
    if (!editDraft.name.trim()) return;
    setSaveStatus("saving");
    try {
      await onSavePatient(editDraft);
      setPatients((prev) => prev.map((p) => (p.patientId === editDraft.patientId ? editDraft : p)));
      setEditDraft(null);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h1 className="text-base font-semibold">Patients</h1>
          <p className="text-xs text-slate-500">
            {patients.length} patient{patients.length !== 1 ? "s" : ""} {search ? "found" : "on record"}
            {searching && " — searching…"}
          </p>
        </div>

        <PatientFilters search={search} onSearchChange={setSearch} />

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <PatientTable
            loadStatus={loadStatus}
            patients={patients}
            filteredPatients={patients}
            onView={setViewPatient}
            onEdit={openEdit}
          />
        </div>
      </div>

      {viewPatient && (
        <PatientDetailModal
          patient={viewPatient}
          onClose={() => setViewPatient(null)}
          onEdit={(p) => {
            openEdit(p);
            setViewPatient(null);
          }}
        />
      )}

      {editDraft && (
        <PatientEditModal
          draft={editDraft}
          setDraft={setEditDraft}
          saveStatus={saveStatus}
          onSave={handleSave}
          onClose={() => setEditDraft(null)}
          doctorOptions={doctorOptions}
        />
      )}
    </div>
  );
}
