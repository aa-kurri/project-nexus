import { supabaseServer } from "@/lib/supabase/server";
import { CalendarDays, User, Stethoscope } from "lucide-react";

const SURFACE = "hsl(220,13%,9%)";
const BORDER  = "#1e2332";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function RecordsPage() {
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="text-red-400">Not authenticated.</p>;

  // Fetch patient row to get patient.id (profiles.id == auth.uid, but patients.id may differ)
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const patientId = patient?.id ?? user.id;

  const { data: encounters, error } = await supabase
    .from("encounters")
    .select(`
      id, class, status, reason, started_at,
      profiles:practitioner_id ( full_name )
    `)
    .eq("patient_id", patientId)
    .order("started_at", { ascending: false });

  if (error) return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
      {error.message}
    </div>
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Medical Records</h1>
      <p className="mb-6 text-sm text-gray-400">Your visit history sorted by most recent</p>

      {(!encounters || encounters.length === 0) && (
        <p className="text-center text-gray-500 mt-20">No encounters on record yet.</p>
      )}

      <ol className="relative border-l border-[#1e2332] space-y-6 pl-8">
        {(encounters ?? []).map((enc: any) => (
          <li key={enc.id} className="relative">
            {/* Timeline dot */}
            <span className="absolute -left-[21px] top-3 h-3 w-3 rounded-full bg-teal-600 ring-4 ring-[hsl(220,15%,6%)]" />

            <div
              className="rounded-2xl border p-5"
              style={{ background: SURFACE, borderColor: BORDER }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: "#0F766E30", color: "#0F766E" }}>
                      {enc.class ?? "Visit"}
                    </span>
                    <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "#1e2332", color: "#9ca3af" }}>
                      {enc.status}
                    </span>
                  </div>
                  <p className="font-semibold text-white text-sm mt-1">
                    {enc.reason ?? "Consultation"}
                  </p>
                  {enc.profiles?.full_name && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <User size={11} />
                      Dr. {enc.profiles.full_name}
                    </p>
                  )}
                </div>
                <p className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                  <CalendarDays size={12} />
                  {fmtDate(enc.started_at)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
