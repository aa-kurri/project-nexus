"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope, Calendar, Clock, User, Phone, FileText,
  ChevronRight, ArrowLeft, CheckCircle2, Loader2, MapPin,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/hospital/TopBar";
import { bookSlot } from "./actions";

// ── Mock data ──────────────────────────────────────────────────────────────

const DOCTORS = [
  { id: "doc-1", name: "Dr. Ananya Sharma", specialty: "General OPD",   room: "Block 2, Room 4",  fee: 500,  avatar: "AS", slotsLeft: 8 },
  { id: "doc-2", name: "Dr. Ravi Rao",      specialty: "Endocrinology",  room: "Block 1, Room 11", fee: 800,  avatar: "RR", slotsLeft: 4 },
  { id: "doc-3", name: "Dr. Priya Menon",   specialty: "Cardiology",     room: "Cardiology Wing",  fee: 1200, avatar: "PM", slotsLeft: 2 },
  { id: "doc-4", name: "Dr. Vikram Nair",   specialty: "Orthopaedics",   room: "Block 3, Room 7",  fee: 700,  avatar: "VN", slotsLeft: 6 },
] as const;

type Doctor = (typeof DOCTORS)[number];

interface Slot { id: string; time: string; label: string; booked: boolean }

const BOOKED_TIMES = new Set(["09:30", "10:30", "14:30"]);

