# Ayura OS — User Stories (Gherkin)

> Each story has a Fibonacci estimate (1/2/3/5/8/13) and a priority (p0 must-ship-v1, p1 v1-stretch, p2 v2).

---

## Epic: E1 · Identity, Tenancy & RBAC

### S-AUTH-1 · Tenant onboarding wizard · **P0** · 5 pts
**As a** Hospital Administrator
**I want** to self-onboard my hospital with a 3-step wizard (brand, departments, first staff user)
**So that** I can start inviting my team the same day.

```gherkin
Scenario: First-time tenant completes onboarding
  Given I land on /onboard with a valid invite token
  When I submit hospital name, logo, and primary color
    And I pick enabled modules (OPD, IPD, LIMS, Pharmacy)
    And I create my admin account with email + password
  Then a new tenant row is created with tenant_id scoped RLS
    And I am redirected to /dashboard
    And an audit log entry "tenant.created" is written
```

### S-AUTH-HWKEY · Zero-Trust Hardware Key pairing · **P0** · 5 pts
**As a** newly invited doctor
**I want** to pair my YubiKey/TouchID during first login
**So that** my account meets zero-trust requirements.

```gherkin
Scenario: Doctor pairs FIDO2 credential
  Given I click the setup link in my welcome email
  When I enter my temporary password
    And the system prompts for WebAuthn setup
    And I tap my YubiKey
  Then my FIDO2 public key is bound to my user_id
    And future logins require the physical key, bypassing OTPs
```

### S-AUTH-2 · Role-based navigation · **P0** · 3 pts
**As a** lab technician
**I want** the sidebar to show only Lab + my profile
**So that** I don't see irrelevant modules.

```gherkin
Scenario: Lab tech sees filtered nav
  Given I am logged in with role "lab_tech"
  When I open /dashboard
  Then the nav contains "Worklist", "QC", "Profile"
    And the nav does not contain "Billing" or "IPD"
```

### S-AUTH-3 · Patient OTP login · **P0** · 3 pts
**As a** patient
**I want** to log into the mobile app with my phone + OTP
**So that** I don't manage another password.

```gherkin
Scenario: Patient logs in via SMS OTP
  Given I enter "+91 98xxx xxxxx" on the patient app login screen
  When I tap "Send code"
    And I enter the 6-digit code within 5 minutes
  Then I am signed in with role "patient"
    And my session is valid for 90 days
```

---

## Epic: E2 · Patient Registry & EMR Core

### S-EMR-1 · Fast patient registration (< 45 sec) · **P0** · 5 pts
**As a** receptionist
**I want** to register a patient with just phone + name + DOB
**So that** the queue moves fast during peak hours.

```gherkin
Scenario: New patient is registered in one screen
  Given I click "New patient" from the OPD queue
  When I type phone "9845123456"
    And the autocomplete shows no existing match
    And I enter name "Ramesh Kumar" and DOB "1978-06-12"
    And I submit
  Then a patient row is created in under 3 seconds
    And the patient is added to today's OPD queue with token #34
```

### S-EMR-2 · Patient timeline view · **P0** · 5 pts
**As a** doctor
**I want** to see a vertical timeline of encounters, labs, prescriptions
**So that** I have full context in one scroll.

```gherkin
Scenario: Timeline aggregates sources
  Given the patient has 3 OPD visits, 2 lab orders, 1 admission
  When I open the patient timeline
  Then events are sorted desc by date
    And each event is tagged with its source module
    And lab results show a chip "normal" / "abnormal"
```

### S-EMR-3 · Document vault with signed URLs · **P1** · 3 pts
**As a** patient
**I want** my uploaded scans to remain private
**So that** only my doctors can open them.

```gherkin
Scenario: Vault link expires
  Given I upload "MRI_report.pdf"
  When my doctor clicks the file from the timeline
  Then a signed URL is generated, valid for 5 minutes
    And a subsequent click re-generates a fresh URL
    And the audit log records doctor_id + patient_id + file_id + action "read"
```

---

## Epic: E3 · Appointments, OPD Queue & Tele-consult

### S-OPD-1 · Real-time live queue board · **P0** · 8 pts
**As a** hospital administrator
**I want** a wall-mounted screen showing OPD queues by doctor
**So that** patients see where they stand.

```gherkin
Scenario: Queue updates without refresh
  Given the board is open on the TV in the waiting area
  When the reception moves patient #32 to "in-consult"
  Then the board updates within 500 ms via Supabase Realtime
    And the remaining ETAs are recalculated
```

