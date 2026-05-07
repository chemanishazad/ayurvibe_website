# Ayurvibe — Full Overhaul Plan

**Goal:** Turn the current admin-only clinic app into a polished, role-tailored hospital management system for **3 logins**:
- **Admin** — runs the clinic(s), full control
- **Doctor** — clinical work (consultations, plans, follow-ups)
- **Receptionist** — front desk (registration, vitals, billing, scheduling)

**Scope:** Both UI/UX overhaul *and* missing functional modules, phased so each phase ships independently.
**Out of scope (this revision):** Patient-facing portal, telemedicine, native mobile apps, multi-language.

---

## 1. Current State (Baseline)

### What exists
- React 18 + Vite + TS + Tailwind + shadcn/ui (Radix), React Router v6, React Query, React Hook Form + Zod.
- Express + Drizzle ORM + Postgres backend, JWT auth via `sessionStorage`.
- Roles today: `admin`, `doctor`, `nurse`, `user` (generic staff) — controlled per-user via `allowedNavPaths` and `staffRole` ([nav-access.ts](src/lib/nav-access.ts)).
- Modules: Patients, OP vitals, Consultations, Treatment Plans (with sessions/therapists/rooms), Pharmacy (direct + consultation-linked), Inventory (batches, expiry), Suppliers, Medicines, Direct Sales, Reports, Clinics, UOM, Users.
- Multi-clinic: admin can switch all-clinics filter; staff are JWT-bound to one clinic and `switchClinic` triggers a full reload ([AdminClinicContext.tsx](src/contexts/AdminClinicContext.tsx)).
- Single login page at `/admin` for everyone; sidebar layout via [AdminLayout.tsx](src/components/AdminLayout.tsx).

### Gaps that hurt the most
1. **No role-shaped experience.** All roles see the same shell + dashboard; receptionists scroll past clinical pages, doctors see commerce.
2. **No appointment/calendar layer.** "Appointments" exist only inside treatment-plan days; walk-ins and OP visits are not on a calendar.
3. **No notifications.** Follow-ups need a manual page visit; no SMS/WhatsApp/email reminders; no in-app inbox.
4. **No proper invoice.** Print-only HTML, no PDF, no invoice numbers, no GST, no payment status tracking, no partial payments.
5. **No audit log.** Who edited what, when — invisible.
6. **`sessionStorage` JWT** logs the user out on every tab close; no refresh tokens; no 2FA.
7. **One enormous `ConsultationsPage.tsx` (~157 KB)** — hard to maintain, slow to load, mixed concerns.
8. **No EHR depth.** No file uploads (lab reports, scans, ID proof), no allergies/drug-interaction flags, no prescription templates.
9. **Mobile/tablet polish is unverified.** Front-desk tablets and doctor phones aren't first-class.
10. **Reports are flat tables/charts.** No drill-down, no date-range presets in one place, no export (CSV/PDF).
11. **No global search / command palette.** Looking up a patient takes 3 clicks every time.
12. **Inventory has expiry but no alerts.** No "expires in 30 days" reports, no auto-removal of expired batches from FIFO.

---

## 2. Target Role Model (3 Roles)

> Migration: existing `nurse` → folded into `receptionist`; existing `user` (generic staff) → migrate to `receptionist` with the same `allowedNavPaths`. `doctor` and `admin` unchanged. Keep `staffRole` column for back-compat but stop reading it in app code after migration.

### 2.1 Admin
**Mental model:** Owner / clinic manager. Sees everything across clinics.

Modules:
- All current admin pages (Clinics, Users & access, UOM, Doctors, Medicines, Suppliers, Direct sales).
- **Reports hub** with drill-down + CSV/PDF export.
- **Audit log** viewer (new).
- **Settings** page (clinic branding, invoice prefix, GSTIN, working hours, notification templates) — new.

Default landing: `/admin/dashboard` (KPIs across selected clinic or all).

### 2.2 Doctor
**Mental model:** Clinical worker. Today's panel + this patient.

