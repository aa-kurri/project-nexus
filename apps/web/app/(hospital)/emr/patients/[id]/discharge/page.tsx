"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  FileText, CheckCircle2, Printer, Plus, X,
  Pill, Stethoscope, Calendar, AlertTriangle, ClipboardList,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Pre-populated from patient EMR record (would be API-driven in production)
const PATIENT_DATA: Record<string, {
  name: string; age: number; gender: string; uhid: string; blood: string;
  admitDate: string; ward: string; consultant: string;
  diagnosis: string; icd10: string; comorbidities: string[];
  procedures: string[]; allergies: string;
  admitVitals: string; dischargeVitals: string;
  medications: { name: string; dose: string; route: string; freq: string; duration: string }[];
  followUp: string; advice: string[]; referral: string;
}> = {
  "AY-00001": {
    name: "Anish Kurri", age: 29, gender: "Male", uhid: "AY-00001", blood: "O+",
    admitDate: "2026-04-12", ward: "Ward 3B", consultant: "Dr. Rajiv Menon",
    diagnosis: "Essential Hypertension with Hypertensive Urgency",
    icd10: "I10",
    comorbidities: ["Obesity (BMI 29.4)"],
    procedures: ["12-lead ECG", "24hr BP monitoring", "Fundus examination"],
    allergies: "NKDA",
    admitVitals:     "BP 182/110 mmHg · HR 96 bpm · SpO2 98% · Temp 37.0°C",
    dischargeVitals: "BP 136/84 mmHg · HR 78 bpm · SpO2 99% · Temp 36.8°C",
    medications: [
      { name: "Amlodipine",   dose: "5mg",  route: "Oral", freq: "OD",  duration: "Continue — review in 4 weeks" },
      { name: "Telmisartan",  dose: "40mg", route: "Oral", freq: "OD",  duration: "Continue — review in 4 weeks" },
      { name: "Aspirin",      dose: "75mg", route: "Oral", freq: "OD",  duration: "Continue" },
    ],
    followUp: "OPD review with Dr. Rajiv Menon in 4 weeks. Repeat BP monitoring weekly.",
    advice: [
      "Low-salt diet (< 2g sodium/day)",
      "Weight reduction — target BMI < 25",
      "Avoid NSAIDs",
      "Home BP monitoring twice daily",
      "Report immediately if BP > 180 or headache / chest pain",
    ],
    referral: "Nil",
  },
  "AY-00005": {
    name: "Ramesh Kumar", age: 45, gender: "Male", uhid: "AY-00005", blood: "O-",
    admitDate: "2026-04-14", ward: "Surgical Ward", consultant: "Dr. Priya Subramaniam",
    diagnosis: "Acute Appendicitis",
    icd10: "K35.8",
    comorbidities: ["Type 2 Diabetes Mellitus"],
    procedures: ["Emergency Laparoscopic Appendectomy (2026-04-14)", "Intraoperative peritoneal wash", "Histopathology sent"],
    allergies: "Penicillin (rash)",
    admitVitals:     "BP 126/80 · HR 102 · Temp 38.4°C · SpO2 97%",
    dischargeVitals: "BP 118/76 · HR 80 · Temp 36.9°C · SpO2 99%",
    medications: [
      { name: "Metronidazole", dose: "400mg", route: "Oral", freq: "TDS", duration: "5 days" },
      { name: "Cefixime",      dose: "200mg", route: "Oral", freq: "BD",  duration: "5 days" },
      { name: "Pantoprazole",  dose: "40mg",  route: "Oral", freq: "OD",  duration: "10 days" },
      { name: "Tramadol",      dose: "50mg",  route: "Oral", freq: "SOS", duration: "3 days — for pain" },
      { name: "Metformin",     dose: "500mg", route: "Oral", freq: "BD",  duration: "Continue — pre-existing" },
    ],
    followUp: "Surgical review at OPD in 1 week for wound check and histopathology report.",
    advice: [
      "Wound care — keep dry for 48 hours",
      "Avoid heavy lifting for 4 weeks",
      "Soft diet for 48 hours, then normal",
      "Report if fever > 38°C, wound redness or discharge",
      "Continue diabetic medications as prescribed",
    ],
    referral: "Diabetology follow-up for HbA1c review — refer to Dr. Anand Rao",
  },
};

