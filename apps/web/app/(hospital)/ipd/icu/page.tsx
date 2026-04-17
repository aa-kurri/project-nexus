"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Activity, Droplets, Wind, Brain, TrendingDown, TrendingUp, AlertTriangle, User,
} from "lucide-react";

interface VitalReading { time: string; value: string; flag?: "high" | "low" | "critical" }
interface IcuPatient {
  name: string; uhid: string; bed: string; age: number; diagnosis: string;
  admitDate: string; ventilated: boolean; apacheII: number; sofa: number; gcs: number;
  vitals: {
    sbp: VitalReading[]; dbp: VitalReading[]; hr: VitalReading[];
    spo2: VitalReading[]; rr: VitalReading[]; temp: VitalReading[];
  };
  fluid: { intake: string; output: string; balance: string };
  vent?: { mode: string; fio2: string; peep: string; tv: string; rr: string };
}

const PATIENTS: IcuPatient[] = [
  {
    name: "Sunita Sharma", uhid: "AY-00389", bed: "ICU-2", age: 41,
    diagnosis: "STEMI — Post-PCI Day 2", admitDate: "2026-04-15", ventilated: false,
    apacheII: 14, sofa: 3, gcs: 15,
    vitals: {
      sbp:  [{ time: "06:00", value: "102", flag: "low" }, { time: "08:00", value: "108" }, { time: "10:00", value: "114" }, { time: "12:00", value: "118" }, { time: "14:00", value: "122" }],
      dbp:  [{ time: "06:00", value: "64" }, { time: "08:00", value: "68" }, { time: "10:00", value: "70" }, { time: "12:00", value: "72" }, { time: "14:00", value: "74" }],
      hr:   [{ time: "06:00", value: "94" }, { time: "08:00", value: "88" }, { time: "10:00", value: "84" }, { time: "12:00", value: "82" }, { time: "14:00", value: "80" }],
      spo2: [{ time: "06:00", value: "96" }, { time: "08:00", value: "97" }, { time: "10:00", value: "98" }, { time: "12:00", value: "97" }, { time: "14:00", value: "98" }],
      rr:   [{ time: "06:00", value: "18" }, { time: "08:00", value: "17" }, { time: "10:00", value: "16" }, { time: "12:00", value: "16" }, { time: "14:00", value: "15" }],
      temp: [{ time: "06:00", value: "37.8", flag: "high" }, { time: "10:00", value: "37.4" }, { time: "14:00", value: "37.1" }],
    },
    fluid: { intake: "2450 ml", output: "1980 ml", balance: "+470 ml" },
  },
  {
    name: "Krishnamurti Rao", uhid: "AY-00501", bed: "ICU-4", age: 68,
    diagnosis: "Septic shock — ARDS (Day 3)", admitDate: "2026-04-13", ventilated: true,
    apacheII: 28, sofa: 9, gcs: 8,
    vitals: {
      sbp:  [{ time: "06:00", value: "82", flag: "critical" }, { time: "08:00", value: "90", flag: "low" }, { time: "10:00", value: "96" }, { time: "12:00", value: "98" }, { time: "14:00", value: "102" }],
      dbp:  [{ time: "06:00", value: "50", flag: "low" }, { time: "08:00", value: "56" }, { time: "10:00", value: "60" }, { time: "12:00", value: "62" }, { time: "14:00", value: "64" }],
      hr:   [{ time: "06:00", value: "118", flag: "high" }, { time: "08:00", value: "112" }, { time: "10:00", value: "106" }, { time: "12:00", value: "104" }, { time: "14:00", value: "100" }],
      spo2: [{ time: "06:00", value: "88", flag: "critical" }, { time: "08:00", value: "91", flag: "low" }, { time: "10:00", value: "93" }, { time: "12:00", value: "94" }, { time: "14:00", value: "95" }],
      rr:   [{ time: "06:00", value: "26", flag: "high" }, { time: "08:00", value: "24" }, { time: "10:00", value: "22" }, { time: "12:00", value: "20" }, { time: "14:00", value: "18" }],
      temp: [{ time: "06:00", value: "39.2", flag: "high" }, { time: "10:00", value: "38.8", flag: "high" }, { time: "14:00", value: "38.4", flag: "high" }],
    },
    fluid: { intake: "3200 ml", output: "1400 ml", balance: "+1800 ml" },
    vent: { mode: "PRVC", fio2: "60%", peep: "10", tv: "440 ml", rr: "20" },
  },
];

function VitalSparkline({ readings, unit, normal }: { readings: VitalReading[]; unit: string; normal: [number, number] }) {
  const latest = readings[readings.length - 1];
  const flagColor = latest.flag === "critical" ? "text-red-400" : latest.flag === "high" ? "text-yellow-400" : latest.flag === "low" ? "text-orange-400" : "text-[#0F766E]";
  return (
    <div className="flex flex-col gap-1">
      <p className={cn("text-2xl font-bold font-mono", flagColor)}>{latest.value}<span className="text-xs text-slate-500 font-normal ml-1">{unit}</span></p>
      <div className="flex items-end gap-0.5 h-6">
        {readings.map((r, i) => {
          const v = parseFloat(r.value);
          const max = Math.max(...readings.map(x => parseFloat(x.value)));
          const min = Math.min(...readings.map(x => parseFloat(x.value)));
          const pct = max === min ? 50 : ((v - min) / (max - min)) * 100;
          const inRange = v >= normal[0] && v <= normal[1];
          return (
            <div key={i} className={cn("w-1 rounded-sm", inRange ? "bg-[#0F766E]/60" : "bg-yellow-400/60")}
              style={{ height: `${Math.max(4, pct)}%` }} />
          );
        })}
      </div>
      <p className="text-[9px] text-slate-600">{readings[readings.length - 1].time}</p>
    </div>
  );
}

