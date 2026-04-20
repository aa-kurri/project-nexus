"use client";

import { useState, useEffect, useTransition } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, ShieldAlert, Info, CheckCircle2,
  RefreshCw, Loader2, Activity, TrendingUp, TrendingDown,
  BedDouble, FlaskConical, Users, DollarSign,
} from "lucide-react";
import {
  detectAnomalies, getActiveAlerts, acknowledgeAlert, getAlertHistory,
} from "./actions";
import type { AnomalyAlert } from "./actions";

// ── Config ────────────────────────────────────────────────────────────────────

const SEVERITY_CFG = {
  critical: { label: "Critical", color: "text-red-400 bg-red-500/10 border-red-500/30",     icon: ShieldAlert   },
  warning:  { label: "Warning",  color: "text-amber-400 bg-amber-500/10 border-amber-500/30", icon: AlertTriangle },
  info:     { label: "Info",     color: "text-blue-400 bg-blue-500/10 border-blue-500/30",   icon: Info          },
} as const;

const METRIC_CFG: Record<string, { label: string; icon: React.ElementType; unit?: string }> = {
  opd_visits:     { label: "OPD Visits",     icon: Users,        unit: "visits"  },
  ipd_admissions: { label: "IPD Admissions", icon: BedDouble,    unit: "admits"  },
  lab_tests:      { label: "Lab Tests",       icon: FlaskConical, unit: "tests"   },
  revenue:        { label: "Revenue",         icon: DollarSign,   unit: "₹"       },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtVal(metric: string, v: number) {
  if (metric === "revenue") return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  return v.toLocaleString();
}

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AnomaliesPage() {
  const [alerts,  setAlerts]  = useState<AnomalyAlert[]>([]);
  const [history, setHistory] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, startScan] = useTransition();
  const [tab, setTab] = useState<"active" | "history">("active");

  async function loadData() {
    setLoading(true);
    const [active, hist] = await Promise.all([getActiveAlerts(), getAlertHistory()]);
    setAlerts(active);
    setHistory(hist);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function runScan() {
    startScan(async () => {
      const active = await detectAnomalies();
      setAlerts(active);
      const hist = await getAlertHistory();
      setHistory(hist);
    });
  }

  async function ack(id: string) {
    await acknowledgeAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setHistory((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  }

  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning  = alerts.filter((a) => a.severity === "warning").length;

  return (
    <>
      <TopBar title="ML Anomaly Detection" />
      <main className="p-8 space-y-6">

        {/* Summary + scan */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-3">
            {critical > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                <span className="text-sm font-bold text-red-400">{critical} Critical</span>
              </div>
            )}
            {warning > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">{warning} Warning</span>
              </div>
            )}
            {alerts.length === 0 && !loading && (
              <div className="flex items-center gap-2 rounded-xl border border-[#0F766E]/30 bg-[#0F766E]/10 px-4 py-2">
                <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                <span className="text-sm font-bold text-[#0F766E]">All metrics normal</span>
              </div>
            )}
          </div>
          <button
            onClick={runScan}
            disabled={scanning}
            className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Run Detection Now
          </button>
        </div>

        {/* How it works */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardContent className="p-4 flex items-start gap-3">
            <Activity className="h-4 w-4 text-[#0F766E] mt-0.5 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Statistical anomaly detection using <span className="text-slate-200 font-semibold">Z-score on a 7-day rolling baseline</span>.
              Flags today's OPD visits, IPD admissions, lab tests, and revenue when they deviate
              more than <span className="text-amber-400 font-semibold">2σ (warning)</span> or{" "}
              <span className="text-red-400 font-semibold">3σ (critical)</span> from the rolling mean.
              Click <em>Run Detection Now</em> to analyse today's data.
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/8 w-fit">
          {(["active", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                tab === t ? "bg-[#0F766E] text-white" : "text-slate-400 hover:text-white"
              )}
            >
              {t === "active" ? `Active (${alerts.length})` : "History (30d)"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-500">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm">Loading alerts…</span>
          </div>
        ) : tab === "active" ? (
          <ActiveTab alerts={alerts} onAck={ack} />
        ) : (
          <HistoryTab history={history} />
        )}
      </main>
    </>
  );
}

// ── Active Alerts Tab ─────────────────────────────────────────────────────────

function ActiveTab({ alerts, onAck }: { alerts: AnomalyAlert[]; onAck: (id: string) => void }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-600 gap-3">
        <CheckCircle2 className="h-10 w-10 opacity-30 text-[#0F766E]" />
        <p className="text-sm">No active anomalies detected</p>
        <p className="text-xs text-slate-700">Run detection to analyse today's metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onAck={onAck} />
      ))}
    </div>
  );
}