Modules:
- **Today** (new doctor home) — today's appointments, in-progress consultations, due follow-ups, quick "start consultation".
- Patients (read + edit medical history).
- Consultations (full CRUD; their own + clinic's, configurable).
- Treatment Plans (their patients).
- Upcoming Follow-ups (their list).
- Pharmacy (read-only — to see what was dispensed).
- Reports (their own performance + clinic clinical reports — no profit/cost).

Default landing: `/doctor/today`.

### 2.3 Receptionist
**Mental model:** Front desk. Schedule, intake, billing, dispense.

Modules:
- **Front Desk** (new home) — today's calendar, walk-in queue, OP vitals queue, pending bills.
- Patients (CRUD, search, registration).
- **Appointments** (new) — calendar view, book/reschedule/cancel.
- OP vitals entry.
- Pharmacy sales (direct + consultation add-on).
- **Billing & Invoices** (new module, see §5).
- Inventory (read + low-stock alerts; no purchase entry unless granted).
- Upcoming Follow-ups (call list with "called/confirmed" status).

Default landing: `/reception/desk`.

### 2.4 Access matrix (high level)

| Module | Admin | Doctor | Reception |
|---|---|---|---|
| Clinics, Users, UOM, Suppliers, Medicines master | ✓ | — | — |
| Doctors master | ✓ | view | view |
| Patients | ✓ | ✓ | ✓ |
| Appointments calendar | ✓ | own + view | ✓ (book) |
| OP vitals | ✓ | view | ✓ (enter) |
| Consultations | ✓ | ✓ | view + bill |
| Treatment Plans | ✓ | ✓ | view + schedule |
| Pharmacy / Direct sales | ✓ | view | ✓ |
| Inventory (purchases) | ✓ | — | view |
| Inventory (low stock view) | ✓ | view | ✓ |
| Reports — clinical | ✓ | own + clinic | own counters |
| Reports — financial (profit/cost) | ✓ | — | revenue only |
| Audit log, Settings | ✓ | — | — |

Implementation: keep `allowedNavPaths` mechanism — it already works. Add **role presets** in the Users admin page so admins click "Doctor preset" or "Receptionist preset" instead of ticking 18 boxes.

---

## 3. Phased Roadmap

Each phase is independently shippable. Estimated calendar weeks assume one full-time engineer.

### Phase 0 — Foundations (1 week)
Prep work that everything else builds on. **Ship before any UI work.**

- [ ] Create `RoleProvider` context wrapping `AdminClinicContext`; expose `role: 'admin'|'doctor'|'reception'` derived from JWT (with migration shim for old `nurse`/`user`).
- [ ] Add **role presets** in [UsersAdminPage.tsx](src/pages/admin/UsersAdminPage.tsx) — three buttons that set `allowedNavPaths` to canned lists.
- [ ] Backend migration: add `role_v2` column on `users` (`'admin'|'doctor'|'reception'`) computed from current `role`+`staffRole`; backfill; switch JWT to emit it; keep old fields for 1 release.
- [ ] Move JWT from `sessionStorage` → **`httpOnly` refresh-token cookie + short-lived access token in memory**. Adds: longer sessions, CSRF token, logout-everywhere.
- [ ] Add audit log table + write helper used by all mutating routes (see §4.1).
- [ ] Split [ConsultationsPage.tsx](src/pages/admin/ConsultationsPage.tsx) into: list, drawer (create/edit form), detail view, print payload builder. Pure refactor, no behavior change. Critical for further work.

**Deliverables:** new role plumbing, audit log writing (viewer comes later), refresh-token auth, leaner consultation code.

### Phase 1 — Role-Shaped Shell & Dashboards (1–2 weeks)
Make the app feel different for each role on day one.

- [ ] Three route trees: `/admin/*` (existing), `/doctor/*` (new), `/reception/*` (new). Login redirects by role. Old `/admin/*` URLs redirect for non-admins.
- [ ] **AdminLayout** stays for admin; **ClinicalLayout** for doctor; **DeskLayout** for receptionist — same primitives (sidebar from `@/components/ui/sidebar`), different nav groups, different header widgets (e.g. "Start consultation" CTA for doctor; "Walk-in" + "Search patient" for reception).
- [ ] **Doctor Today page** (`/doctor/today`) — sectioned: In Progress, Today's Appointments, Walk-ins waiting, Due Follow-ups, Quick patient search. Each row → one-click into the right place.
- [ ] **Reception Desk page** (`/reception/desk`) — Today's calendar (compact), Walk-in queue with "Send to vitals → Send to doctor" flow, Pending bills, Low stock peek.
- [ ] **Admin Dashboard** rework — KPI cards (Today revenue / consultations / new patients / pending bills), chart row (last 30d), drill-down links.
- [ ] **Global command palette** (`Ctrl+K`) — patient search, jump to module, recent items. shadcn `Command` already imported.
- [ ] **Theming pass** — define a small token set (brand color, density, radius) in `tailwind.config`; tighten spacing on tables; ensure dark mode works on every page (already wired via `next-themes`).
- [ ] **Mobile/tablet pass** — sidebar collapses to drawer below `md`; tables become cards; receptionist desk is touch-first (front desk on iPad).

### Phase 2 — Appointments & Calendar (1–2 weeks)
Currently appointments only exist inside treatment-plan days. Add a real schedulable calendar.

- [ ] New **`appointments`** table (separate from `treatment_plan_days.appointments`): id, clinicId, patientId, doctorId, type (`consultation|follow_up|treatment_session|walk_in`), startAt, endAt, status (`booked|checked_in|in_progress|completed|cancelled|no_show`), source (`reception|doctor|admin`), notes, linkedConsultationId?, linkedPlanDayId?.
- [ ] FullCalendar or shadcn Calendar + custom grid (weigh bundle size — recommend **`@fullcalendar/react`** for the day/week/month views).
- [ ] Conflict detection per doctor/room/therapist (DB-level constraint + UI warning).
- [ ] **Walk-in flow:** receptionist creates patient → creates `walk_in` appointment "now" → vitals → doctor sees it on Today.
- [ ] Status transitions wired from each surface: reception checks in, doctor marks in-progress/completed, no-show auto-mark by cron after grace period.
- [ ] Treatment-plan sessions auto-emit `appointments` rows so the calendar shows everything in one place (one writer wins; plan_day stays the source of truth, appointment is a projection).

### Phase 3 — Billing & Invoicing (1–2 weeks)
Replace HTML print with proper invoicing.

- [ ] New tables: `invoices` (id, number, clinicId, patientId, customerName?, customerMobile?, issuedAt, subtotal, discount, taxAmount, total, paidAmount, balance, status `draft|issued|partial|paid|cancelled|refunded`, gstin?, notes), `invoice_items` (id, invoiceId, kind `consultation|medicine|procedure|treatment_session`, refId, description, qty, unitPrice, lineDiscount, taxRate, lineTotal), `payments` (id, invoiceId, paidAt, amount, mode `cash|card|upi|bank|wallet`, reference, receivedBy).
- [ ] Invoice **numbering scheme** per clinic per fiscal year (e.g. `AYV/2026-27/00042`) — configurable in Settings.
- [ ] **PDF generation** — server-side via `pdfkit` or `puppeteer` (recommend `pdfkit` for size). Same template for screen + PDF + thermal print.
- [ ] **Tax (GST)** — per-item tax rate, CGST/SGST/IGST split, GSTIN on invoice. Off by default; enable in Settings.
- [ ] **Partial payments** — invoice with multiple `payments` rows; "balance due" surfaced on patient page and reception desk.
- [ ] Replace existing pharmacy/consultation print pages with the new invoice template (keep old routes redirecting).
- [ ] WhatsApp send: existing `api.whatsapp.sendBill` reused with a hosted PDF link instead of plaintext.

### Phase 4 — Notifications (1 week)
- [ ] New `notification_templates` table — admin-editable text + variables (`{{patient.name}}`, `{{appointment.time}}`).
- [ ] New `notification_jobs` table — scheduled outbound messages with status/retry.
- [ ] Channel adapters: SMS (Twilio or MSG91 — Indian context favors MSG91/Gupshup), WhatsApp Business (Gupshup or 360dialog), email (Resend or SES). Pluggable.
- [ ] Triggers:
    - Appointment booked → confirmation
    - 24h before appointment → reminder
    - Consultation completed with `followUpDate` → reminder 1 day prior
    - Low-stock daily digest to admin
    - Birthday wishes (optional, off by default)
- [ ] **In-app notification center** — bell icon in header, unread count, mark-as-read; backed by `notifications` table per user.

### Phase 5 — EHR Depth (1–2 weeks)
- [ ] **File attachments** on patients and consultations — S3-compatible storage (recommend Cloudflare R2 — cheapest for this scale). Categories: `id_proof|lab_report|scan|consent|other`.
- [ ] **Allergies & alerts** field on patient with red banner across consultation/pharmacy screens.
- [ ] **Prescription templates** — doctor-saved combos of medicines/doses; pick-and-edit on consultation form.
- [ ] **Drug interaction warning** — light version: warn if same molecule already in patient's last 30-day prescriptions; full DB integration is later.
- [ ] **Patient timeline** — single chronological view of visits, vitals, prescriptions, plans, files.

### Phase 6 — Reports & Analytics (1 week)
- [ ] Reports hub redesigned: filter bar (date range presets, clinic, doctor) + tabs (Operations / Clinical / Financial / Inventory).
- [ ] Drill-down: click any chart bar → filtered detail table → export.
- [ ] **CSV + PDF export** on every report.
- [ ] New reports: doctor performance (consultations/revenue/avg consult time), receptionist throughput, no-show rate, expiry-soon stock, payment-aging.

### Phase 7 — Inventory Hardening (3–5 days)
- [ ] **FIFO with expiry** — auto-skip expired batches when dispensing; flag them on inventory page.
- [ ] **Expiry report** + email digest (30/60/90 day windows).
- [ ] **Stock adjustments** entity (id, medicineId, batchId, qtyDelta, reason `damage|expired|recount|return`, doneBy) — replaces ad-hoc edits.
- [ ] Purchase return flow.

### Phase 8 — Security, Audit & Polish (1 week)
- [ ] **Audit log viewer** for admin (filter by user, entity, action; diff view for updates).
- [ ] **Optional 2FA** for admin via TOTP (`otplib` + QR).
- [ ] **Rate limiting** on `/api/auth/login`.
- [ ] **Session list** in user profile — "Sign out other sessions".
- [ ] **Backup & export** — Settings → "Download all data (CSV bundle)".
- [ ] Error boundary refresh: friendly per-route fallback, Sentry wiring.

---

## 4. Backend / Schema Changes (consolidated)

### 4.1 New tables

```sql
-- Phase 0
audit_log (
  id, at, user_id, clinic_id, entity, entity_id,
  action ('create'|'update'|'delete'|'view_sensitive'),
  diff_json, ip, user_agent
)

refresh_tokens (
  id, user_id, token_hash, issued_at, expires_at, revoked_at, ip, user_agent
)

-- Phase 2
appointments (
  id, clinic_id, patient_id, doctor_id NULL, room_id NULL, therapist_id NULL,
  type, start_at, end_at, status, source,
  linked_consultation_id NULL, linked_plan_day_id NULL,
  notes, created_by, created_at, updated_at
)
-- + partial unique index to prevent doctor double-booking when status not in (cancelled,no_show)

-- Phase 3
invoices (...as in §3 Phase 3)
invoice_items (...)
payments (...)
clinic_settings ( clinic_id PK, invoice_prefix, fiscal_start_month, gstin, gst_enabled, ... )

-- Phase 4
notification_templates ( id, key, channel, subject, body, variables_json, enabled )
notification_jobs ( id, template_key, channel, to_address, payload_json, scheduled_at, sent_at, status, error, retries )
notifications ( id, user_id, kind, title, body, link, read_at, created_at )

-- Phase 5
attachments ( id, owner_kind, owner_id, category, file_key, mime, size, uploaded_by, uploaded_at )
prescription_templates ( id, doctor_id, name, items_json )
patient_alerts ( id, patient_id, kind 'allergy'|'condition'|'note', text, severity )

-- Phase 7
stock_adjustments ( id, clinic_id, medicine_id, batch_id, qty_delta, reason, note, done_by, done_at )
```

### 4.2 Existing tables — additions
- `users.role_v2` (Phase 0), `users.totp_secret`, `users.totp_enabled` (Phase 8).
- `patients.allergies_summary` (denormalized for banner; source of truth = `patient_alerts`).
- `consultations.invoice_id` (Phase 3 — link to issued invoice).
- `inventory_batches.is_expired` (computed/triggered for fast FIFO query).

### 4.3 API surface
- Group new endpoints by role-friendly base paths: `/api/appointments`, `/api/invoices`, `/api/payments`, `/api/notifications`, `/api/attachments`, `/api/audit`, `/api/settings`.
- Keep current `/api/auth/*`, add `/api/auth/refresh`, `/api/auth/logout-all`, `/api/auth/2fa/*`.
- Document with OpenAPI (`zod-to-openapi` since schemas are already Zod) → renders in admin Settings → Developers.

---

## 5. Frontend Restructure (consolidated)

### 5.1 Folder layout (target)
```
src/
  pages/
    admin/         # admin-only modules (clinics, users, uom, etc.)
    doctor/        # NEW — Today, MyPatients, MyConsultations
    reception/     # NEW — Desk, Calendar, Walk-ins, Bills
    shared/        # Patients, Consultations, TreatmentPlans, Pharmacy etc.
  layouts/
    AdminLayout.tsx
    ClinicalLayout.tsx   # NEW
    DeskLayout.tsx       # NEW
  features/        # NEW — feature-first split for big modules
    consultations/
      list/  form/  detail/  print/
    appointments/
      calendar/  drawer/
    invoices/
      list/  editor/  pdf/
  lib/
    role-access.ts       # supersedes nav-access.ts
    api.ts
    pdf/
  contexts/
    RoleContext.tsx      # NEW
```

### 5.2 Routing
- `/login` (rename from `/admin`) — single login, redirects by role.
- `/admin/*`, `/doctor/*`, `/reception/*` — separate trees, each with its own layout. Shared modules (Patients, Consultations) live under whichever path the role uses, but the **page component** is shared.
- `<RoleRoute allow={['admin','doctor']}>` wrapper (replaces `AdminOnlyRoute`).

### 5.3 Components / UX rules
- One **`PageHeader`** primitive used everywhere (title, breadcrumbs, actions). Removes the per-page header drift.
- One **`DataTable`** primitive (server-paginated, sortable, column-pickable, exportable). Replaces the ~10 hand-rolled tables.
- One **`PatientCombobox`** used by every screen that picks a patient (already partially exists in `useConsultationPatientSearch`).
- Keyboard shortcuts: `Ctrl+K` global search, `n` new (context-aware), `g p` go to patients, `g d` go to dashboard.
- Toast → keep Sonner; standardize on `toast.success/error/info`. Remove the `use-toast` hook duplication.
- Forms: every form derives types from a single Zod schema in `src/schema/`; no hand-typed form types.

### 5.4 Performance
- Virtualize patient/consultation tables (`@tanstack/react-virtual`).
- Bundle-split per role tree (already lazy, but verify `/admin` chunk no longer contains doctor/reception code).
- Replace `react-to-print` (DOM-clone-based) with server PDF for invoices; keep `react-to-print` only for thermal receipts.

---

## 6. Migration & Risk

| Risk | Mitigation |
|---|---|
| Live data on `users.role` change | Keep `role`+`staffRole` columns; emit both old and new in JWT for one release; only delete after Phase 1 ships and all clients refresh. |
| `ConsultationsPage` refactor regressing existing flows | Pure structural split first (Phase 0); behavior PRs come after with a feature flag. |
| Calendar/appointment dual source of truth with treatment-plan days | Plan_day remains source; appointment row is a projection written by trigger or service layer; never edited directly when `linked_plan_day_id` is set. |
| Refresh-token cookie breaks current `sessionStorage` consumers | New auth route lives alongside old for one release; `lib/api.ts` reads from whichever is present. |
| PDF generation latency | Generate async on issue, store in object storage, link in UI; UI shows "Generating…" then swaps to download. |
| Notification spam during dev | All channels gated behind `NOTIFICATIONS_ENABLED` env; templates default disabled; staging uses a sink address. |

---

## 7. Suggested Order (TL;DR)

1. **Phase 0** — refactor + auth + audit plumbing (no user-visible change).
2. **Phase 1** — three role shells + role-specific home pages (biggest perceived UX win).
3. **Phase 2** — appointments calendar (biggest functional gap).
4. **Phase 3** — invoicing (biggest revenue-side gap).
5. **Phase 4** — notifications (closes the loop on appointments + follow-ups).
6. **Phase 5–8** — EHR, reports, inventory, security/polish.

Total: ~8–10 weeks of focused work for one engineer; parallelizable across two (FE + BE) for ~5–6 weeks.

---

## 7a. Doctor-Added Medicines (Pending-Master Flow)

**Problem.** During a consultation a doctor often prescribes a medicine that isn't in the master list yet. Today this blocks the consultation or forces the doctor to leave the screen and create the medicine. We want: doctor types the name → it gets accepted instantly → admin completes the master record later.

**Lifecycle**

```
Doctor types unknown medicine in consultation
        │
        ▼
medicines row inserted with status = 'pending'  (only name is required)
        │
        ▼
consultation_medicines row references it normally
        │
        ▼
Admin Inbox shows it under "Pending medicines"
        │
        ▼
Admin fills UOM, purchase price, selling price, supplier, opening stock
        │
        ▼
status = 'active' — medicine behaves like any other
```

**Schema changes** (extends Phase 0; minimal cost to add now)

```sql
ALTER TABLE medicines
  ADD COLUMN status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending','active','archived')),
  ADD COLUMN created_by_user_id uuid REFERENCES users(id),
  ADD COLUMN created_via text CHECK (created_via IN ('admin','doctor_quick_add','import')),
  ADD COLUMN pending_reason text,         -- "no UOM yet", auto-set
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN completed_by_user_id uuid REFERENCES users(id);

CREATE INDEX medicines_pending_idx ON medicines(status) WHERE status = 'pending';
```

No new table — `medicines` itself carries the state. Existing rows get `status='active'`, `created_via='admin'` in the backfill.

**Backend rules**

- `POST /api/medicines/quick-add` (doctor + admin): body `{ name }`. Inserts with `status='pending'`, `created_via='doctor_quick_add'`, `created_by_user_id`, `pending_reason='awaiting master data'`. Returns the row. Idempotent on case-insensitive name within the clinic — if a pending or active match exists, returns it instead of duplicating.
- `POST /api/consultations/:id/medicines` accepts a `medicineId` that points to a `pending` row — **no inventory deduction** is attempted for pending items. The line is stored with `dispensed=false` and `unit_price=null`; pricing is filled in when admin completes the master.
- `PATCH /api/medicines/:id/complete` (admin only): body `{ uom, purchasePrice, sellingPrice, supplierId?, openingStock?, openingBatch? }`. Validates all required fields, flips `status='active'`, sets `completed_at`/`completed_by_user_id`. If `openingStock>0` and `openingBatch` provided, creates an `inventory_batches` row in one transaction.
- `GET /api/medicines/pending` (admin) — drives the inbox; includes count of consultations referencing each pending row, plus first/last seen dates.
- Audit log entries on quick-add and on complete (already covered by Phase 0 audit plumbing).

**Inventory & billing rules for pending medicines**

| Concern | Rule |
|---|---|
| Stock deduction at consult time | **Skipped.** Pending items are recorded as "prescribed" but not "dispensed". |
| Invoice line | Included with `unitPrice = 0` and label suffix "(pending price)"; invoice **cannot be marked `paid`** until all pending lines are resolved or removed. UI shows a warning. |
| Pharmacy print | Shows the line with a "Pending — confirm with reception" tag. |
| Reports | Pending medicines are excluded from sales/profit reports until completed; counted in a separate "Pending review" KPI on the admin dashboard. |
| Re-use | A pending medicine can be prescribed again before completion — same row, no duplication. |
| Completion retroactivity | When admin completes the master with a price, **existing consultation lines are NOT auto-priced** (avoids silently changing historical bills). Instead the admin inbox surfaces "N past consultations have this med with no price — review". One-click "apply current price to unbilled consultations only". |

**Frontend changes**

- **Consultation form medicine combobox** — when the typed name has no match, show a final option: `+ Add "Amrutadi Kashayam" as new medicine`. Click → inline confirm dialog ("This will create a draft medicine; admin will complete the details. Continue?") → the row is added with a small amber "Pending" badge and `0` price. No modal, no navigation away.
- **Doctor-side surfacing** — Today page shows a small notice: "3 medicines you added are awaiting admin review" (info only, no action needed).
- **Admin Pending Medicines inbox** — new page `/admin/medicines/pending` (also a sidebar badge with count under "Medicines"). Each row: name, who added it, when, # consultations using it, button "Complete master". Drawer form with all required fields + opening stock entry.
- **Master Medicines page** — a Status column, filter chips: All / Active / Pending / Archived. Pending rows are visually distinct and have the "Complete master" action.
- **Invoice editor** — pending lines are highlighted; a disabled "Mark paid" button with tooltip "Resolve pending medicines first".

**Permissions**

- Doctor: can `quick-add` and prescribe pending. Cannot complete master.
- Receptionist: cannot quick-add (front desk should not invent meds); can dispense only `active` ones; can flag a pending line as "do not dispense — escalate to admin".
- Admin: full lifecycle, including ability to **reject** a pending entry (e.g. duplicate spelled differently) — rejection merges all references to a chosen active medicine and deletes the pending row in one transaction.

**Edge cases handled**

- Two doctors quick-add the same medicine seconds apart → idempotency check on lowercased name + clinic returns the same row.
- Doctor quick-adds, then admin renames it during completion → references stay intact (FK by id, not name); audit log records the rename.
- Pending medicine sits unused for 60+ days → admin inbox shows a "stale" tag; one-click archive.
- Doctor quick-adds a name that matches an `archived` medicine → admin inbox suggests "Reactivate existing?" instead of completing as new.

**Where this lives in the roadmap**

- Schema columns + `quick-add` endpoint + consultation form combobox: **Phase 0 / Phase 1** (small, unblocks doctor UX immediately).
- Admin Pending Inbox + completion drawer + status filter on Medicines page: **Phase 1**.
- Invoice "block paid until resolved" rule: **Phase 3** (invoicing).
- Audit-log surfacing of quick-adds: **Phase 8**.

---

## 8. Open Decisions (need answers before starting)

1. **SMS/WhatsApp provider** — MSG91, Gupshup, 360dialog, Twilio? Affects Phase 4.
2. **PDF engine** — `pdfkit` (small, programmatic) vs `puppeteer` (HTML-template, heavier). Recommend `pdfkit`.
3. **Object storage** — Cloudflare R2 vs S3 vs local disk? Affects Phase 5.
4. **GST** — Required from day one or behind a per-clinic toggle? (Plan assumes toggle.)
5. **Doctor visibility scope** — Can a doctor see *all* clinic consultations or only their own patients? (Plan assumes their own + read access to clinic for handoff; configurable per user.)
6. **Receptionist purchase entry** — Allow them to enter purchases/GRN, or admin-only? (Plan assumes admin-only.)
