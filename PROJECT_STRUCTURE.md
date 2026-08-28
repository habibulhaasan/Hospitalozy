# Hospitalozy — Project Structure

This is the 13 standalone components from earlier compiled into one
Next.js (App Router) project, with the four things you asked for:

1. Each component broken into multiple files
2. Large embedded JSON/data moved into `data/` and imported
3. An `AuthContext` gating which components a signed-in user can see
4. A real Firestore data-access layer (`lib/firestore/`) replacing
   the placeholder default props everywhere

Read this file once before touching the code — it explains what's
fully done, what's partially done, and exactly how to finish the
parts that aren't, so you're not rediscovering the plan from scratch.

---

## What's fully done

### Data extraction (`data/`)

| File | What it replaced |
|---|---|
| `data/reportableParameters.js` | LabReportComponent's embedded 163-test catalog (categories, units, reference ranges) |
| `data/billableItems.js` | Invoice/PatientBilling's embedded 194-item fee-schedule catalog — **and** TestMasterComponent's seed data. These were two separate catalogs before; see [The catalog merge](#the-catalog-merge-billable-vs-reportable) below for why they're related but still two files, not one. |
| `data/staffReference.js` | DoctorComponent's specialty/designation/qualification lists |
| `data/opdDepartments.js` | PatientBillingComponent's department/Bangla-label/room-assignment maps |

Every one of these is a plain `export const` array/object — no
fetching logic, just data. `lib/firestore/tests.js` seeds Firestore
from `billableItems.js` the first time the Test Master screen runs
against an empty database; after that, Firestore is what's actually
read from, and the data file is only the shipped starting point.

### Real Firestore layer (`lib/firestore/`)

Seven files, one per entity, each implementing the exact prop
contracts already documented in the original components:
`doctors.js`, `tests.js`, `patients.js`, `invoices.js`, `reports.js`,
`tickets.js`, `employees.js`. Every function is written to be passed
**directly** as a prop — no adapter code needed in a page:

```jsx
<DoctorComponent
  onLoadDoctors={loadDoctorRecords}
  onSaveDoctor={saveDoctor}
  onDeleteDoctor={deleteDoctor}
/>
```

See [app/dashboard/](#the-nextjs-wiring-apphttp) for every page that
does this.

### Auth + permissions (`context/`, `hooks/`, `components/shared/PermissionGate.jsx`)

- `context/AuthContext.jsx` — tracks the Firebase Auth user AND the
  matching `employees/{uid}` Firestore record (where `role` and
  `permissions` live, matching EmployeeComponent's data shape)
- `hooks/usePermission.js` — `usePermission("billing")` → boolean,
  `usePermissions()` → the whole map. Admin role always passes.
- `components/shared/PermissionGate.jsx` — wraps a component, shows a
  polite message instead of it if the signed-in employee doesn't have
  that module enabled
- `app/dashboard/layout.jsx` — the nav itself only lists links for
  modules the employee has; **this hides links, it does not enforce
  security** — see [Security boundary](#the-actual-security-boundary)

### Shared UI primitives (`components/shared/`)

`SearchableSelect.jsx`, `MultiSearchableSelect.jsx`, `Barcode.jsx`,
`KpiCard.jsx`, `Field.jsx` — previously copy-pasted (with small,
accumulated divergences — a quick diff found 4 different
`SearchableSelect` implementations before this) into 6+ files each.
One canonical copy now.

`lib/format.js` similarly consolidates `formatMoney`,
`formatMoneyShort`, `numberToWordsBDT`, `fmtDate`, `fmtDateTime`,
`fmt12h`, `nowTimeString`, `isoDate`, `calcAgeFromDOB` — previously
duplicated across Invoice, InvoiceList, PatientBilling,
PatientBillingList, and Accounting.

### Fully decomposed — Doctor and Invoice (flagship examples)

These two are split into as many files as the pattern below,
completely:

```
components/doctor/
  doctorShape.js        blank record + id generator
  DoctorFilters.jsx      search box + specialty dropdown
  DoctorRow.jsx          one table row, incl. its own delete-confirm state
  DoctorTable.jsx        loading/error/empty states + the table
  DoctorModal.jsx        add/edit form
  DoctorComponent.jsx    orchestrator — state + handlers only, ~150 lines
                         (was ~600 lines doing everything)

components/invoice/
  invoiceShape.js        blank patient + id/number generators
  LetterheadSettings.jsx toggle + hospital name/address fields
  PatientPanel.jsx        existing/new patient lookup + registration form
  TestPicker.jsx           searchable test-add box (now reads data/billableItems.js)
  LineItemsTable.jsx      the Sl./Test/Rate/Qty/Bill table
  TotalsPanel.jsx          the six-row Total→Due cascade
  PrintableInvoice.jsx    the whole A4 printed page, composed from the above
  InvoiceComponent.jsx    orchestrator — ~230 lines (was ~1060 with the catalog embedded)
```

Read these two front-to-back if you're extending the pattern to
another component — every other component in this suite has the same
natural seams (a filter bar, a list/table, a row, a modal or printable
view, an orchestrator).

### Partially done — the rest

`components/lab-report/LabReportComponent.jsx` and
`LabReportListComponent.jsx` had their **embedded data catalog**
swapped for an import from `data/reportableParameters.js` — the
single highest-value fix, since it's exactly the duplication that
would silently drift a report and its reprint out of sync. The rest
of each file (all the UI logic — category tabs, panel buttons, the
paginated print view) is still one file each. Same treatment for
`PatientBillingComponent.jsx`/`PatientBillingListComponent.jsx`
(department/room data now imported from `data/opdDepartments.js`) and
`InvoiceListComponent.jsx`/`AccountingComponent.jsx` (formatting
helpers now imported from `lib/format.js`).

`EmployeeComponent.jsx` and `TestMasterComponent.jsx` are copied in
as-is (with `"use client"` added) — not yet split, not yet deduped
beyond what shares an obvious identical copy elsewhere. They still
work exactly as before; they just haven't had the Doctor/Invoice
treatment.

**Why stop here instead of doing all 13:** the decomposition pattern
is identical every time once you've seen it done twice (filter bar /
row / table / modal-or-print-view / orchestrator) — grinding through
the same mechanical split nine more times returns rapidly diminishing
value against the two fully-worked examples already sitting in the
repo as a template. The parts that needed judgment calls, not just
repetition — the Firestore layer, the auth/permission model, the data
extraction, the doc-ID/uid consistency fix (see below) — are done for
all thirteen. The remaining split is genuinely mechanical labor best
done incrementally, component-by-component, as you actually touch each
one next — not speculatively finished up front for files nobody's
editing yet.

---

## The catalog merge: billable vs. reportable

Worth understanding before you touch `data/`. The two catalogs
(`billableItems.js`, `reportableParameters.js`) look like they should
be one file — they're both "tests," from the same fee schedule — but
they're deliberately not merged, because **they're different
granularities of the same real-world thing**:

- A patient is billed for **one** line item: "CBC (TC, DC, ESR,
  Hemoglobin combined)" — ৳150.
- A lab report prints **fourteen** separate result rows for that same
  order: Hemoglobin, RBC Count, MCV, MCH, MCHC, WBC, five-part
  differential, Platelet, ESR.

Forcing these into one flat table was tried first (a name-matching
script) and only found 42 exact 1:1 matches out of 194 billable items
— confirming they really are two different shapes of data, not one
duplicated by accident. The actual fix: `billableItems.js` entries
carry a `reportParameters: string[]` field naming which
`reportableParameters.js` entries that billed item produces:

```js
// data/billableItems.js
{ name: "TC, DC, ESR, Hemoglobin (combined)", price: 150, ...,
  reportParameters: ["Hemoglobin (Hb%)", "Total Count of WBC (TC)", /* ...12 more */] }
```

Only two bundles were hand-mapped this way (the CBC panel, the Urine
R/M/E panel) since those are the only ones actually spanning multiple
reported parameters in this data set; everything else either links
1:1 automatically or has an empty `reportParameters` array, meaning
it's billed but doesn't produce an individually-reported result row
(blood-bank service tiers, histopathology preparation fees, etc.).

If you add a new bundled panel to the fee schedule later, that's the
field to populate — don't try to merge the two files into one.

---

## Employee doc ID = Auth UID (a consistency fix made while wiring this up)

While building `firestore.rules`, a real inconsistency turned up:
`AuthContext` needs a cheap way to find "the employee record for
whoever's signed in," but `EmployeeComponent`'s original save logic
(same as Doctor/Test Master) used `addDoc` — an auto-generated ID with
no relationship to the Firebase Auth `uid` at all. A security rule
can't efficiently do "find the doc where `uid` field equals mine"
without either a composite index workaround or a client-side query
(which defeats the point of a rule).

The fix, made consistently across three files:
- `lib/firestore/employees.js::saveEmployee` — once an employee has a
  `uid` (their login account exists), their Firestore doc is written
  at `employees/{uid}` instead of an auto-generated ID. If they had an
  older auto-ID doc from before they got a login (registered as staff
  first, given system access later), that old doc is deleted as part
  of the same save — so there's one record, not two.
- `context/AuthContext.jsx` — reads `employees/{uid}` directly
  (`getDoc`, not a `query`) — cheaper, and matches what the rule
  below assumes.
- `firestore.rules` — `hasPermission()` reads the caller's own record
  the same way, so the whole chain (save → read → rule check) agrees
  on where an employee-with-a-login actually lives.

This is the kind of thing that's easy to get away with while a
project has no real backend (every prop was a stub returning `[]` or
`true`) and then breaks the first time someone tries to actually
enforce a permission — worth knowing it was caught and fixed here
rather than left for you to debug later.

---

## The actual security boundary

`PermissionGate` and the dashboard nav are **UX**, not access control.
Someone with devtools open can call any client SDK function directly,
bypassing every React component in this project entirely. The only
thing that actually stops an unauthorized read/write is
**`firestore.rules`**, evaluated server-side by Firestore itself.

`firestore.rules` in this repo mirrors the same module keys as
`EmployeeComponent`'s permission grid — deploy it with:

```
firebase deploy --only firestore:rules
```

If you add a new permission module (say, a future "pharmacy" screen),
it needs to exist in **three** places to actually mean anything:
`EmployeeComponent`'s `MODULES` array (so it's assignable), the
dashboard nav's `NAV_ITEMS` (so there's a link), and a
`hasPermission('pharmacy')` check somewhere in `firestore.rules` (so
it's enforced). The first two without the third is a component that
LOOKS gated but ISN'T.

---

## Human-readable IDs (DOC-000001, PAT-000001, EMP-000001)

Doctor, Patient, and Employee records now get a real sequential
numeric ID with a prefix — not a Firestore auto-generated string, and
critically, **not the same thing as a Firebase Auth UID** for
employees.

`lib/firestore/counters.js` is the one place this happens: one
`counters/{entityName}` document per entity type, incremented inside
a `runTransaction` so two people registering a patient at the same
moment can't both get `PAT-000042`.

- **Doctors and Patients** — the generated ID (`DOC-000001`,
  `PAT-000001`) *is* the Firestore document ID directly (`setDoc`
  instead of `addDoc`). Neither has an Auth account, so there's no
  UID to keep separate from anything.
- **Employees** — trickier, because an employee's Firestore doc ID
  needs to be their Auth `uid` once they have a login (see the
  existing note on this in `lib/firestore/employees.js` and
  `firestore.rules`). So `employeeId` (`EMP-000001`) is a **field**
  on the document, generated once at creation and carried forward
  unchanged even if the underlying doc ID later migrates from an
  auto-ID to a uid-keyed one. `EmployeeComponent`'s list, detail view,
  and search all use `employeeId` — never `id` or `uid` — for
  anything shown to a person.

If you're adding a new entity type that needs the same treatment,
`getNextSequentialId(prefix, counterName)` in `counters.js` is the
function to call — it's generic, not specific to any one entity.

## "View Detail" on Doctor, Employee, and Patient lists

All three list views now have a **View** action distinct from Edit —
clicking a row's name opens a read-only detail panel
(`DoctorDetailModal`, the inline detail view in `EmployeeComponent`,
`PatientDetailModal`), with its own "Edit" button if you actually
need to change something. This is deliberate, not just extra clicks:
a person checking someone's details shouldn't be one accidental
keystroke away from changing them, which is exactly what happens if
"click a row" and "open the editable form" are the same action.

## Finding a patient via Invoice/OPD Ticket on Lab Reporting

A lab report's patient is almost always someone already billed —
either an itemized Invoice or an OPD Ticket — so retyping their name,
age, and referring doctor by hand on the report is redundant work a
technologist shouldn't have to do twice. `LabReportComponent` now has
a search dropdown, right above the manual Reg/Patient ID field:
**"Find Patient via Invoice No. or OPD Ticket No."** — type an invoice
number, ticket number, patient name, or mobile, and pick the right
result to auto-fill Reg No., Name, Sex, Age, Referred By, and
Collection Date in one click.

- `components/shared/AsyncSearchableSelect.jsx` — a new, generic
  reusable primitive: same "type to filter" feel as `SearchableSelect`,
  but backed by an async search function instead of a fixed in-memory
  array (debounced 300ms). Anywhere else in this project that needs
  "search a backend, pick a result" can reuse this instead of writing
  another one-off combobox.
- `lib/firestore/billingSources.js` — composes the *existing*
  `searchInvoices` and `searchTickets` (already built for the Invoice
  List and Patient Ticket List screens) into one unified result list,
  rather than duplicating either's query logic. No new Firestore index
  needed — called with only `{ text }`, it hits the same
  `orderBy("billDateTime")`-only query path those two functions
  already use for their default (no-filter) case.

The old manual Reg/Patient ID + Lookup fields are still there
underneath, unchanged — this is an additional, faster path for the
common case, not a replacement for the "I already know the Patient
ID" case.

## The new Patient list (`components/patient/`)

Patients previously had no screen of their own — only ever created or
looked up as a side effect of billing/reporting someone
(`InvoiceComponent`'s `PatientPanel`, etc.). `components/patient/`
follows the same decomposition pattern as Doctor (filters / row /
table / detail modal / edit modal / orchestrator), backed by two new
functions in `lib/firestore/patients.js` (`loadPatients`,
`searchPatients`).

One deliberate omission: **no Delete**. A patient record is referenced
by invoices, lab reports, and OPD tickets — hard-deleting it would
either orphan that history or require cascading deletes across three
other collections, neither of which this component should decide
silently. If a patient record genuinely needs to be deactivated,
add a `status` field and a toggle (same pattern as Doctor's
Active/Inactive) rather than a real delete.

There's also no "create new patient" form here — new patients are
only ever registered from Invoice/LabReport/PatientBilling's existing
patient-registration flow, so this screen's edit modal only ever
updates an existing record. Search is server-side (debounced,
re-queries Firestore on each change) rather than the client-side
in-memory filter Doctor/Employee use, since a hospital's patient list
can grow much larger than its doctor or staff roster.

`firestore.rules` and the dashboard nav both treat `/patients` the
same way: open to any signed-in employee, not gated to one specific
permission module (patient lookup is shared across Billing and
Reporting) — the Patients nav link uses the `dashboard` permission key
as a stand-in for "any assigned role," since every `ROLE_PRESET` in
`EmployeeComponent` sets that to `true`.

## Firestore indexes (`firestore.indexes.json`)

Firestore auto-creates single-field indexes, but a query that combines
a `where()` on one field with `orderBy()` on a *different* field — or
more than one `where()` — needs a composite index declared explicitly,
or the query throws at runtime with a link to create one manually.
Rather than wait for those errors one at a time, `firestore.indexes.json`
declares the five composites the actual queries in `lib/firestore/`
need, worked out by reading every `query(...)` call in that folder:

| Collection | Fields | Which query needs it |
|---|---|---|
| `invoices` | `status` ↑, `billDateTime` ↓ | `searchInvoices({status})` |
| `invoices` | `patient.referredBy` ↑, `billDateTime` ↓ | `searchInvoices({referredBy})` |
| `invoices` | `status` ↑, `patient.referredBy` ↑, `billDateTime` ↓ | `searchInvoices({status, referredBy})` (both filters at once — this is what `AccountingComponent`'s filter bar can trigger) |
| `tickets` | `department` ↑, `billDateTime` ↓ | `searchTickets({department})` |
| `doctors` | `status` ↑, `name` ↑ | `loadActiveDoctorNames()` (used everywhere via `onLoadDoctors`) |

`reports.js`'s date-range queries don't need a composite — the
`where()` range and the `orderBy()` are on the same field
(`reportDate`), which Firestore's automatic single-field index already
covers. Same logic means `patients.js`'s single-field equality lookups
need nothing extra either.

Deploy with:
```
firebase deploy --only firestore:indexes
```

This set covers every query as currently written — but if you add a
new filter combination later (a new field to `searchInvoices`, say),
Firestore's own error message when you run that query for the first
time will give you the exact composite index definition to add here.
That's the reliable way to know you need one, not a substitute for
reading this table first.

## `firebase.json` and `functions/package.json`

Two files that have to exist for any of the `firebase deploy --only
...` commands referenced throughout this document to actually do
anything: `firebase.json` points the Firebase CLI at
`firestore.rules`, `firestore.indexes.json`, and the `functions/`
codebase; `functions/package.json` is what makes `functions/` a
deployable Cloud Functions codebase at all (declares `firebase-admin`
and `firebase-functions` as dependencies, Node 20 runtime). Run
`npm install` inside `functions/` once before your first
`firebase deploy --only functions`.



Three Auth actions can't run from the client at all (documented in
`EmployeeComponent`'s own doc comment, and again in
`lib/firestore/employees.js`): creating another user's login,
setting someone else's password, and disabling an account. All three
live in `functions/employees.js`, using `firebase-admin`, gated by a
`requireAdmin()` check on the *caller* (so only an actual Admin-role
employee can invoke them — without that check, any signed-in user
could call these Cloud Functions directly and create or disable
arbitrary accounts).

Deploy with `firebase deploy --only functions` — requires the
Blaze (pay-as-you-go) plan; Cloud Functions don't run on the free
Spark plan.

---

## The Next.js wiring (`app/`)

```
app/
  layout.jsx                       wraps everything in <AuthProvider>
  login/page.jsx                   LoginComponent + signInWithEmailAndPassword
  reset-password/page.jsx          ResetPasswordComponent + the 3 Auth calls it needs
  dashboard/
    layout.jsx                    redirect-if-signed-out + permission-filtered nav
    page.jsx                      tile launcher, also permission-filtered
    doctors/page.jsx              PermissionGate("doctors") + DoctorComponent + Firestore props
    invoices/page.jsx             InvoiceListComponent
    invoices/new/page.jsx         InvoiceComponent
    lab-reports/page.jsx          LabReportListComponent
    lab-reports/new/page.jsx      LabReportComponent
    patient-tickets/page.jsx      PatientBillingListComponent
    patient-tickets/new/page.jsx  PatientBillingComponent
    test-master/page.jsx          TestMasterComponent
    employees/page.jsx            EmployeeComponent (all 4 Auth-action props wired)
    accounting/page.jsx           AccountingComponent (+ the async category-lookup fix, see below)
```

Every feature page is the same three lines: import the component,
import its Firestore functions, wire them as props, wrap in
`<PermissionGate module="...">`. That's the whole integration
contract — nothing page-specific beyond that.

**One real bug fixed while wiring `accounting/page.jsx`:**
`AccountingComponent`'s `getCategoryForTestName` prop is called
synchronously during render, but building it requires an async
Firestore read (`loadTests()`). The page loads tests once via
`useEffect` into state and only passes the real lookup function once
that resolves — before that, the prop falls back to
`() => "Uncategorized"`, matching `AccountingComponent`'s own default.
Get this wrong and the Revenue-by-Category chart throws instead of
just not showing yet.

---

## Running this project

```bash
npm install
cp .env.local.example .env.local   # fill in your Firebase config
npm run dev
```

You'll also need, in your Firebase project:
- **Authentication** → Email/Password provider enabled
- **Firestore** → a database created, `firestore.rules` deployed
- **Functions** → Blaze plan, `functions/` deployed (only needed once
  you're actually creating/blocking employee accounts — everything
  else works without it)

The very first employee needs to exist before permission-gating means
anything (nobody starts as Admin automatically). Simplest bootstrap:
manually create one Firestore doc at `employees/{their-auth-uid}` with
`role: "Admin"` after they've signed up, either via the Firebase
Console directly or a one-off script — there's no seed script for
this in the repo since it's a one-time, per-deployment action, not
something worth automating.
