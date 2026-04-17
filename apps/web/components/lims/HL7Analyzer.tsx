"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface IngestEvent {
  id: string;
  barcode: string;
  patient: string;
  tests: string[];
  status: string;
  arrivedAt: string;
}

interface ParsedResult {
  test: string;
  value: number;
  unit: string;
  ref: string;
  flag: string;
}

function toHL7Lines(ev: IngestEvent): string[] {
  const ts = new Date(ev.arrivedAt).toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const patParts = ev.patient.split(" ");
  const lastName  = patParts.slice(-1)[0] ?? ev.patient;
  const firstName = patParts.slice(0, -1).join(" ");
  return [
    `MSH|^~\\&|LIS|LAB|AYURA|HIS|${ts}||ORU^R01|${ev.id.slice(0,8).toUpperCase()}|P|2.5`,
    `PID|1||${ev.id.slice(0,8)}||${lastName}^${firstName}||`,
    `OBR|1||${ev.barcode}|${ev.tests.join(",")}|||${ts}`,
    ...ev.tests.map((t, i) =>
      `OBX|${i + 1}|NM|${t.replace(/\s+/g,"_")}^${t}|1|—|—|—|||${ev.status === "resulted" ? "F" : "P"}`
    ),
    `ACK: Application Accept (AA)`,
  ];
}

export default function HL7Analyzer() {
  const supabase  = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [events, setEvents]   = useState<IngestEvent[]>([]);
  const [lines, setLines]     = useState<string[]>(["Ayura HL7 Engine v2.5 · binding to realtime channel…"]);
  const [selected, setSelected] = useState<IngestEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const appendLines = (newLines: string[]) => {
    setLines((prev) => [...prev, ...newLines]);
  };

  const fetchSamples = useCallback(async () => {
    const { data } = await supabase
      .from("lab_samples")
      .select(`
        id, barcode, status, collected_at,
        patients ( full_name ),
        service_requests ( display )
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      const evs: IngestEvent[] = (data as Record<string, unknown>[]).map((r) => ({
        id:        r.id as string,
        barcode:   r.barcode as string,
        patient:   (r.patients as { full_name?: string } | null)?.full_name ?? "Unknown",
        tests:     (() => {
          const sr = r.service_requests as { display?: string } | null;
          return sr?.display ? [sr.display] : ["CBC"];
        })(),
        status:    r.status as string,
        arrivedAt: (r.collected_at as string) ?? new Date().toISOString(),
      }));
      setEvents(evs);
      if (evs.length > 0 && lines.length <= 1) {
        const recent = evs[0];
        appendLines([`[INIT] ${evs.length} samples loaded from DB — showing latest:`, ...toHL7Lines(recent)]);
        setSelected(recent);
      }
    }
    setLoading(false);
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchSamples();

    const ch = supabase
      .channel("hl7-ingest-stream")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "lab_samples" },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          const ev: IngestEvent = {
            id:        r.id as string,
            barcode:   r.barcode as string,
            patient:   "—",
            tests:     ["CBC"],
            status:    r.status as string,
            arrivedAt: (r.collected_at as string) ?? new Date().toISOString(),
          };
          const ts = new Date().toLocaleTimeString();
          appendLines([
            `[${ts}] NEW SAMPLE: ${r.barcode} · status=${r.status}`,
            ...toHL7Lines(ev),
          ]);
          setEvents((prev) => [ev, ...prev].slice(0, 10));
          setSelected(ev);
          fetchSamples(); // re-fetch to get patient/test join
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [fetchSamples, supabase]);

  // Auto-scroll terminal
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const parsedResults: ParsedResult[] = selected
    ? selected.tests.map((t) => ({
        test:  t,
        value: 0,
        unit:  "—",
        ref:   "—",
        flag:  selected.status === "resulted" ? "N" : "P",
      }))
    : [];

  return (
    <div className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-950 text-emerald-400 font-mono overflow-hidden flex flex-col md:flex-row h-[580px]">

      {/* Left: Raw Terminal */}
      <div className="w-full md:w-2/3 flex flex-col border-r border-slate-800">
        <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-800">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <span className="text-xs text-slate-500 uppercase tracking-widest font-sans font-bold">
            Ayura TCP // HL7 Listener
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">Live</span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-black/50 space-y-1 text-sm">
          {loading && (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Connecting to realtime channel…
            </div>
          )}
          {lines.map((line, i) => (
            <p
              key={i}
              className={
                line.startsWith("MSH") || line.startsWith("OBX") || line.startsWith("PID") || line.startsWith("OBR")
                  ? "text-blue-400"
                  : line.startsWith("ACK")
                  ? "text-emerald-400 font-bold"
                  : line.startsWith("[INIT]") || line.startsWith("Ayura")
                  ? "text-slate-500"
                  : "text-slate-300"
              }
            >
              {line}
            </p>
          ))}
          <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
        </div>

        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            {events.length} samples · realtime Supabase channel active
          </span>
          <div className="flex gap-2 overflow-x-auto">
            {events.slice(0, 4).map((ev) => (
              <button
                key={ev.id}
                onClick={() => {
                  setSelected(ev);
                  appendLines([`[SELECT] Barcode ${ev.barcode}`, ...toHL7Lines(ev)]);
                }}
                className="px-2 py-1 text-[10px] bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 transition-colors shrink-0"
              >
                {ev.barcode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Parsed Output */}
      <div className="w-full md:w-1/3 bg-slate-900 p-5 flex flex-col">
        <h3 className="text-slate-300 font-sans font-bold uppercase tracking-widest text-xs mb-4 pb-2 border-b border-slate-800">
          Parsed Clinical Data
        </h3>

        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-center opacity-50">
            <p className="text-slate-500 text-sm font-sans">No sample selected</p>
          </div>
        ) : (
          <div className="space-y-3 animate-in slide-in-from-right-4">
            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">Sample</p>
              <p className="text-sm font-bold text-white font-sans mt-0.5">{selected.barcode}</p>
              <p className="text-[11px] text-slate-400 font-sans">{selected.patient}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans mb-1">Status</p>
              <Badge variant="outline" className="text-[10px] uppercase font-bold border-none bg-emerald-500/20 text-emerald-400">
                {selected.status}
              </Badge>
            </div>
            {parsedResults.map((res, i) => (
              <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold text-slate-200 font-sans">{res.test}</span>
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold border-none font-sans
                    ${res.flag === "N" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {res.flag === "N" ? "Normal" : "Pending"}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-sans">
                  Arrived: {new Date(selected.arrivedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
