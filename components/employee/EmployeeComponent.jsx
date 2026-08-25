"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ *
 * Reference lists — edit to match your hospital's actual departments,
 * roles, and permission modules.
 * ------------------------------------------------------------------ */
const DEPARTMENTS = [
  "Laboratory",
  "Reception & Billing",
  "Administration",
  "Radiology",
  "Pharmacy",
  "Nursing",
  "IT",
  "Management",
  "Accounts / Finance",
  "Housekeeping",
  "Security",
  "Ambulance / Transport",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/* Modules an employee can be given access to — maps to the other
 * components/pages in this project. */
const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "billing", label: "Billing / Invoice" },
  { key: "reporting", label: "Test Reporting (Lab Report)" },
  { key: "doctors", label: "Doctor Management" },
  { key: "testMaster", label: "Laboratory Test Master" },
  { key: "employees", label: "Employee Management" },
  { key: "settings", label: "Settings" },
];

/* Picking a role auto-fills these permissions — still individually
 * editable afterward, so a role is just a fast starting point, not a
 * hard lock. "Custom" applies nothing and leaves whatever was there. */
const ROLE_PRESETS = {
  "Admin": { dashboard: true, billing: true, reporting: true, doctors: true, testMaster: true, employees: true, settings: true },
  "Manager": { dashboard: true, billing: true, reporting: true, doctors: true, testMaster: true, employees: false, settings: false },
  "Billing Staff": { dashboard: true, billing: true, reporting: false, doctors: false, testMaster: false, employees: false, settings: false },
  "Receptionist": { dashboard: true, billing: true, reporting: false, doctors: false, testMaster: false, employees: false, settings: false },
  "Lab Technologist": { dashboard: true, billing: false, reporting: true, doctors: false, testMaster: false, employees: false, settings: false },
  "Pathologist": { dashboard: true, billing: false, reporting: true, doctors: false, testMaster: false, employees: false, settings: false },
  "IT Support": { dashboard: true, billing: false, reporting: false, doctors: false, testMaster: true, employees: true, settings: true },
  "Custom": null,
};
const ROLES = Object.keys(ROLE_PRESETS);

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function generateEmployeeId() {
  return `EMP-${Date.now().toString().slice(-8)}`;
}

const BLANK_PERMISSIONS = { dashboard: true, billing: false, reporting: false, doctors: false, testMaster: false, employees: false, settings: false };

const BLANK_EMPLOYEE = {
  id: "",
  uid: "", // Firebase Auth UID, set once a login account exists
  name: "",
  designation: "",
  department: "",
  mobile: "",
  email: "",
  gender: "Male",
  dob: "",
  nid: "",
  bloodGroup: "",
  address: "",
  joiningDate: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  salary: "",
  photoUrl: "",
  role: "Custom",
  permissions: { ...BLANK_PERMISSIONS },
  status: "Active", // "Active" | "Inactive" | "Blocked"
  notes: "",
};

