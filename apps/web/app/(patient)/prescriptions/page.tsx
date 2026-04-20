"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Pill, Printer, User, CalendarDays } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SURFACE = "hsl(220,13%,9%)";
const BORDER  = "#1e2332";
const PRIMARY = "#0F766E";

interface Rx {
  id:          string;
  drug_name:   string;
  dose:        string;
  frequency:   string;
  duration_days: number | null;
  status:      string;
  doctor:      string | null;
}

const STATUS_COLOR: Record<string, string> = {
  active:  "#059669",
  stopped: "#6b7280",
  on_hold: "#f59e0b",
};

export default function PrescriptionsPage() {
  const [rxList,   setRxList]  = useState<Rx[]>([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not authenticated."); setLoading(false); return; }

      const { data, error: qErr } = await supabase
        .from("medication_requests")
        .select(`
          id, drug_name, dose, frequency, duration_days, status,
          profiles:practitioner_id ( full_name )
        `)
        .eq("patient_id", user.id)
        .order("status")
        .limit(100);

      if (qErr) { setError(qErr.message); setLoading(false); return; }

      setRxList(
        (data ?? []).map((r: any) => ({
          id:           r.id,
          drug_name:    r.drug_name,
          dose:         r.dose ?? "—",
          frequency:    r.frequency ?? "—",
          duration_days:r.duration_days,
          status:       r.status ?? "active",
          doctor:       r.profiles?.full_name ?? null,
        }))
      );
      setLoading(false);
    })();
  }, []);

  function handlePrint() {
    window.print();
  }

  if (loading) return <p className="text-gray-400 text-center mt-20">Loading prescriptions…</p>;
  if (error)   return <p className="text-red-400 text-center mt-20">{error}</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prescriptions</h1>
          <p className="text-sm text-gray-400 mt-1">Your medication history</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-80"
          style={{ background: PRIMARY }}
        >
          <Printer size={15} /> Download PDF
        </button>
      </div>

      {rxList.length === 0 && (
        <p className="text-center text-gray-500 mt-20">No prescriptions found.</p>
      )}

      <div className="space-y-3 print:space-y-4">
        {rxList.map((rx) => {
          const color = STATUS_COLOR[rx.status] ?? "#6b7280";
          return (
            <div
              key={rx.id}
              className="rounded-2xl border p-5"
              style={{ background: SURFACE, borderColor: BORDER }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${color}20` }}>
                  <Pill size={18} color={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white">{rx.drug_name}</span>
                    <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: `${color}20`, color }}>
                      {rx.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-300">
                    {rx.dose} · {rx.frequency}
                    {rx.duration_days ? ` · ${rx.duration_days} days` : ""}
                  </p>
                  {rx.doctor && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <User size={11} /> Dr. {rx.doctor}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <p className="text-lg font-bold">Ayura — Prescription Summary</p>
        <p className="text-sm text-gray-500">Printed on {new Date().toLocaleDateString("en-IN")}</p>
      </div>
    </div>
  );
}