function buildSlots(): Slot[] {
  const times = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  ];
  return times.map(t => ({
    id:     `slot-${t.replace(":", "")}`,
    time:   t,
    label:  formatTime(t),
    booked: BOOKED_TIMES.has(t),
  }));
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function getDates(count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

function shortDate(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

// ── Component ──────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

export default function OpdBookingPage() {
  const router = useRouter();
  const [pending, startTx] = useTransition();

  const [step, setStep]             = useState<Step>(1);
  const [doctor, setDoctor]         = useState<Doctor | null>(null);
  const [date, setDate]             = useState<Date>(() => new Date());
  const [slot, setSlot]             = useState<Slot | null>(null);
  const [patientName, setPatientName]   = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [reason, setReason]         = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [bookingId, setBookingId]   = useState<string | null>(null);

  const dates = getDates();
  const slots = buildSlots();
  const morningSlots   = slots.filter(s => parseInt(s.time) < 12);
  const afternoonSlots = slots.filter(s => parseInt(s.time) >= 14);

  const submit = () => {
    if (!doctor || !slot) return;
    setError(null);
    startTx(async () => {
      const res = await bookSlot({
        slotId:         slot.id,
        practitionerId: doctor.id,
        slotDate:       isoDate(date),
        startTime:      slot.time,
        patientName,
        patientPhone,
        reason:         reason || undefined,
      });
      if (res.ok) setBookingId(res.bookingId);
      else        setError(res.error);
    });
  };

  // ── Success state ──────────────────────────────────────────────────────
  if (bookingId) {
    return (
      <>
        <TopBar title="Appointment Booking" />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm w-full">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#0F766E]/15">
              <CheckCircle2 className="h-8 w-8 text-[#0F766E]" />
            </div>
            <h2 className="text-xl font-bold text-fg">Appointment Confirmed</h2>
            <p className="mt-1 text-sm text-muted">
              Booking ID: <span className="font-mono text-[#0F766E]">{bookingId}</span>
            </p>
            <Card className="mt-5 p-4 text-left space-y-2.5">
              <InfoRow icon={<User className="h-3.5 w-3.5 text-[#0F766E]" />}       label={patientName} />
              <InfoRow icon={<Stethoscope className="h-3.5 w-3.5 text-[#0F766E]" />} label={doctor?.name ?? ""} />
              <InfoRow icon={<Calendar className="h-3.5 w-3.5 text-[#0F766E]" />}   label={shortDate(date)} />
              <InfoRow icon={<Clock className="h-3.5 w-3.5 text-[#0F766E]" />}      label={slot?.label ?? ""} />
              <InfoRow icon={<MapPin className="h-3.5 w-3.5 text-[#0F766E]" />}     label={doctor?.room ?? ""} />
            </Card>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setBookingId(null); setStep(1); setDoctor(null); setSlot(null); setPatientName(""); setPatientPhone(""); setReason(""); }}
              >
                Book Another
              </Button>
              <Button
                className="flex-1 bg-[#0F766E] hover:bg-[#115E59]"
                onClick={() => router.push("/opd/queue")}
              >
                Go to Queue
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Appointment Booking" action={{ label: "View Queue", href: "/opd/queue" }} />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">

          <Link
            href="/opd/queue"
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to queue
          </Link>

          <StepIndicator current={step} />

          {/* ── Step 1: Doctor picker ─────────────────────────────────── */}
          {step === 1 && (
            <div className="mt-6">
              <h2 className="text-base font-semibold text-fg mb-4">Select a doctor</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DOCTORS.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => { setDoctor(doc); setSlot(null); setStep(2); }}
                    className="text-left rounded-xl border border-border bg-surface/60 p-5 hover:border-[#0F766E]/60 hover:bg-surface transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/15 font-bold text-[#0F766E] text-sm group-hover:bg-[#0F766E]/25 transition-colors">
                        {doc.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-fg truncate">{doc.name}</p>
                          <ChevronRight className="h-4 w-4 text-muted shrink-0 group-hover:text-[#0F766E] transition-colors" />
                        </div>
                        <p className="text-xs text-muted mt-0.5">{doc.specialty}</p>
                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                          <Badge variant="outline">₹{doc.fee}</Badge>
                          <Badge variant="secondary" className="text-[#0F766E] border-[#0F766E]/20">
                            {doc.slotsLeft} slots today
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-xs text-muted">
                            <MapPin className="h-2.5 w-2.5" />{doc.room}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Date + time slot ──────────────────────────────── */}
          {step === 2 && doctor && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-fg">Pick a date &amp; time</h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-muted hover:text-fg transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Change doctor
                </button>
              </div>

              {/* Doctor summary chip */}
              <div className="rounded-xl border border-[#0F766E]/30 bg-[#0F766E]/5 px-4 py-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F766E]/15 text-sm font-bold text-[#0F766E]">
                  {doctor.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-fg">{doctor.name}</p>
                  <p className="text-xs text-muted">{doctor.specialty} · {doctor.room}</p>
                </div>
              </div>

              {/* Date strip */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted mb-3">Select date</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {dates.map((d, i) => {
                    const selected = isoDate(d) === isoDate(date);
                    return (
                      <button
                        key={i}
                        onClick={() => { setDate(d); setSlot(null); }}
                        className={`shrink-0 rounded-xl px-4 py-2.5 text-center transition-all ${
                          selected
                            ? "bg-[#0F766E] text-white shadow-lg shadow-[#0F766E]/30"
                            : "border border-border bg-surface/60 text-fg hover:border-[#0F766E]/40"
                        }`}
                      >
                        <p className="text-[10px] font-semibold uppercase">
                          {d.toLocaleDateString("en-IN", { weekday: "short" })}
                        </p>
                        <p className="text-lg font-bold leading-tight">{d.getDate()}</p>
                        <p className="text-[10px]">{d.toLocaleDateString("en-IN", { month: "short" })}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slot grids */}
              <div className="space-y-5">
                <SlotGroup label="Morning" slots={morningSlots} selected={slot} onSelect={setSlot} />
                <SlotGroup label="Afternoon" slots={afternoonSlots} selected={slot} onSelect={setSlot} />
              </div>

              <Button
                className="w-full bg-[#0F766E] hover:bg-[#115E59]"
                disabled={!slot}
                onClick={() => setStep(3)}
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── Step 3: Patient details + confirm ────────────────────── */}
          {step === 3 && doctor && slot && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-fg">Patient details</h2>
                <button
                  onClick={() => setStep(2)}
                  className="text-xs text-muted hover:text-fg transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Change slot
                </button>
              </div>

              {/* Booking summary */}
              <Card className="p-4 space-y-2.5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted mb-3">Booking summary</p>
                <InfoRow icon={<Stethoscope className="h-3.5 w-3.5 text-[#0F766E]" />} label={`${doctor.name} — ${doctor.specialty}`} />
                <InfoRow icon={<Calendar className="h-3.5 w-3.5 text-[#0F766E]" />}   label={shortDate(date)} />
                <InfoRow icon={<Clock className="h-3.5 w-3.5 text-[#0F766E]" />}      label={slot.label} />
                <InfoRow icon={<MapPin className="h-3.5 w-3.5 text-[#0F766E]" />}     label={doctor.room} />
              </Card>

              {/* Patient form */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted">
                    Patient name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                    <Input
                      placeholder="Full name"
                      value={patientName}
                      onChange={e => setPatientName(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted">
                    Phone number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={patientPhone}
                      onChange={e => setPatientPhone(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted">
                    Reason for visit{" "}
                    <span className="normal-case text-muted/60">(optional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-3.5 w-3.5 text-muted" />
                    <textarea
                      placeholder="Brief description of symptoms or visit purpose"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={3}
                      className="flex w-full rounded-md border border-border bg-surface px-3 py-2 pl-9 text-sm text-fg placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/50 resize-none"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}

              <Button
                className="w-full bg-[#0F766E] hover:bg-[#115E59]"
                disabled={pending || !patientName || !patientPhone}
                onClick={submit}
              >
                {pending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Confirming…</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Confirm Appointment</>
                )}
              </Button>

              <p className="text-center text-xs text-muted">
                ₹{doctor.fee} consultation fee · payable at the clinic
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: { n: Step; label: string }[] = [
    { n: 1, label: "Doctor" },
    { n: 2, label: "Slot" },
    { n: 3, label: "Confirm" },
  ];
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              current === s.n
                ? "bg-[#0F766E] text-white"
                : current > s.n
                ? "bg-[#0F766E]/25 text-[#0F766E]"
                : "border border-border bg-surface text-muted"
            }`}
          >
            {current > s.n ? "✓" : s.n}
          </div>
          <span
            className={`ml-1.5 text-sm ${
              current === s.n ? "text-fg font-medium" : "text-muted"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`mx-3 h-px w-8 ${
                current > s.n ? "bg-[#0F766E]/40" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function SlotGroup({
  label, slots, selected, onSelect,
}: {
  label: string;
  slots: Slot[];
  selected: Slot | null;
  onSelect: (s: Slot) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {slots.map(s => (
          <button
            key={s.id}
            disabled={s.booked}
            onClick={() => onSelect(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              s.booked
                ? "cursor-not-allowed border border-dashed border-border text-muted/40"
                : selected?.id === s.id
                ? "bg-[#0F766E] text-white shadow-lg shadow-[#0F766E]/30"
                : "border border-border bg-surface/60 text-fg hover:border-[#0F766E]/50 hover:bg-surface"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="shrink-0">{icon}</span>
      <span className="text-fg">{label}</span>
    </div>
  );
}
