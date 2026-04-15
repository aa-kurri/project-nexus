"use server";

import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DocType =
  | "lab_report"
  | "discharge_summary"
  | "prescription"
  | "imaging"
  | "referral_letter"
  | "insurance_form"
  | "consent_form"
  | "other";

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  lab_report:         "Lab Report",
  discharge_summary:  "Discharge Summary",
  prescription:       "Prescription",
  imaging:            "Imaging",
  referral_letter:    "Referral Letter",
  insurance_form:     "Insurance Form",
  consent_form:       "Consent Form",
  other:              "Other",
};

export interface PatientDocument {
  id:               string;
  patient_id:       string;
  patient_name:     string;
  encounter_id:     string | null;
  doc_type:         DocType;
  name:             string;
  storage_path:     string;
  mime_type:        string;
  size_bytes:       number;
  uploaded_by_name: string | null;
  created_at:       string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_DOCUMENTS: PatientDocument[] = [
  {
    id:               "doc-001",
    patient_id:       "pat-001",
    patient_name:     "Riya Mehta",
    encounter_id:     "enc-003",
    doc_type:         "discharge_summary",
    name:             "Discharge Summary — Acute Appendicitis",
    storage_path:     "patient-docs/pat-001/enc-003/discharge_summary.pdf",
    mime_type:        "application/pdf",
    size_bytes:       248_320,
    uploaded_by_name: "Dr. Kavita Rao",
    created_at:       "2026-03-10T14:00:00Z",
  },
  {
    id:               "doc-002",
    patient_id:       "pat-001",
    patient_name:     "Riya Mehta",
    encounter_id:     "enc-001",
    doc_type:         "lab_report",
    name:             "Comprehensive Metabolic Panel",
    storage_path:     "patient-docs/pat-001/enc-001/cmp_report.pdf",
    mime_type:        "application/pdf",
    size_bytes:       153_600,
    uploaded_by_name: "LIMS Auto",
    created_at:       "2026-04-14T10:30:00Z",
  },
  {
    id:               "doc-003",
    patient_id:       "pat-001",
    patient_name:     "Riya Mehta",
    encounter_id:     "enc-003",
    doc_type:         "imaging",
    name:             "Chest X-Ray (AP + Lateral)",
    storage_path:     "patient-docs/pat-001/enc-003/chest_xray.jpg",
    mime_type:        "image/jpeg",
    size_bytes:       2_097_152,
    uploaded_by_name: "Radiology Dept",
    created_at:       "2026-03-08T23:50:00Z",
  },
  {
    id:               "doc-004",
    patient_id:       "pat-002",
    patient_name:     "Arun Sharma",
    encounter_id:     "enc-010",
    doc_type:         "prescription",
    name:             "Prescription — Hypertension Management",
    storage_path:     "patient-docs/pat-002/enc-010/rx_htn.pdf",
    mime_type:        "application/pdf",
    size_bytes:       89_088,
    uploaded_by_name: "Dr. Priya Iyer",
    created_at:       "2026-04-12T09:20:00Z",
  },
  {
    id:               "doc-005",
    patient_id:       "pat-002",
    patient_name:     "Arun Sharma",
    encounter_id:     null,
    doc_type:         "consent_form",
    name:             "Surgical Consent — Knee Replacement",
    storage_path:     "patient-docs/pat-002/consent_knee_surgery.pdf",
    mime_type:        "application/pdf",
    size_bytes:       112_640,
    uploaded_by_name: "Admin",
    created_at:       "2026-04-11T11:45:00Z",
  },
  {
    id:               "doc-006",
    patient_id:       "pat-003",
    patient_name:     "Priya Patel",
    encounter_id:     "enc-020",
    doc_type:         "referral_letter",
    name:             "Referral to Cardiology — Dr. Mehta",
    storage_path:     "patient-docs/pat-003/enc-020/referral_cardiology.pdf",
    mime_type:        "application/pdf",
    size_bytes:       76_800,
    uploaded_by_name: "Dr. Suresh Kumar",
    created_at:       "2026-04-10T16:00:00Z",
  },
  {
    id:               "doc-007",
    patient_id:       "pat-003",
    patient_name:     "Priya Patel",
    encounter_id:     "enc-021",
    doc_type:         "discharge_summary",
    name:             "Discharge Summary — Type 2 DM Stabilisation",
    storage_path:     "patient-docs/pat-003/enc-021/discharge_dm.pdf",
    mime_type:        "application/pdf",
    size_bytes:       195_584,
    uploaded_by_name: "Dr. Suresh Kumar",
    created_at:       "2026-04-05T10:00:00Z",
  },
  {
    id:               "doc-008",
    patient_id:       "pat-002",
    patient_name:     "Arun Sharma",
    encounter_id:     "enc-011",
    doc_type:         "lab_report",
    name:             "HbA1c + Lipid Panel",
    storage_path:     "patient-docs/pat-002/enc-011/hba1c_lipid.pdf",
    mime_type:        "application/pdf",
    size_bytes:       134_144,
    uploaded_by_name: "LIMS Auto",
    created_at:       "2026-04-13T08:15:00Z",
  },
  {
    id:               "doc-009",
    patient_id:       "pat-001",
    patient_name:     "Riya Mehta",
    encounter_id:     null,
    doc_type:         "insurance_form",
    name:             "Pre-Auth Request — Star Health",
    storage_path:     "patient-docs/pat-001/insurance_preauth.pdf",
    mime_type:        "application/pdf",
    size_bytes:       64_512,
    uploaded_by_name: "Billing",
    created_at:       "2026-04-01T13:30:00Z",
  },
];

// ── listDocuments ─────────────────────────────────────────────────────────────

const ListSchema = z.object({
  patientId: z.string().uuid().optional(),
  docType:   z.string().optional(),
});

export async function listDocuments(
  input: z.infer<typeof ListSchema> = {}
): Promise<{ ok: true; data: PatientDocument[] } | { ok: false; error: string }> {
  const parsed = ListSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // TODO: replace with real Supabase query
  // const sb = createServerClient();
  // let q = sb
  //   .from("patient_documents")
  //   .select(`
  //     id, patient_id, encounter_id, doc_type, name,
  //     storage_path, mime_type, size_bytes, created_at,
  //     uploader:uploaded_by ( full_name ),
  //     patient:patient_id   ( full_name )
  //   `)
  //   .is("deleted_at", null)
  //   .order("created_at", { ascending: false });
  // if (parsed.data.patientId) q = q.eq("patient_id", parsed.data.patientId);
  // if (parsed.data.docType)   q = q.eq("doc_type", parsed.data.docType);
  // const { data, error } = await q;
  // if (error) return { ok: false, error: error.message };
  // return { ok: true, data };

  await new Promise(r => setTimeout(r, 300));

  let docs = [...MOCK_DOCUMENTS];
  if (parsed.data.patientId) {
    docs = docs.filter(d => d.patient_id === parsed.data.patientId);
  }
  if (parsed.data.docType) {
    docs = docs.filter(d => d.doc_type === parsed.data.docType);
  }

  return { ok: true, data: docs };
}

// ── getSignedUrl ──────────────────────────────────────────────────────────────

const SignedUrlSchema = z.object({
  documentId:    z.string().min(1),
  expirySeconds: z.number().int().min(60).max(86_400).default(3_600),
});

export async function getSignedUrl(
  documentId: string,
  expirySeconds = 3_600
): Promise<{ ok: true; url: string; expiresAt: string } | { ok: false; error: string }> {
  const parsed = SignedUrlSchema.safeParse({ documentId, expirySeconds });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const doc = MOCK_DOCUMENTS.find(d => d.id === parsed.data.documentId);
  if (!doc) return { ok: false, error: "Document not found" };

  // TODO: replace with real Supabase Storage signed-URL generation
  // const sb = createServerClient();
  // const { data, error } = await sb.storage
  //   .from("patient-docs")
  //   .createSignedUrl(doc.storage_path, parsed.data.expirySeconds);
  // if (error || !data?.signedUrl) return { ok: false, error: error?.message ?? "Failed to generate URL" };
  //
  // TODO: write to document_access_log
  // await sb.from("document_access_log").insert({
  //   tenant_id:            jwtTenant(),
  //   document_id:          doc.id,
  //   accessed_by:          currentUserId(),
  //   action:               "download",
  //   signed_url_expires_at: new Date(Date.now() + expirySeconds * 1000).toISOString(),
  // });
  //
  // return { ok: true, url: data.signedUrl, expiresAt: ... };

  await new Promise(r => setTimeout(r, 400));

  const mockToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const expiresAt = new Date(Date.now() + parsed.data.expirySeconds * 1000).toISOString();
  const url = `https://example.supabase.co/storage/v1/object/sign/patient-docs/${doc.storage_path}?token=${mockToken}&t=${Date.now()}`;

  return { ok: true, url, expiresAt };
}

// ── uploadDocument ────────────────────────────────────────────────────────────

const UploadSchema = z.object({
  patientId:   z.string().min(1),
  docType:     z.enum([
    "lab_report", "discharge_summary", "prescription", "imaging",
    "referral_letter", "insurance_form", "consent_form", "other",
  ]),
  name:        z.string().min(1).max(255),
  encounterId: z.string().optional(),
});

export async function uploadDocument(
  formData: FormData
): Promise<{ ok: true; document: PatientDocument } | { ok: false; error: string }> {
  const raw = {
    patientId:   formData.get("patientId"),
    docType:     formData.get("docType"),
    name:        formData.get("name"),
    encounterId: formData.get("encounterId") ?? undefined,
  };

  const parsed = UploadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "A file must be attached" };
  }
  if (file.size > 50 * 1024 * 1024) {
    return { ok: false, error: "File must be ≤ 50 MB" };
  }

  // TODO: replace with real Supabase Storage upload + metadata insert
  // const sb     = createServerClient();
  // const tenant = jwtTenant();
  // const path   = `${tenant}/${parsed.data.patientId}/${Date.now()}_${file.name}`;
  //
  // const { error: storageError } = await sb.storage
  //   .from("patient-docs")
  //   .upload(path, file, { contentType: file.type, upsert: false });
  // if (storageError) return { ok: false, error: storageError.message };
  //
  // const { data: doc, error: dbError } = await sb
  //   .from("patient_documents")
  //   .insert({
  //     tenant_id:    tenant,
  //     patient_id:   parsed.data.patientId,
  //     encounter_id: parsed.data.encounterId ?? null,
  //     doc_type:     parsed.data.docType,
  //     name:         parsed.data.name,
  //     storage_path: path,
  //     mime_type:    file.type || "application/octet-stream",
  //     size_bytes:   file.size,
  //   })
  //   .select()
  //   .single();
  // if (dbError) return { ok: false, error: dbError.message };
  //
  // await sb.from("document_access_log").insert({
  //   tenant_id: tenant, document_id: doc.id, action: "upload",
  // });
  // return { ok: true, document: doc };

  await new Promise(r => setTimeout(r, 800));

  const newDoc: PatientDocument = {
    id:               `doc-${Date.now()}`,
    patient_id:       parsed.data.patientId,
    patient_name:     "Unknown Patient",
    encounter_id:     parsed.data.encounterId ?? null,
    doc_type:         parsed.data.docType,
    name:             parsed.data.name,
    storage_path:     `patient-docs/${parsed.data.patientId}/${Date.now()}_${file.name}`,
    mime_type:        file.type || "application/octet-stream",
    size_bytes:       file.size,
    uploaded_by_name: "Current User",
    created_at:       new Date().toISOString(),
  };

  return { ok: true, document: newDoc };
}

// ── deleteDocument ────────────────────────────────────────────────────────────

export async function deleteDocument(
  documentId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!documentId) return { ok: false, error: "documentId is required" };

  // TODO: replace with real Supabase soft-delete
  // const sb = createServerClient();
  // const { error } = await sb
  //   .from("patient_documents")
  //   .update({ deleted_at: new Date().toISOString() })
  //   .eq("id", documentId);
  // if (error) return { ok: false, error: error.message };
  //
  // await sb.from("document_access_log").insert({
  //   tenant_id: jwtTenant(), document_id: documentId, action: "delete",
  // });

  await new Promise(r => setTimeout(r, 300));
  return { ok: true };
}