function AlertCard({ alert, onAck }: { alert: AnomalyAlert; onAck: (id: string) => void }) {
  const sev  = SEVERITY_CFG[alert.severity];
  const met  = METRIC_CFG[alert.metric] ?? { label: alert.metric, icon: Activity };
  const SevIcon = sev.icon;
  const MetIcon = met.icon;
  const isUp    = alert.value > alert.baseline;
  const TrendIcon = isUp ? TrendingUp : TrendingDown;
  const trendColor = isUp ? "text-red-400" : "text-blue-400";

  return (
    <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-2.5 rounded-xl border shrink-0",
            sev.color
          )}>
            <SevIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                <MetIcon className="h-3.5 w-3.5 text-slate-400" />
                {met.label}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                sev.color
              )}>
                <SevIcon className="h-3 w-3" />
                {sev.label}
              </span>
              <span className="text-[10px] text-slate-600 ml-auto">{fmtTs(alert.created_at)}</span>
            </div>
            <div className="flex items-center gap-6 text-sm mt-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Today</p>
                <p className={cn("font-bold", trendColor)}>
                  {fmtVal(alert.metric, alert.value)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">7-Day Baseline</p>
                <p className="font-semibold text-slate-300">{fmtVal(alert.metric, alert.baseline)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Z-Score</p>
                <p className="font-bold text-slate-200 flex items-center gap-1">
                  <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
                  {alert.z_score > 0 ? "+" : ""}{alert.z_score.toFixed(2)}σ
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => onAck(alert.id)}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Acknowledge
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab({ history }: { history: AnomalyAlert[] }) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-600 gap-2">
        <Activity className="h-10 w-10 opacity-30" />
        <p className="text-sm">No alert history in the last 30 days</p>
      </div>
    );
  }

  return (
    <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
      <CardContent className="pt-0 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 uppercase tracking-widest border-b border-white/5">
              <th className="text-left py-3 pr-4 font-medium">Metric</th>
              <th className="text-right py-3 px-3 font-medium">Value</th>
              <th className="text-right py-3 px-3 font-medium">Baseline</th>
              <th className="text-right py-3 px-3 font-medium">Z-Score</th>
              <th className="text-center py-3 px-3 font-medium">Severity</th>
              <th className="text-center py-3 px-3 font-medium">Status</th>
              <th className="text-right py-3 pl-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {history.map((a) => {
              const sev = SEVERITY_CFG[a.severity];
              const met = METRIC_CFG[a.metric] ?? { label: a.metric, icon: Activity };
              const SevIcon = sev.icon;
              return (
                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 pr-4 text-slate-300 font-medium">{met.label}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-200">{fmtVal(a.metric, a.value)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">{fmtVal(a.metric, a.baseline)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {a.z_score > 0 ? "+" : ""}{a.z_score.toFixed(2)}σ
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                      sev.color
                    )}>
                      <SevIcon className="h-3 w-3" />
                      {sev.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {a.acknowledged ? (
                      <span className="text-slate-600 text-[10px]">Acknowledged</span>
                    ) : (
                      <span className="text-amber-400 text-[10px] font-semibold">Active</span>
                    )}
                  </td>
                  <td className="py-2.5 pl-3 text-right text-slate-500 font-mono">{fmtTs(a.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