/* ------------------------------------------------------------------ *
 * Single-value searchable dropdown (combobox) — same pattern as the
 * other components in this project. Free typing is accepted as the
 * value even if it isn't in the option list.
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
          {filtered.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-slate-400">No match — your typed text will be used as-is.</div>
          )}
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

/**
 * Firebase hookup — same backend-agnostic pattern as the lab report,
 * invoice, doctor, and test master components in this project.
 *
 *   onLoadEmployees() => return the full array of employee records
 *     (shape matches BLANK_EMPLOYEE) to populate the list on mount.
 *
 *   onSaveEmployee(employeeData) => create the Firestore profile if
 *     employeeData.id is empty (assign and return a new id), or
 *     update the existing one. This is the HR record only — it does
 *     NOT touch Firebase Auth. Return the saved object either way.
 *
 *   onDeleteEmployee(employee) => delete the Firestore profile.
 *     Doesn't delete the Auth account by itself — if the employee has
 *     a uid, do that too on your backend (auth().deleteUser(uid)) if
 *     that's what you want, since a stray Auth account left over
 *     after deleting the profile is a common way access control
 *     quietly drifts.
 *
 *   onCreateEmployeeAccount(employeeData, tempPassword) => create the
 *     Firebase Auth login for this employee, return { uid }.
 *
 *     IMPORTANT: do this through a Cloud Function using firebase-admin
 *     (admin.auth().createUser({ email, password })), NOT the client
 *     SDK's createUserWithEmailAndPassword(). That client call signs
 *     the browser in AS the new user — which would kick the admin out
 *     of their own session the moment they create someone else's
 *     account. A Cloud Function keeps the admin's session untouched.
 *     (The other common workaround — a second, temporary Firebase App
 *     instance just for the signup call — works too, but a Cloud
 *     Function is simpler to reason about and keeps the admin
 *     privilege check server-side where it belongs.)
 *
 *   onSendPasswordResetEmail(employee) => the one account-management
 *     action that legitimately works straight from the client SDK:
 *     sendPasswordResetEmail(auth, employee.email). No backend needed.
 *
 *   onSetTemporaryPassword(employee, newPassword) => admin sets a
 *     password directly instead of emailing a reset link. Requires
 *     firebase-admin server-side (admin.auth().updateUser(uid,
 *     { password })) — the client SDK cannot set another user's
 *     password.
 *
 *   onSetAccountDisabled(employee, disabled) => block/unblock login.
 *     Also requires firebase-admin (admin.auth().updateUser(uid,
 *     { disabled })) — disabling someone else's account isn't
 *     something the client SDK can do either. A disabled Auth account
 *     still exists but can no longer sign in.
 */
