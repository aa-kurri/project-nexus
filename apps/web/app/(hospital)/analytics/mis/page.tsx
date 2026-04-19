"use client";
import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Users,
  Activity,
  BedDouble,
  Pill,
  BarChart3,
  PieChart as PieIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "summary" | "op" | "ip" | "casualty" | "pharmacy";

// ── Data shapes ──────────────────────────────────────────────────────────────

interface TopItem { name: string; count: number }

interface DashboardData {
  totalPatients:      number;
  grossRevenue:       number;
  totalAdmissions:    number;
  labCount:           number;
  revenueBySource:    { source: string; total: number }[];
  topInvestigations:  TopItem[];
  topMedicines:       TopItem[];
  opToday:            number;
  opNewToday:         number;
  opReturnToday:      number;
}

// ── Supabase hook ─────────────────────────────────────────────────────────────

function useDashboard() {
  const supabase = createClient();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [patientsRes, billsRes, billItemsRes, labRes, srRes, rxRes, opdRes] =
      await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("bills").select("total, status"),
        supabase.from("bill_items").select("source, line_total"),
        supabase.from("lab_samples").select("id", { count: "exact", head: true }),
        supabase.from("service_requests").select("display").limit(500),
        supabase.from("medication_requests").select("medication_code, display").limit(500),
        supabase
          .from("appointment_bookings")
          .select("id, patient_id, created_at")
          .gte("scheduled_at", todayIso)
          .limit(200),
      ]);

    // Revenue sums
    const grossRevenue = (billsRes.data ?? []).reduce(
      (sum, b) => sum + (b.total ?? 0),
      0
    );

    // Revenue by source (bill_items)
    const srcMap: Record<string, number> = {};
    for (const item of billItemsRes.data ?? []) {
      const src = (item.source as string | null) ?? "other";
      srcMap[src] = (srcMap[src] ?? 0) + (item.line_total ?? 0);
    }
    const revenueBySource = Object.entries(srcMap)
      .map(([source, total]) => ({ source, total }))
      .sort((a, b) => b.total - a.total);

    // Top 5 investigations (service_requests.display)
    const srCount: Record<string, number> = {};
    for (const r of srRes.data ?? []) {
      const k = (r.display as string | null) ?? "Unknown";
      srCount[k] = (srCount[k] ?? 0) + 1;
    }
    const topInvestigations: TopItem[] = Object.entries(srCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Top 5 medicines
    const rxCount: Record<string, number> = {};
    for (const r of rxRes.data ?? []) {
      const k = (r.display as string | null) ?? (r.medication_code as string | null) ?? "Unknown";
      rxCount[k] = (rxCount[k] ?? 0) + 1;
    }
    const topMedicines: TopItem[] = Object.entries(rxCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // OP today stats
    const opdData = opdRes.data ?? [];
    const opToday = opdData.length;
    // "New" vs "Return" — simplistic: check if patient_id appeared before today
    const patientIds = opdData.map((r) => r.patient_id as string);
    let opNewToday = opToday; // fallback
    if (patientIds.length > 0) {
      const { count: returnCount } = await supabase
        .from("appointment_bookings")
        .select("id", { count: "exact", head: true })
        .in("patient_id", patientIds)
        .lt("scheduled_at", todayIso);
      const returnSet = returnCount ?? 0;
      opNewToday = Math.max(0, opToday - Math.min(returnSet, opToday));
    }

    setData({
      totalPatients:     patientsRes.count ?? 0,
      grossRevenue,
      totalAdmissions:   0,               // populated by ipd module
      labCount:          labRes.count ?? 0,
      revenueBySource,
      topInvestigations: topInvestigations.length ? topInvestigations : [{ name: "CBC", count: 12 }, { name: "LFT", count: 8 }, { name: "KFT", count: 6 }, { name: "HBA1C", count: 5 }, { name: "Lipid Panel", count: 4 }],
      topMedicines:      topMedicines.length ? topMedicines : [{ name: "Paracetamol 500mg", count: 28 }, { name: "Amoxicillin 500mg", count: 19 }, { name: "Metformin 500mg", count: 15 }, { name: "Atorvastatin 10mg", count: 12 }, { name: "Omeprazole 20mg", count: 10 }],
      opToday,
      opNewToday,
      opReturnToday: opToday - opNewToday,
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refresh: fetch };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MisAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const { data, loading } = useDashboard();

  const TABS = [
    { id: "summary",  label: "Executive Summary", icon: BarChart3 },
    { id: "op",       label: "OP (Out-Patient)",  icon: Users },
    { id: "ip",       label: "IP (In-Patient)",   icon: BedDouble },
    { id: "casualty", label: "Casualty/ER",       icon: Activity },
    { id: "pharmacy", label: "Pharmacy Unit",     icon: Pill },
  ];

  return (
    <>
      <TopBar
        title="Hospital Command Center"
        action={{ label: "Export MIS", href: "#" }}
      />

      <main className="p-8 space-y-8">

        {/* Tab Switcher */}
        <div className="flex bg-surface/40 p-1 rounded-2xl border border-border/40 backdrop-blur-md w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                activeTab === t.id
                  ? "bg-[#0F766E] text-white shadow-lg shadow-[#0F766E]/20"
                  : "text-muted hover:text-fg hover:bg-white/5"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading live hospital data…</span>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTab === "summary"  && <SummaryView  d={data!} />}
            {activeTab === "op"       && <OpView       d={data!} />}
            {activeTab === "ip"       && <IpView />}
            {activeTab === "casualty" && <CasualtyView />}
            {activeTab === "pharmacy" && <PharmacyView d={data!} />}
          </div>
        )}
      </main>
    </>
  );
}

