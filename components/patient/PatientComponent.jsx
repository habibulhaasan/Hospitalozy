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
import Pagination from "@/components/shared/Pagination";
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
  onLoadPatientsPage = async () => ({}),
} = {}) {
  const [patients, setPatients] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState("recent"); // "recent" | "search"

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [cursorStack, setCursorStack] = useState([]);
  const [lastRawDoc, setLastRawDoc] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);

  const [doctorOptions, setDoctorOptions] = useState([]);
  const [viewPatient, setViewPatient] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    onLoadDoctors().then(setDoctorOptions).catch(() => {});
    loadPage(null, 1, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPage(cursor, pageNum, stack) {
    setPageLoading(true);
    setMode("recent");
    if (patients.length === 0) setLoadStatus("loading");
    try {
      const result = await onLoadPatientsPage({ cursor });
      setPatients(result.data);
      setHasMore(result.hasMore);
      setCurrentPage(pageNum);
      setCursorStack(stack);
      setLastRawDoc(result.lastDoc);
      setLoadStatus("loaded");
    } catch {
      setLoadStatus("error");
    } finally {
      setPageLoading(false);
    }
  }

  function handleNext() {
    loadPage(lastRawDoc, currentPage + 1, [...cursorStack, lastRawDoc]);
  }

  function handlePrev() {
    const newStack = cursorStack.slice(0, -1);
    const cursor = newStack.length > 0 ? newStack[newStack.length - 1] : null;
    loadPage(cursor, currentPage - 1, newStack);
  }

  // Debounced Search
  useEffect(() => {
    let cancelled = false;
    // Don't search if it's empty and we are already in recent mode
    if (!search.trim() && mode === "recent") return;

    setSearching(true);
    const handle = setTimeout(() => {
      if (search.trim()) {
        onSearchPatients(search.trim())
          .then((list) => {
            if (!cancelled) {
              setMode("search");
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
      } else {
        // Revert to recent list if search cleared
        if (!cancelled) {
          loadPage(null, 1, []).then(() => {
            if (!cancelled) setSearching(false);
          });
        }
      }
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
      const savedId = await onSavePatient(editDraft);
      const savedRecord = { ...editDraft, patientId: savedId };
      if (editDraft.patientId) {
        setPatients((prev) => prev.map((p) => (p.patientId === savedId ? savedRecord : p)));
      } else {
        setPatients((prev) => [savedRecord, ...prev]);
      }
      setEditDraft(null);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Patients</h1>
            <p className="text-xs text-slate-500">
              {patients.length} patient{patients.length !== 1 ? "s" : ""} {mode === "search" ? "found" : "on record"}
              {searching && " — searching…"}
            </p>
          </div>
          <button
            onClick={() => {
              setEditDraft({ ...BLANK_PATIENT });
              setSaveStatus("");
            }}
            className="text-sm bg-slate-800 text-white px-4 py-1.5 rounded hover:bg-slate-700 transition-colors"
          >
            + Add Patient
          </button>
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
        {mode === "recent" && (
          <Pagination
            currentPage={currentPage}
            hasMore={hasMore}
            onPrev={handlePrev}
            onNext={handleNext}
            loading={pageLoading}
            totalOnPage={patients.length}
          />
        )}
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