export default function EmployeeComponent({
  onLoadEmployees = async () => [],
  onSaveEmployee = async (employeeData) => ({ ...employeeData, id: employeeData.id || generateEmployeeId() }),
  onDeleteEmployee = async () => true,
  onCreateEmployeeAccount = async () => {
    throw new Error("onCreateEmployeeAccount isn't wired up yet — see the component's doc comment for how to implement it.");
  },
  onSendPasswordResetEmail = async () => true,
  onSetTemporaryPassword = async () => true,
  onSetAccountDisabled = async () => true,
} = {}) {
  const [employees, setEmployees] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading"); // "loading" | "loaded" | "error"

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(BLANK_EMPLOYEE);
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "error"

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [createAccount, setCreateAccount] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [accountActionStatus, setAccountActionStatus] = useState(""); // "", "working", "done", "error"
  const [tempPasswordForReset, setTempPasswordForReset] = useState("");
  const [showSetPasswordBox, setShowSetPasswordBox] = useState(false);

  useEffect(() => {
    onLoadEmployees()
      .then((list) => {
        setEmployees(Array.isArray(list) ? list : []);
        setLoadStatus("loaded");
      })
      .catch(() => setLoadStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchesTerm =
        !term ||
        e.name.toLowerCase().includes(term) ||
        (e.mobile || "").includes(term) ||
        (e.email || "").toLowerCase().includes(term) ||
        (e.designation || "").toLowerCase().includes(term);
      const matchesDept = departmentFilter === "All" || e.department === departmentFilter;
      const matchesStatus = statusFilter === "All" || e.status === statusFilter;
      return matchesTerm && matchesDept && matchesStatus;
    });
  }, [employees, search, departmentFilter, statusFilter]);

  function openAddModal() {
    setDraft({ ...BLANK_EMPLOYEE, id: "", permissions: { ...BLANK_PERMISSIONS } });
    setSaveStatus("");
    setCreateAccount(false);
    setTempPassword("");
    setAccountActionStatus("");
    setShowSetPasswordBox(false);
    setModalOpen(true);
  }
  function openEditModal(e) {
    setDraft({ ...BLANK_EMPLOYEE, ...e, permissions: { ...BLANK_PERMISSIONS, ...(e.permissions || {}) } });
    setSaveStatus("");
    setCreateAccount(false);
    setTempPassword("");
    setAccountActionStatus("");
    setShowSetPasswordBox(false);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setDraft(BLANK_EMPLOYEE);
    setSaveStatus("");
  }

  function applyRolePreset(role) {
    const preset = ROLE_PRESETS[role];
    setDraft((prev) => ({ ...prev, role, permissions: preset ? { ...preset } : prev.permissions }));
  }
  function togglePermission(key) {
    setDraft((prev) => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));
  }

  async function handleSaveEmployee() {
    if (!draft.name.trim() || !draft.email.trim()) return;
    setSaveStatus("saving");
    try {
      let toSave = { ...draft };
      if (createAccount && !toSave.uid) {
        if (!tempPassword || tempPassword.length < 6) {
          setSaveStatus("error");
          return;
        }
        const { uid } = await onCreateEmployeeAccount(toSave, tempPassword);
        toSave = { ...toSave, uid };
      }
      const saved = await onSaveEmployee(toSave);
      setEmployees((prev) => {
        const exists = prev.some((e) => e.id === saved.id);
        return exists ? prev.map((e) => (e.id === saved.id ? saved : e)) : [...prev, saved];
      });
      closeModal();
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  }

  async function handleDeleteEmployee(emp) {
    try {
      await onDeleteEmployee(emp);
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
    } catch (err) {
      console.error(err);
    }
    setConfirmDeleteId(null);
  }

  async function handleSendResetEmail() {
    setAccountActionStatus("working");
    try {
      await onSendPasswordResetEmail(draft);
      setAccountActionStatus("done");
    } catch (err) {
      console.error(err);
      setAccountActionStatus("error");
    }
  }

  async function handleSetTempPassword() {
    if (!tempPasswordForReset || tempPasswordForReset.length < 6) return;
    setAccountActionStatus("working");
    try {
      await onSetTemporaryPassword(draft, tempPasswordForReset);
      setAccountActionStatus("done");
      setTempPasswordForReset("");
      setShowSetPasswordBox(false);
    } catch (err) {
      console.error(err);
      setAccountActionStatus("error");
    }
  }

  async function handleToggleBlocked() {
    const nextDisabled = draft.status !== "Blocked";
    setAccountActionStatus("working");
    try {
      await onSetAccountDisabled(draft, nextDisabled);
      const updated = { ...draft, status: nextDisabled ? "Blocked" : "Active" };
      setDraft(updated);
      setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setAccountActionStatus("done");
    } catch (err) {
      console.error(err);
      setAccountActionStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Employees</h1>
            <p className="text-xs text-slate-500">{employees.length} employee{employees.length !== 1 ? "s" : ""} on record</p>
          </div>
          <button onClick={openAddModal} className="text-sm bg-slate-800 text-white px-4 py-2 rounded font-medium">
            + Add Employee
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3 flex flex-wrap gap-2 items-center">
          <input
            className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[200px]"
            placeholder="Search by name, mobile, email, or designation"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="border rounded px-2 py-1.5 text-sm" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option>All</option>
            {DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select className="border rounded px-2 py-1.5 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Blocked</option>
          </select>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          {loadStatus === "loading" && <div className="p-6 text-center text-sm text-slate-400">Loading employees…</div>}
          {loadStatus === "error" && <div className="p-6 text-center text-sm text-red-500">Couldn't load the employee list — check the connection.</div>}
          {loadStatus === "loaded" && filteredEmployees.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-400">
              {employees.length === 0 ? "No employees added yet — click \"+ Add Employee\" to get started." : "No employees match this search/filter."}
            </div>
          )}
          {loadStatus === "loaded" && filteredEmployees.length > 0 && (
            <table className="w-full text-sm min-w-[950px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-3 font-medium">ID</th>
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Designation</th>
                  <th className="py-2 px-3 font-medium">Department</th>
                  <th className="py-2 px-3 font-medium">Role</th>
                  <th className="py-2 px-3 font-medium">Mobile</th>
                  <th className="py-2 px-3 font-medium">Login Access</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((e) => (
                  <tr key={e.id} className={`border-b border-slate-100 align-top ${e.status !== "Active" ? "opacity-60" : ""}`}>
                    <td className="py-2 px-3 text-xs text-slate-400 whitespace-nowrap">{e.id}</td>
                    <td className="py-2 px-3 font-medium">{e.name}</td>
                    <td className="py-2 px-3">{e.designation || "—"}</td>
                    <td className="py-2 px-3">{e.department || "—"}</td>
                    <td className="py-2 px-3">{e.role || "—"}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{e.mobile || "—"}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${e.uid ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                        {e.uid ? "Has Login" : "No Account"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          e.status === "Active" ? "bg-emerald-50 text-emerald-700" : e.status === "Blocked" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {e.status || "Active"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(e)} className="text-xs text-slate-500 hover:text-slate-800">Edit</button>
                        {confirmDeleteId === e.id ? (
                          <span className="flex items-center gap-1 text-xs bg-red-50 border border-red-200 rounded px-1.5 py-0.5 whitespace-nowrap">
                            <button onClick={() => handleDeleteEmployee(e)} className="text-red-700 font-semibold underline">Yes</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-slate-500 underline">No</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(e.id)} className="text-xs text-slate-400 hover:text-red-500">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ============ ADD / EDIT MODAL ============ */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold">{draft.id ? "Edit Employee" : "Add Employee"}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {draft.id && <div className="text-xs text-slate-400">Employee ID: <span className="font-mono">{draft.id}</span></div>}

              {/* ---- Basic info ---- */}
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-2">Basic Information</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Full Name *</label>
                    <input className="border rounded px-2 py-1.5 text-sm w-full" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Email * (used for login)</label>
                    <input
                      type="email"
                      className="border rounded px-2 py-1.5 text-sm w-full"
                      value={draft.email}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      disabled={!!draft.uid}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Designation</label>
                    <input className="border rounded px-2 py-1.5 text-sm w-full" value={draft.designation} onChange={(e) => setDraft({ ...draft, designation: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Department</label>
                    <SearchableSelect value={draft.department} onChange={(v) => setDraft({ ...draft, department: v })} options={DEPARTMENTS} placeholder="Search or type" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Mobile</label>
                    <input className="border rounded px-2 py-1.5 text-sm w-full" value={draft.mobile} onChange={(e) => setDraft({ ...draft, mobile: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Gender</label>
                    <select className="border rounded px-2 py-1.5 text-sm w-full" value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Date of Birth</label>
                    <input type="date" className="border rounded px-2 py-1.5 text-sm w-full" value={draft.dob} onChange={(e) => setDraft({ ...draft, dob: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Blood Group</label>
                    <select className="border rounded px-2 py-1.5 text-sm w-full" value={draft.bloodGroup} onChange={(e) => setDraft({ ...draft, bloodGroup: e.target.value })}>
                      <option value="">—</option>
                      {BLOOD_GROUPS.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">NID</label>
                    <input className="border rounded px-2 py-1.5 text-sm w-full" value={draft.nid} onChange={(e) => setDraft({ ...draft, nid: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Date of Joining</label>
                    <input type="date" className="border rounded px-2 py-1.5 text-sm w-full" value={draft.joiningDate} onChange={(e) => setDraft({ ...draft, joiningDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Monthly Salary (optional, admin-only)</label>
                    <input type="number" className="border rounded px-2 py-1.5 text-sm w-full" value={draft.salary} onChange={(e) => setDraft({ ...draft, salary: e.target.value })} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-slate-500 block mb-1">Address</label>
                  <textarea className="border rounded px-2 py-1.5 text-sm w-full" rows={1} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Emergency Contact Name</label>
                    <input className="border rounded px-2 py-1.5 text-sm w-full" value={draft.emergencyContactName} onChange={(e) => setDraft({ ...draft, emergencyContactName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Emergency Contact Phone</label>
                    <input className="border rounded px-2 py-1.5 text-sm w-full" value={draft.emergencyContactPhone} onChange={(e) => setDraft({ ...draft, emergencyContactPhone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Photo URL (optional)</label>
                  <input className="border rounded px-2 py-1.5 text-sm w-full" placeholder="https://…" value={draft.photoUrl} onChange={(e) => setDraft({ ...draft, photoUrl: e.target.value })} />
                </div>
              </div>

              {/* ---- Role & permissions ---- */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="text-xs font-semibold text-slate-600 mb-2">Role & Page Access</div>
                <div className="mb-2">
                  <label className="text-xs text-slate-500 block mb-1">Role (auto-fills permissions below — still editable)</label>
                  <select className="border rounded px-2 py-1.5 text-sm w-full bg-white" value={draft.role} onChange={(e) => applyRolePreset(e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {MODULES.map((m) => (
                    <label key={m.key} className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 rounded px-2 py-1.5">
                      <input type="checkbox" checked={!!draft.permissions[m.key]} onChange={() => togglePermission(m.key)} />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* ---- System access ---- */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="text-xs font-semibold text-slate-600 mb-2">System Access</div>

                {!draft.uid && (
                  <div>
                    <label className="flex items-center gap-1.5 text-xs mb-2">
                      <input type="checkbox" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} />
                      Create a login account for this employee
                    </label>
                    {createAccount && (
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Temporary Password (min. 6 characters)</label>
                        <input
                          type="text"
                          className="border rounded px-2 py-1.5 text-sm w-full bg-white"
                          placeholder="Employee should change this after first login"
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {draft.uid && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500">
                      Login account: <span className="font-mono text-slate-700">{draft.uid}</span> —{" "}
                      <span className={draft.status === "Blocked" ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}>
                        {draft.status === "Blocked" ? "Blocked" : "Active"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleSendResetEmail}
                        disabled={accountActionStatus === "working"}
                        className="text-xs border border-slate-300 bg-white px-3 py-1.5 rounded"
                      >
                        Send Password Reset Email
                      </button>
                      <button
                        onClick={() => setShowSetPasswordBox((v) => !v)}
                        className="text-xs border border-slate-300 bg-white px-3 py-1.5 rounded"
                      >
                        Set Temporary Password
                      </button>
                      <button
                        onClick={handleToggleBlocked}
                        disabled={accountActionStatus === "working"}
                        className={`text-xs px-3 py-1.5 rounded border ${
                          draft.status === "Blocked" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"
                        }`}
                      >
                        {draft.status === "Blocked" ? "Unblock Access" : "Block Access"}
                      </button>
                    </div>
                    {showSetPasswordBox && (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          className="border rounded px-2 py-1.5 text-sm flex-1 bg-white"
                          placeholder="New temporary password"
                          value={tempPasswordForReset}
                          onChange={(e) => setTempPasswordForReset(e.target.value)}
                        />
                        <button
                          onClick={handleSetTempPassword}
                          disabled={tempPasswordForReset.length < 6 || accountActionStatus === "working"}
                          className="text-xs bg-slate-800 disabled:bg-slate-300 text-white px-3 py-1.5 rounded whitespace-nowrap"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                    {accountActionStatus === "done" && <p className="text-xs text-emerald-600">Done ✓</p>}
                    {accountActionStatus === "error" && <p className="text-xs text-red-600">Action failed — check the connection and try again.</p>}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Notes</label>
                <textarea className="border rounded px-2 py-1.5 text-sm w-full" rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </div>

              {!draft.uid && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Status</label>
                  <select className="border rounded px-2 py-1.5 text-sm w-full" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
              {saveStatus === "error" && (
                <span className="text-xs text-red-600 mr-auto">
                  {createAccount && (!tempPassword || tempPassword.length < 6)
                    ? "Enter a temporary password (min. 6 characters) to create the login account."
                    : "Save failed — try again."}
                </span>
              )}
              <button onClick={closeModal} className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded">
                Cancel
              </button>
              <button
                onClick={handleSaveEmployee}
                disabled={!draft.name.trim() || !draft.email.trim() || saveStatus === "saving"}
                className="text-sm bg-slate-800 disabled:bg-slate-300 text-white px-4 py-1.5 rounded"
              >
                {saveStatus === "saving" ? "Saving…" : draft.id ? "Save Changes" : "Add Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
