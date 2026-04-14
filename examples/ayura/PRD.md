# Ayura OS — Product Requirements Document

> **Rebuild target:** Legacy HMS/LIMS suite (formerly Vaidyo)
> **Modern stack (target):** Next.js 14 App Router · Supabase (Postgres + Auth + RLS + Realtime) · Shadcn/ui + Tailwind · Aceternity UI motion · Expo Router (React Native) · Resend · Razorpay

## 1. Vision

Ayura OS is the intelligent operating system for mid-tier Indian hospitals and diagnostic labs. Paste your hospital into Ayura and, within 30 minutes, every department — reception, OPD, IPD, pharmacy maintenance, analytics, lab, billing — runs on a single real-time database with a patient-facing mobile app, ABDM-compliant health records, and AI-native automation.

It replaces the legacy on-prem stack with a **reactive, multi-tenant, mobile-first, and AI-assisted** platform.

## 2. Personas

### Dr. Ananya Rao — Clinical Director
- **Goals:** Spend zero time typing notes, real-time ward occupancy visibility, low-friction prescription writing.
- **Pain today:** Separate modules don't share state; discharge summaries take 20+ min; manual charting.

### Rahul Menon — Hospital Administrator
- **Goals:** Revenue dashboards, automated supplier POs, bed utilization, insurance claim turnaround.
- **Pain today:** Exports to Excel for every report; manual GST purchase returns; no audit trail for billing edits.

### Priya Iyer — Lab Manager (LIMS)
- **Goals:** Barcode-driven sample tracking, auto-result delivery, predictive QC.
- **Pain today:** Manual result entry, no analyzer integration (HL7), reacting to Westgard rule failures after the fact.

### Manoj Das — Chief Pharmacist & Reception
- **Goals:** Perfect stock reconciliation, 30-second patient registration.
- **Pain today:** Multiple physical sub-stores are out of sync; indenting takes hours; insurance pre-auth is phone-based.

### Anita Sharma — Patient
- **Goals:** Book appointments, view lab reports, download prescriptions, pay online, WhatsApp updates.
- **Pain today:** No portal; has to WhatsApp staff for reports manually; no reminders.

## 3. Success Metrics (North Stars)

| KPI | Baseline | Target (12 months) |
|---|---|---|
| Avg. patient registration time | ~3 min | < 45 sec |
| Note-taking time per consult | 4 mins | 0 mins (Ambient Scribe) |
| Pharmacy variance | > 5% | < 0.5% |
| Monthly active hospitals | 1× (current) | 25× |
| Patient-app 30-day retention | n/a | > 35% |
| Claim rejection rate | > 18% | < 3% (Agentic Drafter) |
| OPD wait-time visibility | 0% of hospitals | 80% of hospitals with live queue |
| Lab-result TAT (in-house) | ~6 hrs | < 90 min (auto-dispatch) |

## 4. Epics

### E0. ABDM Foundation · `abdm-core` (NEW)
The interoperability bus that all modules sit on.
- M2/M3 compliance baked into the database schema (FHIR R4).
- HPR (Healthcare Professional) link for e-signatures.
- ABHA ID creation and verification at registration.

### E1. Identity, Tenancy & RBAC · `auth-rbac`
Multi-tenant foundation operating on Zero-Trust principles. Each hospital is a strictly isolated tenant.
- **WebAuthn / FIDO2:** Mandatory hardware security keys (YubiKey/Biometrics) for all staff roles. OTP relegated to patient access only.
- Supabase Auth with strictly short-lived JWTs.
- Role-based nav, server-enforced permissions in route handlers.

### E2. Patient Registry & EMR Core · `patient-emr`
Single-source-of-truth patient record, demographics, allergies, vitals, problem list, encounters.
- Dedup on phone + Aadhaar-hash / ABHA.
- Timeline view (Shadcn timeline + Framer Motion).
- Document vault (Supabase Storage) with signed URLs.

### E3. Appointments, OPD Queue & Tele-consult · `opd`
Scheduling, real-time queue board, video consult.
- Supabase Realtime for live queue updates.
- Doctor's daily calendar with slot management.
- WebRTC tele-consult (Daily.co SDK) with in-call Rx writing.
- Reminder notifications (Resend email + Twilio SMS + WhatsApp Cloud API).

### E4. IPD, Bed Management & Nursing · `ipd`
Admission, ward/bed allocation, nursing notes, vital charting, discharge summary.
- Drag-drop bed board (Shadcn Kanban pattern).
- Nursing eSign on hourly vitals.
- AI-assisted discharge summary draft from encounter history.

