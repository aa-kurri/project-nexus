"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  FileText,
  FlaskConical,
  Stethoscope,
  Pill,
  Image as ImageIcon,
  MailOpen,
  ShieldCheck,
  ClipboardSignature,
  File,
  Search,
  Upload,
  Link2,
  Trash2,
  Copy,
  Check,
  X,
  ExternalLink,
  Clock,
  AlertTriangle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  listDocuments,
  getSignedUrl,
  uploadDocument,
  deleteDocument,
  DOC_TYPE_LABELS,
  type PatientDocument,
  type DocType,
} from "@/app/(hospital)/emr/documents/actions";

// ── Doc type display config ───────────────────────────────────────────────────

type FilterType = DocType | "all";

const TYPE_ICON: Record<FilterType, React.ElementType> = {
  all:                File,
  lab_report:         FlaskConical,
  discharge_summary:  Stethoscope,
  prescription:       Pill,
  imaging:            ImageIcon,
  referral_letter:    MailOpen,
  insurance_form:     ShieldCheck,
  consent_form:       ClipboardSignature,
  other:              FileText,
};

const TYPE_COLOUR: Record<FilterType, string> = {
  all:                "text-muted",
  lab_report:         "text-teal-400",
  discharge_summary:  "text-blue-400",
  prescription:       "text-violet-400",
  imaging:            "text-amber-400",
  referral_letter:    "text-sky-400",
  insurance_form:     "text-emerald-400",
  consent_form:       "text-rose-400",
  other:              "text-muted",
};

const FILTERS: FilterType[] = [
  "all",
  "lab_report",
  "discharge_summary",
  "prescription",
  "imaging",
  "referral_letter",
  "insurance_form",
  "consent_form",
  "other",
];

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

function formatExpiry(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ── Backdrop overlay ──────────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    />
  );
}

// ── Signed-URL modal ──────────────────────────────────────────────────────────

interface SignedUrlModalProps {
  docName:   string;
  url:       string;
  expiresAt: string;
  onClose:   () => void;
}

