import Link from "next/link";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  PieChart, BarChart3, BedDouble,
  FlaskConical, Users, DollarSign, ShieldAlert,
} from "lucide-react";

const MODULES = [
  {
    title:   "MIS Reports",
    desc:    "Executive census, revenue & department breakdown",
    icon:    BarChart3,
    href:    "/analytics/mis",
    badge:   "Live",
  },
  {
    title:   "Revenue Intelligence",
    desc:    "12-week billing trend, forecasts & top revenue drivers",
    icon:    DollarSign,
    href:    "/analytics/revenue-ai",
    badge:   "Live",
  },
  {
    title:   "Patient Intelligence",
    desc:    "New registrations, demographics & return-visit patterns",
    icon:    Users,
    href:    "/analytics/patient-intelligence",
    badge:   "Live",
  },
  {
    title:   "Anomaly Detection",
    desc:    "ML Z-score alerts for OPD, IPD, lab & revenue spikes",
    icon:    ShieldAlert,
    href:    "/analytics/anomalies",
    badge:   "AI",
  },
  {
    title:   "Pharmacy Analytics",
    desc:    "Revenue, top items, fast/slow movers from live billing",
    icon:    PieChart,
    href:    "/analytics/pharmacy",
    badge:   "Live",
  },
  {
    title:   "Medicine Intelligence",
    desc:    "Drug velocity, stockout risk & prescription trends",
    icon:    FlaskConical,
    href:    "/analytics/medicine-trends",
    badge:   "Live",
  },
  {
    title:   "AI Bed Flow",
    desc:    "Live bed occupancy + 7-day capacity forecast by ward",
    icon:    BedDouble,
    href:    "/analytics/bedflow",
    badge:   "AI",
  },
];

const BADGE_STYLE: Record<string, string> = {
  Live: "bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/30",
  AI:   "bg-blue-500/10 text-blue-400 border border-blue-500/30",
};

export default function AnalyticsPage() {
  return (
    <>
      <TopBar title="Hospital Analytics" />
      <main className="p-8">
        <p className="text-sm text-muted mb-6">
          All modules pull from live Supabase data — no mocks.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href}>
              <Card className="hover:border-[#0F766E]/50 transition-all cursor-pointer group h-full">
                <CardHeader>
                  <div className="mb-3 flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#0F766E]/10 flex items-center justify-center">
                      <m.icon className="h-5 w-5 text-[#0F766E]" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE_STYLE[m.badge]}`}>
                      {m.badge}
                    </span>
                  </div>
                  <CardTitle className="group-hover:text-[#0F766E] transition-colors text-base">
                    {m.title}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed">{m.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