### E5. Pharmacy Maintenance & Inventory · `pharmacy` (UPGRADED)
Comprehensive stock, supplier, and GST management for main/sub-stores.
- **Multi-store:** Main warehouse → ICU sub-store transfers & indents.
- **Procurement & GST:** Generate POs automatically on ROL, track supplier returns matching GST workflows seen in legacy.
- **Reconciliation:** Blind physical audits vs digital software stocks.
- **Dispensing:** Barcode-driven FEFO dispense-against-Rx.

### E6. AI-Native LIMS · `lims` (UPGRADED)
Lab order entry, sample barcode tracking, analyzer integration, validation.
- **AI Anomaly Detection:** Flags bizarre result combinations.
- **Analyzer Integration:** HL7 streaming ingestion for Mindray/Sysmex/Roche.
- Levey–Jennings QC charts per test with Westgard rule alerts.
- Auto-dispatch signed reports to patient app & WhatsApp.

### E7. Billing, Insurance & Claims · `billing` (UPGRADED)
Charge capture from every module, package billing, insurance cashless claims.
- **Agentic Claim Drafter:** Pass the chart to an LLM to auto-draft the TPA pre-auth form.
- Rules engine for payer-specific validations.
- Razorpay payments integration.
- GST computed per item as per HSN/SAC config.

### E8. Patient Mobile App & Concierge · `patient-app` (UPGRADED)
Expo React Native app + WhatsApp.
- **WhatsApp AI Concierge:** Patient texts the hospital WhatsApp; LLM answers questions using their chart context.
- Offline cache of reports (WatermelonDB).
- Biometric lock, push notifications, tele-consult self-booking.

### E9. Advanced Analytics Dashboards · `analytics` (UPGRADED)
Hospital KPIs + channel partner portal + revenue tracking.
- Tremor charts for real-time revenue over a read-replica.
- Drill-down tables for Pharmacy consumption velocity and drug stock-outs.
- Partner referral tracking with attribution.

### E10. Compliance, Cryptography & Audit · `compliance` (SECURITY MAXIMIZED)
Military-grade PHI protection tracking every byte of data access.
- **Envelope Encryption & BYOK:** Application-layer AES-GCM-256 before data hits Postgres. Tenants bring their own KMS keys. Revoking a key instantly crypto-shreds all tenant PHI.
- **Tamper-Evident Ledger:** Merkle-tree cryptographic hashing for sequential logs. DB tampering breaks the hash chain and triggers alarms.
- Nightly encrypted Postgres backup to S3 Mumbai.

### E11. Ambient Clinical Scribe · `ai-scribe` (NEW)
- Listens to the doctor-patient conversation via mic into Whisper.
- Automatically generates structured SOAP notes using Claude/GPT.

### E12. Clinical Copilot · `ai-copilot` (NEW)
- Right-rail chat assistant for doctors.
- Can answer "What was the patient's HbA1c last year?" by vector-searching the EMR context (pgvector).

### E13. Wearable Data Ingest · `wearable-iot` (NEW)
- Apple Health / Google Fit sync directly into the EMR timeline.

## 5. Non-Functional Requirements
- **Security:** BYOK (Bring Your Own Key) Tenant Encryption, AES-GCM-256 Application-layer E2EE, mTLS for all hardware endpoints. 
- **AI Privacy:** Strict PHI sanitization/de-identification via locally hosted models before ANY payload is transmitted to an external LLM.
- **Performance:** p95 < 300 ms for any single-tenant query; TTFB < 200ms.
- **AI Cost Control:** Aggressive prompt caching in `packages/ai-orchestrator` to manage LLM API burn.
- **Availability:** 99.9% monthly SLO; active-active read replicas.
- **Offline:** Patient app reads cached reports without network; staff IPD vitals queue-and-sync.
- **Regulatory:** DPDP Act 2023, ABDM M2 compliance, FHIR R4 exports.

## 6. Design System
- **Primary:** Ayura Teal `#0F766E` · Ink `#020617` · Surface `#F8FAFC`
- **Typography:** **Outfit** display + **Inter** body.
- **Motion:** Glassmorphism + subtle micro-interactions to feel like a premium OS (Aceternity `CardHoverEffect`, Framer layout transitions).

## 7. Out of Scope (v1)
- Radiology PACS integration (DICOM is its own beast).
- Genomics / research modules.
- Multi-country support beyond India.
