"use client";
import React, { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Activity, 
  BedDouble, 
  FlaskConical, 
  Pill,
  BarChart3,
  PieChart as PieIcon,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "summary" | "op" | "ip" | "casualty" | "pharmacy";

export default function MisAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("summary");

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
        
        {/* Modern Tab Switcher */}
        <div className="flex bg-surface/40 p-1 rounded-2xl border border-border/40 backdrop-blur-md w-fit">
          {TABS.map(t => (
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

        {/* Dynamic Content */}
        <div className="space-y-8">
          {activeTab === "summary" && <SummaryView />}
          {activeTab === "op" && <OpView />}
          {activeTab === "ip" && <IpView />}
          {activeTab === "casualty" && <CasualtyView />}
          {activeTab === "pharmacy" && <PharmacyView />}
        </div>

      </main>
    </>
  );
}

// ── SUB-VIEWS ───────────────────────────────────────────────────────────────

function SummaryView() {
  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Top Row: Volume Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value="3,550" change="+12%" positive />
        <StatCard title="Gross Revenue" value="₹1,03,357" change="+8.4%" positive />
        <StatCard title="Total Admissions" value="42" change="-2%" positive={false} />
        <StatCard title="Lab Investigations" value="284" change="+15%" positive />
      </div>

      {/* Payment Modes & Revenue Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue by Mode */}
        <Card className="lg:col-span-1 border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-sm">Revenue Mix (Mode)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PaymentBar label="Cash" amount="₹84,499" percentage={80} color="bg-[#0F766E]" />
            <PaymentBar label="Digital (UPI/Card)" amount="₹18,858" percentage={18} color="bg-blue-500" />
            <PaymentBar label="Credit/Insurance" amount="₹0" percentage={2} color="bg-orange-500" />
          </CardContent>
        </Card>

        {/* Revenue by Department */}
        <Card className="lg:col-span-2 border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Revenue by Department</CardTitle>
            <PieIcon className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-12 py-4">
              <div className="h-40 w-40 rounded-full border-[12px] border-[#0F766E]/10 relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[12px] border-[#0F766E] border-t-transparent border-r-transparent" />
                <span className="text-xl font-bold">43.3%</span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
                <LegendItem color="bg-[#0F766E]" label="In-Patient (IP)" value="43%" />
                <LegendItem color="bg-blue-500" label="Emergency" value="37%" />
                <LegendItem color="bg-purple-500" label="Lab / LIMS" value="15%" />
                <LegendItem color="bg-orange-500" label="Pharmacy" value="5%" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OpView() {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
        <StatCard title="New Patients" value="13" change="+5%" positive />
        <StatCard title="Old (Return) Patients" value="22" change="+3%" positive />
        <StatCard title="Follow Ups" value="20" change="-1%" positive={false} />
        <StatCard title="OP Conversion" value="12%" change="+2%" positive />
      </div>
      {/* Charts placeholder */}
      <Card className="h-64 border-dashed border-border/40 bg-surface/20 flex items-center justify-center">
        <p className="text-muted text-sm italic">OP Appointment & Revenue Trends Loading...</p>
      </Card>
    </div>
  );
}

function IpView() {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Current Census" value="16 / 55" change="29% Occupied" neutral />
        <StatCard title="Admissions Today" value="2" change="+1" positive />
        <StatCard title="Discharges" value="3" change="Steady" neutral />
        <StatCard title="Avg stay" value="7 Days" change="-1 Day" positive />
      </div>
      <Card className="h-64 border-dashed border-border/40 bg-surface/20 flex items-center justify-center">
        <p className="text-muted text-sm italic">Occupancy Heatmap & Billing Breakdown...</p>
      </Card>
    </div>
  );
}

function CasualtyView() {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-border/40 bg-surface/50">
          <CardHeader><CardTitle className="text-sm">ER Revenue by Service</CardTitle></CardHeader>
          <CardContent className="space-y-6 pt-4">
             <PaymentBar label="Procedure Charges" amount="₹12,400" percentage={55} color="bg-purple-500" />
             <PaymentBar label="Bed Charges" amount="₹8,200" percentage={45} color="bg-blue-500" />
          </CardContent>
        </Card>
        <Card className="h-64 border-dashed border-border/40 bg-surface/20 flex items-center justify-center">
          <p className="text-muted text-sm italic">Casualty Wait-Time Analytics...</p>
        </Card>
      </div>
    </div>
  );
}

function PharmacyView() {
  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Daily Sales" value="₹76,916" change="+12%" positive />
        <StatCard title="Purchase (PO)" value="₹40,841" change="Managed" neutral />
        <StatCard title="Supplier Dues" value="₹0" change="On track" positive />
        <StatCard title="Stock Value" value="₹50.4L" change="MRP" neutral />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border/40 bg-surface/50">
          <CardHeader><CardTitle className="text-sm">Sales Split</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PaymentBar label="Out-Patient (OP)" amount="₹38,450" percentage={50} color="bg-[#0F766E]" />
            <PaymentBar label="In-Patient (IP)" amount="₹38,460" percentage={50} color="bg-blue-500" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 border-border/40 bg-surface/50">
           <CardHeader><CardTitle className="text-sm">Top 5 Vendors / Manufacturers</CardTitle></CardHeader>
           <CardContent className="space-y-4">
              <LegendItem color="bg-[#0F766E]" label="Girish Surgicals" value="46.7%" />
              <LegendItem color="bg-blue-500" label="JBS Rehab" value="38.3%" />
           </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── SHARED UI COMPONENTS ──────────────────────────────────────────────────

function StatCard({ title, value, change, positive, neutral = false }: any) {
  return (
    <Card className="border-border/40 bg-surface/50 hover:bg-white/5 transition-all group overflow-hidden">
      <CardContent className="pt-6 relative">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-fg tracking-tight">{value}</h3>
        <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          neutral ? "bg-muted/10 text-muted" : 
          positive ? "bg-[#0F766E]/10 text-[#0F766E]" : "bg-red-500/10 text-red-500"
        }`}>
          {change}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentBar({ label, amount, percentage, color }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted font-medium">{label}</span>
        <span className="text-fg font-mono font-bold">{amount}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function LegendItem({ color, label, value }: any) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b border-border/5">
      <div className="flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full", color)} />
        <span className="text-muted">{label}</span>
      </div>
      <span className="font-mono font-bold text-[#0F766E]">{value}</span>
    </div>
  );
}