### S-OPD-2 · Slot self-booking (patient app) · **P1** · 5 pts
**As a** patient
**I want** to pick a doctor and time slot from the mobile app
**So that** I don't have to call the reception.

```gherkin
Scenario: Patient books a slot
  Given I open the Appointments tab in the Ayura Patient app
  When I select Dr. Rao and tap "Mon 10:30 AM"
    And I confirm the booking
  Then an appointment row is created in the DB linked to my patient_id
    And I receive a WhatsApp / SMS confirmation with the booking details
    And the slot is no longer visible to other patients
```

### S-OPD-3 · Tele-consultation with in-call Rx · **P1** · 13 pts
**As a** doctor
**I want** to write a prescription without leaving the video call
**So that** I can ship a Rx before the call ends.

```gherkin
Scenario: Rx issued mid-call
  Given I am in a tele-consult with patient P-1234
  When I open the Rx panel on the right rail
    And I add "Azithromycin 500mg · 3 days"
    And I click "Send"
  Then a PDF Rx is generated and pushed to the patient's app
    And an SMS fallback link is sent
    And the Rx is linked to this encounter
```

---

## Epic: E3b · Wearables & Remote Monitoring

### S-WEARABLE-1 · Wearable Data Ingest (Apple/Google) · **P1** · 8 pts
**As a** doctor managing a chronic patient
**I want** step count, heart rate, and SpO2 data from the patient's wearable
**So that** I can see trends between clinic visits.

```gherkin
Scenario: Apple Health data is ingested
  Given a patient has connected Apple Health in the Ayura Patient app
  When they complete a walk session
  Then their step count and heart rate are synced to the observations table
    And are visible in the patient timeline under "Wearables"
    And any SpO2 below 94% triggers an alert to the assigned doctor
```

---

## Epic: E4 · IPD, Bed Management & Nursing

### S-IPD-1 · Drag-and-drop bed allocation · **P0** · 8 pts
**As a** ward nurse
**I want** to drag a patient card onto a bed tile
**So that** admission completes without a multi-field form.

```gherkin
Scenario: Drop assigns bed
  Given the bed board shows 12 beds, 3 vacant
  When I drag patient card "P-5512" onto bed "W2-08"
  Then patient P-5512 has admission_id linked to bed W2-08
    And bed W2-08 status becomes "occupied"
    And the board reflects the change in realtime for all viewers
```

---

## Epic: E5 · Pharmacy Maintenance & Inventory

### S-PHARM-1 · Multi-store inventory sync & transfers · **P0** · 8 pts
**As a** head pharmacist
**I want** to track stock across the main warehouse and ward sub-stores
**So that** I know exactly where the drugs are located.

```gherkin
Scenario: Indent transfer between stores
  Given the main store has 500 strips of Paracetamol
  When the ICU sub-store issues an indent for 100 strips
    And the main store admin approves the transfer
  Then 100 strips are moved to "in-transit"
    And once acknowledged by the ICU, their stock increases by 100
```

### S-PHARM-2 · Auto-generated Supplier POs · **P0** · 5 pts
**As a** procurement officer
**I want** the system to draft Purchase Orders when stock hits the Re-Order Level (ROL)
**So that** we never run out of vital drugs.

```gherkin
Scenario: ROL triggers PO draft
  Given the ROL for Amoxicillin is 50 bottles
  When a dispense drops the master stock to 49
  Then an automated draft PO is created for the preferred supplier
    And the dashboard alerts me to review and send it
```

### S-PHARM-3 · Blind stock reconciliation · **P0** · 5 pts
**As an** auditor
**I want** to perform a blind physical count
**So that** software stock matches physical reality without revealing expected numbers.

```gherkin
Scenario: Physical limits adjustment
  Given the system expects 100 units of Saline
  When the clerk enters a blind physical count of 98
  Then a variance of -2 is logged
    And an adjustment entry is created requiring admin approval
```

### S-PHARM-4 · Barcode dispense-against-Rx · **P0** · 5 pts
**As a** pharmacist
**I want** to scan a drug barcode to auto-select the batch
**So that** I don't mis-pick FEFO.

```gherkin
Scenario: Barcode picks correct batch
  Given Rx R-998 has "Paracetamol 500mg × 10"
  When I scan barcode "8901012345678"
  Then the FEFO batch is auto-selected
    And the dispense quantity defaults to 10
    And stock is decremented on "Confirm"
```

---

## Epic: E6 · AI-Native LIMS

### S-LIMS-1 · Barcode sample tracking · **P0** · 5 pts
**As a** lab technician
**I want** each sample to carry a unique barcode from collection to result
**So that** I never mix samples.

