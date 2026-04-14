# Ayura OS — Target Architecture

## Why rebuild

The legacy infrastructure ([vaidyo.in](https://www.vaidyo.in)) uses a Create-React-App SPA fronted by Apache Tomcat, suffering from client-side 404s, absent mobile apps, and outdated architectures. Ayura OS moves this to an interoperable, AI-native edge stack.

## Target

```mermaid
flowchart LR
  subgraph Edge
    CDN[Cloudflare CDN] --> Next[Next.js 14 App Router on Vercel]
  end

  subgraph Web[apps/web]
    Next --> RSC[React Server Components]
    Next --> SA[Server Actions]
    Next --> RH[Route Handlers /api/*]
  end

  subgraph Mobile[apps/mobile — Expo]
    Expo --> NW[NativeWind + RN Reusables]
  end

  subgraph Data[Supabase]
    PG[(Postgres + RLS + Vector)]
    AUTH[Auth / OTP / OAuth]
    RT[Realtime channels]
    EF[Edge Functions]
    STO[Storage]
  end

  subgraph Integrations
    HL7[HL7 / SiLA 2 VPS]
    ABDM[FHIR R4 Interchange Bus]
    WABA[WhatsApp Cloud API]
    RZP[Razorpay]
  end

  subgraph AI Orchestrator Layer
    Scribe[Ambient Scribe Whisper]
    Copilot[Vector RAG Copilot]
    Claims[Agentic Claim Drafter]
  end

  Web --> RSC
  RSC --> PG
  RH  --> EF
  Expo --> PG
  HL7 --> EF
  ABDM --> EF
  EF --> WABA
  SA --> AI Orchestrator Layer
  AI Orchestrator Layer --> PG
```

## AI Orchestration Surface

The platform incorporates 7 major LLM/AI touchpoints:

1. **Ambient AI Scribe:** Streaming mic audio → Whisper → Opus for SOAP note extraction.
2. **Clinical Copilot:** pgvector embeddings of chart history → RAG pipeline.
3. **Agentic Claim Drafter:** LLM maps clinical context to 100+ TPA formats to pre-fill claims.
4. **WhatsApp Assistant:** Semantic search answering patient inquiries.
5. **AI LIMS Anomaly Detection:** Westgard rules supplemented by predictive flag scoring.
6. **AI Discharge Summary:** Encounter log aggregation.

> **AI Sanitization Pipeline:** Before any PHI is routed to external LLMs, it passes through a locally hosted Presidio-based sanitization layer that strips ABHA IDs, patient names, and exact addresses computationally.

## Defense-in-Depth Security

Ayura OS guarantees military-grade PHI protection:
- **Envelope Encryption & BYOK:** Application-layer AES-GCM-256 encrypts all PHI before it hits Postgres. Hospital tenants manage their own Master Keys via an external KMS (AWS/GCP).
- **Zero-Trust Access:** Staff logins require WebAuthn/FIDO2 hardware keys.
- **mTLS Network:** All edge connections (specifically HL7 ingest from lab machines) mandate Mutual TLS to prevent local-network man-in-the-middle attacks.
- **Tamper-Evident Auditing:** The `audit_log` uses Merkle-tree cryptography. Each log hashes the payload plus the previous log's signature. Direct DB modification will break the hash chain and fail integrity checks.

## Multi-tenant model & RLS

Every PHI/Inventory table has `tenant_id uuid NOT NULL`. RLS policies strictly isolate hospital data:

```sql
create policy tenant_isolation on pharmacy_stock
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

## Analytics & Pharmacy Maintenance

To handle large-scale pharmacy reconciliations and revenue dashboards:
- Write paths (stock dispensing) hit Postgres directly with row-level locks to prevent double-spending.
- Analytics/dashboards (Tremor) read from a replica or materialized views updated via pg_cron.