function SignedUrlModal({ docName, url, expiresAt, onClose }: SignedUrlModalProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-[hsl(220_13%_9%)] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Link2 className="h-4 w-4 text-[#0F766E]" />
              <h2 className="text-sm font-semibold text-fg">Signed URL Generated</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted hover:bg-surface hover:text-fg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 p-5">
            {/* Doc name */}
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />
              <p className="text-sm font-medium text-fg leading-snug">{docName}</p>
            </div>

            {/* URL box */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Signed URL
              </p>
              <div className="flex gap-2">
                <code className="flex-1 overflow-hidden rounded-lg border border-border bg-[hsl(220_15%_6%)] px-3 py-2 font-mono text-[11px] text-fg whitespace-nowrap text-ellipsis">
                  {url}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-[#0F766E]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Expiry */}
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <p className="text-xs text-amber-300">
                Expires in{" "}
                <span className="font-semibold">{formatExpiry(expiresAt)}</span>
                {" · "}
                <span className="font-mono text-[11px]">
                  {new Date(expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 text-[11px] text-muted">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
              <span>
                This URL grants temporary, unauthenticated read access to the document. Do not
                share it in insecure channels or beyond its intended recipient.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#0F766E] hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in new tab
            </a>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Upload modal ──────────────────────────────────────────────────────────────

interface UploadModalProps {
  onUploaded: (doc: PatientDocument) => void;
  onClose:    () => void;
}

function UploadModal({ onUploaded, onClose }: UploadModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError]   = useState<string | null>(null);
  const [docType, setDocType] = useState<DocType>("other");
  const [fileName, setFileName] = useState("");
  const [docName, setDocName]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    if (!docName) setDocName(f.name.replace(/\.[^/.]+$/, ""));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd   = new FormData(form);

    startTransition(async () => {
      const result = await uploadDocument(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onUploaded(result.document);
      onClose();
    });
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-[hsl(220_13%_9%)] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Upload className="h-4 w-4 text-[#0F766E]" />
              <h2 className="text-sm font-semibold text-fg">Upload Document</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted hover:bg-surface hover:text-fg transition-colors"
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {/* Hidden patient selector — hardcoded to pat-001 for demo */}
            <input type="hidden" name="patientId" value="pat-001" />

            {/* File drop area */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-[hsl(220_15%_6%)] py-8 transition-colors hover:border-[#0F766E]/50 hover:bg-[#0F766E]/5"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-muted" />
              {fileName ? (
                <p className="text-sm font-medium text-fg">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm text-muted">Click to select a file</p>
                  <p className="text-[11px] text-muted">PDF, JPEG, PNG · max 50 MB</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                name="file"
                accept=".pdf,.jpg,.jpeg,.png,.dicom,.dcm"
                className="hidden"
                onChange={handleFileChange}
                required
              />
            </div>

            {/* Document name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Document Name
              </label>
              <Input
                name="name"
                placeholder="e.g. Discharge Summary — Acute Appendicitis"
                value={docName}
                onChange={e => setDocName(e.target.value)}
                required
              />
            </div>

            {/* Document type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Document Type
              </label>
              <div className="relative">
                <select
                  name="docType"
                  value={docType}
                  onChange={e => setDocType(e.target.value as DocType)}
                  className="w-full appearance-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {(Object.keys(DOC_TYPE_LABELS) as DocType[]).map(t => (
                    <option key={t} value={t}>
                      {DOC_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="bg-[#0F766E] hover:bg-[#0F766E]/90 text-white shadow-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Doc row ───────────────────────────────────────────────────────────────────

interface DocRowProps {
  doc:          PatientDocument;
  onSignedUrl:  (doc: PatientDocument) => void;
  onDelete:     (docId: string) => void;
  isDeleting:   boolean;
  isGenerating: boolean;
}

function DocRow({ doc, onSignedUrl, onDelete, isDeleting, isGenerating }: DocRowProps) {
  const Icon   = TYPE_ICON[doc.doc_type] ?? File;
  const colour = TYPE_COLOUR[doc.doc_type] ?? "text-muted";

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-transparent px-4 py-3 transition-colors hover:border-border hover:bg-surface/40">
      {/* Icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(220_15%_6%)] ${colour}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{doc.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="text-[11px] text-muted">{doc.patient_name}</span>
          <span className="text-[11px] text-muted">{formatDate(doc.created_at)}</span>
          <span className="text-[11px] text-muted">{formatBytes(doc.size_bytes)}</span>
          {doc.uploaded_by_name && (
            <span className="text-[11px] text-muted">by {doc.uploaded_by_name}</span>
          )}
        </div>
      </div>

      {/* Type badge */}
      <Badge
        variant="outline"
        className={`hidden shrink-0 border-border text-[10px] sm:inline-flex ${colour}`}
      >
        {DOC_TYPE_LABELS[doc.doc_type]}
      </Badge>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          title="Generate Signed URL"
          onClick={() => onSignedUrl(doc)}
          disabled={isGenerating}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-[#0F766E]/15 hover:text-[#0F766E] transition-colors disabled:opacity-40"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          title="Delete document"
          onClick={() => onDelete(doc.id)}
          disabled={isDeleting}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-red-500/15 hover:text-red-400 transition-colors disabled:opacity-40"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  colour = "text-fg",
}: {
  label:   string;
  value:   number;
  colour?: string;
}) {
  return (
    <Card className="p-4 flex flex-col items-center justify-center text-center gap-0.5">
      <span className={`text-2xl font-bold ${colour}`}>{value}</span>
      <span className="text-[10px] text-muted">{label}</span>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DocumentVault() {
  const [docs,       setDocs]       = useState<PatientDocument[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<FilterType>("all");
  const [search,     setSearch]     = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [signedUrlModal, setSignedUrlModal] = useState<{
    docName: string; url: string; expiresAt: string;
  } | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  // Load documents on mount
  useEffect(() => {
    listDocuments().then(result => {
      if (result.ok) setDocs(result.data);
      setLoading(false);
    });
  }, []);

  // Filtered + searched docs
  const visible = docs.filter(d => {
    if (filter !== "all" && d.doc_type !== filter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
        !d.patient_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats
  const totalByType = (type: DocType) => docs.filter(d => d.doc_type === type).length;

  async function handleSignedUrl(doc: PatientDocument) {
    setGeneratingId(doc.id);
    const result = await getSignedUrl(doc.id);
    setGeneratingId(null);
    if (result.ok) {
      setSignedUrlModal({ docName: doc.name, url: result.url, expiresAt: result.expiresAt });
    }
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId);
    setDeleteError(null);
    const result = await deleteDocument(docId);
    setDeletingId(null);
    if (result.ok) {
      setDocs(prev => prev.filter(d => d.id !== docId));
    } else {
      setDeleteError(result.error);
    }
  }

  function handleUploaded(doc: PatientDocument) {
    setDocs(prev => [doc, ...prev]);
  }

  return (
    <>
      <ScrollArea className="flex-1">
        <main className="space-y-5 p-6 pb-10">

          {/* ── Stats row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Documents" value={docs.length} colour="text-[#0F766E]" />
            <StatCard
              label="Lab Reports"
              value={totalByType("lab_report")}
              colour="text-teal-400"
            />
            <StatCard
              label="Discharge Summaries"
              value={totalByType("discharge_summary")}
              colour="text-blue-400"
            />
            <StatCard
              label="Imaging"
              value={totalByType("imaging")}
              colour="text-amber-400"
            />
          </div>

          {/* ── Filter + search + upload bar ────────────────────────────── */}
          <Card className="p-4 space-y-3">
            {/* Type filter tabs */}
            <ScrollArea className="pb-0.5">
              <div className="flex gap-2 min-w-max">
                {FILTERS.map(f => {
                  const FIcon  = TYPE_ICON[f];
                  const colour = TYPE_COLOUR[f];
                  const active = filter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={[
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                        active
                          ? "border-[#0F766E] bg-[#0F766E]/10 text-[#0F766E]"
                          : `border-border bg-transparent text-muted hover:border-[#0F766E]/40 hover:text-fg ${colour}`,
                      ].join(" ")}
                    >
                      <FIcon className="h-3 w-3" />
                      {f === "all" ? "All" : DOC_TYPE_LABELS[f as DocType]}
                      {f !== "all" && (
                        <span className="ml-0.5 rounded-full bg-border px-1.5 py-0.5 text-[9px] font-bold text-muted">
                          {totalByType(f as DocType)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Search + upload */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <Input
                  placeholder="Search by document name or patient…"
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                onClick={() => setShowUpload(true)}
                className="bg-[#0F766E] hover:bg-[#0F766E]/90 text-white shadow-none shrink-0"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </Button>
            </div>
          </Card>

          {/* ── Delete error ────────────────────────────────────────────── */}
          {deleteError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {deleteError}
              <button onClick={() => setDeleteError(null)} className="ml-auto">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── Document list ───────────────────────────────────────────── */}
          <Card className="p-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading documents…</span>
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <File className="h-8 w-8 text-muted/40" />
                <p className="text-sm text-muted">
                  {search || filter !== "all"
                    ? "No documents match the current filter."
                    : "No documents uploaded yet."}
                </p>
                {!search && filter === "all" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUpload(true)}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload the first document
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-0.5">
                {visible.map(doc => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    onSignedUrl={handleSignedUrl}
                    onDelete={handleDelete}
                    isGenerating={generatingId === doc.id}
                    isDeleting={deletingId === doc.id}
                  />
                ))}
              </div>
            )}

            {/* Footer count */}
            {!loading && visible.length > 0 && (
              <p className="mt-2 border-t border-border px-4 pt-3 pb-1 text-[11px] text-muted">
                Showing {visible.length} of {docs.length} document{docs.length !== 1 ? "s" : ""}
              </p>
            )}
          </Card>

        </main>
      </ScrollArea>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {signedUrlModal && (
        <SignedUrlModal
          docName={signedUrlModal.docName}
          url={signedUrlModal.url}
          expiresAt={signedUrlModal.expiresAt}
          onClose={() => setSignedUrlModal(null)}
        />
      )}

      {showUpload && (
        <UploadModal
          onUploaded={handleUploaded}
          onClose={() => setShowUpload(false)}
        />
      )}
    </>
  );
}