```gherkin
Scenario: Barcode binds sample to order
  Given a lab order for patient P-1234 with tests [CBC, LFT]
  When I print + stick a barcode "S-88231" on the tube
    And I scan it at the receiving bench
  Then sample S-88231 is linked to order O-441
    And status advances "collected → received"
```

### S-LIMS-2 · HL7 analyzer result ingestion · **P0** · 13 pts
**As a** lab technician
**I want** analyzer results to flow in automatically
**So that** I don't retype numeric values.

```gherkin
Scenario: HL7 ORU message is parsed
  Given an HL7 ORU^R01 arrives on the TCP listener for analyzer "Sysmex-XN-1000"
  When the parser extracts OBX segments
  Then each OBX becomes a test_result row with value + unit + reference range
    And status advances "received → resulted"
```

---

## Epic: E7 · Billing & Claims

### S-BILL-1 · Charge auto-capture · **P0** · 5 pts
**As a** cashier
**I want** charges from OPD/IPD/LIMS/Pharmacy to appear on the bill without re-entry
**So that** billing is reconciled in one click.

```gherkin
Scenario: Charges aggregate per encounter
  Given patient P-1234 has: consult ₹500, CBC ₹350, paracetamol ₹20
  When I open the billing screen for encounter E-77
  Then all 3 line items are listed with source module tags
    And the total shows ₹870
    And GST is computed per item as per HSN/SAC config
```

### S-BILL-2 · Agentic Claim Drafter · **P0** · 8 pts
**As a** TPA claims agent
**I want** an LLM to pre-fill the insurance pre-auth form based on the chart
**So that** we eliminate copy-paste data entry errors.

```gherkin
Scenario: Draft claim matching TPA rules
  Given a discharge summary is finalized for a total knee replacement
  When I click "AI Draft Claim" for Apollo Munich Insurance
  Then the orchestrator maps the clinical text to the specific TPA schema
    And flags any missing clinical justification before submission
```

---

## Epic: E8 · Patient Mobile App & Concierge

### S-APP-1 · WhatsApp AI Concierge · **P1** · 8 pts
**As a** patient
**I want** to WhatsApp the hospital for information
**So that** I don't have to wait on hold.

```gherkin
Scenario: AI responds to lab inquiry
  Given my lab results were released 10 minutes ago
  When I text "Are my liver reports ready?" to the hospital WhatsApp
  Then the AI checks the LIMS via the backend API
    And replies "Yes, your LFT results were just finalized. You can download them here: [Signed URL]"
```

### S-APP-2 · Offline cached reports · **P0** · 5 pts
**As a** patient traveling on the train
**I want** to view last month's lab reports without signal
**So that** I can show them to any doctor.

```gherkin
Scenario: Reports survive airplane mode
  Given I opened my reports yesterday on Wi-Fi
  When I toggle airplane mode and reopen the app
  Then the last 10 reports render from local cache
    And a "Offline" chip is visible in the header
```

### S-APP-3 · Biometric lock on launch · **P0** · 3 pts
**As a** patient
**I want** Face ID before my health data opens
**So that** a stolen phone doesn't leak my diagnosis.

```gherkin
Scenario: App requires biometric
  Given biometric lock is enabled in settings
  When I foreground the app after 60 s
  Then the app shows a FaceID prompt
    And content is blurred behind it until auth succeeds
```

---

## Epic: E6b · LIMS QC & Backups

### S-LIMS-5 · Levey–Jennings QC Chart · **P1** · 5 pts
**As a** lab quality manager
**I want** to see a Levey–Jennings chart for each analyte
**So that** I can spot systematic drift before patient results are affected.

```gherkin
Scenario: QC chart flags a run
  Given QC material for "Glucose" was run 20 times over the past 10 days
  When I open the QC chart for Glucose on Analyser-1
  Then the L-J chart plots each QC value against +2SD/-2SD and +3SD/-3SD lines
    And any point outside ±2SD is marked orange
    And any point outside ±3SD is marked red and prevents result release
```

---

## Epic: E6c · Backup & Disaster Recovery

### S-BACKUP-1 · Nightly backup + quarterly restore drill · **P0** · 5 pts
**As a** hospital IT administrator
**I want** an automated nightly database backup with quarterly restore verification
**So that** patient data can be recovered from any failure within the RPO/RTO targets.

