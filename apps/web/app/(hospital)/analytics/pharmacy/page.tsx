"use client";
import React from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  ArrowRightLeft,
  PieChart as PieIcon,
  BarChart3,
  Flame,
  Snowflake
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalyticsPharmacyPage() {
  return (
    <>
      <TopBar 
        title="Pharmacy Performance Analytics" 
        action={{ label: "View MIS", href: "/analytics/mis" }}
      />
      <main className="p-8 space-y-8">
        
        {/* Core Sales KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Gross Sales" value="₹2,14,500" change="+18%" positive />
          <StatCard title="Net Margin" value="22.5%" change="+2.4%" positive />
          <StatCard title="Avg Prescription" value="₹420" change="-5%" positive={false} />
          <StatCard title="Stock Turnover" value="1.2x" change="+0.1" positive />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Mix Donut */}
          <Card className="lg:col-span-1 border-border/40 bg-surface/50 backdrop-blur-xl">
             <CardHeader><CardTitle className="text-sm">Revenue Mix by Category</CardTitle></CardHeader>
             <CardContent className="space-y-6 pt-4">
                <ModernDonut percentage={45} label="Analgesics" amount="₹96K" color="bg-[#0F766E]" />
                <div className="space-y-2">
                   <LegendItem color="bg-blue-500" label="Antibiotics" value="30%" />
                   <LegendItem color="bg-purple-500" label="Dermatology" value="15%" />
                   <LegendItem color="bg-muted" label="Generic OTC" value="10%" />
                </div>
             </CardContent>
          </Card>

          {/* Sales Trend Bar Chart */}
          <Card className="lg:col-span-2 border-border/40 bg-surface/50 backdrop-blur-xl">
             <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Monthly Sales Trend</CardTitle>
                <div className="flex gap-1">
                   <div className="px-2 py-0.5 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-[10px] font-bold">REVENUE</div>
                   <div className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold">QTY</div>
                </div>
             </CardHeader>
             <CardContent className="h-[280px] flex items-end justify-around pb-4 pt-8 group">
                {[45, 60, 40, 75, 90, 65, 80, 55, 100, 85, 70, 95].map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 w-full max-w-[20px]">
                     <div 
                       className="w-full bg-[#0F766E]/20 hover:bg-[#0F766E]/40 transition-all rounded-t-sm relative"
                       style={{ height: `${h}%` }}
                     >
                        <div className="absolute inset-x-0 bottom-0 bg-[#0F766E]/40 h-1/2 rounded-t-sm" />
                     </div>
                     <span className="text-[8px] text-muted-foreground font-bold">M{i+1}</span>
                  </div>
                ))}
             </CardContent>
          </Card>
        </div>

        {/* Moving Items Heatmap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <MovementCard title="Fast Moving SKUs" icon={Flame} color="text-orange-500" items={[
             { label: "Paracetamol 500", val: "840 units / day" },
             { label: "Citrizine Tab", val: "420 units / day" }
           ]} />
           <MovementCard title="Slow Moving / Dead Stock" icon={Snowflake} color="text-blue-500" items={[
             { label: "Complex Ortho Inject", val: "0.2 units / day" },
             { label: "Rare Blood Factor IX", val: "0.01 units / day" }
           ]} />
        </div>

      </main>
    </>
  );
}

function StatCard({ title, value, change, positive }: any) {
  return (
    <Card className="border-border/40 bg-surface/50 border-t-[#0F766E]/20">
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

function ModernDonut({ percentage, label, amount, color }: any) {
  return (
    <div className="flex items-center gap-6 p-4 rounded-2xl bg-black/20 border border-border/10">
       <div className="h-16 w-16 rounded-full border-[6px] border-[#0F766E]/10 relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[6px] border-[#0F766E] border-t-transparent border-r-transparent rotate-12" />
          <span className="text-xs font-bold">{percentage}%</span>
       </div>
       <div>
          <p className="text-[10px] font-bold text-muted uppercase">{label}</p>
          <p className="text-lg font-bold text-fg">{amount}</p>
       </div>
    </div>
  );
}

function LegendItem({ color, label, value }: any) {
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <div className="flex items-center gap-2">
        <div className={cn("h-1.5 w-1.5 rounded-full", color)} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-bold text-fg">{value}</span>
    </div>
  );
}

function MovementCard({ title, icon: Icon, color, items }: any) {
  return (
    <Card className="border-border/40 bg-surface/50 overflow-hidden">
       <CardHeader className="flex flex-row items-center gap-2 border-b border-border/10 bg-black/10">
          <Icon className={cn("h-4 w-4", color)} />
          <CardTitle className="text-sm font-bold uppercase tracking-widest">{title}</CardTitle>
       </CardHeader>
       <CardContent className="pt-6 space-y-4">
          {items.map((i: any) => (
            <div key={i.label} className="flex justify-between items-center text-sm p-3 rounded-lg bg-black/20 border border-border/10">
               <span className="font-medium text-muted-foreground">{i.label}</span>
               <span className="font-mono text-xs font-bold text-[#0F766E]">{i.val}</span>
            </div>
          ))}
       </CardContent>
    </Card>
  );
}
