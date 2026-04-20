"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Scissors, Clock, CheckCircle2, AlertTriangle, User, Calendar,
  ClipboardList, ChevronRight, Loader2, RefreshCw,
} from "lucide-react";

type OtStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "prep";

const STATUS_CFG: Record<OtStatus, { label: string; color: string; icon: React.ElementType }> = {
  scheduled:   { label: "Scheduled",   color: "text-blue-400 bg-blue-500/10 border-blue-500/20",       icon: Calendar      },
  prep:        { label: "Prep",         color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock         },
  in_progress: { label: "In Progress", color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",    icon: Scissors      },
  completed:   { label: "Completed",   color: "text-slate-400 bg-white/5 border-white/8",               icon: CheckCircle2  },
  cancelled:   { label: "Cancelled",   color: "text-red-400 bg-red-500/10 border-red-500/20",           icon: AlertTriangle },
};

interface OtBooking {
  id:             string;
  room:           string;
  procedure_name: string;
  starts_at:      string;
  ends_at:        string;
  status:         OtStatus;
  notes:          string | null;
  surgeon:        { id: string; full_name: string } | null;
  anaesthetist:   { id: string; full_name: string } | null;
  patient:        { id: string; full_name: string } | null;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function OtPage() {
  const [date,     setDate]     = useState(todayIso());
  const [bookings, setBookings] = useState<OtBooking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ot/bookings?date=${date}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load bookings");
      setBookings(json.bookings ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const selectedBooking = bookings.find((b) => b.id === selected) ?? null;

  // Group by room — show all rooms that appear today, plus defaults
  const rooms = Array.from(new Set(["OT-1", "OT-2", ...bookings.map((b) => b.room)]));
  const byRoom = rooms.map((room) => ({
    room,
    cases: bookings.filter((b) => b.room === room),
  }));

  const inProgress = bookings.filter((b) => b.status === "in_progress").length;
  const completed  = bookings.filter((b) => b.status === "completed").length;

  return (
    <>
      <TopBar title="OT Scheduling & Surgical Cases" />
      <main className="p-8 space-y-6">

        {/* Date picker + refresh */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white"
          />
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 hover:text-white transition"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Today's Cases",   value: bookings.length,  color: "text-slate-200" },
            { label: "In Progress",     value: inProgress,       color: "text-[#0F766E]" },
            { label: "Completed",       value: completed,        color: "text-slate-400" },
            { label: "Remaining",       value: bookings.length - completed - inProgress, color: "text-blue-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className={cn("text-3xl font-bold mt-1", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#0F766E]" size={32} />
          </div>
        )}

        {!loading && bookings.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-2">
            <Scissors size={32} className="opacity-30" />
            <p className="text-sm">No OT bookings for {date}</p>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* OT board */}
            <div className="lg:col-span-2 space-y-4">
              {byRoom.map(({ room, cases }) => (
                <Card key={room} className="border-border/40 bg-surface/50 backdrop-blur-xl">
                  <CardHeader className="border-b border-border/20 pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-[#0F766E]" /> {room}
                      <span className="ml-auto text-xs font-normal text-slate-500">
                        {cases.length} case{cases.length !== 1 ? "s" : ""}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {cases.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-600">No cases scheduled</p>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {cases.map((c) => {
                          const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.scheduled;
                          return (
                            <button
                              key={c.id}
                              onClick={() => setSelected(selected === c.id ? null : c.id)}
                              className={cn(
                                "w-full flex items-center gap-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors",
                                selected === c.id && "bg-white/[0.02]"
                              )}
                            >
                              <div className="text-center shrink-0 w-16">
                                <p className="text-xs font-bold text-slate-300">{fmtTime(c.starts_at)}</p>
                                <p className="text-[10px] text-slate-600">{fmtTime(c.ends_at)}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-100 truncate">{c.procedure_name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {c.patient?.full_name ?? "—"}
                                  {c.surgeon ? ` · ${c.surgeon.full_name}` : ""}
                                </p>
                              </div>
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0",
                                cfg.color
                              )}>
                                <cfg.icon className="h-3 w-3" />
                                {cfg.label}
                              </span>
                              <ChevronRight className={cn(
                                "h-4 w-4 text-slate-600 transition-transform shrink-0",
                                selected === c.id && "rotate-90"
                              )} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detail panel */}
            <div>
              {selectedBooking ? (
                <Card className="border-border/40 bg-surface/50 backdrop-blur-xl sticky top-4">
                  <CardHeader className="border-b border-border/20 pb-3">
                    <CardTitle className="text-sm">Case Detail</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <p className="font-bold text-slate-100">{selectedBooking.patient?.full_name ?? "Unknown patient"}</p>
                      <p className="text-xs text-slate-500">{selectedBooking.room}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Procedure</p>
                      <p className="text-sm text-slate-200">{selectedBooking.procedure_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Time</p>
                      <p className="text-sm text-slate-200">
                        {fmtTime(selectedBooking.starts_at)} – {fmtTime(selectedBooking.ends_at)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500 uppercase tracking-widest mb-0.5">Surgeon</p>
                        <p className="text-slate-300 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {selectedBooking.surgeon?.full_name ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase tracking-widest mb-0.5">Anaesthetist</p>
                        <p className="text-slate-300 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {selectedBooking.anaesthetist?.full_name ?? "—"}
                        </p>
                      </div>
                    </div>
                    {selectedBooking.notes && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <ClipboardList className="h-3.5 w-3.5" /> Notes
                        </p>
                        <p className="text-xs text-slate-400">{selectedBooking.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 rounded-2xl border border-white/8 bg-white/[0.02] text-slate-600 gap-2">
                  <Scissors className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Select a case to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