```gherkin
Scenario: Nightly backup succeeds
  Given the GitHub Actions workflow runs at 02:00 UTC
  When pg_dump completes via the Supabase DB URL
  Then the encrypted backup is uploaded to the S3-compatible bucket
    And a Slack/webhook notification confirms size and checksum

Scenario: Quarterly restore drill passes
  Given the last backup is downloaded to a test Postgres instance
  When the restore script runs
  Then all core tables (patients, encounters, audit_logs) exist with expected row counts
    And a summary report is committed to the repo as docs/restore-drill-YYYY-MM-DD.md
```

---

## Epic: E9 · Advanced Analytics Dashboards

### S-ANALYTICS-1 · Pharmacy & GST Analytics Dashboard · **P0** · 6 pts
**As a** hospital admin
**I want** a dashboard to see high-velocity drug consumption and GST outputs
**So that** I can analyze purchasing patterns.

```gherkin
Scenario: Drill-down by drug category
  Given today's pharmacy revenue is ₹1.4L
  When I click the "Antibiotics" slice on the Tremor chart
  Then I see a table of specific item transactions, sortable
    And a sparkline of last-30-day consumption velocity
```

---

## Epic: E10 · Compliance, Audit & Observability

### S-AUDIT-1 · Tamper-Evident Cryptographic Ledger · **P0** · 8 pts
**As a** compliance officer
**I want** every PHI read/write to be cryptographically hashed against the previous entry
**So that** any direct database tampering breaks the hash chain and triggers alarms.

```gherkin
Scenario: PHI read is logged and hashed
  Given doctor D-12 opens patient P-5512's record
  When the server responds 200
  Then an audit_log row is appended with action "read", actor, resource, tenant_id
    And the row's hash column is computed using HMAC-SHA256(payload + previous_hash)
    And the row cannot be updated or deleted natively

Scenario: Tampered ledger triggers alarm
  Given an attacker maliciously alters row #400 directly in Postgres
  When the hourly integrity checker runs
  Then row #401's hash validation fails
    And the system triggers a PagerDuty severity-1 alarm "Ledger Tampering Detected"
```

---

## Epic: E11 · Ambient Clinical Scribe

### S-AI-2 · Speech to SOAP note · **P0** · 13 pts
**As a** busy physician
**I want** an AI to listen to my consult and write the SOAP note
**So that** I maintain eye contact with the patient.

```gherkin
Scenario: Scribe drafts note from audio stream
  Given I click "Start Scribe" in the consultation UI
  When I speak with the patient for 5 minutes
    And I click "Stop Muxing"
  Then the AI Orchestrator processes the transcript
    And within 5 seconds, a structured SOAP note is populated
    And I can edit and sign it directly
```

---

## Epic: E4b · IPD Dashboard & Nursing

### S-IPD-2 · IP Admissions Dashboard (KPIs) · **P0** · 5 pts
**As a** hospital administrator
**I want** a real-time IP Dashboard showing admissions, discharges, bed occupancy, and average length of stay
**So that** I can monitor hospital capacity at a glance.

```gherkin
Scenario: Dashboard reflects live census
  Given 42 beds are occupied out of 60
  When I open the IP Dashboard
  Then I see: Admissions today (8), Discharges today (5), Bed Occupancy Rate (70%), Avg LOS (3.2 days)
    And each KPI card updates within 2 seconds via Supabase Realtime
    And a ward-wise breakdown table shows occupancy per ward
```

### S-IPD-3 · Nurse Station — vitals charting & task board · **P1** · 8 pts
**As a** ward nurse
**I want** to record patient vitals and manage nursing tasks from a single screen
**So that** I don't context-switch between paper and software.

```gherkin
Scenario: Vitals recorded and trending
  Given patient P-5512 is admitted in Bed W2-08
  When I enter BP=130/85, Pulse=88, Temp=37.4, SpO2=97
  Then the vitals are saved to the observations table
    And a sparkline chart shows the last 24h trend inline
    And any value outside reference range is highlighted red

Scenario: Nursing task completed
  Given a "Change IV line" task is assigned to P-5512 at 08:00
  When I tap "Done" on the task
  Then the task is marked complete with my user_id + timestamp
    And the task disappears from the active queue
```

---

## Epic: E2b · Discharge & MIS

### S-EMR-4 · LLM-assisted Discharge Summary · **P1** · 8 pts
**As a** doctor
**I want** the AI to draft a discharge summary from the encounter notes, labs, and medications
**So that** I spend 2 minutes reviewing instead of 20 minutes typing.

