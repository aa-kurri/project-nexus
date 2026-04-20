"use client";

import { useState, useEffect, useTransition } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowUpRight, ArrowDownRight, Flame, Snowflake, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPharmacyStats, type PharmacyStats } from "./actions";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function StatCard({ title, value, change, positive }: { title: string; value: string; change: string; positive: boolean }) {
  return (
    <Card className="border-border/40 bg-surface/50">
      <CardContent className="pt-6">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{title}</p>
        <div className="flex items-end justify-between mt-1">
          <h3 className="text-2xl font-bold text-fg tracking-tight">{value}</h3>
          <div className={cn("text-[10px] font-bold flex items-center gap-0.5", positive ? "text-[#0F766E]" : "text-red-500")}>
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {change}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPharmacyPage() {
  const [stats, setStats] = useState<PharmacyStats | null>(null);
  const [, startTx] = useTransition();

  useEffect(() => {
    startTx(async () => {
      const data = await getPharmacyStats();
      setStats(data);
    });
  }, []);

  const maxMonthly = Math.max(...(stats?.monthlyRevenue ?? [1]), 1);
  const now = new Date();
  const currentMonthIdx = now.getMonth();

  return (
    <>
      <TopBar title="Pharmacy Performance Analytics" action={{ label: "MIS Reports", href: "/analytics/mis" }} />
      <main className="p-8 space-y-8">

        {!stats ? (
          <div className="flex items-center justify-center py-24 gap-3 text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />
            <span className="text-sm">Loading pharmacy data…</span>
          </div>
        ) : (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Gross Revenue (MTD)"
                value={fmt(stats.grossRevenue)}
                change={`${stats.revenueChange > 0 ? "+" : ""}${stats.revenueChange}%`}
                positive={stats.revenueChange >= 0}
              />
              <StatCard
                title="Last Month Revenue"
                value={fmt(stats.lastMonthRevenue)}
                change="vs prior month"
                positive={stats.grossRevenue >= stats.lastMonthRevenue}
              />
              <StatCard
                title="Total Prescriptions"
                value={stats.totalPrescriptions.toLocaleString()}
                change="all time"
                positive
              />
              <StatCard
                title="Avg Prescription Value"
                value={fmt(stats.avgPrescriptionValue)}
                change="per Rx"
                positive
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top items table */}
              <Card className="lg:col-span-1 border-border/40 bg-surface/50">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm">Top Items by Revenue</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {stats.topItems.length === 0 ? (
                    <p className="text-xs text-muted text-center py-6">No billing data yet.</p>
                  ) : (
                    stats.topItems.map((item, i) => {
                      const maxRev = stats.topItems[0]?.revenue ?? 1;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 truncate pr-2 max-w-[160px]">{item.name}</span>
                            <span className="font-mono text-[#0F766E] shrink-0">{fmt(item.revenue)}</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0F766E]/70 rounded-full"
                              style={{ width: `${Math.round((item.revenue / maxRev) * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* 12-month revenue trend */}
              <Card className="lg:col-span-2 border-border/40 bg-surface/50">
                <CardHeader className="border-b border-border/20 pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#0F766E]" /> 12-Month Revenue Trend
                  </CardTitle>
                  <span className="text-[10px] text-muted">From live billing data</span>
                </CardHeader>
                <CardContent className="h-[260px] flex items-end gap-1 pb-6 pt-8">
                  {stats.monthlyRevenue.map((val, i) => {
                    const monthIdx = (currentMonthIdx - 11 + i + 12) % 12;
                    const isCurrent = i === 11;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            "w-full rounded-t-sm transition-all",
                            isCurrent ? "bg-[#0F766E]" : "bg-[#0F766E]/30 hover:bg-[#0F766E]/50"
                          )}
                          style={{ height: `${Math.max(4, Math.round((val / maxMonthly) * 100))}%` }}
                          title={`${MONTHS_SHORT[monthIdx]}: ${fmt(val)}`}
                        />
                        <span className="text-[8px] text-muted font-mono">
                          {MONTHS_SHORT[monthIdx]}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Fast / Slow movers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/40 bg-surface/50 overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-2 border-b border-border/10 bg-black/10">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Fast Moving — Top Rx Drugs</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {stats.fastMoving.length === 0 ? (
                    <p className="text-xs text-muted text-center py-4">No prescription data.</p>
                  ) : (
                    stats.fastMoving.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-3 rounded-lg bg-black/20 border border-border/10">
                        <span className="font-medium text-muted-foreground truncate pr-2">{d.name}</span>
                        <span className="font-mono text-xs font-bold text-orange-400 shrink-0">{d.count} Rx</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-surface/50 overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-2 border-b border-border/10 bg-black/10">
                  <Snowflake className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Slow Moving — Low Rx Drugs</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {stats.slowMoving.length === 0 ? (
                    <p className="text-xs text-muted text-center py-4">No prescription data.</p>
                  ) : (
                    stats.slowMoving.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-3 rounded-lg bg-black/20 border border-border/10">
                        <span className="font-medium text-muted-foreground truncate pr-2">{d.name}</span>
                        <span className="font-mono text-xs font-bold text-blue-400 shrink-0">{d.count} Rx</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  );
}