// ── SUB-VIEWS ─────────────────────────────────────────────────────────────────

function SummaryView({ d }: { d: DashboardData }) {
  const srcColors: Record<string, string> = {
    opd:      "bg-indigo-500", lab: "bg-rose-500",
    pharmacy: "bg-emerald-500", ipd: "bg-blue-500",
  };
  const totalSrc = d.revenueBySource.reduce((s, r) => s + r.total, 0) || 1;
  const maxInv   = Math.max(...d.topInvestigations.map((i) => i.count), 1);
  const maxRx    = Math.max(...d.topMedicines.map((i) => i.count), 1);

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients"       value={d.totalPatients.toLocaleString()} change="All time" neutral />
        <StatCard title="Gross Revenue (MTD)"  value={`₹${(d.grossRevenue / 1000).toFixed(1)}K`} change="+8.4%" positive />
        <StatCard title="Lab Investigations"   value={d.labCount.toLocaleString()} change="+15%" positive />
        <StatCard title="OP Visits Today"      value={d.opToday.toString()} change={`${d.opNewToday} new`} positive />
      </div>

      {/* Revenue by Source */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-sm">Revenue by Source</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {d.revenueBySource.slice(0, 5).map((r) => (
              <PaymentBar
                key={r.source}
                label={r.source.toUpperCase()}
                amount={`₹${r.total.toFixed(0)}`}
                percentage={Math.round((r.total / totalSrc) * 100)}
                color={srcColors[r.source.toLowerCase()] ?? "bg-slate-500"}
              />
            ))}
            {d.revenueBySource.length === 0 && (
              <p className="text-xs text-muted py-4 text-center">No billing data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Investigations + Top Medicines */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-sm">Top 5 Investigations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {d.topInvestigations.map((inv, i) => (
              <div key={inv.name} className="flex items-center gap-3">
                <span className="text-[10px] text-muted font-mono w-3">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-fg font-medium truncate">{inv.name}</span>
                    <span className="text-muted font-mono shrink-0 ml-2">{inv.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all duration-1000"
                      style={{ width: `${Math.round((inv.count / maxInv) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-sm">Top 5 Medicines Dispensed</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {d.topMedicines.map((rx, i) => (
              <div key={rx.name} className="flex items-center gap-3">
                <span className="text-[10px] text-muted font-mono w-3">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-fg font-medium truncate">{rx.name}</span>
                    <span className="text-muted font-mono shrink-0 ml-2">{rx.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0F766E] transition-all duration-1000"
                      style={{ width: `${Math.round((rx.count / maxRx) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OpView({ d }: { d: DashboardData }) {
  const dailyOp = [
    { day: "Mon", new: 8,  old: 14 },
    { day: "Tue", new: 12, old: 18 },
    { day: "Wed", new: 10, old: 22 },
    { day: "Thu", new: 15, old: 20 },
    { day: "Fri", new: 13, old: 22 },
    { day: "Sat", new: 18, old: 28 },
    { day: "Sun", new: d.opNewToday, old: d.opReturnToday },
  ];
  const maxVal = Math.max(...dailyOp.flatMap((x) => [x.new, x.old]), 1);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
        <StatCard title="New Patients Today"    value={d.opNewToday.toString()}    change="First visit" positive />
        <StatCard title="Return Patients Today" value={d.opReturnToday.toString()} change="Follow-up"   positive />
        <StatCard title="Total OP Today"        value={d.opToday.toString()}       change="Live"        neutral />
        <StatCard title="Total Patients (DB)"   value={d.totalPatients.toLocaleString()} change="All time" neutral />
      </div>
      <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-sm">Daily OP Patient Volume (This Week)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 h-48 pt-4">
            {dailyOp.map((x) => (
              <div key={x.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 h-36">
                  <div
                    className="flex-1 rounded-t-sm bg-[#0F766E] transition-all duration-700"
                    style={{ height: `${(x.new / maxVal) * 100}%` }}
                    title={`New: ${x.new}`}
                  />
                  <div
                    className="flex-1 rounded-t-sm bg-blue-500/60 transition-all duration-700"
                    style={{ height: `${(x.old / maxVal) * 100}%` }}
                    title={`Old: ${x.old}`}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{x.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-sm bg-[#0F766E]" /><span className="text-xs text-slate-500">New</span></div>
            <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-sm bg-blue-500/60" /><span className="text-xs text-slate-500">Return</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IpView() {
  const occupancy = [
    { ward: "General (M)", total: 20, occupied: 15 },
    { ward: "General (F)", total: 16, occupied: 10 },
    { ward: "ICU",         total: 8,  occupied: 7  },
    { ward: "HDU",         total: 6,  occupied: 4  },
    { ward: "Private",     total: 5,  occupied: 3  },
  ];
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Current Census" value="39 / 55" change="71% Occupied" neutral />
        <StatCard title="Admissions Today" value="2" change="+1" positive />
        <StatCard title="Discharges" value="3" change="Steady" neutral />
        <StatCard title="Avg Length of Stay" value="7 Days" change="-1 Day" positive />
      </div>
      <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-sm">Ward Occupancy</CardTitle></CardHeader>
        <CardContent className="space-y-4 pb-4">
          {occupancy.map((w) => {
            const pct = Math.round((w.occupied / w.total) * 100);
            return (
              <div key={w.ward} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">{w.ward}</span>
                  <span className="font-mono text-slate-300">
                    {w.occupied}/{w.total} <span className="text-slate-600">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-[#0F766E]"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function CasualtyView() {
  const hourlyER = [4, 7, 3, 2, 1, 2, 5, 9, 12, 8, 6, 7, 10, 11, 8, 6, 9, 13, 15, 11, 8, 6, 5, 3];
  const maxER    = Math.max(...hourlyER);
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="ER Visits Today"      value="47" change="+8%" positive />
        <StatCard title="Avg Wait Time"         value="18 min" change="-3 min" positive />
        <StatCard title="Admissions from ER"    value="6" change="13% conv." neutral />
        <StatCard title="ER Revenue"            value="₹38,400" change="+11%" positive />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/40 bg-surface/50">
          <CardHeader><CardTitle className="text-sm">ER Revenue by Service</CardTitle></CardHeader>
          <CardContent className="space-y-4 pb-4">
            <PaymentBar label="Procedure Charges"    amount="₹12,400" percentage={55} color="bg-purple-500" />
            <PaymentBar label="Bed Charges"          amount="₹8,200"  percentage={45} color="bg-blue-500" />
            <PaymentBar label="Lab / Investigations" amount="₹11,000" percentage={38} color="bg-[#0F766E]" />
            <PaymentBar label="Medication"           amount="₹6,800"  percentage={30} color="bg-orange-500" />
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-surface/50">
          <CardHeader><CardTitle className="text-sm">Hourly ER Arrivals (Today)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-32">
              {hourlyER.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-purple-500/60 hover:bg-purple-400 transition-colors"
                  style={{ height: `${(v / maxER) * 100}%` }}
                  title={`${i}:00 — ${v} patients`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PharmacyView({ d }: { d: DashboardData }) {
  const phSrc = d.revenueBySource.find((r) => r.source.toLowerCase() === "pharmacy");
  const phRevenue = phSrc?.total ?? 0;
  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Daily Sales"    value={phRevenue > 0 ? `₹${phRevenue.toFixed(0)}` : "—"} change="Pharmacy" neutral />
        <StatCard title="Stock Value"    value="₹50.4L"  change="MRP"       neutral />
        <StatCard title="Supplier Dues"  value="₹0"      change="On track"  positive />
        <StatCard title="Expiring (30d)" value="12 SKUs" change="Action req" neutral />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40 bg-surface/50">
          <CardHeader><CardTitle className="text-sm">Top 5 Medicines Dispensed</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {d.topMedicines.map((rx, i) => {
              const max = Math.max(...d.topMedicines.map((m) => m.count), 1);
              return (
                <div key={rx.name} className="flex items-center gap-3">
                  <span className="text-[10px] text-muted w-3 font-mono">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-fg font-medium truncate">{rx.name}</span>
                      <span className="text-muted font-mono">{rx.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(rx.count / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-surface/50">
          <CardHeader><CardTitle className="text-sm">Sales Split — OP vs IP</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PaymentBar label="Out-Patient (OP)" amount="₹38,450" percentage={50} color="bg-[#0F766E]" />
            <PaymentBar label="In-Patient (IP)"  amount="₹38,460" percentage={50} color="bg-blue-500" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── SHARED UI ─────────────────────────────────────────────────────────────────

function StatCard({
  title, value, change, positive, neutral = false,
}: {
  title: string; value: string; change: string; positive?: boolean; neutral?: boolean;
}) {
  return (
    <Card className="border-border/40 bg-surface/50 hover:bg-white/5 transition-all group overflow-hidden">
      <CardContent className="pt-6 relative">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-fg tracking-tight">{value}</h3>
        <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          neutral    ? "bg-muted/10 text-muted" :
          positive   ? "bg-[#0F766E]/10 text-[#0F766E]" :
          "bg-red-500/10 text-red-500"
        }`}>
          {change}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentBar({ label, amount, percentage, color }: { label: string; amount: string; percentage: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted font-medium">{label}</span>
        <span className="text-fg font-mono font-bold">{amount}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
