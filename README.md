# Hospitalozy Component Suite

> **This project has since been compiled into a real Next.js app.**
> This file still documents what each component does, its props, and
> the design patterns behind it — for the actual file layout, the
> Firestore data-access layer, the auth/permission system, and how
> the 13 components were wired together, see **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**.


A set of 13 self-contained React components for a hospital's pathology
lab, billing counter, OPD registration, admin/master data, and staff
accounts. Built incrementally in one working session; this document
is the map back through it — what each piece does, how it talks to a
backend, and the conventions that repeat across all of them so the
next person (or the next session) isn't rediscovering them from
scratch.

Every component is a single `.jsx` file, framework-agnostic React
(no Next.js-specific imports), styled with Tailwind utility classes,
and designed to be dropped into an existing Next.js + Firebase project.
None of them talk to Firebase directly — see
[Design Pattern 1](#1-backend-agnostic-props) for why, and
[Firebase Integration Guide](#firebase-integration-guide) for what to
actually wire up.

---

## Table of Contents

- [Tech Stack & Assumptions](#tech-stack--assumptions)
- [Design Patterns & Conventions](#design-patterns--conventions)
- [Component Catalog](#component-catalog)
  - [Clinical / Lab](#clinical--lab)
  - [Billing & Front Desk](#billing--front-desk)
  - [Admin / Master Data](#admin--master-data)
  - [Analytics](#analytics)
  - [Auth](#auth)
- [Shared Data Shapes](#shared-data-shapes)
- [Firebase Integration Guide](#firebase-integration-guide)
- [Known Limitations & Follow-ups](#known-limitations--follow-ups)
- [Development Timeline](#development-timeline)
- [File Manifest](#file-manifest)

---

## Tech Stack & Assumptions

- **React** (function components, hooks only — no class components)
- **Tailwind CSS** utility classes throughout, no custom CSS files
- **Target backend:** Firebase (Firestore + Firebase Auth), but no
  component imports the Firebase SDK directly
- **Currency:** Bangladeshi Taka (৳), formatted via `Intl`/`toLocaleString("en-BD")`
- **Language:** English UI with Bangla (বাংলা) labels where the
  source hospital documents used them (patient ticket header,
  department names)
- **Charts:** `recharts` (Accounting component only) — run
  `npm install recharts` in the target project
- **Barcodes:** `jsbarcode` (Invoice, Patient Billing, and their List
  counterparts) — run `npm install jsbarcode` in the target project
- **Icons:** `lucide-react` (already a common Next.js dependency)

---

## Design Patterns & Conventions

These repeat across every component. Knowing them once means every
individual component's docs below can stay short.

### 1. Backend-agnostic props

No component calls Firebase directly. Instead, each takes a handful
of `onLoadX` / `onSaveX` / `onDeleteX` async function props, all with
safe no-op or in-memory defaults so every component **works standalone
before any backend is wired up** — useful for previewing UI, and it
means a missing prop never crashes the app, it just doesn't persist
anything.

```jsx
export default function DoctorComponent({
  onLoadDoctors = async () => [],
  onSaveDoctor = async (doctorData) => ({ ...doctorData, id: doctorData.id || generateDoctorId() }),
  onDeleteDoctor = async () => true,
} = {}) { ... }
```

The convention for *why* a prop is shaped the way it is: read the doc
comment directly above each component's `export default function` —
that's where the real "how to wire this to Firestore/Firebase Auth"
instructions live, written once per component rather than repeated
here.

### 2. Print architecture

Two class-name conventions exist across the suite, depending on
which turn they were built in — **worth standardizing on one before
shipping**, see [Known Limitations](#known-limitations--follow-ups).

- `LabReportComponent`, `InvoiceComponent`, `AccountingComponent`'s
  siblings, `DoctorComponent`, `TestMasterComponent`,
  `EmployeeComponent`: use `.no-print` / `.print-page`
- `PatientBillingComponent` and `PatientBillingListComponent`: use
  `.no-print` / `.print-area` — this matches the naming already used
  in the hospital's own pre-existing `PatientTicket.jsx`/`LabInvoice.jsx`,
  which is what those two were built to slot alongside

Both follow the same mechanics:

```css
@media print {
  .no-print { display: none !important; }   /* hide the builder UI */
  .print-page /* or .print-area */ { box-shadow: none !important; }
}
@page { size: A4; margin: 0; }               /* full control via inline padding instead */
```

Printable content is sized in **millimetres or inches matching real
A4** (`210mm`/`297mm` or `8.27in`/`11.69in`), not left to flow —
each "page" is a fixed-size box so what's on screen is what prints,
not an approximation of it.

### 3. Reusable UI primitives

Small components copy-pasted (not imported — see
[Known Limitations](#known-limitations--follow-ups)) across files
whenever needed:

| Primitive | What it does | Used in |
|---|---|---|
| `SearchableSelect` | Single-value combobox — type to filter a list, or type something not in the list and it's accepted as free text | Lab Report, Invoice, Doctor, Test Master, Employee, Patient Billing, Accounting |
| `MultiSearchableSelect` | Same, but multi-value with removable chips (Backspace deletes the last chip) | Doctor (qualifications) |
| `TestPicker` | Search box over a test catalog, shows the rate inline, adds a line item on pick | Invoice, Patient Billing (removed from Patient Billing per later revision) |
| `KpiCard` | Small stat card (label, big number, sub-label) | Accounting |
| `Field` | `Label: value` row, matches the hospital's original ticket format | Patient Billing, Patient Billing List |
| `*Barcode` (`InvoiceBarcode`/`BillBarcode`) | Renders a real Code128 barcode via dynamic `import("jsbarcode")`, falls back to a plain text label if the package isn't installed | Invoice, Invoice List, Patient Billing, Patient Billing List |

### 4. Inline confirmation, never `window.confirm`/`alert`

Early on, a **Reset** button silently did nothing. Root cause:
`window.confirm()` is commonly blocked by sandboxed preview iframes
(no `allow-modals`), so the confirm dialog never opened and the
function returned as if the user clicked Cancel. Every destructive
action since (and retrofitted where it already existed) uses an
inline "Clear everything? **Yes, reset** / Cancel" pattern instead —
no blocking browser dialog involved:

```jsx
{confirmingReset ? (
  <span>Clear everything?
    <button onClick={handleReset}>Yes, reset</button>
    <button onClick={() => setConfirmingReset(false)}>Cancel</button>
  </span>
) : (
  <button onClick={() => setConfirmingReset(true)}>Reset</button>
)}
```

### 5. Currency & localization

- All money formatted `৳` + `toLocaleString("en-BD", { minimumFractionDigits: 2 })`
- `numberToWordsBDT(amount)` converts a number to words using
  Bangladeshi/Indian digit grouping (Lakh/Crore, not Million/Billion) —
  e.g. `৳125,000` → *"Taka One Lakh Twenty-Five Thousand Only"*
- Dates formatted via `toLocaleDateString("en-BD", ...)`

### 6. Single-source-of-truth philosophy

`DoctorComponent` and `TestMasterComponent` are meant to become the
canonical lists everything else reads from. Rather than duplicate
"list of doctor names" or "list of tests with categories" logic
everywhere, other components take an **optional lookup prop**
(`onLoadDoctors`, `getCategoryForTestName`) that defaults to something
harmless, but is documented as "wire this to Test Master /
Doctor once you have one" — so the data has one place to live instead
of drifting out of sync across five components.

The one deliberate exception: `LabReportComponent` and
`LabReportListComponent` each carry their **own copy** of the test
catalog (name → category/unit/reference-range), because reprinting a
report correctly requires that exact data and a shared runtime import
isn't possible across separate artifact files in this environment. If
you consolidate these into one codebase, replace both copies with a
shared module — see [Known Limitations](#known-limitations--follow-ups).

---

## Component Catalog

### Clinical / Lab

#### `LabReportComponent.jsx`
Builds and prints a pathology/lab report. Test catalog (~190 tests)
seeded from the hospital's fee schedule, organized into categories
(Hematology, Biochemistry, Serology & Immunology, Endocrine, Culture &
Sensitivity, Histopathology, Urine & Stool, Urine R/M/E, Blood Bank),
plus a virtual **"General"** tab bundling the routine CBC + full
Urine R/M/E panels. Reference ranges support Male/Female/Child buckets,
displayed together rather than resolved to one (e.g. *"M: 13.5–17.5
g/dL | F: 12.0–15.5 g/dL | Child: 11.0–14.0 g/dL"*).

Each category prints on its own A4 page (patient header repeated on
every page), plus operator-addable "Extra Pages" for tests outside the
catalog (histopathology narrative, culture reports) with free-text
rows. A letterhead toggle blanks the header and reserves configurable
mm of space for hospitals using pre-printed letterhead paper. Results
are typed directly into the print-styled view — no separate editing
list — so what's on screen while filling it in is what prints.

| Prop | Default | Purpose |
|---|---|---|
| `onLookupPatient` | `async () => null` | Patient master record by Reg No. |
| `onLookupInvoice` | `async () => null` | Invoice-sourced fields (referred-by, collection date) for the same Reg No. |
| `onSaveReport` | logs to console | Persist the finished report |
| `onLoadDoctors` | `async () => []` | Names for the Referred By dropdown |
| `onLoadTechnologists` | `async () => []` | Names for the Technologist dropdown |
| `onLoadPathologists` | `async () => []` | Names for the Pathologist dropdown |

#### `CBCReportComponent.jsx`
An earlier, narrower version built before the CBC panel was folded
into `LabReportComponent`'s catalog — a fixed 14-parameter CBC-only
report with the same reference-range/flagging logic. Functionally
superseded by `LabReportComponent`'s "+ Add CBC Panel" button; kept
here since it was a standalone deliverable and may still be useful if
CBC-only printing is wanted without the full catalog UI. Takes no
props — patient/hospital fields are all local state.

#### `LabReportListComponent.jsx`
Search/browse saved lab reports and reprint any of them exactly as
originally printed. Carries its **own copy** of `LabReportComponent`'s
test catalog (see [Design Pattern 6](#6-single-source-of-truth-philosophy))
purely to regroup a saved report's flat `{name, result}` pairs back
into categorized, paginated A4 pages with the correct units and ranges.

| Prop | Default | Purpose |
|---|---|---|
| `onLoadRecentReports` | `async () => []` | Populate the list before any search |
| `onSearchReports` | `async () => []` | `{text, dateFrom, dateTo}` → matching reports |
| `hospitalName` / `hospitalAddress` | `"Upazila Health Complex"` / `""` | Fallback header for records saved before the report component persisted its own hospital fields |

---

### Billing & Front Desk

#### `InvoiceComponent.jsx`
Standard itemized invoice: patient lookup/registration (by Patient
ID/Mobile/NID), searchable test picker (~180 billable items pulled
from the fee schedule, with rate/specimen/turnaround), editable Rate
and Qty per line, and a six-row totals cascade: **Total → + Previous
Due = Payable → − Discount = Net Bill → − Received = Due**. Status
badge (PAID/DUE/FREE) computed from Net Bill and Due. Delivery time
estimated from the *longest* turnaround among selected tests, added to
the bill timestamp.

| Prop | Default | Purpose |
|---|---|---|
| `onLookupPatientByIdOrMobile` | `async () => null` | Existing-patient search |
| `onSavePatient` | generates a local ID | Create/update patient, returns `patientId` |
| `onLoadDoctors` | `async () => []` | Referred By dropdown |
| `onSaveInvoice` | logs to console | Persist the invoice — payload includes `hospitalName`/`hospitalAddress` so a reprint months later shows what the header actually looked like at billing time, not whatever it's since been changed to |
| `generateInvoiceNumber` | `INV-YYYYMMDD-XXXX` | Override for a different numbering scheme |

#### `InvoiceListComponent.jsx`
Search/browse saved invoices, view the full itemized breakdown, and
reprint identically to the original (barcode, status badge, totals,
amount-in-words). Same fallback-hospital-props pattern as the Lab
Report List, for the same reason.

| Prop | Default | Purpose |
|---|---|---|
| `onLoadRecentInvoices` | `async () => []` | Populate the list before any search |
| `onSearchInvoices` | `async () => []` | `{text, dateFrom, dateTo, status}` → matches |
| `hospitalName` / `hospitalAddress` | fallback header | For records predating the hospital-field patch |

#### `PatientBillingComponent.jsx`
**Not an invoice** — a printable OPD registration/routing ticket,
styled after the hospital's actual `PatientTicket.jsx` reference
(bilingual header, logo/seal circles, barcode + Room No. box, patient
grid, Dept. row, blank **℞** writing area, single Doctor's Signature
line, "Powered By: Hospitalozy" footer). Serves two purposes on one
sheet: the patient pays a flat OPD ticket fee at the counter (captured
internally, deliberately **not printed** on the ticket), then the same
physical ticket goes to the doctor, who writes the actual prescription
by hand in the blank ℞ area.

Picking a **Department/Specialty** auto-assigns a **Room No.** from a
configurable `roomAssignments` map (still manually overridable).
Visit time defaults to *now*; Visit-To defaults to `1:30 PM`; ticket
validity is always computed as **creation date + 3 days**, not a field
anyone sets by hand.

| Prop | Default | Purpose |
|---|---|---|
| `hospital` | `{nameBn, nameEn, address, contact, email}` | Bilingual header |
| `logoUrl` / `sealUrl` | `null` (shows placeholder circles) | Header images |
| `counterName` | `"Online Ticket Counter"` | Footer "Printed By... at ___" |
| `roomAssignments` | `DEFAULT_ROOM_ASSIGNMENTS` | Department → Room No. map |
| `rxLines` | `[]` | Optional prefilled Rx text |
| `onLookupPatientByIdOrMobile` / `onSavePatient` / `onLoadDoctors` | same as Invoice | Patient handling |
| `onSaveBill` | logs to console | Persist the ticket (includes `paymentAmount`, department, room, visit times) |
| `generateBillNo` | `TKT-YYYYMMDD-XXXX` | Ticket numbering |

#### `PatientBillingListComponent.jsx`
Search/browse saved OPD tickets and reprint them. Reconstructs the
exact ticket layout from the saved record. **Honest limitation, not a
bug:** the reprint's ℞ area is always blank, even on a reprint of a
ticket a doctor already wrote on — because what the doctor wrote only
ever existed as ink on the original paper, nothing about it was
captured digitally. The reprint says so directly rather than silently
implying it's an identical copy.

| Prop | Default | Purpose |
|---|---|---|
| `onLoadRecentTickets` | `async () => []` | Populate the list |
| `onSearchTickets` | `async () => []` | `{text, department, dateFrom, dateTo}` → matches |
| `hospital` | fallback hospital object | For records predating per-ticket hospital fields |

---

### Admin / Master Data

#### `DoctorComponent.jsx`
Full CRUD over a doctor directory. List-first view (search + specialty
filter), "+ Add Doctor" modal. Fields: Name, Designation, Specialty/
Department (~28 options), **Qualifications** (searchable multi-select
with chips — MBBS/MD/MS/FCPS/MRCP/etc., plus custom entries), BMDC
Reg. No., Mobile, Email, Chamber/Room, Consultation Fee, Available
Days/Time, Active/Inactive status. Auto-generated `DOC-<id>`.

| Prop | Default | Purpose |
|---|---|---|
| `onLoadDoctors` | `async () => []` | Populate the list |
| `onSaveDoctor` | assigns a local ID | Create/update |
| `onDeleteDoctor` | `async () => true` | Delete |

> Its own `onLoadDoctors()` (full records) is a different shape from
> the *other* components' `onLoadDoctors()` (plain `string[]` of
> names) — both can be backed by the same Firestore collection, e.g.
> `doctors.filter(d => d.status === "Active").map(d => d.name)`.

#### `TestMasterComponent.jsx`
Full CRUD over the lab test catalog — the intended single source of
truth for test name, short name, category, **price** (with an explicit
note that it fluctuates and this screen is exactly how you update it),
sample type, Active/Inactive, Search-Visible/Hidden, Report Template
(Numeric Single Value / Multi-Parameter Panel / Qualitative / Narrative),
**Unit/Reference Configuration** (Qualitative, Single Range, Male/
Female Split, or Male/Female/Child — mirrors the Lab Report component's
reference-range model), turnaround hours, fasting-required, synonyms,
specimen container/volume, display order.

Seeded with 194 tests auto-classified from the hospital's fee schedule
JSON by keyword matching — explicitly documented as a first draft to
review, since the source JSON has no reference ranges or short names
to seed from.

| Prop | Default | Purpose |
|---|---|---|
| `onLoadTests` | `async () => SEED_TESTS` | Populate the list (falls back to the built-in seed) |
| `onSaveTest` | assigns a local ID | Create/update |
| `onDeleteTest` | `async () => true` | Delete |

#### `EmployeeComponent.jsx`
Full CRUD over staff records **plus** Firebase Auth account
management — the most architecturally sensitive component in the
suite. Extra HR fields beyond the basics: Gender, DOB, Blood Group,
Joining Date, NID, Address, Emergency Contact, Salary (optional,
admin-only), Photo URL. **Role & Page Access**: a Role dropdown
(Admin/Manager/Billing Staff/Receptionist/Lab Technologist/
Pathologist/IT Support/Custom) auto-fills a per-module permission
checkbox grid (Dashboard/Billing/Reporting/Doctors/Test Master/
Employees/Settings) — still individually editable after picking a role.

**Read this before wiring `onCreateEmployeeAccount`:** Firebase's
client-side `createUserWithEmailAndPassword()` signs the *browser* in
as the newly created user — calling it from an admin screen would log
the admin out of their own session. `onCreateEmployeeAccount` is
documented to be implemented via a **Cloud Function using
`firebase-admin`** (`admin.auth().createUser(...)`) instead. Same
story for `onSetTemporaryPassword` and `onSetAccountDisabled` — both
need `firebase-admin` server-side; only `onSendPasswordResetEmail`
works straight from the client SDK.

| Prop | Default | Purpose |
|---|---|---|
| `onLoadEmployees` | `async () => []` | Populate the list |
| `onSaveEmployee` | assigns a local ID | Create/update the Firestore profile only |
| `onDeleteEmployee` | `async () => true` | Delete the Firestore profile (does **not** touch the Auth account) |
| `onCreateEmployeeAccount` | throws (not wired up) | Must be backed by a Cloud Function |
| `onSendPasswordResetEmail` | `async () => true` | Client-SDK-safe |
| `onSetTemporaryPassword` | `async () => true` | Must be backed by a Cloud Function |
| `onSetAccountDisabled` | `async () => true` | Must be backed by a Cloud Function (Block/Unblock Access) |

---

### Analytics

#### `AccountingComponent.jsx`
In-depth analytics over saved invoices — no new data model, everything
derived from the same record shape `InvoiceComponent` already
persists. Date-range presets (Today/Week/Month/Year/All Time/Custom),
Status filter, Referred By filter, free-text search, Min/Max amount,
"Due only" toggle. KPI cards (Net Billed, Collected, Outstanding Due,
Discount Given, Collection Rate %) computed purely from each invoice's
`{total, payable, netBill, due}` — e.g. `Collected = netBill − due`,
`Discount = payable − netBill`, no separate fields needed. Charts
(via `recharts`): Collected-vs-Due over time (auto-bucketed by day or
month), Revenue by Status (pie), Top 10 Tests by Revenue (bar,
computed directly from line-item names). Revenue-by-Category only
appears once `getCategoryForTestName` is wired to Test Master — see
[Design Pattern 6](#6-single-source-of-truth-philosophy). Click any
invoice row for a read-only detail modal.

| Prop | Default | Purpose |
|---|---|---|
| `onLoadInvoices` | `async () => []` | `{dateFrom, dateTo, status, referredBy}` → matching invoices |
| `onLoadDoctors` | `async () => []` | Referred By filter dropdown |
| `getCategoryForTestName` | `() => "Uncategorized"` | Optional Test Master lookup for the category chart |

> Deliberately client-side: fine at one hospital's invoice volume;
> years of multi-facility history would be the point to move to
> server-side aggregation instead.

---

### Auth

#### `LoginComponent.jsx`
Email/password sign-in. Maps Firebase Auth error codes to messages a
user can act on — most importantly `auth/user-disabled` →
*"This account has been disabled. Contact your administrator."*,
which is exactly the state `EmployeeComponent`'s "Block Access" button
puts someone into. This is the one auth action in the whole suite
where calling the client SDK directly is correct — a user signing
themselves in has none of the "wrong session" pitfalls that apply to
an admin creating/blocking *someone else's* account.

| Prop | Default | Purpose |
|---|---|---|
| `hospitalName` / `logoUrl` | branding defaults | Header |
| `onSignIn` | throws (not wired up) | `signInWithEmailAndPassword(auth, email, password)` |
| `onForgotPasswordClick` | — | Callback for in-app routing to Reset Password |
| `resetPasswordHref` | — | Plain-link alternative to the callback |

#### `ResetPasswordComponent.jsx`
Both halves of a real Firebase reset flow in one component, because
that's how a user actually experiences it across two separate visits:
**(1) Request** — enter email, send a reset link, deliberately vague
on whether that email has an account (standard anti-enumeration
practice). **(2) Confirm** — detected automatically via
`?mode=resetPassword&oobCode=...` in `window.location.search` (Firefox's/
Firebase's standard action-link format) when the user arrives from the
emailed link; verifies the code and shows whose password is being
reset before accepting a new one. Expired/invalid links show a clear
message and a one-click way to request a fresh one.

| Prop | Default | Purpose |
|---|---|---|
| `hospitalName` / `logoUrl` | branding defaults | Header |
| `onSendResetEmail` | throws (not wired up) | `sendPasswordResetEmail(auth, email)` |
| `onVerifyResetCode` | throws (not wired up) | `verifyPasswordResetCode(auth, oobCode)` |
| `onConfirmReset` | throws (not wired up) | `confirmPasswordReset(auth, oobCode, newPassword)` |
| `onGoToLogin` / `loginHref` | — | Callback or plain link back to sign-in |

---

## Shared Data Shapes

Rough shapes that recur across components (not enforced by any schema
— these are what the props above actually pass around):

```
Patient (Invoice / Patient Billing)
{ patientId, name, mobile, ageY, ageM, ageD, dob, nid, gender, address, referredBy }

Invoice record (saved by InvoiceComponent, read by InvoiceListComponent & AccountingComponent)
{ invoiceNumber, billDateTime, hospitalName, hospitalAddress, patient,
  lineItems: [{id, name, rate, qty}],
  totals: {total, payable, netBill, due}, status, deliveryDateTime }

Lab report record (saved by LabReportComponent, read by LabReportListComponent)
{ hospitalName, hospitalAddress, patient: {..., regNo, sex, collectionDate, reportDate},
  technologist, pathologist,
  tests: [{name, result}],
  extraPages: [{id, title, rows: [{id, name, result, unit, normal}]}] }

OPD ticket record (saved by PatientBillingComponent, read by PatientBillingListComponent)
{ billNo, billDateTime, hospital, department, roomNo, healthId,
  visitFrom, visitTo, validUntilDate, patient, paymentAmount, printedBy }

Doctor record (DoctorComponent)
{ id, name, designation, specialty, qualifications: [...], bmdc, mobile,
  email, chamber, fee, availableTime, status }

Test Master record (TestMasterComponent)
{ id, name, shortName, category, price, notes, sampleType, active,
  searchVisible, reportTemplate, unit, referenceType,
  refUnisex/refMale/refFemale/refChild: [low, high], normalText,
  turnaroundHours, fastingRequired, synonyms, specimenContainer, displayOrder }

Employee record (EmployeeComponent)
{ id, uid, name, designation, department, mobile, email, gender, dob,
  nid, bloodGroup, address, joiningDate, emergencyContactName/Phone,
  salary, photoUrl, role, permissions: {dashboard, billing, reporting,
  doctors, testMaster, employees, settings}, status, notes }
```

---

## Firebase Integration Guide

A quick reference for which auth-related prop needs which
implementation strategy — this trips people up because Firebase's
client SDK is deliberately restricted in what it lets you do to
*other* users' accounts:

| Action | Safe from client SDK? | Component(s) |
|---|---|---|
| Sign yourself in | ✅ `signInWithEmailAndPassword` | Login |
| Send a password reset email | ✅ `sendPasswordResetEmail` | Reset Password, Employee |
| Verify/confirm a reset code | ✅ `verifyPasswordResetCode` / `confirmPasswordReset` | Reset Password |
| Create *another user's* login | ❌ signs the browser in as them | Employee — needs a Cloud Function + `firebase-admin` |
| Set *another user's* password directly | ❌ not permitted client-side | Employee — needs a Cloud Function |
| Disable/enable *another user's* account | ❌ not permitted client-side | Employee — needs a Cloud Function |
| Draw a real scannable barcode | N/A (not an auth concern) | Invoice/Patient Billing — use `jsbarcode`, not a hand-rolled encoder (see below) |

**Why `jsbarcode` instead of a custom Code128 encoder:** a hand-rolled
barcode-width table is easy to get subtly wrong in a way that looks
correct on screen but silently fails to scan — worse than not having a
barcode at all, since it looks like it should work. `jsbarcode` is the
industry-standard, MIT-licensed way to get one that actually scans;
every barcode component here loads it via dynamic `import()` and falls
back to a plain readable text label if it isn't installed, rather than
drawing something fake.

---

## Known Limitations & Follow-ups

Worth deciding on deliberately rather than discovering later:

- **Two print class-name conventions exist** (`.print-page` vs.
  `.print-area`) depending on when in the build order a component was
  written. Pick one before shipping and normalize the rest.
- **Duplicated lookup tables**: `LabReportComponent` and
  `LabReportListComponent` each carry their own copy of the test
  catalog; `InvoiceComponent` and `PatientBillingComponent` each
  carry their own copy of the billable-test list. Fine as separate
  artifact files; once these live in one real codebase, extract each
  into a single shared module (or better, read live from
  `TestMasterComponent`'s data) so a catalog edit doesn't need to
  happen in two or three places.
- **Client-side analytics at scale**: `AccountingComponent` pulls all
  matching invoices into the browser and computes everything there.
  Fine for one hospital; revisit with server-side aggregation
  (scheduled rollups, BigQuery export) if this ever needs to analyze
  years of multi-facility history.
- **OPD ticket reprints can't show handwritten Rx content** — by
  construction, not by omission. If a digital record of what the
  doctor actually prescribed matters, that needs its own data-capture
  step somewhere (a doctor's module), independent of this ticket.
- **Employee deletion doesn't cascade to the Auth account** — deleting
  the Firestore profile leaves any associated Firebase Auth account
  intact unless your `onDeleteEmployee` backend also calls
  `admin.auth().deleteUser(uid)`.
- **`CBCReportComponent` is likely redundant** now that
  `LabReportComponent` has the same panel built in — keep it only if
  a CBC-only, no-catalog print flow is specifically wanted somewhere.

---

## Development Timeline

Roughly the order things were built, since later decisions reacted to
earlier ones:

1. **Lab Report** — built from a hospital fee-schedule JSON; scoped to
   only the tests with genuine reference ranges (procedures like
   imaging/surgery were excluded since they don't have "normal
   values"). Iterated through: CBC panel → Urine R/M/E full panel →
   a virtual "General" tab → per-category A4 pagination → editable
   results directly in the print view → Male/Female/Child reference
   display → Culture & Sensitivity and Histopathology categories.
2. **Invoice** — itemized billing sharing the same fee-schedule data,
   with patient registration, a searchable test picker, and the
   six-row totals cascade. This is where the `window.confirm` bug was
   found and fixed project-wide, and where the barcode
   build-vs-buy decision (`jsbarcode` over hand-rolled Code128) was made.
3. **Doctor**, **Test Master**, **Employee** — admin/master-data CRUD
   screens, each following the same list-first + modal pattern. Test
   Master was seeded from the same fee schedule as Invoice, this time
   annotated with reference-range configuration mirroring Lab Report's
   model. Employee is where the Firebase Auth client-vs-Cloud-Function
   boundary was worked out in detail.
4. **Invoice List** and **Lab Report List** — search/reprint views
   over what the first two components save; this is where a small gap
   was caught and fixed (Invoice wasn't saving `hospitalName`/
   `hospitalAddress` per record, which would've broken reprint
   fidelity if the hospital's details ever changed).
5. **Accounting** — analytics dashboard built entirely from the
   Invoice record shape, no new data model.
6. **Patient Billing** — initially built as an invoice-styled document,
   then corrected: the hospital's actual format is an OPD/prescription
   ticket (bilingual header, blank Rx area for the doctor), supplied
   as a real reference file (`PatientTicket.jsx`) partway through.
   Rebuilt to match that format exactly, then simplified further
   (itemized billing removed entirely in favor of a flat ticket fee)
   once it was clear this ticket doesn't carry test-level billing —
   that's what Invoice is for.
7. **Patient Billing List** — same search/reprint pattern as the other
   two List components, applied to the ticket format.
8. **Login** and **Reset Password** — the two client-safe Firebase
   Auth flows, built last since they depend on nothing else in the
   suite.

---

## File Manifest

```
LabReportComponent.jsx           Pathology/lab report builder + printable output
CBCReportComponent.jsx           Standalone CBC-only report (superseded, kept for reference)
LabReportListComponent.jsx       Search, view, and reprint saved lab reports

InvoiceComponent.jsx             Itemized patient invoice + billing
InvoiceListComponent.jsx         Search, view, and reprint saved invoices
PatientBillingComponent.jsx      OPD registration ticket (prescription format)
PatientBillingListComponent.jsx  Search, view, and reprint saved OPD tickets

DoctorComponent.jsx              Doctor directory CRUD
TestMasterComponent.jsx          Lab test catalog CRUD (source of truth for pricing/ranges)
EmployeeComponent.jsx            Staff CRUD + Firebase Auth account management

AccountingComponent.jsx          Revenue/collection analytics over saved invoices

LoginComponent.jsx               Email/password sign-in
ResetPasswordComponent.jsx       Password reset request + confirmation
```
