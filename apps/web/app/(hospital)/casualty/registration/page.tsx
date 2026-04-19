"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, User, Heart, ClipboardList } from "lucide-react";

type Triage = "red" | "orange" | "yellow" | "green";

const TRIAGE_CFG: Record<Triage, { label: string; color: string; desc: string }> = {
  red:    { label: "Immediate",  color: "bg-red-500 text-white",    desc: "Life-threatening — resuscitation required" },
  orange: { label: "Urgent",    color: "bg-orange-500 text-white",  desc: "Serious — seen within 15 minutes" },
  yellow: { label: "Delayed",   color: "bg-yellow-500 text-black",  desc: "Stable — can wait 30–60 minutes" },
  green:  { label: "Minor",     color: "bg-emerald-500 text-white", desc: "Minor — treat and release" },
};

interface FormState {
  // Patient
  fullName:        string;
  age:             string;
  gender:          string;
  phone:           string;
  address:         string;
  relName:         string;
  relPhone:        string;
  // Triage
  triage:          Triage;
  chiefComplaint:  string;
  mechanism:       string;
  // Vitals
  bp:              string;
  pulse:           string;
  temp:            string;
  spo2:            string;
  rr:              string;
  gcs:             string;
  // Clinical
  allergies:       string;
  currentMeds:     string;
  notes:           string;
}

const EMPTY: FormState = {
  fullName: "", age: "", gender: "", phone: "", address: "",
  relName: "", relPhone: "",
  triage: "green", chiefComplaint: "", mechanism: "",
  bp: "", pulse: "", temp: "", spo2: "", rr: "", gcs: "15",
  allergies: "", currentMeds: "", notes: "",
};