const FALLBACK_PATIENT = PATIENT_DATA["AY-00001"];

interface Medication { name: string; dose: string; route: string; freq: string; duration: string; }

export default function DischargeSummaryPage({ params }: { params: { id: string } }) {
  const base = PATIENT_DATA[params.id] ?? FALLBACK_PATIENT;

  const [diagnosis,        setDiagnosis]        = useState(base.diagnosis);
  const [icd10,            setIcd10]            = useState(base.icd10);
  const [comorbidities,    setComorbidities]     = useState(base.comorbidities.join(", "));
  const [procedures,       setProcedures]        = useState(base.procedures.join("\n"));
  const [allergies,        setAllergies]         = useState(base.allergies);
  const [dischargeVitals,  setDischargeVitals]   = useState(base.dischargeVitals);
  const [medications,      setMedications]       = useState<Medication[]>(base.medications);
  const [followUp,         setFollowUp]          = useState(base.followUp);
  const [advice,           setAdvice]            = useState(base.advice.join("\n"));
  const [referral,         setReferral]          = useState(base.referral);
  const [dischargeDate,    setDischargeDate]     = useState("2026-04-16");
  const [condition,        setCondition]         = useState("Stable");
  const [finalized,        setFinalized]         = useState(false);
  const [showMedForm,      setShowMedForm]       = useState(false);
  const [newMed,           setNewMed]            = useState<Medication>({ name: "", dose: "", route: "Oral", freq: "", duration: "" });

  function addMed() {
    if (!newMed.name || !newMed.dose) return;
    setMedications((m) => [...m, newMed]);
    setNewMed({ name: "", dose: "", route: "Oral", freq: "", duration: "" });
    setShowMedForm(false);
  }

  function removeMed(i: number) {
    setMedications((m) => m.filter((_, idx) => idx !== i));
  }

  const setNM = (k: keyof Medication) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setNewMed((m) => ({ ...m, [k]: e.target.value }));

  return (
    <>
      <TopBar
        title={`Discharge Summary — ${base.name}`}
        action={{ label: "← Back to Patient", href: `/emr/patients/${params.id}` }}
      />
      <main className="p-8 space-y-6 max-w-4xl mx-auto">

        {finalized ? (
          /* ── Print preview ─────────────────────────────────── */
          <div className="space-y-6">
            <div className="flex items-center gap-3 bg-[#0F766E]/10 border border-[#0F766E]/20 rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 text-[#0F766E] shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0F766E]">Discharge Summary Finalized</p>
                <p className="text-xs text-slate-500">Ready to print and hand to patient</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFinalized(false)}
                  className="px-4 py-1.5 rounded-lg border border-white/8 hover:bg-white/5 text-slate-400 text-xs font-bold transition-all"
                >
                  Edit
                </button>
                <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-all">
                  <Printer className="h-3.5 w-3.5" /> Print PDF
                </button>
              </div>
            </div>

            {/* Summary preview card */}
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/10 bg-black/10 pb-4">
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Ayura Hospital</p>
                  <CardTitle className="text-base">Discharge Summary</CardTitle>
                  <p className="text-xs text-slate-500 font-mono">{base.uhid} · {base.name} · {base.age}y {base.gender}</p>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5 text-sm">
                <SummarySection title="Admission Details">
                  <Grid2>
                    <KV label="Date of Admission"  value={base.admitDate} />
                    <KV label="Date of Discharge"  value={dischargeDate} />
                    <KV label="Ward"               value={base.ward} />
                    <KV label="Consultant"         value={base.consultant} />
                    <KV label="Blood Group"        value={base.blood} />
                    <KV label="Discharge Condition" value={condition} />
                  </Grid2>
                </SummarySection>

                <SummarySection title="Diagnosis">
                  <p className="text-slate-200 font-medium">{diagnosis}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">ICD-10: {icd10}</p>
                  {comorbidities && <p className="text-xs text-slate-400 mt-1">Co-morbidities: {comorbidities}</p>}
                </SummarySection>

                <SummarySection title="Procedures Performed">
                  <ul className="space-y-1">
                    {procedures.split("\n").filter(Boolean).map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-[#0F766E] mt-0.5">•</span>{p}
                      </li>
                    ))}
                  </ul>
                </SummarySection>

                <SummarySection title="Vitals at Discharge">
                  <p className="text-xs text-slate-300 font-mono">{dischargeVitals}</p>
                  <p className="text-[10px] text-slate-600 mt-1">At admission: {base.admitVitals}</p>
                </SummarySection>

                <SummarySection title="Discharge Medications">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5">
                        {["Drug", "Dose", "Route", "Frequency", "Duration"].map((h) => (
                          <th key={h} className="text-left py-1.5 pr-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {medications.map((m, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-3 font-bold text-slate-200">{m.name}</td>
                          <td className="py-2 pr-3 font-mono text-slate-300">{m.dose}</td>
                          <td className="py-2 pr-3 text-slate-400">{m.route}</td>
                          <td className="py-2 pr-3 text-slate-400">{m.freq}</td>
                          <td className="py-2 text-slate-400">{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allergies !== "NKDA" && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Allergy: {allergies}
                    </p>
                  )}
                </SummarySection>

                <SummarySection title="Follow-Up Instructions">
                  <p className="text-xs text-slate-300">{followUp}</p>
                </SummarySection>

                <SummarySection title="Advice to Patient">
                  <ul className="space-y-1">
                    {advice.split("\n").filter(Boolean).map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-[#0F766E] mt-0.5">•</span>{a}
                      </li>
                    ))}
                  </ul>
                </SummarySection>

                {referral && referral !== "Nil" && (
                  <SummarySection title="Referral">
                    <p className="text-xs text-slate-300">{referral}</p>
                  </SummarySection>
                )}

                <div className="border-t border-white/5 pt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-slate-600">Signed by</p>
                    <p className="text-xs font-bold text-slate-300">{base.consultant}</p>
                    <p className="text-[10px] text-slate-600">{dischargeDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-700 font-mono">Generated by Ayura OS</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        ) : (
          /* ── Edit form ────────────────────────────────────── */
          <div className="space-y-5">
            {/* Patient header */}
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <KV label="Patient"    value={`${base.name} · ${base.age}y ${base.gender}`} />
                  <KV label="UHID"       value={base.uhid} mono />
                  <KV label="Consultant" value={base.consultant} />
                  <KV label="Admitted"   value={base.admitDate} mono />
                </div>
              </CardContent>
            </Card>

            {/* Diagnosis */}
            <Section title="Diagnosis" icon={<Stethoscope className="h-4 w-4" />}>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Primary Diagnosis</Label>
                  <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                    className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label>ICD-10</Label>
                  <input value={icd10} onChange={(e) => setIcd10(e.target.value)}
                    className={cn(inputCls, "font-mono")} placeholder="e.g. K35.8" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Co-morbidities</Label>
                <input value={comorbidities} onChange={(e) => setComorbidities(e.target.value)}
                  className={inputCls} placeholder="Comma-separated" />
              </div>
            </Section>

            {/* Procedures */}
            <Section title="Procedures Performed" icon={<ClipboardList className="h-4 w-4" />}>
              <div className="space-y-1.5">
                <Label>One procedure per line</Label>
                <textarea value={procedures} onChange={(e) => setProcedures(e.target.value)}
                  rows={3} className={cn(inputCls, "resize-none")} />
              </div>
            </Section>

            {/* Vitals */}
            <Section title="Vitals" icon={<FileText className="h-4 w-4" />}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Vitals at Admission (auto-filled)</Label>
                  <input value={base.admitVitals} readOnly className={cn(inputCls, "opacity-50 cursor-default")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Vitals at Discharge</Label>
                  <input value={dischargeVitals} onChange={(e) => setDischargeVitals(e.target.value)}
                    className={inputCls} />
                </div>
              </div>
            </Section>

            {/* Medications */}
            <Section title="Discharge Medications" icon={<Pill className="h-4 w-4" />}>
              <div className="space-y-1.5 mb-3">
                <Label>Allergy</Label>
                <input value={allergies} onChange={(e) => setAllergies(e.target.value)}
                  className={inputCls} placeholder="e.g. Penicillin (rash) or NKDA" />
              </div>
              <table className="w-full text-xs mb-3">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Drug", "Dose", "Route", "Frequency", "Duration", ""].map((h) => (
                      <th key={h} className="text-left py-2 pr-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {medications.map((m, i) => (
                    <tr key={i} className="group">
                      <td className="py-2 pr-3 font-bold text-slate-200">{m.name}</td>
                      <td className="py-2 pr-3 font-mono text-slate-300">{m.dose}</td>
                      <td className="py-2 pr-3 text-slate-400">{m.route}</td>
                      <td className="py-2 pr-3 text-slate-400">{m.freq}</td>
                      <td className="py-2 pr-3 text-slate-400 max-w-[160px] truncate">{m.duration}</td>
                      <td className="py-2">
                        <button onClick={() => removeMed(i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {showMedForm ? (
                <div className="bg-black/20 border border-white/8 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#0F766E] font-bold">Add Medication</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1"><Label>Drug Name *</Label>
                      <input value={newMed.name} onChange={setNM("name")} className={inputCls} placeholder="e.g. Amoxicillin" /></div>
                    <div className="space-y-1"><Label>Dose *</Label>
                      <input value={newMed.dose} onChange={setNM("dose")} className={inputCls} placeholder="e.g. 500mg" /></div>
                    <div className="space-y-1"><Label>Route</Label>
                      <select value={newMed.route} onChange={setNM("route")} className={inputCls}>
                        {["Oral", "IV", "IM", "SC", "Topical", "Inhaled"].map((r) => <option key={r}>{r}</option>)}
                      </select></div>
                    <div className="space-y-1"><Label>Frequency</Label>
                      <input value={newMed.freq} onChange={setNM("freq")} className={inputCls} placeholder="e.g. BD, TDS" /></div>
                    <div className="col-span-2 space-y-1"><Label>Duration / Instructions</Label>
                      <input value={newMed.duration} onChange={setNM("duration")} className={inputCls} placeholder="e.g. 7 days" /></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addMed} disabled={!newMed.name || !newMed.dose}
                      className="px-4 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-40 text-white text-xs font-bold transition-all">
                      Add
                    </button>
                    <button onClick={() => setShowMedForm(false)}
                      className="px-4 py-1.5 rounded-lg border border-white/8 hover:bg-white/5 text-slate-400 text-xs font-bold transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowMedForm(true)}
                  className="flex items-center gap-1.5 text-xs text-[#0F766E] border border-[#0F766E]/20 bg-[#0F766E]/5 hover:bg-[#0F766E]/10 px-3 py-1.5 rounded-lg font-bold transition-all">
                  <Plus className="h-3.5 w-3.5" /> Add Medication
                </button>
              )}
            </Section>

            {/* Follow-up + Advice */}
            <Section title="Follow-Up & Advice" icon={<Calendar className="h-4 w-4" />}>
              <div className="space-y-1.5">
                <Label>Follow-Up Instructions</Label>
                <input value={followUp} onChange={(e) => setFollowUp(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label>Advice to Patient (one per line)</Label>
                <textarea value={advice} onChange={(e) => setAdvice(e.target.value)}
                  rows={4} className={cn(inputCls, "resize-none")} />
              </div>
              <div className="space-y-1.5">
                <Label>Referral</Label>
                <input value={referral} onChange={(e) => setReferral(e.target.value)} className={inputCls} placeholder="Nil or specialist details" />
              </div>
            </Section>

            {/* Discharge meta */}
            <Section title="Discharge Details" icon={<CheckCircle2 className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date of Discharge</Label>
                  <input type="date" value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)}
                    className={cn(inputCls, "font-mono")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Discharge Condition</Label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className={inputCls}>
                    {["Stable", "Improved", "Against Medical Advice", "Referred", "Expired"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </Section>

            {/* Finalize */}
            <div className="flex items-center justify-end gap-3 pb-4">
              <button
                onClick={() => setFinalized(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold transition-all shadow-lg shadow-[#0F766E]/20"
              >
                <CheckCircle2 className="h-4 w-4" /> Finalize & Preview
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────
const inputCls = "w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50 transition-colors";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{children}</label>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border/10 bg-black/10 pb-3">
        <div className="text-[#0F766E]">{icon}</div>
        <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-3">{children}</CardContent>
    </Card>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-white/5 pb-1">{title}</p>
      {children}
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">{label}</p>
      <p className={cn("text-xs text-slate-300 mt-0.5", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
