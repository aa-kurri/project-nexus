"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Stethoscope, Pill, FlaskConical, Scan, UtensilsCrossed,
  CheckCircle2, Clock, AlertTriangle, Plus, Send, Mic2, ChevronDown,
} from "lucide-react";

type OrderType = "medication" | "lab" | "radiology" | "diet" | "nursing";
type OrderStatus = "active" | "pending_cosign" | "completed" | "discontinued";

const TYPE_CFG: Record<OrderType, { icon: React.ElementType; color: string; label: string }> = {
  medication: { icon: Pill,           color: "text-blue-400 bg-blue-500/10",   label: "Medication"  },
  lab:        { icon: FlaskConical,   color: "text-pink-400 bg-pink-500/10",   label: "Lab"         },
  radiology:  { icon: Scan,           color: "text-cyan-400 bg-cyan-500/10",   label: "Radiology"   },
  diet:       { icon: UtensilsCrossed,color: "text-yellow-400 bg-yellow-500/10",label: "Diet"        },
  nursing:    { icon: Stethoscope,    color: "text-purple-400 bg-purple-500/10",label: "Nursing"     },
};

const STATUS_CFG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  active:          { label: "Active",          color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",   icon: CheckCircle2 },
  pending_cosign:  { label: "Pending Co-sign", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock        },
  completed:       { label: "Completed",       color: "text-slate-500 bg-white/5 border-white/8",              icon: CheckCircle2 },
  discontinued:    { label: "Discontinued",    color: "text-red-400 bg-red-500/10 border-red-500/20",          icon: AlertTriangle},
};

interface CpoeOrder {
  id: string;
  patientName: string;
  uhid: string;
  bed: string;
  type: OrderType;
  orderText: string;
  details: string;
  orderedBy: string;
  orderedAt: string;
  status: OrderStatus;
  aiGenerated: boolean;
}

const ORDERS: CpoeOrder[] = [
  { id: "ORD-001", patientName: "Ramesh Kumar",   uhid: "AY-00412", bed: "IPD-204",  type: "medication", orderText: "Inj. Ceftriaxone 1g IV",             details: "BD × 5 days, dilute in 100ml NS",                orderedBy: "Dr. Venkat",  orderedAt: "10:15",  status: "active",         aiGenerated: true  },
  { id: "ORD-002", patientName: "Ramesh Kumar",   uhid: "AY-00412", bed: "IPD-204",  type: "medication", orderText: "Tab. Pantoprazole 40mg PO",           details: "OD before breakfast",                            orderedBy: "Dr. Venkat",  orderedAt: "10:15",  status: "active",         aiGenerated: true  },
  { id: "ORD-003", patientName: "Sunita Sharma",  uhid: "AY-00389", bed: "ICU-2",    type: "lab",        orderText: "ABG + CBC + LFT + RFT",               details: "STAT, repeat ABG at 6h",                         orderedBy: "Dr. Priya",   orderedAt: "08:30",  status: "active",         aiGenerated: false },
  { id: "ORD-004", patientName: "Sunita Sharma",  uhid: "AY-00389", bed: "ICU-2",    type: "nursing",    orderText: "Continuous cardiac monitoring",       details: "HR, BP, SpO2, RR — alert if SpO2 < 90%",         orderedBy: "Dr. Priya",   orderedAt: "08:30",  status: "active",         aiGenerated: false },
  { id: "ORD-005", patientName: "George Mathew",  uhid: "AY-00345", bed: "IPD-112",  type: "radiology",  orderText: "X-ray Chest PA",                     details: "Pre-op assessment for knee replacement",         orderedBy: "Dr. Ortho",   orderedAt: "11:00",  status: "pending_cosign", aiGenerated: false },
  { id: "ORD-006", patientName: "George Mathew",  uhid: "AY-00345", bed: "IPD-112",  type: "diet",       orderText: "Low salt, diabetic diet",             details: "1600 kcal, 40g protein, no added salt",          orderedBy: "Dr. Ortho",   orderedAt: "11:05",  status: "active",         aiGenerated: true  },
  { id: "ORD-007", patientName: "Priya Venkatesh",uhid: "AY-00298", bed: "WARD-301", type: "medication", orderText: "Tab. Ferrous Sulfate 200mg PO",       details: "BD after meals × 30 days",                       orderedBy: "Dr. Gynae",   orderedAt: "09:00",  status: "completed",      aiGenerated: false },
  { id: "ORD-008", patientName: "Arun Nair",      uhid: "AY-00267", bed: "IPD-215",  type: "medication", orderText: "Inj. Morphine 4mg IV PRN",            details: "For pain score > 6; max q4h; witness required", orderedBy: "Dr. Ramesh",  orderedAt: "14:22",  status: "active",         aiGenerated: false },
];

