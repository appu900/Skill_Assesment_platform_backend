# AB Portal: build plan (sprints)

What has to be built so the new Awarding Body (AB) Portal covers everything AMASY does, based on the
*Migration Scope and Deliverables* document and the AMASY database schema (72 MySQL dumps, 56 of them copies of the
same AMASY app). **Data migration is out of scope for now**: the goal is a portal whose schema and workflows cover
AMASY, so data could be moved later without changing the design.

- Backend: this repo (Express + MongoDB + BullMQ/Redis + S3)
- Frontend: `skillassessment-frontend-v2` (Next.js 16 + shadcn)
- Sprint length: **2 weeks**. Team assumed: 1 backend + 1 frontend developer (halve the pace with one person).

Legend: ✅ done · 🟡 partly done · 🔴 to build

---

## 1. Where we are today

| Area (from the scope document) | Status | Notes |
|---|---|---|
| TP registration, login, dashboard, approval | ✅ | Multi-step signup, admin approval, dashboard with analytics |
| Centre creation, editing, approval | 🟡 | SNA approve/reject done; centre details are thin (8 fields vs 56 in AMASY), no verification step |
| Batch creation, ABN, approval | 🟡 | Create, submit, SNA approve/reject done; **no batch upload**, no configurable approval chain |
| Payments: online, offline, invoice, verification, receipt | 🔴 | Only offline proof + admin confirm. No gateway, GST invoice, receipt, wallet or ledger |
| Candidates, scheduling, attendance, results | ✅ | Agency portal: assessor, date, attendance, NOS-wise marks, absent |
| Result comparison, tabulation, verification, publication | 🟡 | Publication (BullMQ) and public verification done; comparison and tabulation missing |
| Certificates, transcripts, ID cards, reports, downloads | 🔴 | Certificate records only; no PDF templates, transcripts, ID cards or reports |
| Roles: SNA, LC, RC, Accounts, Operation Head | 🔴 | SNA exists; others missing; admins have no permissions model |
| Scheme-wise / TP-wise configuration | 🔴 | Rules are hard-coded |
| Schema parity with AMASY | 🔴 | See section 4 |

---

## 2. Sprint overview

| Sprint | Theme | Main outcome |
|---|---|---|
| 0 (1 week) | Kick-off and decisions | Open questions answered, environments and repo hygiene ready |
| 1 | Schema parity with AMASY | Every AMASY entity and field has a home in our models and APIs |
| 2 | Roles, permissions and audit | Role-based access, new roles (LC, RC, Accounts, Operation Head, district/state levels), audit log |
| 3 | Configuration engine | Scheme-wise and TP-wise settings with overrides, versioning and an admin settings console |
| 4 | Centres and batches upgrade | Full centre profile and verification, centre courses, batch upload from Excel, configurable approval chain |
| 5 | Payments and accounts | Gateway, offline UTR, wallet and ledger, GST invoices and receipts, Accounts portal |
| 6 | Assessment and results | Proposed/final dates, core and soft results, bulk result upload, comparison, tabulation, moderation |
| 7 | Documents | Template engine, certificate, transcript, ID card, invoice and receipt PDFs, QR verification, bulk downloads |
| 8 | Reports, notifications, assessor claims | Report builder and exports, email/SMS notifications, assessor fee claims |
| 9 | Hardening and go-live | Tests, security, performance, UAT support, production deployment, handover |
| Backlog | Separate AMASY modules | ToT/TCT trainer certification, RPL, online exam / question bank, helpdesk |

Total: about **19 weeks** for two developers.

---

## 3. Sprints in detail

### Sprint 0: kick-off and decisions (1 week)

**Goal:** remove the unknowns that block design.

