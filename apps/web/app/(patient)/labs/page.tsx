import { supabaseServer } from "@/lib/supabase/server";
import { FlaskConical, Download, AlertTriangle, CheckCircle2 } from "lucide-react";

const SURFACE = "hsl(220,13%,9%)";
const BORDER  = "#1e2332";
const PRIMARY = "#0F766E";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Heuristic: flag any result whose display contains words like "high","low","abnormal","positive"
function isAbnormal(display: string | null): boolean {
  if (!display) return false;
  return /\b(high|low|abnormal|positive|critical|elevated|decreased)\b/i.test(display);
}

async function getSignedUrl(supabase: ReturnType<typeof supabaseServer>, path: string) {
  if (!path) return null;
  const { data } = await supabase.storage
    .from("lab-reports")
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export default async function LabsPage() {
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="text-red-400">Not authenticated.</p>;

  const { data: reports, error } = await supabase
    .from("diagnostic_reports")
    .select("id, code, display, status, issued_at, storage_path")
    .eq("patient_id", user.id)
    .order("issued_at", { ascending: false });

  if (error) return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
      {error.message}
    </div>
  );

  // Pre-sign URLs for reports that have a storage_path
  const enriched = await Promise.all(
    (reports ?? []).map(async (r: any) => ({
      ...r,
      signedUrl: r.storage_path ? await getSignedUrl(supabase, r.storage_path) : null,
    }))
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Lab Reports</h1>
      <p className="mb-6 text-sm text-gray-400">
        {enriched.length} report{enriched.length !== 1 ? "s" : ""} on record ·
        <span className="text-red-400 ml-1">{enriched.filter((r) => isAbnormal(r.display)).length} abnormal</span>
      </p>

      {enriched.length === 0 && (
        <p className="text-center text-gray-500 mt-20">No lab reports found.</p>
      )}

      <div className="space-y-3">
        {enriched.map((r: any) => {
          const abnormal = isAbnormal(r.display);
          const color    = abnormal ? "#ef4444" : PRIMARY;
          return (
            <div
              key={r.id}
              className="rounded-2xl border p-5"
              style={{
                background:   SURFACE,
                borderColor:  abnormal ? "#ef444440" : BORDER,
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${color}20` }}>
                  {abnormal
                    ? <AlertTriangle size={18} color={color} />
                    : <FlaskConical  size={18} color={color} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white text-sm">{r.code ?? "—"}</span>
                    {abnormal && (
                      <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: "#ef444420", color: "#ef4444" }}>
                        Abnormal
                      </span>
                    )}
                    <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "#1e2332", color: "#9ca3af" }}>
                      {r.status}
                    </span>
                  </div>
                  {r.display && (
                    <p className="mt-1 text-sm" style={{ color: abnormal ? "#fca5a5" : "#d1d5db" }}>
                      {r.display}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{fmtDate(r.issued_at)}</p>
                </div>

                {r.signedUrl && (
                  <a
                    href={r.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5
                               text-xs font-semibold text-white transition hover:opacity-80"
                    style={{ background: PRIMARY }}
                  >
                    <Download size={13} /> Download
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
