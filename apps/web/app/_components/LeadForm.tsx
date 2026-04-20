"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitLead } from "@/app/actions";

export function LeadForm() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    hospitalName: "",
    contactName: "",
    email: "",
    phone: "",
    bedCount: "",
    message: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitLead(form);
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0F766E]/20 text-3xl">
          ✓
        </div>
        <h3 className="text-xl font-semibold text-fg">Request received!</h3>
        <p className="text-muted max-w-sm">
          Our team will reach out within one business day to schedule your personalised demo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted uppercase tracking-wide">Hospital / Clinic name *</label>
        <Input
          name="hospitalName"
          placeholder="City General Clinics"
          value={form.hospitalName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted uppercase tracking-wide">Your name *</label>
        <Input
          name="contactName"
          placeholder="Dr. Ananya Rao"
          value={form.contactName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted uppercase tracking-wide">Work email *</label>
        <Input
          type="email"
          name="email"
          placeholder="admin@citygeneral.com"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted uppercase tracking-wide">Phone</label>
        <Input
          type="tel"
          name="phone"
          placeholder="+91 98765 43210"
          value={form.phone}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted uppercase tracking-wide">Bed count</label>
        <Input
          name="bedCount"
          placeholder="e.g. 250"
          value={form.bedCount}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted uppercase tracking-wide">Message</label>
        <Input
          name="message"
          placeholder="Anything specific you'd like to discuss?"
          value={form.message}
          onChange={handleChange}
        />
      </div>

      {error && (
        <p className="col-span-2 text-sm text-red-400">{error}</p>
      )}

      <div className="col-span-2">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90 text-white shadow-[0_0_0_1px_#0F766E/50,0_8px_30px_-12px_#0F766E] focus-visible:ring-[#0F766E]/50"
        >
          {isPending ? "Sending…" : "Request a free demo →"}
        </Button>
        <p className="mt-2 text-center text-xs text-muted">No credit card required. Setup in under 48 hours.</p>
      </div>
    </form>
  );
}
