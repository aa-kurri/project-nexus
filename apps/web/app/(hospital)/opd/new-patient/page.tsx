"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Phone, User, Calendar, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopBar } from "@/components/hospital/TopBar";
import { registerPatient } from "./actions";

export default function NewPatientPage() {
  const router = useRouter();
  const [pending, startTx] = useTransition();
  const [error, setError]  = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [name,  setName]  = useState("");
  const [dob,   setDob]   = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTx(async () => {
      const res = await registerPatient({ phone, name, dob, gender });
      if (res.ok) {
        router.push("/opd/queue");
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <>
      <TopBar title="Register New Patient" />
      <main className="flex-1 flex items-start justify-center p-8">
        <div className="w-full max-w-md">

          <Link
            href="/opd/queue"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to queue
          </Link>

          <div className="rounded-2xl border border-border bg-surface/60 p-8 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E]/15 text-[#0F766E]">
                <UserPlus className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-fg">Quick registration</h2>
                <p className="text-xs text-muted">Target: under 45 seconds</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="pl-9"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                  <Input
                    placeholder="Ramesh Kumar"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {/* DOB + Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted">
                    Date of birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                    <Input
                      type="date"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as typeof gender)}
                    className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="mt-2 w-full bg-[#0F766E] hover:bg-[#115E59]"
                disabled={pending || !phone || !name}
              >
                {pending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Registering…</>
                ) : (
                  <><UserPlus className="h-4 w-4" /> Register &amp; Add to Queue</>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