| Task | Owner | Output |
|---|---|---|
| Confirm what **LC**, **RC** and **Operation Head** do, and the approval chain for each scheme | Client + us | Role matrix (role → actions → scope) |
| Collect samples: certificate, transcript (marksheet), ID card, invoice, receipt, per scheme/TP | Client | Template pack |
| Confirm payment gateway (AMASY's `transaction` table looks like Instamojo: `paymentRequestId`, `paymentId`) and get sandbox keys | Client | Gateway decision + credentials |
| GST rules: rate, inclusive/exclusive, per TP or scheme, HSN/SAC code | Client | GST rule sheet |
| Grading scale and pass rules (currently a placeholder in `grading.ts`) | Client | Signed-off grading table |
| Batch upload formats currently in use (Excel samples per scheme) | Client | Column specs |
| Commit current work, set up branches, CI (lint, type check, tests), staging environment, real S3 bucket, SMTP | Us | Working staging |
| Rotate leaked secrets (MongoDB, Gmail, JWT, test admin password) | Us | Clean credentials |

**Done when:** every question above has a written answer, and staging deploys from `main`.

---

### Sprint 1: schema parity with AMASY

**Goal:** every AMASY table and column has an equivalent field or model (full mapping in section 4). No new
workflows yet: models, validation, APIs and the forms/detail screens that show the new fields.

**Backend**
- Extend models: `TrainingPartner`, `Center`, `Batch`, `Student`, `Course`, `Assessor`, `Admin`, `SNA`, `Scheme`, `Mark`.
- New models: `State`, `CentreCourse`, `PaymentTransaction`, `BatchPayment`, `Wallet` + `WalletEntry`, `OfflinePayment`, `AssessorClaim`, `AuditLog`, `TpAccreditation`, `Document`.
- `customFields` (map) on `Student`, `Batch` and `Center`, for the scheme-specific extras AMASY instances added (BPL, BOCW, block, tehsil, village, funding source…). Sprint 3 makes them configurable.
- Replace the hard-coded `stateCodes` util with a `State` collection (name, code, abbreviation) plus a seed.
- Indexes for the new lookup fields (ABN, MPR ID, UID, centre code, TP batch number).
- Update `PROTECTED_*` field lists so workflow-only fields cannot be set from requests.

**Frontend**
- TP signup: citizenship, promoters with stake %, contact person alternate email.
- Centre form and detail sheet: full address and contact, centre contact person (with PAN/Aadhaar), affiliation, logo.
- Batch form: TP batch number/ID, project ID, OJT dates and hours, core/soft skill hours, batch type and category, financial year.
- Candidate form: sector code, OJT hours, special ID, assessment type.
- Models and types in `lib/api/models.ts` for all new entities.

**Done when:** the field-by-field checklist in section 4 is all ticked, existing tests still pass, and new fields show
on the relevant forms and detail views.

---

### Sprint 2: roles, permissions and audit

**Goal:** replace "admin can do everything" with permissions, and add the AMASY roles.

**Backend**
- `Role` model: name, permissions (`centre.verify`, `batch.approve`, `payment.verify`, `result.publish`, `config.edit`…), scope type (global / state / district / scheme).
- `User` accounts for staff roles (Admin, Operation Head, Accounts, LC, RC, DPMU, SPMU), with `role`, `operatingState`, `scheme` and `district` (AMASY `admin.opr_state`, `admin.scheme`, `admin.auth`; `state_agency.cen_distt`; `tct_rc`).
- `can(user, permission, resource)` middleware that checks the permission and the scope (state/scheme/district of the resource).
- Move existing `allow(ADMIN)` routes to permission checks; SNA stays, now as a scoped role.
- `AuditLog` written by a middleware on every write: who, action, entity, before/after (JSON), IP, time (AMASY `system_log`).

**Frontend**
- Admin → **Users and roles**: create users, assign role and scope, deactivate.
- Admin → **Roles**: permission matrix editor.
- Navigation and screens shown per permission, not per hard-coded role.
- Admin → **Audit log** viewer with filters.
- Portals for the new roles (start with dashboard + their work queues; screens fill in as later sprints add features).

**Done when:** each role from the Sprint 0 matrix can do exactly its actions in its scope (tested per role), and every
write appears in the audit log.

---

### Sprint 3: configuration engine

**Goal:** "TP-wise and scheme-wise customisation without affecting other TPs or schemes".

**Backend**
- `Config` documents: `{ scope: global | scheme | scheme+tp, key, value, version, effectiveFrom, createdBy }`.
- Resolution order: **TP + scheme override → scheme → global default**, cached in Redis, invalidated on change.
- Versioning: a batch stores the config version it was created with, so later changes never alter old batches.
- Config keys:
  - `fees`: per-candidate rate, per-course rate (AMASY `cou_list.rate`), GST %, inclusive/exclusive, payment mode (pay per batch / prepaid wallet), payment conditions
  - `candidateFields`: field definitions (name, label, type, required, options, regex, min/max)
  - `requiredDocuments`: per step (TP signup, centre, batch, payment) with type/size rules
  - `batchUpload`: column → field mapping, date formats, header row
  - `approvalChain`: ordered steps per entity (centre, batch), each with a role (e.g. TP → DPMU → SPMU → SNA → AB)
  - `assessment`: theory/practical/viva/record/project components, core and soft results, pass rules, grading scale
  - `templates`: certificate, transcript, ID card, invoice, receipt template IDs
  - `reports`: which reports and columns a scheme uses
- Validation of config values (JSON schema per key) so a bad setting can't be saved.

**Frontend**
- Admin → **Settings console**: choose scope (global / scheme / scheme + TP), see the effective value and where it comes from, edit with preview, see version history, roll back.
- Candidate form and candidate detail are rendered from `candidateFields`.
- Document upload fields rendered from `requiredDocuments`.

**Done when:** changing a setting for one TP or scheme changes only that TP or scheme (automated test), and every
setting has a version history.

---

### Sprint 4: centres and batches upgrade

**Goal:** the full AMASY centre and batch workflows on top of the configuration engine.

**Backend**
- Centre lifecycle: draft → submitted → **verified** (physical/document verification) → approved per scheme (approval chain from config), with go-ahead flag (AMASY `cen_status`, `sna_status`, `go_ahead`, `cen_dpmu_sts`, `cen_spmu_sts`).
- `CentreCourse`: courses a centre may run, each with its own approval status (AMASY `course.cou_status`) and QP (`module.qp`).
- Batch lifecycle driven by `approvalChain`; confirmation status and time (`cnf_status`, `cnf_tmstmp`).
- **Batch upload:** upload Excel → background job (BullMQ) parses with the scheme's `batchUpload` mapping → validates against `candidateFields` → preview with row-level errors → confirm import. Duplicate MPR/UID checks across the platform.
- ABN generation rule configurable per scheme (format, sequence).

**Frontend**
- Centre: verification checklist, document uploads, approval timeline (who approved what, when).
- Centre courses tab: request a course for a centre, see its approval.
- Batch: **Upload candidates** wizard (download template → upload → fix errors → import).
- Approval queues for every role in the chain (DPMU, SPMU, SNA, AB), with approve / reject with reason.

**Done when:** a batch of 200 candidates can be uploaded from the scheme's Excel format, and centres and batches move
through each scheme's configured chain.

---

### Sprint 5: payments and accounts

**Goal:** online and offline payments, GST invoices, receipts and an Accounts role.

**Backend**
- Fee calculation from `fees` config (per candidate or per course, GST inclusive/exclusive).
- **Online:** payment gateway integration (create request → redirect → webhook → verify signature) stored in `PaymentTransaction` (AMASY `transaction`).
- **Offline:** UTR + date + proof upload → Accounts verifies or rejects (AMASY `invoice_payment`).
- **Wallet:** prepaid balance per TP/centre; batch fees deducted on submission; ledger entries (AMASY `wallet`: paid, deducted, balance).
- **Ledger:** every payment against a batch, partial payments allowed (AMASY `trans`: actual vs paid amount, student count).
- GST invoice and receipt numbers (sequences per financial year), PDFs generated in a background job (template from Sprint 7; a simple version first).
- Idempotent webhook handling and reconciliation report (gateway vs ledger).

**Frontend**
- TP → **Payments**: pay online, pay offline (UTR), wallet balance and top-up, invoices and receipts to download.
- **Accounts portal**: pending offline payments to verify, gateway transactions, ledger per TP, refunds/adjustments, daily collection report.

**Done when:** a batch can be paid online (sandbox) and offline, invoice and receipt PDFs are produced, and the
ledger balances to the rupee in the reconciliation report.

---

### Sprint 6: assessment and results

**Goal:** the AMASY assessment and result flow, including comparison and tabulation.

**Backend**
- Assessment dates: TP-proposed date (`pr_as_dt`) → final date set by AB/agency (`fl_as_dt`).
- Result components from `assessment` config: theory, practical, viva, record, project (AMASY `batch_4`), **core and soft-skill results** (`res_core`, `res_soft`, `soft_result`), each with its own status and timestamp.
- **Bulk result upload** (Excel) by the agency, validated against NOS maximums.
- **Result comparison:** agency-uploaded marks vs. the signed result sheet / second entry; mismatches flagged per candidate.
- **Tabulation:** batch result sheet (per candidate, per NOS/component, totals, grade, pass/fail) with totals per batch.
- **Moderation and verification:** a reviewer role approves the tabulated results before publication; publish is blocked until verified.
- Publication stays a BullMQ job; separate publish for core and soft results (AMASY `pub_tab1`, `pub_tab2`).

**Frontend**
- Agency: bulk result upload, core/soft result tabs.
- Reviewer: comparison view (differences highlighted), tabulation sheet, verify/return with comments.
- Admin: publication queue with status.

**Done when:** a batch with core and soft results goes upload → compare → tabulate → verify → publish, with every
step in the audit log.

---

### Sprint 7: documents

**Goal:** all PDFs AMASY produces, per scheme/TP templates.

**Backend**
- **Template engine:** HTML templates with placeholders (candidate, batch, scheme, TP logo and signature, QR code), stored per scheme/TP via the `templates` config; rendered to PDF with headless Chrome in a BullMQ worker.
- Documents: **certificate** (core and soft, AMASY `cert_core`, `cert_soft`), **transcript / marksheet**, **ID card**, invoice, receipt.
- `Document` model: type, owner (candidate / batch / TP / scheme), S3 key, version, generated at, checksum.
- QR code on every certificate → public `/verify?enrollment=…` (frontend already supports this link).
- Bulk download: batch ZIP of certificates and transcripts (background job + download link).
- TP branding: logo and signature (AMASY `tpfile`), TP accreditation with expiry (AMASY `cert`).

**Frontend**
- Admin → **Templates**: upload/edit HTML, preview with sample data, assign to scheme/TP.
- Candidate, batch and TP screens: download buttons for each document; batch "Download all".
- Public verify page shows the certificate preview.

**Done when:** each document type renders correctly from its scheme template, scans to the verify page, and a
100-candidate batch ZIP is produced in the background.

---

### Sprint 8: reports, notifications and assessor claims

**Goal:** the reporting and operational extras.

**Backend**
- **Reports:** saved report definitions per scheme from the `reports` config (batch status, candidate list, results, payments, centre list, assessor workload), filters (state, district, scheme, TP, date range), Excel/PDF export via background job.
- Funding-source reports (AMASY `ttl_msdp`, `ttl_ssdf`, `ttl_badp`, `ttl_bocw`, `ttl_sca_scsp`, `fin_yr`).
- **Notifications:** email (and SMS if required) on submission, approval, rejection, payment, result and certificate events, through the existing email queue; per-event templates.
- **Assessor claims** (AMASY `claim`, `claim_batch`): assessor submits a monthly fee claim with batches, travel locations, advance taken; Accounts approves and pays.
- Notices with expiry and status (AMASY `notice`), already partly done.

**Frontend**
- **Reports** section in every portal (scoped by role).
- Notification settings and history.
- Assessor claim forms (agency/assessor) and the Accounts claim queue.

**Done when:** each role can run and export its reports, and every workflow event sends its notification.

---

### Sprint 9: hardening and go-live

**Goal:** production-ready.

- Automated tests: unit (fee, GST, grading, config resolution), API integration (every workflow per role), end-to-end browser tests for the main journeys.
- Security review: permissions per route, file upload checks, rate limits, secrets, S3 objects private with signed URLs.
- Performance: indexes, pagination everywhere, load test of batch upload and certificate generation.
- Backups, monitoring and alerting, error tracking.
- Production deployment (backend + workers + Redis + MongoDB + S3 + frontend).
- UAT support and fixes; user guides per role; technical handover documentation.

**Done when:** UAT is signed off and the portal runs in production with monitoring.

---

### Backlog: separate AMASY modules (only if the client confirms they are in scope)

| Module | AMASY tables | What it is |
|---|---|---|
| ToT / TCT trainer certification | `tct_req`, `tct_btch`, `tot_btch`, `act_req`, `act_btch`, `tct_rc` | Trainer certification batches, master trainers, venues, dates, payments |
| RPL (recognition of prior learning) | `rpl_req`, `rpl_btch`, `rpl_res` | Assessing experienced workers without training |
| Online exam | `question_bank`, `exam_details`, `test_subject` | Online theory tests |
| Helpdesk | `ticket_details`, `announcement` | Support tickets |
| Legacy batch uploads (MP board) | `batch_wise_student`, `result`, `upld_file` | State board bulk uploads |

---

## 4. Schema parity: AMASY table → our model

Fields marked *custom* go into `customFields` and are switched on per scheme through `candidateFields` / config.

### Training partner (`onboarding` → `TrainingPartner`)

| AMASY column | Our field | Status |
|---|---|---|
| `org_name`, `org_cat`, `affltn`, `doi` | `organizationName`, `organizationCategory`, `affiliation`, `dateOfIncorporation` | ✅ |
| `ro_*` (add, distt, city, state, pin, tel, mob, fax, email, gst) | `registeredOffice*` | ✅ |
| `rs_*` | `regionalStateOffice*` | ✅ |
| `website`, `pan`, `prn`, `tp_code`, `scheme`, `cen_id` | `website`, `pan`, `prnNo`, `tpCode`, `scheme`, `centerId` | ✅ |
| `ho_name`, `ho_dob`, `ho_resadd`, `ho_peradd`, `ho_mob`, `ho_altmob`, `ho_email`, `ho_equal`, `ho_wrk`, `ho_pan`, `ho_adhar` | `headOwner*` | ✅ |
| `ho_citz` | `headOwnerCitizenship` | 🔴 add |
| `ho_pr1..3`, `ho_pr1..3_stk` | `promoters: [{ name, stakePercent }]` | 🔴 add (stake missing) |
| `pc_name`, `pc_desig`, `pc_mob`, `pc_alt_mob`, `pc_resadd`, `pc_peradd`, `pc_email` | `projectContactPerson*` | ✅ |
| `pc_citz`, `pc_alt_email` | `projectContactPersonCitizenship`, `projectContactPersonAltEmail` | 🔴 add |
| `pay_sts`, `status`, `tmstmp` | `paymentStatus`, `applicationStatus`, `createdAt` | ✅ |
| `tp_cat`, `tp_dist`, `dist_id`, `dist_name_en/hi`, `tp_spoc`, `tp_mob`, `sector` | district code + bilingual names, SPOC | 🔴 add (*custom* where scheme-specific) |
| `tpfile.tplogo`, `tpfile.tpsign` | `logo`, `signature` | 🔴 add |
| `cert` (sector, issuedate, expiarydate) | `TpAccreditation` model | 🔴 new |

### Centre (`centers` → `Center`)

| AMASY column | Our field | Status |
|---|---|---|
| `cen_name`, `center_id`, `cen_pr_id`, `prn`, `scheme`, `cen_state` | `name`, `centerId`, `projectId`, `PRN_NO`, `schemes[]`, `state` | ✅ |
| `cen_add`, `cen_distt`, `cen_city`, `cen_pin`, `cen_tel`, `cen_mob`, `cen_fax`, `cen_email` | `address`, `district`, `city`, `pincode`, `telephone`, `mobile`, `fax`, `email` | 🔴 add |
| `affltn`, `logo`, `tc_id`, `opr_state` | `affiliation`, `logo`, `tcId`, `operatingState` | 🔴 add |
| `poc_name`, `poc_desig`, `poc_citz`, `poc_dob`, `poc_resadd`, `poc_peradd`, `poc_mob`, `poc_alt_mob`, `poc_email`, `poc_equal`, `poc_wrk`, `poc_pan`, `poc_adhar` | `contactPerson: { … }` | 🔴 add |
| `spoc_name`, `spoc_mob`, `spoc_email` | `spoc: { name, mobile, email }` | 🔴 add |
| `cen_status`, `sna_status`, `go_ahead` | `status`, scheme approval (✅), `goAhead` | 🟡 add status + goAhead |
| `cen_dpmu_sts`, `cen_spmu_sts`, `tc_dpmu_sts`, `tc_spmu_sts` | approval chain steps (Sprint 3/4) | 🔴 |
| `cen_distt_id`, `cen_teh_*` (bilingual district/tehsil) | `districtCode`, `tehsil` (*custom*) | 🔴 add |

### Centre courses (`course` + `module` → `CentreCourse`, new)

`centre`, `trainingPartner`, `course`, `courseCode` (`cou_code`), `sector` (`cou_sec`), `qp` (`module.qp`), `status` (`cou_status`), timestamps.

### Course catalogue (`cou_list`, `course_details` → `Course`)

| AMASY column | Our field | Status |
|---|---|---|
| `cou_name`, `cou_code`, `sec_name`, `nsqf_lvl` | `courseName`, `courseCode`, `sectorName`, `ncrfLevel` | ✅ |
| `sec_code` | `sectorCode` (also on `Sector`) | 🔴 add |
| `aff` | `affiliation` (awarding SSC) | 🔴 add |
| `rate` | `ratePerCandidate` (default; overridable in config) | 🔴 add |

### Batch (`btch_1`, `btch_4` header fields → `Batch`)

| AMASY column | Our field | Status |
|---|---|---|
| `pr_abn_no`, `cen_id`, `cen_name`, `pr_crcode`, `nsqf` | `ABN_Number`, `centerId`, `centerName`, `courseCode`, `courseLevel` | ✅ |
| `pr_btchid`, `pr_btchno` | `tpBatchId`, `tpBatchNumber` | 🔴 add |
| `cen_pr_id` | `projectId` | 🔴 add |
| `pr_as_dt`, `fl_as_dt` | `proposedAssessmentDate`, `finalAssessmentDate` | 🔴 add |
| `ojt_dt` | `ojtDate` | 🔴 add |
| `btch_pymnt`, `btch_pyby`, `btch_status` | payment status (✅), `paymentPublishedBy` (✅), `status` (✅) | ✅ |
| `cnf_status`, `cnf_tmstmp` | `confirmationStatus`, `confirmedAt` | 🔴 add |
| `pub_tab1`, `pub_tab2`, `pub_tmstmp` | `corePublished`, `softPublished`, `resultPublishedAt` | 🔴 add |
| `ass_reg`, `regd_id` | `assessorId` | ✅ |
| `remarks`, `reports`, `rprt_status` | `remarks`, `reports[]` | 🔴 add |
| `core_skill_hrs`, `core_soft_skill_hrs`, `core_hrs` | `coreSkillHours`, `softSkillHours`, `totalHours` | 🔴 add |
| `btch_type`, `btch_cat`, `fin_yr`, `spmu_dt` | `batchType`, `batchCategory`, `financialYear` (*custom*) | 🔴 add |
| `ttl_enroll`, `ttl_msdp`, `ttl_ssdf`, `ttl_badp`, `ttl_bocw`, `ttl_sca_scsp` | `enrolmentBySource: { … }` (*custom*) | 🔴 add |

### Candidate (`btch_2` → `Student`)

| AMASY column | Our field | Status |
|---|---|---|
| `mprId`, `snaId`, `candidateName`, `fathersName`, `mothersName`, `dob`, `gender`, `religion`, `category`, `nationality`, `generalQualification` | same fields | ✅ |
| `address`, `state`, `district`, `city`, `pinCode`, `mobile`, `email`, `uid` | same fields | ✅ |
| `sector_name`, `course`, `module`, `trainingStartDate`, `trainingEndDate`, `trainingHours`, `totalHours`, `totalDays`, `photo`, `pr_abn_no`, `cen_id` | same fields | ✅ |
| `sector_code` | `sectorCode` | 🔴 add |
| `ojtHours` | `ojtHours` | 🔴 add |
| `spl_id` | `specialId` | 🔴 add |
| `asstype` | `assessmentType` | 🔴 add |
| `attendance` | attendance per assessment day | 🔴 add |
| `age`, `scheme`, `bocw`, `bpl`, `block`, `tehsil`, `village`, `Mpssdegbid` | *custom* | 🔴 add via config |

### Results (`btch_3`, `batch_4`, `soft_result`, `res_core`, `res_soft` → `Mark`)

| AMASY column | Our field | Status |
|---|---|---|
| `theory`, `practical`, `viva`, `total` | per-NOS marks + totals | ✅ |
| `record`, `project` | extra components (config) | 🔴 add |
| core vs soft result tables | `component: "core" \| "soft"` (one mark doc per component) | 🔴 add |
| `res_status`, `res_tmstmp`, `dt` | `resultStatus`, `resultAt`, `assessmentDate` | 🔴 add |

### People and roles

| AMASY table | Our model | Change |
|---|---|---|
| `admin` (name, role, username, phone, opr_state, scheme, auth) | `User` + `Role` | 🔴 role, scope and permissions (Sprint 2) |
| `state_agency` (role, scheme, sna_name, sna_email, sna_mob, cen_distt) | `SNA` → scoped `User` | 🔴 contact fields, district scope |
| `tct_rc` (rc_name, rc_email, rc_contact, rc_state) | `User` with role RC | 🔴 |
| `assessor` (regd_id, trade, module, ass_name, qual, status, photo, sign, KYC, bank) | `Assessor` | 🔴 add qualification, status, sign, KYC docs, bank details |

### Money (all new)

| AMASY table | New model | Key fields |
|---|---|---|
| `transaction` | `PaymentTransaction` | owner, type, amount, gateway request/payment IDs, gateway status, status |
| `invoice_payment` | `OfflinePayment` | batch, amount, UTR, payment date, proof, submitted by, approval status, approved by/at |
| `trans` | `BatchPayment` (ledger) | batch, ref ID, type, amount due, amount paid, candidates, date, remarks |
| `wallet` | `Wallet`, `WalletEntry` | owner, entry type, amount paid, deducted, balance, batch, ref ID |
| `invoice` | `Invoice` (extend existing) | TP, centre, batch, candidates, billing address, GST, number, PDF |
| `claim`, `claim_batch` | `AssessorClaim` | claim ID, month, locations, project, batches, candidates, fee, advance, refund, bank, status |

### Other

| AMASY table | Our model | Status |
|---|---|---|
| `scheme` (name, value, alias) | `Scheme` (add `alias`) | 🟡 |
| `state` (name, code, abv) | `State` (new collection) | 🔴 |
| `notice` | `Notification` | ✅ |
| `system_log` | `AuditLog` | 🔴 |
| `attendancesheet` | `Exam.attendanceSheet` | ✅ |

---

## 5. Open questions (needed before Sprint 2 and 3)

1. What do **LC**, **RC** and **Operation Head** do, and in which scope (state / district / scheme)?
2. The approval chain per scheme (is DPMU/SPMU used outside the one instance that has it?).
3. Fee rules per scheme and TP: per candidate or per course, GST rate and inclusive/exclusive, wallet or pay per batch.
4. Payment gateway provider and keys.
5. Certificate, transcript, ID card, invoice and receipt templates per scheme/TP.
6. Official grading scale and pass rules, and whether core and soft results get separate certificates.
7. Batch upload Excel formats per scheme.
8. Which backlog modules (ToT/TCT, RPL, online exam, helpdesk) are in scope.

## 6. Definition of done (every sprint)

- Backend: validation, permission checks, audit log entries, indexes, tests for the new rules.
- Frontend: screens for every role involved, loading/empty/error states, mobile layout, dark mode in portals.
- Lint, type check and build pass; tested end to end on staging.
- Short demo to the client at the end of the sprint; feedback goes into the next sprint.
