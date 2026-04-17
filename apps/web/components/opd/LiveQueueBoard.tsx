"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import {
  PhoneCall,
  Clock,
  Users,
  Stethoscope,
  ChevronRight,
  BellRing,
  SkipForward,
} from "lucide-react";

// ── Types matching queue_tokens schema ──────────────────────────────────────

type QueueStatus = "waiting" | "next" | "in-consult" | "done" | "no-show";

type QueueEntry = {
  id: string;
  token_number: number;
  practitioner_id: string;
  patient_id: string;
  status: QueueStatus;
  created_at: string;
  called_at: string | null;
  // joined
  doctor_name?: string;
  patient_name?: string;
};

type DoctorLane = {
  practitioner_id: string;
  doctor: string;
  current: QueueEntry | null;
  waiting: QueueEntry[];
};

export default function LiveQueueBoard() {
  const supabase = createClient();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [now, setNow] = useState(new Date());

  const fetchQueue = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("queue_tokens")
      .select(`
        id, token_number, practitioner_id, patient_id,
        status, created_at, called_at,
        patients ( full_name ),
        profiles ( full_name )
      `)
      .eq("token_date", today)
      .not("status", "in", '("done","no-show")')
      .order("token_number", { ascending: true });

    if (data) {
      setQueue(
        (data as Record<string, unknown>[]).map((r) => ({
          id: r.id as string,
          token_number: r.token_number as number,
          practitioner_id: r.practitioner_id as string,
          patient_id: r.patient_id as string,
          status: r.status as QueueStatus,
          created_at: r.created_at as string,
          called_at: r.called_at as string | null,
          doctor_name: (r.profiles as { full_name?: string } | null)?.full_name,
          patient_name: (r.patients as { full_name?: string } | null)?.full_name,
        }))
      );
    }
  }, [supabase]);

  useEffect(() => {
    fetchQueue();
    const channel = supabase
      .channel("opd-live-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_tokens" },
        () => fetchQueue()
      )
      .subscribe();

    const ticker = setInterval(() => setNow(new Date()), 1000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(ticker);
    };
  }, [fetchQueue, supabase]);

  const callNext = async (practitioner_id: string) => {
    const current = queue.find(
      (q) => q.practitioner_id === practitioner_id && q.status === "in-consult"
    );
    const next = queue.find(
      (q) =>
        q.practitioner_id === practitioner_id &&
        (q.status === "waiting" || q.status === "next")
    );
    if (current) {
      await supabase
        .from("queue_tokens")
        .update({ status: "done" })
        .eq("id", current.id);
    }
    if (next) {
      await supabase
        .from("queue_tokens")
        .update({ status: "in-consult", called_at: new Date().toISOString() })
        .eq("id", next.id);
    }
    fetchQueue();
  };

  const skipToken = async (id: string) => {
    await supabase
      .from("queue_tokens")
      .update({ status: "no-show" })
      .eq("id", id);
    fetchQueue();
  };

  // Demo helper — inserts a real token if a tenant row exists
  const pingMock = async () => {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .limit(1)
      .single();

    if (!tenant) return;

    const { data: doctors } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "doctor")
      .eq("tenant_id", tenant.id)
      .limit(3);

    const { data: patients } = await supabase
      .from("patients")
      .select("id")
      .eq("tenant_id", tenant.id)
      .limit(10);

    if (!doctors?.length || !patients?.length) return;

    const doc = doctors[Math.floor(Math.random() * doctors.length)];
    const pat = patients[Math.floor(Math.random() * patients.length)];
    const today = new Date().toISOString().split("T")[0];

    const { data: maxRow } = await supabase
      .from("queue_tokens")
      .select("token_number")
      .eq("tenant_id", tenant.id)
      .eq("practitioner_id", doc.id)
      .eq("token_date", today)
      .order("token_number", { ascending: false })
      .limit(1)
      .single();

    await supabase.from("queue_tokens").insert({
      tenant_id: tenant.id,
      practitioner_id: doc.id,
      patient_id: pat.id,
      token_number: ((maxRow?.token_number ?? 0) as number) + 1,
      token_date: today,
      status: "waiting",
    });
  };

  // Build doctor lanes
  const practIds = Array.from(new Set(queue.map((q) => q.practitioner_id)));
  const lanes: DoctorLane[] = practIds.map((pid) => {
    const entries = queue.filter((q) => q.practitioner_id === pid);
    return {
      practitioner_id: pid,
      doctor: entries[0]?.doctor_name ?? `Dr. ${pid.slice(0, 6)}`,
      current: entries.find((q) => q.status === "in-consult") ?? null,
      waiting: entries.filter((q) => q.status === "waiting" || q.status === "next"),
    };
  });

  const totalWaiting = queue.filter((q) => q.status === "waiting" || q.status === "next").length;
  const totalConsulting = queue.filter((q) => q.status === "in-consult").length;

  return (
    <div className="min-h-screen bg-[hsl(220_15%_6%)] text-white">
      {/* Header bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/8 bg-black/30 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E]">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">OPD Token Queue</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F766E] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F766E]" />
              </span>
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-mono">Live Stream</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-3">
            <StatPill label="Waiting" value={totalWaiting} color="yellow" icon={Clock} />
            <StatPill label="In Room" value={totalConsulting} color="teal" icon={PhoneCall} />
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono font-bold tabular-nums">{now.toLocaleTimeString()}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              {now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}
            </p>
          </div>
          <button
            onClick={pingMock}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            + Add Token
          </button>
        </div>
      </div>

      <div className="p-8">
        {lanes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {lanes.map((lane) => (
              <DoctorLaneCard
                key={lane.practitioner_id}
                lane={lane}
                onCallNext={() => callNext(lane.practitioner_id)}
                onSkip={skipToken}
              />
            ))}
          </div>
        )}

        {totalWaiting > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              All Waiting Tokens
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 xl:grid-cols-10 gap-3">
              {queue
                .filter((q) => q.status === "waiting" || q.status === "next")
                .map((q) => (
                  <TokenChip key={q.id} entry={q} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DoctorLaneCard({
  lane,
  onCallNext,
  onSkip,
}: {
  lane: DoctorLane;
  onCallNext: () => void;
  onSkip: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-black/20">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Doctor Lane</p>
          <p className="font-bold text-sm mt-0.5">{lane.doctor}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Waiting</p>
          <p className="text-2xl font-bold text-[#0F766E]">{lane.waiting.length}</p>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-white/8">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Now Consulting</p>
        {lane.current ? (
          <div className="flex items-center gap-4 bg-[#0F766E]/10 border border-[#0F766E]/30 rounded-xl p-4">
            <div className="h-14 w-14 rounded-xl bg-[#0F766E] flex items-center justify-center shrink-0">
              <span className="text-xl font-black">{lane.current.token_number}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate">Token #{lane.current.token_number}</p>
              {lane.current.patient_name && (
                <p className="text-xs text-slate-400 truncate">{lane.current.patient_name}</p>
              )}
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#0F766E]/20 text-[#0F766E] text-[10px] font-bold uppercase tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0F766E] animate-pulse" />
                In Room
              </span>
            </div>
          </div>
        ) : (
          <div className="h-[86px] rounded-xl border border-dashed border-white/8 flex items-center justify-center">
            <p className="text-xs text-slate-600 font-mono uppercase tracking-widest">Room Available</p>
          </div>
        )}
      </div>

      <div className="px-5 py-4 flex-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Up Next</p>
        <div className="space-y-2">
          {lane.waiting.length === 0 ? (
            <p className="text-xs text-slate-600 italic">No patients waiting</p>
          ) : (
            lane.waiting.slice(0, 4).map((q, i) => (
              <div
                key={q.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg border",
                  i === 0
                    ? "bg-yellow-500/5 border-yellow-500/20"
                    : "bg-white/[0.02] border-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs font-bold w-5 text-center",
                    i === 0 ? "text-yellow-400" : "text-slate-600"
                  )}>
                    {i + 1}
                  </span>
                  <span className={cn(
                    "font-mono font-bold text-sm",
                    i === 0 ? "text-white" : "text-slate-400"
                  )}>
                    #{q.token_number}
                  </span>
                  {q.patient_name && (
                    <span className="text-xs text-slate-600 truncate max-w-[80px]">{q.patient_name}</span>
                  )}
                </div>
                <button
                  onClick={() => onSkip(q.id)}
                  className="p-1 text-slate-600 hover:text-slate-300 transition-colors"
                  title="Mark no-show"
                >
                  <SkipForward className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
          {lane.waiting.length > 4 && (
            <p className="text-[10px] text-slate-600 text-center pt-1">
              +{lane.waiting.length - 4} more waiting
            </p>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-white/8">
        <button
          onClick={onCallNext}
          disabled={lane.waiting.length === 0}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
            lane.waiting.length > 0
              ? "bg-[#0F766E] text-white hover:bg-[#0d6560] shadow-lg shadow-[#0F766E]/20"
              : "bg-white/5 text-slate-600 cursor-not-allowed"
          )}
        >
          <BellRing className="h-4 w-4" />
          Call Next
          {lane.waiting.length > 0 && (
            <ChevronRight className="h-4 w-4 ml-auto" />
          )}
        </button>
      </div>
    </div>
  );
}

function TokenChip({ entry }: { entry: QueueEntry }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
      <span className="text-base font-bold font-mono text-slate-200">
        #{entry.token_number}
      </span>
      {entry.patient_name && (
        <span className="text-[9px] text-slate-600 truncate w-full text-center">
          {entry.patient_name.split(" ")[0]}
        </span>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: "teal" | "yellow";
  icon: React.ElementType;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm",
        color === "teal"
          ? "bg-[#0F766E]/10 border-[#0F766E]/20 text-[#0F766E]"
          : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="font-bold">{value}</span>
      <span className="text-[11px] opacity-70">{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 opacity-40">
      <Users className="h-12 w-12 text-slate-600 mb-4" />
      <p className="text-slate-500 font-mono uppercase tracking-widest text-sm">Queue Empty</p>
      <p className="text-slate-600 text-xs mt-1">No patients registered today</p>
    </div>
  );
}
