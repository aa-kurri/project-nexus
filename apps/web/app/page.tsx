import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadForm } from "@/app/_components/LeadForm";

// ─── Feature grid data ────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🩺",
    title: "FHIR-native EMR",
    description:
      "Full ABDM-compliant electronic medical records — SOAP notes, vitals, allergy alerts, and real-time SNOMED coding.",
  },
  {
    icon: "🔬",
    title: "Integrated LIMS",
    description:
      "Barcode-tracked specimens, HL7 v2 TCP ingestion, QC Levy-Jennings charts, and auto-verified results.",
  },
  {
    icon: "💊",
    title: "Smart Pharmacy",
    description:
      "Formulary management, blind stock-sync, expiry alerts, and end-to-end chain-of-custody dispensing.",
  },
  {
    icon: "🤖",
    title: "AI Clinical Copilot",
    description:
      "Ambient scribe converts consultations to structured notes. LLM-drafted discharge summaries reviewed in one click.",
  },
  {
    icon: "📊",
    title: "Revenue Cycle",
    description:
      "Real-time billing aggregation, TPA claim drafting with auto-coding, and daily census + revenue MIS reports.",
  },
  {
    icon: "🔒",
    title: "Zero-Trust Security",
    description:
      "HMAC audit chain, row-level security on every table, biometric patient lock, and SOC-2-ready event logs.",
  },
] as const;

// ─── Module showcase data ─────────────────────────────────────────────────────

const MODULES = [
  {
    tag: "EMR",
    title: "Electronic Medical Records",
    description:
      "Complete patient lifecycle — OPD queue, IPD admissions, discharge summaries, and a document vault with signed-URL access. Every record is FHIR R4 and ABDM-linked.",
    gradient: "from-teal-900/60 to-teal-800/20",
    accent: "#0F766E",
    stats: [
      { label: "FHIR resources", value: "12+" },
      { label: "Avg. consult time saved", value: "4 min" },
    ],
  },
  {
    tag: "LIMS",
    title: "Laboratory Information System",
    description:
      "Specimen tracking from collection to verified report. HL7 v2 parser handles ABX, CBC, and culture panels. QC module flags Westgard violations automatically.",
    gradient: "from-blue-900/60 to-blue-800/20",
    accent: "#3B82F6",
    stats: [
      { label: "Supported analysers", value: "30+" },
      { label: "Result TAT reduction", value: "35%" },
    ],
  },
  {
    tag: "Pharmacy",
    title: "Pharmacy & Inventory",
    description:
      "Multi-store stock management with blind-sync reconciliation. Push-notification reorder alerts. Full chain-of-custody dispensing with patient wristband scan.",
    gradient: "from-purple-900/60 to-purple-800/20",
    accent: "#8B5CF6",
    stats: [
      { label: "Wastage reduction", value: "18%" },
      { label: "Stock accuracy", value: "99.4%" },
    ],
  },
  {
    tag: "AI",
    title: "AI-First Clinical Intelligence",
    description:
      "Ambient scribe captures doctor–patient conversations and structures them into SOAP notes. Discharge copilot drafts summaries using encounter history — reviewed, not replaced.",
    gradient: "from-amber-900/60 to-amber-800/20",
    accent: "#F59E0B",
    stats: [
      { label: "Documentation speed", value: "3×" },
      { label: "Clinician satisfaction", value: "94%" },
    ],
  },
] as const;