```gherkin
Scenario: Draft is generated from chart
  Given patient P-5512 has a completed admission with 3 encounter notes, 2 lab reports, 1 Rx
  When I click "Generate Discharge Summary"
  Then within 10 seconds the AI populates: Diagnosis, Treatment Given, Lab Highlights, Discharge Medications, Follow-up Instructions
    And I can edit each section inline before signing
    And the signed PDF is stored in the document vault and linked to the admission
```

### S-REPORT-1 · MIS Reports — daily census + revenue · **P1** · 5 pts
**As a** hospital administrator
**I want** a Management Information System report screen with daily census, revenue, and procedure counts
**So that** I can share operational data with the board.

```gherkin
Scenario: Daily census report renders
  Given today is 2026-08-01
  When I open MIS Reports → Daily Census
  Then I see: New Admissions, Discharges, OPD visits, Lab tests performed, Revenue collected — all for the selected date
    And I can export the report as a CSV or PDF
    And data is always scoped to my tenant_id
```

---

## Epic: E13 · SaaS Product Layer

### S-SAAS-1 · Marketing landing site · **P0** · 5 pts
**As a** hospital decision-maker
**I want** to land on a compelling public homepage for Ayura OS
**So that** I understand the product's value and can request a demo.

```gherkin
Scenario: Visitor converts to demo request
  Given I land on ayura.health (the root "/" route)
  When I scroll through Hero, Features, Modules grid, Testimonials, and Pricing teaser sections
    And I click "Request Demo"
  Then a lead capture form appears with: name, hospital, phone, email
    And on submit, the lead is saved and I see a "We'll be in touch within 24h" confirmation
```

### S-SAAS-2 · Pricing page + self-serve signup · **P1** · 3 pts
**As a** small clinic owner
**I want** to see pricing tiers and sign up without a sales call
**So that** I can start a 14-day trial immediately.

```gherkin
Scenario: Self-serve trial signup
  Given I am on /pricing
  When I select the "Clinic" plan and click "Start free trial"
    And I fill in hospital name, subdomain, admin email, password
  Then a new tenant is provisioned with the Clinic module set
    And I receive a welcome email with my login link
    And my trial expires after 14 days unless a payment method is added
```

### S-SAAS-3 · Super-admin portal — tenant management · **P1** · 8 pts
**As an** Ayura OS platform admin
**I want** a private super-admin portal to view and manage all hospital tenants
**So that** I can support customers and enforce platform policies.

```gherkin
Scenario: Super-admin views all tenants
  Given I log in to /super-admin with a platform_admin role
  When I open the Tenants list
  Then I see each tenant: name, plan, modules enabled, user count, last activity, trial/paid status
    And I can click into any tenant to impersonate their admin (read-only)
    And I can suspend or delete a tenant with an audit log entry
```

### S-SAAS-4 · Per-tenant usage metering · **P1** · 5 pts
**As an** Ayura OS platform admin
**I want** to track AI token consumption, storage usage, and API call counts per tenant per month
**So that** I can enforce plan limits and generate invoices.

```gherkin
Scenario: Usage is tracked per AI call
  Given tenant T-1 calls the Clinical Copilot endpoint
  When the response is returned
  Then a usage_events row is appended: tenant_id, event_type="ai_token", quantity=850, month="2026-08"
    And the tenant's monthly usage dashboard shows cumulative totals
    And when the tenant exceeds 80% of their plan limit, an automated warning email is sent
```

### S-SAAS-5 · White-label — custom domain + logo per tenant · **P1** · 5 pts
**As a** hospital administrator
**I want** my staff to access the system at emr.cityhospital.com with our logo
**So that** the product feels native to our brand.

```gherkin
Scenario: Custom domain resolves to tenant
  Given tenant "City Hospital" has configured CNAME emr.cityhospital.com → app.ayura.health
  When a staff member visits emr.cityhospital.com
  Then the app loads with City Hospital's logo, primary color, and favicon
    And the page title reads "City Hospital — powered by Ayura OS"
    And the Ayura branding is replaced by the tenant's brand (unless they are on Starter plan)
```

---

## Epic: E12 · Clinical Copilot

### S-AI-3 · Context-aware Q&A Copilot · **P0** · 8 pts
**As a** doctor
**I want** to ask questions about the patient's history in a right-rail chat
**So that** I don't have to scroll through 40 old PDFs.

```gherkin
Scenario: Copilot answers from chart history
  Given I am viewing patient P-1234
  When I type "Has this patient ever been put on Metformin?" in the Copilot pane
  Then the orchestrator vector-searches their past 5 years of notes
    And responds "Yes, started on Metformin 500mg by Dr. Rao in Oct 2024"
    And provides a clickable citation to the exact encounter
```