const VITALS_CONFIG = [
  { key: "sbp" as const,  label: "SBP",  unit: "mmHg", normal: [90, 140] as [number,number],  icon: Activity },
  { key: "dbp" as const,  label: "DBP",  unit: "mmHg", normal: [60, 90]  as [number,number],  icon: Activity },
  { key: "hr" as const,   label: "HR",   unit: "bpm",  normal: [60, 100] as [number,number],  icon: Activity },
  { key: "spo2" as const, label: "SpO₂", unit: "%",    normal: [94, 100] as [number,number],  icon: Wind     },
  { key: "rr" as const,   label: "RR",   unit: "/min", normal: [12, 20]  as [number,number],  icon: Wind     },
  { key: "temp" as const, label: "Temp", unit: "°C",   normal: [36.1, 37.9] as [number,number],icon: Activity},
];

export default function IcuFlowsheetPage() {
  const [selected, setSelected] = useState(0);
  const p = PATIENTS[selected];
  const criticalCount = VITALS_CONFIG.filter(({ key }) => {
    const latest = p.vitals[key][p.vitals[key].length - 1];
    return latest.flag === "critical";
  }).length;

  return (
    <>
      <TopBar title="ICU Flowsheet" />
      <main className="p-8 space-y-6">

        {/* Patient selector */}
        <div className="flex gap-3 flex-wrap">
          {PATIENTS.map((pt, i) => (
            <button key={pt.uhid} onClick={() => setSelected(i)}
              className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                selected === i ? "bg-[#0F766E]/15 border-[#0F766E]/30 text-[#0F766E]" : "border-white/8 text-muted hover:bg-white/5")}>
              <User className="h-3.5 w-3.5" />
              {pt.name} · {pt.bed}
              {pt.ventilated && <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">VENT</span>}
              {VITALS_CONFIG.some(({ key }) => pt.vitals[key][pt.vitals[key].length - 1]?.flag === "critical") && (
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              )}
            </button>
          ))}
        </div>

        {/* Critical alert */}
        {criticalCount > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400 font-bold">CRITICAL: {criticalCount} vital parameter(s) out of range. Immediate review required.</p>
          </div>
        )}

        {/* Patient summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "APACHE II",  value: p.apacheII.toString(), sub: p.apacheII < 15 ? "Low risk" : p.apacheII < 25 ? "Moderate" : "High risk", color: p.apacheII > 24 ? "text-red-400" : "text-[#0F766E]" },
            { label: "SOFA Score", value: p.sofa.toString(),     sub: p.sofa < 6 ? "Low" : p.sofa < 10 ? "Moderate" : "High mortality",          color: p.sofa > 9 ? "text-red-400" : "text-yellow-400" },
            { label: "GCS",        value: p.gcs.toString(),      sub: p.gcs === 15 ? "Normal" : p.gcs > 8 ? "Moderate" : "Severe",               color: p.gcs <= 8 ? "text-red-400" : "text-[#0F766E]" },
            { label: "Diagnosis",  value: "", sub: p.diagnosis, color: "text-slate-300" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              {s.value && <p className={cn("text-3xl font-bold mt-1", s.color)}>{s.value}</p>}
              <p className={cn("text-xs mt-0.5", s.value ? "text-slate-500" : "text-slate-200 font-medium mt-2 text-sm")}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Vitals flowsheet */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#0F766E]" /> Vital Signs Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-6">
              {VITALS_CONFIG.map(({ key, label, unit, normal }) => (
                <div key={key} className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
                  <VitalSparkline readings={p.vitals[key]} unit={unit} normal={normal} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ventilator + Fluid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {p.vent && (
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/20 pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wind className="h-4 w-4 text-blue-400" /> Ventilator Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { l: "Mode", v: p.vent!.mode },
                    { l: "FiO₂", v: p.vent!.fio2 },
                    { l: "PEEP", v: p.vent!.peep + " cmH₂O" },
                    { l: "Tidal Vol.", v: p.vent!.tv },
                    { l: "RR Set", v: p.vent!.rr + "/min" },
                  ].map((item) => (
                    <div key={item.l} className="text-center">
                      <p className="text-[9px] uppercase tracking-widest text-slate-600">{item.l}</p>
                      <p className="text-base font-bold text-blue-300 mt-0.5">{item.v}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/20 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-400" /> Fluid Balance (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { l: "Intake",  v: p.fluid.intake,  color: "text-[#0F766E]", icon: TrendingUp   },
                  { l: "Output",  v: p.fluid.output,  color: "text-blue-400",  icon: TrendingDown },
                  { l: "Balance", v: p.fluid.balance, color: parseInt(p.fluid.balance) > 1500 ? "text-yellow-400" : "text-[#0F766E]", icon: Droplets },
                ].map(({ l, v, color, icon: Icon }) => (
                  <div key={l}>
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 flex items-center justify-center gap-1">
                      <Icon className="h-3 w-3" />{l}
                    </p>
                    <p className={cn("text-lg font-bold mt-1", color)}>{v}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