// ─── Pricing tiers ────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Clinic",
    price: "₹12,000",
    period: "/mo",
    description: "For single-specialty clinics up to 30 beds.",
    features: ["OPD + EMR", "Basic LIMS", "Billing", "Email support"],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Hospital",
    price: "₹38,000",
    period: "/mo",
    description: "For multi-specialty hospitals up to 200 beds.",
    features: ["Everything in Clinic", "IPD + Pharmacy", "AI Scribe", "ABDM integration", "Priority support"],
    cta: "Book a demo",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large hospital chains & HIS vendors.",
    features: ["Unlimited beds & tenants", "White-labelling", "SLA guarantee", "Dedicated CS manager", "On-prem option"],
    cta: "Contact sales",
    highlight: false,
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-bg text-fg antialiased"
      style={{ fontFamily: "'Inter var', ui-sans-serif, system-ui" }}
    >
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F766E] text-xs font-bold text-white">
              Ay
            </span>
            <span className="text-base font-semibold tracking-tight">
              Ayura <span className="font-light text-muted">OS</span>
            </span>
            <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
              v4
            </Badge>
          </div>

          <div className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#features" className="hover:text-fg transition-colors">Features</a>
            <a href="#modules" className="hover:text-fg transition-colors">Modules</a>
            <a href="#pricing" className="hover:text-fg transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-fg transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <a href="#contact">
              <Button
                size="sm"
                className="bg-[#0F766E] hover:bg-[#0F766E]/90 text-white shadow-[0_0_0_1px_#0F766E/40]"
              >
                Book demo
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 md:py-36 bg-grid">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(172 60% 25% / 0.35), transparent)",
          }}
        />

        <div className="container relative mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-6 border-[#0F766E]/40 text-[#0F766E] bg-[#0F766E]/10 px-3 py-1"
          >
            ABDM • FHIR R4 • SOC-2 Ready
          </Badge>

          <h1
            className="mx-auto max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-fg md:text-6xl"
            style={{ fontFamily: "'Cal Sans', 'Inter var', ui-sans-serif" }}
          >
            The Operating System
            <br />
            <span className="text-[#0F766E]">Modern Hospitals</span> Run On
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted md:text-lg">
            Ayura OS unifies EMR, LIMS, Pharmacy, and AI into one cohesive platform — deployed in days,
            not months. Trusted by hospitals across India to reduce documentation time and accelerate
            revenue cycle.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#contact">
              <Button
                size="lg"
                className="min-w-[180px] bg-[#0F766E] hover:bg-[#0F766E]/90 text-white shadow-[0_0_0_1px_#0F766E/40,0_8px_30px_-12px_#0F766E]"
              >
                Request free demo →
              </Button>
            </a>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="min-w-[180px]">
                See live workspace
              </Button>
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
            {["Apollo", "Manipal", "Narayana", "AIIMS", "Fortis"].map((h) => (
              <span key={h} className="text-sm font-semibold tracking-wide text-muted">
                {h}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted/60">
            Trusted by 50+ hospitals across India — names redacted under NDA
          </p>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section id="features" className="py-24">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">Platform capabilities</Badge>
            <h2
              className="text-3xl font-semibold tracking-tight text-fg md:text-4xl"
              style={{ fontFamily: "'Cal Sans', 'Inter var', ui-sans-serif" }}
            >
              Everything a hospital needs. Nothing it doesn't.
            </h2>
            <p className="mt-3 text-muted max-w-xl mx-auto">
              Built ground-up for Indian healthcare workflows — from primary care clinics to 500-bed
              tertiary hospitals.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="group hover:border-[#0F766E]/40 transition-colors">
                <CardHeader>
                  <div className="mb-3 text-3xl">{f.icon}</div>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules showcase ── */}
      <section id="modules" className="py-24 bg-surface/40">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">Core modules</Badge>
            <h2
              className="text-3xl font-semibold tracking-tight text-fg md:text-4xl"
              style={{ fontFamily: "'Cal Sans', 'Inter var', ui-sans-serif" }}
            >
              Four pillars. One platform.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {MODULES.map((m) => (
              <div
                key={m.tag}
                className={`relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${m.gradient} p-6`}
              >
                <Badge
                  className="mb-4 border-transparent text-white"
                  style={{ backgroundColor: `${m.accent}33`, color: m.accent }}
                >
                  {m.tag}
                </Badge>
                <h3 className="mb-2 text-xl font-semibold text-fg">{m.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{m.description}</p>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  {m.stats.map((s) => (
                    <div key={s.label} className="rounded-lg border border-border/50 bg-bg/40 px-3 py-2">
                      <p className="text-lg font-bold" style={{ color: m.accent }}>{s.value}</p>
                      <p className="text-xs text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Decorative circle */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10"
                  style={{ background: m.accent }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="py-24">
        <div className="container mx-auto max-w-3xl text-center">
          <svg
            className="mx-auto mb-6 h-8 w-8 text-[#0F766E]"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>

          <blockquote className="text-xl font-medium text-fg leading-relaxed md:text-2xl">
            "Ayura OS cut our discharge-summary turnaround from 40 minutes to under 8. The AI scribe
            alone paid for the annual subscription in the first quarter."
          </blockquote>

          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0F766E] to-teal-400 flex items-center justify-center text-xs font-bold text-white">
              PS
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-fg">Dr. Priya Suresh</p>
              <p className="text-xs text-muted">Medical Director, Sunrise Multispeciality Hospital</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ── */}
      <section id="pricing" className="py-24 bg-surface/40">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2
              className="text-3xl font-semibold tracking-tight text-fg md:text-4xl"
              style={{ fontFamily: "'Cal Sans', 'Inter var', ui-sans-serif" }}
            >
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-muted">
              All plans include onboarding, data migration support, and 99.9% uptime SLA.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border p-6 ${
                  plan.highlight
                    ? "border-[#0F766E]/60 bg-[#0F766E]/10 shadow-[0_0_0_1px_#0F766E/30,0_20px_40px_-12px_#0F766E/20]"
                    : "border-border bg-surface/60"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0F766E] px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}

                <h3 className="text-lg font-semibold text-fg">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted">{plan.description}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-fg">{plan.price}</span>
                  {plan.period && <span className="text-sm text-muted">{plan.period}</span>}
                </div>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted">
                      <span className="text-[#0F766E]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a href="#contact" className="mt-8 block">
                  <Button
                    size="md"
                    className={`w-full ${
                      plan.highlight
                        ? "bg-[#0F766E] hover:bg-[#0F766E]/90 text-white"
                        : ""
                    }`}
                    variant={plan.highlight ? undefined : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </a>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-muted">
            All prices exclusive of GST. Annual billing saves 20%.
          </p>
        </div>
      </section>

      {/* ── Lead capture ── */}
      <section id="contact" className="py-24">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-4">Get started</Badge>
            <h2
              className="text-3xl font-semibold tracking-tight text-fg md:text-4xl"
              style={{ fontFamily: "'Cal Sans', 'Inter var', ui-sans-serif" }}
            >
              Book your personalised demo
            </h2>
            <p className="mt-3 text-muted">
              We'll walk you through a live environment configured for your specialty mix.
              No generic slides — your data, your workflows.
            </p>
          </div>

          <Card className="border-[#0F766E]/20 bg-surface/80">
            <LeadForm />
          </Card>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-[#0F766E] text-[10px] font-bold text-white">
              Ay
            </span>
            <span>Ayura OS — © {new Date().getFullYear()} Ayura Health Technologies Pvt. Ltd.</span>
          </div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-fg transition-colors">Privacy</a>
            <a href="#" className="hover:text-fg transition-colors">Terms</a>
            <a href="#" className="hover:text-fg transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
