"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { TopBar } from "@/components/hospital/TopBar";
import {
  FileText, Download, Trash2, Upload, Search,
  FlaskConical, ClipboardList, Pill, Image,
  FileCheck, Shield, FileQuestion, X, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type DocType =
  | "lab_report" | "discharge_summary" | "prescription"
  | "imaging" | "referral_letter" | "insurance_form"
  | "consent_form" | "other";

interface PatientDoc {
  id: string;
  patient_id: string;
  doc_type: DocType;
  name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  patients: { full_name: string; mrn: string } | null;
  uploaded_by_profile: { full_name: string } | null;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<DocType, { label: string; color: string; Icon: React.ElementType }> = {
  lab_report:        { label: "Lab Report",        color: "#3b82f6", Icon: FlaskConical  },
  discharge_summary: { label: "Discharge Summary", color: "#0F766E", Icon: ClipboardList },
  prescription:      { label: "Prescription",      color: "#6366f1", Icon: Pill          },
  imaging:           { label: "Imaging",            color: "#f59e0b", Icon: Image         },
  referral_letter:   { label: "Referral Letter",   color: "#06b6d4", Icon: FileText      },
  insurance_form:    { label: "Insurance Form",    color: "#8b5cf6", Icon: Shield        },
  consent_form:      { label: "Consent Form",      color: "#ec4899", Icon: FileCheck     },
  other:             { label: "Other",              color: "#6b7280", Icon: FileQuestion  },
};

const DOC_TYPES = Object.keys(TYPE_CFG) as DocType[];

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CaseFilesPage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<PatientDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<DocType | "all">("all");
  const [uploading, setUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<DocType>("other");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("patient_documents")
      .select(`
        id, patient_id, doc_type, name, storage_path,
        mime_type, size_bytes, created_at,
        patients ( full_name, mrn ),
        uploaded_by_profile:profiles!uploaded_by ( full_name )
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100);

    setDocs((data ?? []) as PatientDoc[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const getSignedUrl = async (path: string, docId: string) => {
    if (signedUrls[docId]) {
      window.open(signedUrls[docId], "_blank");
      return;
    }
    const { data } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(path, 300); // 5 min TTL
    if (data?.signedUrl) {
      setSignedUrls((prev) => ({ ...prev, [docId]: data.signedUrl }));
      window.open(data.signedUrl, "_blank");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: tenantData } = await supabase
        .from("tenants").select("id").limit(1).single();
      const { data: sessionData } = await supabase.auth.getUser();

      if (!tenantData || !sessionData?.user) {
        setUploading(false);
        return;
      }

      // Get first patient for demo
      const { data: patientData } = await supabase
        .from("patients").select("id").limit(1).single();
      if (!patientData) { setUploading(false); return; }

      const ext = file.name.split(".").pop();
      const path = `${tenantData.id}/${patientData.id}/${Date.now()}.${ext}`;

      const { error: storageErr } = await supabase.storage
        .from("patient-documents")
        .upload(path, file, { contentType: file.type });

      if (storageErr) throw storageErr;

      await supabase.from("patient_documents").insert({
        tenant_id: tenantData.id,
        patient_id: patientData.id,
        doc_type: uploadDocType,
        name: file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: sessionData.user.id,
      });

      setShowUpload(false);
      await fetchDocs();
    } catch {
      // storage bucket may not be created yet in dev — silently fail
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (doc: PatientDoc) => {
    setDeletingId(doc.id);
    await supabase
      .from("patient_documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", doc.id);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    setDeletingId(null);
  };

  // Filtered view
  const filtered = docs.filter((d) => {
    const matchType = filterType === "all" || d.doc_type === filterType;
    const matchSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.patients?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      d.patients?.mrn.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <>
      <TopBar
        title="Document Vault"
        action={{ label: "Upload Document", href: "#" }}
      />
      <main className="flex-1 p-6 space-y-5">

        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, filename…"
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-[#0F766E]/50"
            />
          </div>

          {/* Type filter chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                filterType === "all"
                  ? "bg-[#0F766E]/20 border-[#0F766E]/50 text-[#0F766E]"
                  : "bg-surface border-border text-muted hover:text-fg"
              )}
            >
              All
            </button>
            {DOC_TYPES.map((t) => {
              const cfg = TYPE_CFG[t];
              const active = filterType === t;
              return (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                    active
                      ? "border-opacity-50 text-white"
                      : "bg-surface border-border text-muted hover:text-fg"
                  )}
                  style={active ? { backgroundColor: `${cfg.color}25`, borderColor: `${cfg.color}60`, color: cfg.color } : {}}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowUpload((s) => !s)}
            className="ml-auto flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d6560] transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </button>
        </div>

        {/* ── Upload panel ─────────────────────────────────────────────── */}
        {showUpload && (
          <div className="rounded-xl border border-[#0F766E]/30 bg-[#0F766E]/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg">Upload Document</h3>
              <button onClick={() => setShowUpload(false)}>
                <X className="h-4 w-4 text-muted hover:text-fg" />
              </button>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted mb-1.5">
                  Document Type
                </label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value as DocType)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:border-[#0F766E]/50"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_CFG[t].label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted mb-1.5">
                  File
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  onChange={handleUpload}
                  disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                  className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-[#0F766E]/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#0F766E] hover:file:bg-[#0F766E]/30 cursor-pointer disabled:opacity-50"
                />
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-[#0F766E]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Stats bar ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4">
          {DOC_TYPES.map((t) => {
            const count = docs.filter((d) => d.doc_type === t).length;
            if (count === 0) return null;
            const cfg = TYPE_CFG[t];
            return (
              <button
                key={t}
                onClick={() => setFilterType(t === filterType ? "all" : t)}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs transition-colors hover:border-[#0F766E]/30"
              >
                <cfg.Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                <span className="text-muted">{cfg.label}</span>
                <span className="font-bold" style={{ color: cfg.color }}>{count}</span>
              </button>
            );
          })}
          <span className="ml-auto self-center text-xs text-muted">
            {filtered.length} of {docs.length} files
          </span>
        </div>

        {/* ── Document list ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading documents…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-50">
            <FileText className="h-12 w-12 text-muted mb-4" />
            <p className="text-sm font-semibold text-fg">No documents found</p>
            <p className="text-xs text-muted mt-1">
              {search || filterType !== "all"
                ? "Try a different filter or search term"
                : "Upload the first document using the button above"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-white/[0.03] text-[10px] uppercase tracking-widest text-muted">
                  <th className="px-5 py-3 text-left font-semibold">Document</th>
                  <th className="px-4 py-3 text-left font-semibold">Patient</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-right font-semibold">Size</th>
                  <th className="px-4 py-3 text-right font-semibold">Uploaded</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => {
                  const cfg = TYPE_CFG[doc.doc_type] ?? TYPE_CFG.other;
                  return (
                    <tr
                      key={doc.id}
                      className={cn(
                        "border-b border-border transition-colors hover:bg-white/[0.02]",
                        i % 2 !== 0 && "bg-white/[0.015]"
                      )}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${cfg.color}20` }}
                          >
                            <cfg.Icon className="h-4 w-4" style={{ color: cfg.color }} />
                          </div>
                          <span className="font-medium text-fg truncate max-w-[200px]" title={doc.name}>
                            {doc.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {doc.patients ? (
                          <div>
                            <p className="text-fg font-medium">{doc.patients.full_name}</p>
                            <p className="text-[11px] text-muted">{doc.patients.mrn}</p>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted tabular-nums">
                        {fmtSize(doc.size_bytes)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted tabular-nums">
                        {new Date(doc.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => getSignedUrl(doc.storage_path, doc.id)}
                            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-[#0F766E] border border-[#0F766E]/30 hover:bg-[#0F766E]/10 transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            disabled={deletingId === doc.id}
                            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                          >
                            {deletingId === doc.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Trash2 className="h-3 w-3" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
