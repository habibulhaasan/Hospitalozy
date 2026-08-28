# Update: Lab Report patient search via Invoice/OPD Ticket

Only the new/changed files from this update — not the whole project.
Drop these into your existing `hospitalozy` project at the same paths
to apply.

## New files
- `components/shared/AsyncSearchableSelect.jsx` — generic async
  searchable dropdown (debounced backend search instead of filtering
  a fixed in-memory list)
- `lib/firestore/billingSources.js` — unifies `searchInvoices` +
  `searchTickets` into one search for the dropdown above

## Modified files
- `components/lab-report/LabReportComponent.jsx` — added the "Find
  Patient via Invoice No. or OPD Ticket No." search dropdown (new
  `onSearchBillingSource` prop) above the existing manual Reg/Patient
  ID lookup, which is unchanged and still there
- `app/dashboard/lab-reports/new/page.jsx` — wired the new prop to
  `searchBillingSources`
- `PROJECT_STRUCTURE.md` — new section documenting this feature (full
  file included since it's a living doc — only the new section is
  actually new content)

## Doctor-fetching consistency check (no changes needed)

Verified — `Invoice`, `LabReport` (all three of its doctor-list
props), `PatientBilling`, `Patients`, and `Accounting` already all
call the same `loadActiveDoctorNames()` from `lib/firestore/doctors.js`
for their "Referred By" field. This was already consistent across the
project from the original build; nothing needed changing.
