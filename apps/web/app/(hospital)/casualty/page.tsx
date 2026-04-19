import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Receipt, Activity, BarChart3 } from "lucide-react";
import Link from "next/link";

const modules = [
  {
    title: "Emergency Registration",
    desc:  "Register walk-in & emergency patients, capture chief complaint and vitals",
    icon:  UserPlus,
    href:  "/casualty/registration",
    color: "bg-red-500/10 text-red-400",
  },
  {
    title: "Casualty Billing",
    desc:  "Generate and reprint casualty bills — procedures, bed, investigations",
    icon:  Receipt,
    href:  "/casualty/billing",
    color: "bg-orange-500/10 text-orange-400",
  },
  {
    title: "Casualty Dashboard",
    desc:  "Live ER queue, triage status, wait times and admission funnel",
    icon:  Activity,
    href:  "/casualty/dashboard",
    color: "bg-purple-500/10 text-purple-400",
  },
  {
    title: "ER Analytics",
    desc:  "Hourly arrivals, LWBS rate, disposition splits, revenue report",
    icon:  BarChart3,
    href:  "/analytics/mis",
    color: "bg-blue-500/10 text-blue-400",
  },
];

export default function CasualtyPage() {
  return (
    <>
      <TopBar title="Casualty / Emergency" action={{ label: "New Emergency", href: "/casualty/registration" }} />
      <main className="p-8 space-y-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 flex items-center gap-3">
          <Activity className="h-5 w-5 text-red-400 animate-pulse shrink-0" />
          <p className="text-sm text-slate-300">
            Emergency department — <span className="font-bold text-red-400">6 patients</span> currently in queue ·{" "}
            <span className="text-slate-400">Avg wait: 18 min</span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {modules.map((m) => (
            <Link key={m.title} href={m.href}>
              <Card className="hover:border-accent/50 transition-colors cursor-pointer group h-full">
                <CardHeader>
                  <div className={`mb-2 w-10 h-10 rounded-lg flex items-center justify-center ${m.color}`}>
                    <m.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="group-hover:text-[#0F766E] transition-colors">{m.title}</CardTitle>
                  <CardDescription>{m.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