function Field({
  label, name, value, onChange, type = "text", required = false, placeholder = "",
}: {
  label: string; name: keyof FormState; value: string;
  onChange: (k: keyof FormState, v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-muted uppercase tracking-widest">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm text-fg placeholder:text-muted outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/40 transition"
      />
    </div>
  );
}

export default function CasualtyRegistrationPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [uhid, setUhid]       = useState<string | null>(null);

  function set(k: keyof FormState, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // 1. Get tenant
    const { data: tenantRow } = await supabase.from("tenants").select("id").limit(1).single();
    if (!tenantRow) { setSaving(false); return; }
    const tenantId = (tenantRow as { id: string }).id;

    // 2. Create patient
    const newUhid = `ER-${Date.now().toString(36).toUpperCase()}`;
    const { data: patient, error: patErr } = await supabase
      .from("patients")
      .insert({
        tenant_id:    tenantId,
        full_name:    form.fullName,
        phone:        form.phone || null,
        gender:       form.gender || null,
        address:      form.address || null,
        uhid:         newUhid,
      })
      .select("id")
      .single();

    if (patErr || !patient) { setSaving(false); return; }
    const patientId = (patient as { id: string }).id;

    // 3. Create encounter (emergency type)
    const { data: enc } = await supabase
      .from("encounters")
      .insert({
        tenant_id:  tenantId,
        patient_id: patientId,
        class_code: "EMER",
        status:     "in-progress",
        period_start: new Date().toISOString(),
      })
      .select("id")
      .single();

    const encounterId = enc ? (enc as { id: string }).id : null;

    // 4. Save vitals as observation
    if (form.bp || form.pulse || form.spo2) {
      const vitals = [
        form.bp    && { code: "85354-9", display: "Blood Pressure", value: form.bp,    unit: "mmHg" },
        form.pulse && { code: "8867-4",  display: "Pulse Rate",     value: form.pulse, unit: "bpm"  },
        form.spo2  && { code: "59408-5", display: "SpO2",           value: form.spo2,  unit: "%"    },
        form.temp  && { code: "8310-5",  display: "Temperature",    value: form.temp,  unit: "°C"   },
        form.rr    && { code: "9279-1",  display: "Resp. Rate",     value: form.rr,    unit: "/min"  },
        form.gcs   && { code: "35088-4", display: "GCS Total",      value: form.gcs,   unit: "score" },
      ].filter(Boolean);

      if (vitals.length > 0) {
        await supabase.from("observations").insert(
          vitals.map((v) => ({
            tenant_id:    tenantId,
            patient_id:   patientId,
            encounter_id: encounterId,
            code:         (v as { code: string }).code,
            display:      (v as { display: string }).display,
            value_string: (v as { value: string }).value,
            unit:         (v as { unit: string }).unit,
            status:       "final",
          }))
        );
      }
    }

    // 5. Create appointment_booking as emergency slot
    await supabase.from("appointment_bookings").insert({
      tenant_id:    tenantId,
      patient_id:   patientId,
      encounter_id: encounterId,
      status:       "booked",
      class:        "emergency",
      description:  form.chiefComplaint,
      scheduled_at: new Date().toISOString(),
    });

    setUhid(newUhid);
    setSaved(true);
    setSaving(false);
  }

  if (saved) {
    return (
      <>
        <TopBar title="Emergency Registration" />
        <main className="p-8 flex items-center justify-center min-h-[600px]">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-fg">Patient Registered</h2>
              <p className="text-muted mt-1">Emergency patient successfully registered</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 p-6 space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Patient Name</span>
                <span className="font-bold text-fg">{form.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">ER Number</span>
                <span className="font-bold text-[#0F766E] font-mono">{uhid}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Triage</span>
                <Badge className={TRIAGE_CFG[form.triage].color}>{TRIAGE_CFG[form.triage].label}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Chief Complaint</span>
                <span className="text-fg text-right max-w-[180px] truncate">{form.chiefComplaint}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => { setForm(EMPTY); setSaved(false); setUhid(null); }} className="flex-1 bg-[#0F766E] text-white">
                Register Another
              </Button>
              <Button variant="outline" onClick={() => router.push("/casualty/billing")} className="flex-1">
                Generate Bill
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Emergency Registration" />
      <main className="p-8 max-w-5xl mx-auto space-y-6">

        {/* Triage Strip */}
        <div>
          <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Triage Level *</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(TRIAGE_CFG) as [Triage, typeof TRIAGE_CFG[Triage]][]).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => set("triage", key)}
                className={`rounded-xl p-3 border-2 text-left transition-all ${
                  form.triage === key
                    ? `border-current ${cfg.color}`
                    : "border-border bg-surface/40 hover:bg-white/5"
                }`}
              >
                <p className="font-bold text-sm">{cfg.label}</p>
                <p className="text-[11px] opacity-80 mt-0.5">{cfg.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Patient Demographics */}
          <Card className="border-border/40 bg-surface/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-[#0F766E]" /> Patient Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Field label="Full Name"     name="fullName"    value={form.fullName}    onChange={set} required placeholder="As on Aadhaar / ID" />
              </div>
              <Field label="Age (years)"  name="age"         value={form.age}         onChange={set} type="number" required placeholder="e.g. 35" />
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Gender *</label>
                <select
                  value={form.gender}
                  required
                  onChange={(e) => set("gender", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-[#0F766E]"
                >
                  <option value="">Select…</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <Field label="Phone"        name="phone"       value={form.phone}       onChange={set} type="tel" placeholder="+91 98765 43210" />
              <Field label="Address"      name="address"     value={form.address}     onChange={set} placeholder="City, State" />
              <Field label="Relative / Guardian" name="relName" value={form.relName} onChange={set} placeholder="Name" />
              <Field label="Relative Phone"      name="relPhone" value={form.relPhone} onChange={set} type="tel" placeholder="+91…" />
            </CardContent>
          </Card>

          {/* Chief Complaint */}
          <Card className="border-border/40 bg-surface/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" /> Chief Complaint & History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Chief Complaint *</label>
                <textarea
                  value={form.chiefComplaint}
                  required
                  rows={2}
                  onChange={(e) => set("chiefComplaint", e.target.value)}
                  placeholder="e.g. RTA, chest pain, breathlessness, fall…"
                  className="w-full rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm text-fg placeholder:text-muted outline-none focus:border-[#0F766E] resize-none"
                />
              </div>
              <Field label="Mechanism / Mode of Arrival" name="mechanism" value={form.mechanism} onChange={set} placeholder="e.g. Ambulance, Walk-in, Police referral" />
            </CardContent>
          </Card>

          {/* Vitals */}
          <Card className="border-border/40 bg-surface/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-400" /> Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Field label="BP (mmHg)"    name="bp"    value={form.bp}    onChange={set} placeholder="120/80" />
              <Field label="Pulse (/min)" name="pulse" value={form.pulse} onChange={set} type="number" placeholder="72" />
              <Field label="Temp (°C)"    name="temp"  value={form.temp}  onChange={set} type="number" placeholder="37.0" />
              <Field label="SpO2 (%)"     name="spo2"  value={form.spo2}  onChange={set} type="number" placeholder="99" />
              <Field label="RR (/min)"    name="rr"    value={form.rr}    onChange={set} type="number" placeholder="16" />
              <Field label="GCS"          name="gcs"   value={form.gcs}   onChange={set} type="number" placeholder="15" />
            </CardContent>
          </Card>

          {/* Clinical Notes */}
          <Card className="border-border/40 bg-surface/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-400" /> Clinical Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Known Allergies" name="allergies"   value={form.allergies}   onChange={set} placeholder="Penicillin, NSAIDs…" />
              <Field label="Current Medications" name="currentMeds" value={form.currentMeds} onChange={set} placeholder="Metformin, Atenolol…" />
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Additional Notes</label>
                <textarea
                  value={form.notes}
                  rows={3}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="PMHX, surgical history, co-morbidities…"
                  className="w-full rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm text-fg placeholder:text-muted outline-none focus:border-[#0F766E] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setForm(EMPTY)}>Clear</Button>
            <Button type="submit" disabled={saving} className="bg-[#0F766E] hover:bg-[#115E59] text-white px-8">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Registering…</> : "Register Patient"}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