const NEW_ORDER_TYPES: { key: OrderType; label: string; icon: React.ElementType }[] = [
  { key: "medication", label: "Medication", icon: Pill            },
  { key: "lab",        label: "Lab",        icon: FlaskConical    },
  { key: "radiology",  label: "Radiology",  icon: Scan            },
  { key: "diet",       label: "Diet",       icon: UtensilsCrossed },
  { key: "nursing",    label: "Nursing",    icon: Stethoscope     },
];

export default function CpoePage() {
  const [filter, setFilter]     = useState<OrderType | "ALL">("ALL");
  const [orders, setOrders]     = useState<CpoeOrder[]>(ORDERS);
  const [newType, setNewType]   = useState<OrderType>("medication");

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.type === filter);

  const counts = (Object.keys(TYPE_CFG) as OrderType[]).map((t) => ({
    type: t, count: orders.filter((o) => o.type === t && o.status === "active").length,
  }));

  function cosign(id: string) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "active" as OrderStatus } : o));
  }

  return (
    <>
      <TopBar title="CPOE — Active Orders" action={{ label: "New Order", href: "#" }} />
      <main className="p-8 space-y-6">

        {/* Order type summary */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setFilter("ALL")}
            className={cn("px-4 py-2 rounded-xl border text-sm font-medium transition-all",
              filter === "ALL" ? "bg-[#0F766E]/15 border-[#0F766E]/30 text-[#0F766E]" : "border-white/8 text-muted hover:bg-white/5")}>
            All Active Orders
          </button>
          {counts.map(({ type, count }) => {
            const cfg = TYPE_CFG[type];
            const Icon = cfg.icon;
            return (
              <button key={type} onClick={() => setFilter(type)}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                  filter === type ? "bg-[#0F766E]/15 border-[#0F766E]/30 text-[#0F766E]" : "border-white/8 text-muted hover:bg-white/5")}>
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}
                <span className="text-xs bg-white/10 px-1.5 rounded-full">{count}</span>
              </button>
            );
          })}
        </div>

        {/* AI-generated highlight */}
        <div className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
          <Mic2 className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            <strong className="text-purple-400">AI Scribe →</strong> 3 orders in this view were auto-generated from Dr. Venkat's voice consultation.
            Review and confirm before routing to pharmacy/LIMS.
          </p>
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="border-b border-border/20 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Order Board</CardTitle>
              <span className="text-xs text-slate-500">{orders.filter(o => o.status === "active").length} active · {orders.filter(o => o.status === "pending_cosign").length} pending co-sign</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-white/5">
              {filtered.map((o) => {
                const tCfg  = TYPE_CFG[o.type];
                const sCfg  = STATUS_CFG[o.status];
                const TIcon = tCfg.icon;
                return (
                  <div key={o.id} className="flex items-start gap-4 py-3.5 hover:bg-white/[0.01] transition-colors">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", tCfg.color)}>
                      <TIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-slate-100 text-sm">{o.orderText}</span>
                        {o.aiGenerated && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-bold uppercase">
                            <Mic2 className="h-2.5 w-2.5" /> AI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{o.details}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                        <span>{o.patientName} · {o.uhid} · {o.bed}</span>
                        <span>·</span>
                        <span>{o.orderedBy} @ {o.orderedAt}</span>
                      </div>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0", sCfg.color)}>
                      <sCfg.icon className="h-3 w-3" />
                      {sCfg.label}
                    </span>
                    {o.status === "pending_cosign" && (
                      <button onClick={() => cosign(o.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F766E] text-white text-[10px] font-bold hover:bg-[#0F766E]/90 transition-all shrink-0">
                        <Send className="h-3 w-3" /> Approve
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick order entry */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#0F766E]" /> Quick Order Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 mb-4">
              {NEW_ORDER_TYPES.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setNewType(key)}
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    newType === key ? "bg-[#0F766E]/15 border-[#0F766E]/30 text-[#0F766E]" : "border-white/8 text-muted hover:bg-white/5")}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <input placeholder={`Search ${newType} to order…`}
                  className="w-full bg-black/20 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#0F766E]/50 placeholder:text-slate-600" />
              </div>
              <div className="flex gap-2">
                <input placeholder="Patient / Bed" className="flex-1 bg-black/20 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#0F766E]/50 placeholder:text-slate-600" />
                <button className="px-4 py-2 rounded-lg bg-[#0F766E] text-white text-sm font-bold hover:bg-[#0F766E]/90 transition-all">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
