"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  User, Droplets, Phone, Calendar, Activity, Pill, FileText,
  AlertTriangle, ClipboardList, CreditCard, ChevronRight,
  Heart, Thermometer, Wind, TrendingUp, Plus, Printer,
  BadgeCheck, Archive, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Patient data (would come from API keyed by UHID) ────────────────────────
const PATIENTS: Record<string, Patient> = {
  "AY-00001": {
    id: "AY-00001", name: "Anish Kurri",    age: 29, gender: "M", blood: "O+",
    phone: "+91 99000 88776", email: "anish.k@email.com",
    address: "14, Banjara Hills, Hyderabad, Telangana",
    dob: "1997-03-12", aadhaar: "XXXX-XXXX-8776",
    status: "Active", dept: "OPD", admitDate: null,
    consultant: "Dr. Rajiv Menon", referredBy: "Self",
    allergies: ["NKDA"],
    diagnosis: "Essential Hypertension",
    comorbidities: ["Obesity (BMI 29.4)"],
    vitals: [
      { date: "2026-04-16", bp: "136/84", hr: 78, spo2: 99, temp: 36.8, rr: 16, wt: 82 },
      { date: "2026-04-14", bp: "148/92", hr: 84, spo2: 98, temp: 37.0, rr: 17, wt: 82 },
      { date: "2026-04-12", bp: "182/110", hr: 96, spo2: 98, temp: 37.0, rr: 18, wt: 83 },
    ],
    medications: [
      { name: "Amlodipine 5mg",   freq: "OD",  route: "Oral", since: "2026-04-12", status: "Active" },
      { name: "Telmisartan 40mg", freq: "OD",  route: "Oral", since: "2026-04-12", status: "Active" },
      { name: "Aspirin 75mg",     freq: "OD",  route: "Oral", since: "2026-04-12", status: "Active" },
    ],
    timeline: [
      { date: "2026-04-16", type: "OPD",      note: "BP controlled. Continue medications. Review in 4 weeks.", by: "Dr. Rajiv Menon" },
      { date: "2026-04-14", type: "Vitals",   note: "BP 148/92. Dose adjustment considered.", by: "Sr. Nurse Rekha" },
      { date: "2026-04-12", type: "Admission",note: "Hypertensive urgency. BP 182/110. Started on Amlodipine + Telmisartan.", by: "Dr. Rajiv Menon" },
    ],
    reports: [
      { date: "2026-04-13", name: "ECG",               result: "Normal sinus rhythm",       status: "Reported" },
      { date: "2026-04-13", name: "Renal Function Test",result: "Creatinine 1.1 — Normal",  status: "Reported" },
      { date: "2026-04-13", name: "Lipid Profile",      result: "LDL 142 — Borderline High", status: "Reported" },
      { date: "2026-04-16", name: "24hr Urine Protein", result: "Awaiting",                  status: "Pending" },
    ],
    bills: [
      { date: "2026-04-16", desc: "OPD Consultation", amount: 600,  status: "Paid" },
      { date: "2026-04-14", desc: "OPD Consultation", amount: 600,  status: "Paid" },
      { date: "2026-04-13", desc: "Lab — RFT + Lipid", amount: 1200, status: "Paid" },
    ],
  },
  "AY-00005": {
    id: "AY-00005", name: "Ramesh Kumar",   age: 45, gender: "M", blood: "O-",
    phone: "+91 98400 22334", email: "ramesh.k@email.com",
    address: "23, Secunderabad, Hyderabad, Telangana",
    dob: "1981-07-20", aadhaar: "XXXX-XXXX-2334",
    status: "Active", dept: "IPD", admitDate: "2026-04-14",
    consultant: "Dr. Priya Subramaniam", referredBy: "Emergency",
    allergies: ["Penicillin (rash)"],
    diagnosis: "Acute Appendicitis — Post Lap Appendectomy",
    comorbidities: ["Type 2 Diabetes Mellitus"],
    vitals: [
      { date: "2026-04-16", bp: "118/76", hr: 80, spo2: 99, temp: 36.9, rr: 14, wt: 74 },
      { date: "2026-04-15", bp: "122/80", hr: 86, spo2: 98, temp: 37.4, rr: 16, wt: 74 },
      { date: "2026-04-14", bp: "126/80", hr: 102, spo2: 97, temp: 38.4, rr: 18, wt: 75 },
    ],
    medications: [
      { name: "Metronidazole 400mg", freq: "TDS", route: "Oral",  since: "2026-04-15", status: "Active" },
      { name: "Cefixime 200mg",      freq: "BD",  route: "Oral",  since: "2026-04-15", status: "Active" },
      { name: "Pantoprazole 40mg",   freq: "OD",  route: "Oral",  since: "2026-04-15", status: "Active" },
      { name: "Tramadol 50mg",       freq: "SOS", route: "Oral",  since: "2026-04-14", status: "Active" },
      { name: "Metformin 500mg",     freq: "BD",  route: "Oral",  since: "2024-01-01", status: "Active" },
    ],
    timeline: [
      { date: "2026-04-16", type: "Review",    note: "Day 2 post-op. Wound clean. Tolerating oral diet. Plan discharge tomorrow.", by: "Dr. Priya Subramaniam" },
      { date: "2026-04-15", type: "Surgery",   note: "Laparoscopic appendectomy completed. No complications. HPE sent.", by: "Dr. Priya Subramaniam" },
      { date: "2026-04-14", type: "Admission", note: "Acute appendicitis confirmed on USG. Booked for emergency surgery.", by: "Dr. Priya Subramaniam" },
    ],
    reports: [
      { date: "2026-04-14", name: "USG Abdomen",          result: "Enlarged appendix 10mm — Appendicitis", status: "Reported" },
      { date: "2026-04-14", name: "CBC",                  result: "WBC 14,200 — Elevated",                 status: "Reported" },
      { date: "2026-04-14", name: "Blood Sugar (RBS)",    result: "212 mg/dL",                             status: "Reported" },
      { date: "2026-04-15", name: "HPE Appendix",         result: "Awaiting histopathology",               status: "Pending" },
    ],
    bills: [
      { date: "2026-04-14", desc: "Emergency Admission", amount: 5000,  status: "Paid" },
      { date: "2026-04-15", desc: "Surgery Package",     amount: 40000, status: "Paid" },
      { date: "2026-04-15", desc: "OT + Anaesthesia",    amount: 8000,  status: "Paid" },
      { date: "2026-04-16", desc: "Day 2 IPD Charges",   amount: 3500,  status: "Pending" },
    ],
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface Patient {
  id: string; name: string; age: number; gender: string; blood: string;
  phone: string; email: string; address: string; dob: string; aadhaar: string;
  status: string; dept: string; admitDate: string | null;
  consultant: string; referredBy: string;
  allergies: string[];
  diagnosis: string; comorbidities: string[];
  vitals: { date: string; bp: string; hr: number; spo2: number; temp: number; rr: number; wt: number }[];
  medications: { name: string; freq: string; route: string; since: string; status: string }[];
  timeline: { date: string; type: string; note: string; by: string }[];
  reports: { date: string; name: string; result: string; status: string }[];
  bills: { date: string; desc: string; amount: number; status: string }[];
}

type Tab = "overview" | "vitals" | "medications" | "reports" | "billing";

const DEPT_COLORS: Record<string, string> = {
  OPD: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  IPD: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
  ICU: "bg-red-500/10 text-red-400 border-red-500/20",
  OT:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const TIMELINE_COLORS: Record<string, string> = {
  Admission: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Surgery:   "bg-red-500/20 text-red-300 border-red-500/30",
  OPD:       "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Review:    "bg-[#0F766E]/20 text-[#0F766E] border-[#0F766E]/30",
  Vitals:    "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

// fallback patient for unknown IDs
const FALLBACK_ID = "AY-00001";

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const patient = PATIENTS[params.id] ?? { ...PATIENTS[FALLBACK_ID], id: params.id };
  const [tab, setTab] = useState<Tab>("overview");

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview",    label: "Overview",    icon: ClipboardList },
    { id: "vitals",      label: "Vitals",      icon: Activity },
    { id: "medications", label: "Medications", icon: Pill },
    { id: "reports",     label: "Reports",     icon: FileText },
    { id: "billing",     label: "Billing",     icon: CreditCard },
  ];

  const totalBilled  = patient.bills.reduce((s, b) => s + b.amount, 0);
  const totalPending = patient.bills.filter((b) => b.status === "Pending").reduce((s, b) => s + b.amount, 0);

  return (
    <>
      <TopBar
        title={patient.name}
        action={{ label: "Discharge Summary", href: `/emr/patients/${params.id}/discharge` }}
      />
      <main className="p-8 space-y-6">

        {/* Back link */}
        <Link href="/emr/patients" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0F766E] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> All Patients
        </Link>

        {/* Patient header card */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              {/* Avatar */}
              <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center border shrink-0",
                patient.dept === "ICU" ? "bg-red-500/10 border-red-500/20" : "bg-[#0F766E]/10 border-[#0F766E]/20"
              )}>
                <User className={cn("h-8 w-8", patient.dept === "ICU" ? "text-red-400" : "text-[#0F766E]")} />
              </div>

              {/* Core info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 flex-wrap">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">{patient.name}</h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{patient.id}</p>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5", DEPT_COLORS[patient.dept] ?? "bg-white/5 text-slate-500 border-white/8")}>
                    {patient.dept}
                  </span>
                  {patient.admitDate && (
                    <span className="text-[10px] text-slate-500 mt-1 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                      Admitted {patient.admitDate}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mt-4">
                  <InfoPair label="Age / Sex"   value={`${patient.age}y ${patient.gender === "M" ? "Male" : "Female"}`} />
                  <InfoPair label="DOB"          value={patient.dob} mono />
                  <InfoPair label="Blood Group"  value={patient.blood} icon={<Droplets className="h-3 w-3 text-red-400" />} />
                  <InfoPair label="Aadhaar"      value={patient.aadhaar} mono />
                  <InfoPair label="Phone"        value={patient.phone} icon={<Phone className="h-3 w-3 text-slate-500" />} />
                  <InfoPair label="Consultant"   value={patient.consultant} />
                  <InfoPair label="Referred By"  value={patient.referredBy} />
                  <InfoPair label="Diagnosis"    value={patient.diagnosis} />
                </div>
              </div>

              {/* Allergy + actions */}
              <div className="flex flex-col gap-2 shrink-0">
                {patient.allergies[0] !== "NKDA" && (
                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    <span className="text-xs text-red-300 font-bold">Allergy: {patient.allergies.join(", ")}</span>
                  </div>
                )}
                {patient.allergies[0] === "NKDA" && (
                  <div className="flex items-center gap-1.5 bg-[#0F766E]/5 border border-[#0F766E]/20 rounded-lg px-3 py-1.5">
                    <BadgeCheck className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
                    <span className="text-xs text-[#0F766E] font-bold">NKDA</span>
                  </div>
                )}
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 hover:bg-white/5 text-slate-400 text-xs font-bold transition-all">
                  <Printer className="h-3.5 w-3.5" /> Print Card
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/40 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                tab === id ? "bg-[#0F766E] text-white" : "text-muted hover:text-fg hover:bg-white/5"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW tab ───────────────────────────────────── */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Timeline */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Clinical Timeline</h3>
              <div className="relative space-y-3 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-px before:bg-white/5">
                {patient.timeline.map((ev, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border text-[9px] font-bold text-center leading-tight shrink-0 z-10", TIMELINE_COLORS[ev.type] ?? "bg-white/5 border-white/8 text-slate-400")}>
                      {ev.type}
                    </div>
                    <Card className="flex-1 border-border/40 bg-surface/50 backdrop-blur-xl">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-bold text-slate-200">{ev.type}</p>
                          <span className="text-[10px] text-slate-600 font-mono">{ev.date}</span>
                        </div>
                        <p className="text-xs text-slate-400">{ev.note}</p>
                        <p className="text-[10px] text-slate-600 mt-1.5">{ev.by}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
              <Link
                href={`/emr/patients/${params.id}/discharge`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-white/10 text-xs text-slate-600 hover:text-[#0F766E] hover:border-[#0F766E]/20 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Add Clinical Note
              </Link>
            </div>

            {/* Right sidebar summary */}
            <div className="space-y-4">
              {/* Latest vitals snapshot */}
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/10 bg-black/10 pb-3">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-[#0F766E]" /> Latest Vitals
                    <span className="ml-auto text-[10px] text-slate-600 font-normal font-mono">{patient.vitals[0]?.date}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 gap-2">
                  {patient.vitals[0] && (<>
                    <VitalChip label="BP"   value={patient.vitals[0].bp}           unit="mmHg" />
                    <VitalChip label="HR"   value={`${patient.vitals[0].hr}`}      unit="bpm"  />
                    <VitalChip label="SpO2" value={`${patient.vitals[0].spo2}`}    unit="%"    />
                    <VitalChip label="Temp" value={`${patient.vitals[0].temp}`}    unit="°C"   />
                    <VitalChip label="RR"   value={`${patient.vitals[0].rr}`}      unit="/min" />
                    <VitalChip label="Wt"   value={`${patient.vitals[0].wt}`}      unit="kg"   />
                  </>)}
                </CardContent>
              </Card>

              {/* Active medications */}
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/10 bg-black/10 pb-3">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Pill className="h-3.5 w-3.5 text-[#0F766E]" /> Active Medications
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {patient.medications.filter((m) => m.status === "Active").map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-xs font-bold text-slate-200">{m.name}</p>
                        <p className="text-[10px] text-slate-500">{m.route} · {m.freq}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Billing summary */}
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/10 bg-black/10 pb-3">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-[#0F766E]" /> Billing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Total Billed</span>
                    <span className="font-mono font-bold text-slate-200">₹{totalBilled.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Pending</span>
                    <span className={cn("font-mono font-bold", totalPending > 0 ? "text-orange-400" : "text-[#0F766E]")}>
                      ₹{totalPending.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <Link href="/billing/payments" className="flex items-center gap-1 text-[10px] text-[#0F766E] hover:underline mt-1">
                    Collect payment <ChevronRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── VITALS tab ─────────────────────────────────────── */}
        {tab === "vitals" && (
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-border/10 bg-black/10 pb-4">
              <CardTitle className="text-sm">Vitals History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-black/10">
                    {["Date", "BP (mmHg)", "HR (bpm)", "SpO2 (%)", "Temp (°C)", "RR (/min)", "Weight (kg)"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {patient.vitals.map((v, i) => (
                    <tr key={i} className={cn("hover:bg-white/[0.02] transition-colors", i === 0 && "bg-[#0F766E]/[0.03]")}>
                      <td className="py-3 px-4 pl-6 font-mono text-xs text-slate-400">{v.date} {i === 0 && <span className="text-[#0F766E] font-bold ml-1">Latest</span>}</td>
                      <td className={cn("py-3 px-4 font-mono font-bold text-sm", parseInt(v.bp) >= 140 ? "text-orange-400" : "text-slate-200")}>{v.bp}</td>
                      <td className={cn("py-3 px-4 font-mono text-sm", v.hr > 100 ? "text-orange-400" : "text-slate-200")}>{v.hr}</td>
                      <td className={cn("py-3 px-4 font-mono text-sm", v.spo2 < 95 ? "text-red-400" : "text-slate-200")}>{v.spo2}</td>
                      <td className={cn("py-3 px-4 font-mono text-sm", v.temp > 38 ? "text-orange-400" : "text-slate-200")}>{v.temp}</td>
                      <td className={cn("py-3 px-4 font-mono text-sm", v.rr > 20 ? "text-orange-400" : "text-slate-200")}>{v.rr}</td>
                      <td className="py-3 px-4 font-mono text-sm text-slate-300">{v.wt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* ── MEDICATIONS tab ────────────────────────────────── */}
        {tab === "medications" && (
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-border/10 bg-black/10 pb-4">
              <CardTitle className="text-sm">Medication Record</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-black/10">
                    {["Medication", "Dose / Route", "Frequency", "Since", "Status"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {patient.medications.map((m, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 pl-6 font-bold text-slate-200">{m.name}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">{m.route}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-300">{m.freq}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{m.since}</td>
                      <td className="py-3.5 px-4">
                        <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          m.status === "Active"
                            ? "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20"
                            : "bg-white/5 text-slate-500 border-white/8"
                        )}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {patient.allergies[0] !== "NKDA" && (
                <div className="px-6 py-3 border-t border-white/5 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs text-red-300 font-bold">Allergy: {patient.allergies.join(", ")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── REPORTS tab ────────────────────────────────────── */}
        {tab === "reports" && (
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-border/10 bg-black/10 pb-4">
              <CardTitle className="text-sm">Investigation Reports</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-black/10">
                    {["Date", "Investigation", "Result", "Status"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {patient.reports.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 pl-6 font-mono text-xs text-slate-500">{r.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">{r.name}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 max-w-[280px]">{r.result}</td>
                      <td className="py-3.5 px-4">
                        <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          r.status === "Reported"
                            ? "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        )}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* ── BILLING tab ────────────────────────────────────── */}
        {tab === "billing" && (
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-border/10 bg-black/10 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Billing History</CardTitle>
              <div className="flex gap-4 text-xs">
                <span className="text-slate-500">Total: <span className="text-slate-200 font-mono font-bold">₹{totalBilled.toLocaleString("en-IN")}</span></span>
                <span className="text-slate-500">Pending: <span className={cn("font-mono font-bold", totalPending > 0 ? "text-orange-400" : "text-[#0F766E]")}>₹{totalPending.toLocaleString("en-IN")}</span></span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-black/10">
                    {["Date", "Description", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {patient.bills.map((b, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 pl-6 font-mono text-xs text-slate-500">{b.date}</td>
                      <td className="py-3.5 px-4 text-slate-300">{b.desc}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0F766E]">₹{b.amount.toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4">
                        <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          b.status === "Paid"
                            ? "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20"
                            : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        )}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

      </main>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function InfoPair({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">{label}</p>
      <div className="flex items-center gap-1 mt-0.5">
        {icon}
        <p className={cn("text-xs text-slate-300 truncate", mono && "font-mono")}>{value}</p>
      </div>
    </div>
  );
}

function VitalChip({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg bg-black/20 border border-white/5 px-3 py-2">
      <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">{label}</p>
      <p className="text-xs font-bold font-mono text-slate-200 mt-0.5">{value} <span className="text-[9px] text-slate-600">{unit}</span></p>
    </div>
  );
}
