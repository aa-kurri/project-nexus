"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, User, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SALUTATIONS = ["Mr.", "Mrs.", "Miss", "Ms.", "Dr.", "Master", "Baby"];
const CARE_TAKERS = ["FATHER", "MOTHER", "HUSBAND", "WIFE", "SON", "DAUGHTER", "GUARDIAN", "SELF"];
const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];
const CONSULTANTS = [
  "Dr. Chenna Reddy (Orthopaedic)",
  "Dr. Vasantha Raya (Gynaecology)",
  "Dr. Suresh Babu (General Medicine)",
  "Dr. Priya Nair (Paediatrics)",
  "Dr. Ramesh Kumar (Cardiology)",
];
const REF_DOCTORS = ["None", "Dr. Ravi Shankar", "Dr. Anand Murthy", "Dr. Latha Devi", "Dr. Kishore Reddy"];

function today() {
  return new Date().toISOString().split("T")[0];
}

function calcAge(dob: string) {
  if (!dob) return { years: "", months: "", days: "" };
  const now = new Date();
  const birth = new Date(dob);
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  return { years: String(years), months: String(months), days: String(days) };
}

export default function NewPatientPage() {
  const [form, setForm] = useState({
    regDate: today(),
    salutation: "Mr.",
    firstName: "", middleName: "", lastName: "",
    refDocPhone: "",
    referralDoctor: "None",
    consultant: "",
    sex: "",
    dob: "",
    ageYears: "", ageMonths: "", ageDays: "",
    careTaker: "FATHER",
    careTakerName: "",
    address: "",
    city: "",
    district: "",
    phone: "",
    state: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [uhid, setUhid] = useState("");

  useEffect(() => {
    if (form.dob) {
      const age = calcAge(form.dob);
      setForm((f) => ({ ...f, ageYears: age.years, ageMonths: age.months, ageDays: age.days }));
    }
  }, [form.dob]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleRegister = () => {
    if (!form.firstName || !form.phone || !form.sex || !form.state) return;
    const id = `AY-${String(Math.floor(10000 + Math.random() * 89999)).padStart(5, "0")}`;
    setUhid(id);
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm({ regDate: today(), salutation: "Mr.", firstName: "", middleName: "", lastName: "", refDocPhone: "", referralDoctor: "None", consultant: "", sex: "", dob: "", ageYears: "", ageMonths: "", ageDays: "", careTaker: "FATHER", careTakerName: "", address: "", city: "", district: "", phone: "", state: "" });
    setSubmitted(false);
    setUhid("");
  };

  if (submitted) {
    return (
      <>
        <TopBar title="Patient Registration" action={{ label: "Go to Queue", href: "/opd/queue" }} />
        <main className="p-8 max-w-2xl mx-auto">
          <Card className="border-[#0F766E]/30 bg-[#0F766E]/5">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[#0F766E]" />
              </div>
              <h2 className="text-xl font-bold text-fg">Patient Registered Successfully</h2>
              <p className="text-slate-400 text-sm">
                {form.salutation} {form.firstName} {form.lastName} has been registered.
              </p>
              <div className="inline-flex flex-col items-center bg-black/30 border border-[#0F766E]/20 rounded-xl px-8 py-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">UHID / Patient ID</p>
                <p className="text-3xl font-bold font-mono text-[#0F766E]">{uhid}</p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 rounded-lg bg-[#0F766E] text-white text-sm font-bold hover:bg-[#115E59] transition-colors"
                >
                  Register Another
                </button>
                <a href="/opd/queue"
                  className="px-6 py-2 rounded-lg border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/5 transition-colors"
                >
                  Go to Queue
                </a>
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Patient Registration" action={{ label: "Go to Queue", href: "/opd/queue" }} />
      <main className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Form */}
          <div className="lg:col-span-2 space-y-5">

            {/* Header row */}
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/10 pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-[#0F766E]" />
                  New Patient Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">

                {/* Row 1: Reg Date + Salutation */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Reg Date *">
                    <input type="date" value={form.regDate} onChange={set("regDate")} className={inputCls} />
                  </Field>
                  <Field label="Salutation *">
                    <Select value={form.salutation} onChange={set("salutation")} options={SALUTATIONS} />
                  </Field>
                </div>

                {/* Row 2: First / Middle / Last Name */}
                <div className="grid grid-cols-3 gap-4">
                  <Field label="First Name *">
                    <input value={form.firstName} onChange={set("firstName")} placeholder="First name" className={inputCls} />
                  </Field>
                  <Field label="Middle Name">
                    <input value={form.middleName} onChange={set("middleName")} placeholder="Middle name" className={inputCls} />
                  </Field>
                  <Field label="Last Name">
                    <input value={form.lastName} onChange={set("lastName")} placeholder="Last name" className={inputCls} />
                  </Field>
                </div>

                {/* Row 3: Ref Doc + RefDoc Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Referral Doctor">
                    <Select value={form.referralDoctor} onChange={set("referralDoctor")} options={REF_DOCTORS} />
                  </Field>
                  <Field label="RefDoc Phone">
                    <input value={form.refDocPhone} onChange={set("refDocPhone")} placeholder="Mobile number" className={inputCls} />
                  </Field>
                </div>

                {/* Row 4: Consultant */}
                <Field label="Consultant *">
                  <Select value={form.consultant} onChange={set("consultant")} options={["", ...CONSULTANTS]} placeholder="Select Consultant" />
                </Field>

              </CardContent>
            </Card>

            {/* Patient Identity */}
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/10 pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-[#0F766E]" />
                   Patient Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-6">

                {/* Sex + DOB */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Sex *">
                    <div className="flex gap-2">
                      {["Male", "Female", "Other"].map((s) => (
                        <button key={s} onClick={() => setForm((f) => ({ ...f, sex: s }))}
                          className={cn("flex-1 py-2.5 rounded-lg text-xs font-bold border transition-all",
                            form.sex === s ? "bg-[#0F766E] text-white border-[#0F766E]" : "border-white/10 text-slate-400 hover:bg-white/5"
                          )}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Date of Birth">
                    <div className="relative">
                      <input type="date" value={form.dob} onChange={set("dob")} className={inputCls} />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
                    </div>
                  </Field>
                </div>

                {/* Age row */}
                <div className="grid grid-cols-3 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                  <Field label="Age — Years">
                    <input value={form.ageYears} onChange={set("ageYears")} placeholder="yrs" className="bg-transparent text-sm text-slate-200 outline-none w-full" />
                  </Field>
                  <Field label="Months">
                    <input value={form.ageMonths} onChange={set("ageMonths")} placeholder="mo" className="bg-transparent text-sm text-slate-200 outline-none w-full" />
                  </Field>
                  <Field label="Days">
                    <input value={form.ageDays} onChange={set("ageDays")} placeholder="days" className="bg-transparent text-sm text-slate-200 outline-none w-full" />
                  </Field>
                </div>

                {/* Care Taker (Guardian) */}
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0F766E]">Family / Guardian Info</p>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Relation (Care Taker) *">
                      <Select value={form.careTaker} onChange={set("careTaker")} options={CARE_TAKERS} />
                    </Field>
                    <Field label="Care Taker Name *">
                      <input value={form.careTakerName} onChange={set("careTakerName")} placeholder="Full name of guardian" className={inputCls} />
                    </Field>
                  </div>
                </div>

              </CardContent>
            </Card>
>

            {/* Address */}
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/10 pb-4">
                <CardTitle className="text-sm text-[#0F766E]">Patient Address</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <Field label="Address *">
                  <textarea value={form.address} onChange={set("address")} placeholder="Door no, Street, Area…"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#0F766E] transition-colors resize-none h-16" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="City / Town / Village *">
                    <input value={form.city} onChange={set("city")} placeholder="City" className={inputCls} />
                  </Field>
                  <Field label="District *">
                    <input value={form.district} onChange={set("district")} placeholder="District" className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone (Mob) *">
                    <input value={form.phone} onChange={set("phone")} placeholder="+91 00000 00000" className={inputCls} />
                  </Field>
                  <Field label="State *">
                    <Select value={form.state} onChange={set("state")} options={["", ...STATES]} placeholder="Select State" />
                  </Field>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button onClick={handleReset}
                className="px-5 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-medium hover:bg-white/5 transition-colors">
                Reset
              </button>
              <button
                onClick={handleRegister}
                disabled={!form.firstName || !form.phone || !form.sex}
                className="px-8 py-2.5 rounded-lg bg-[#0F766E] text-white text-sm font-bold hover:bg-[#115E59] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                REGISTER
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick search */}
            <Card className="border-[#0F766E]/20 bg-[#0F766E]/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-widest text-[#0F766E]">Quick Patient Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <input placeholder="UHID or mobile…" className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none flex-1" />
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Search before registering to avoid duplicates. Type UHID or phone number.
                </p>
              </CardContent>
            </Card>

            {/* Today's stats */}
            <Card className="border-border/40 bg-surface/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-widest text-slate-500">Today's Registrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "New Patients", value: "36", color: "text-[#0F766E]" },
                  { label: "Walk-ins", value: "24", color: "text-blue-400" },
                  { label: "Referred", value: "12", color: "text-purple-400" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Required fields note */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 mb-2">Required Fields</p>
              <ul className="space-y-1 text-[11px] text-slate-400">
                {["First Name", "Phone (Mob)", "Sex", "Consultant", "Care Taker", "Address", "State"].map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-yellow-500/60" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

const inputCls = "w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#0F766E] transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[]; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange}
        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#0F766E] transition-colors appearance-none">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o || placeholder}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
    </div>
  );
}
