import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BedDouble, Users, UserCheck, Timer, AlertCircle, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const WARD_DATA = [
  { 
    name: "General Ward (Male)", 
    beds: [
      { id: "M-101", status: "occupied", patient: "Rahul S.", since: "2 Days" },
      { id: "M-102", status: "available", patient: null, since: "-" },
      { id: "M-103", status: "cleaning", patient: null, since: "15m" },
      { id: "M-104", status: "occupied", patient: "Amit K.", since: "4 Days" },
      { id: "M-105", status: "occupied", patient: "Vikram P.", since: "6h" },
      { id: "M-106", status: "available", patient: null, since: "-" },
    ]
  },
  { 
    name: "ICU Unit-A", 
    beds: [
      { id: "ICU-01", status: "occupied", patient: "Meena R.", since: "12 Days", critical: true },
      { id: "ICU-02", status: "occupied", patient: "Joseph B.", since: "1 Day", critical: false },
      { id: "ICU-03", status: "available", patient: null, since: "-" },
    ]
  }
];

export default function BedBoardPage() {
  return (
    <>
      <TopBar 
        title="Live Bed Board" 
        action={{ label: "Register Admission", href: "/ipd/new-admission" }}
      />
      <main className="p-8 space-y-8">
        
        {/* Census Summary */}
        <div className="flex bg-surface/30 p-6 rounded-2xl border border-border/40 backdrop-blur-md justify-around items-center">
          <CensusStat label="Total Beds" value="55" icon={BedDouble} />
          <div className="h-10 w-px bg-border/20" />
          <CensusStat label="Occupied" value="41" icon={UserCheck} color="text-[#0F766E]" />
          <div className="h-10 w-px bg-border/20" />
          <CensusStat label="Available" value="12" icon={BedDouble} color="text-muted" />
          <div className="h-10 w-px bg-border/20" />
          <CensusStat label="Needs Cleaning" value="2" icon={AlertCircle} color="text-yellow-500" />
        </div>

        {/* Wards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {WARD_DATA.map((ward) => (
            <Card key={ward.name} className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 bg-black/10">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-[#0F766E]" />
                   {ward.name}
                </CardTitle>
                <span className="text-xs text-muted">{ward.beds.filter(b => b.status === "available").length} Vacant</span>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ward.beds.map((bed) => (
                    <div 
                      key={bed.id}
                      className={cn(
                        "p-4 rounded-xl border border-border/20 transition-all cursor-pointer group hover:scale-[1.02]",
                        bed.status === "occupied" ? "bg-[#0F766E]/5" : "bg-black/20"
                      )}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold tracking-tighter text-muted-foreground">{bed.id}</span>
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          bed.status === "occupied" ? "bg-[#0F766E]" : 
                          bed.status === "cleaning" ? "bg-yellow-500 animate-pulse" : "bg-muted-foreground/20"
                        )} />
                      </div>
                      <BedDouble className={cn(
                        "h-8 w-8 mb-4 transition-colors",
                        bed.status === "occupied" ? "text-[#0F766E]" : "text-muted/30"
                      )} />
                      <div className="space-y-1">
                        <p className="text-sm font-bold truncate">
                          {bed.patient || (bed.status === "cleaning" ? "CLEANING" : "VACANT")}
                        </p>
                        <p className="text-[10px] text-muted flex items-center gap-1">
                          <Timer className="h-3 w-3" /> {bed.since}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </main>
    </>
  );
}

function CensusStat({ label, value, icon: Icon, color = "text-fg" }: any) {
  return (
    <div className="text-center group">
       <div className={cn("mx-auto h-10 w-10 rounded-full flex items-center justify-center bg-black/20 border border-border/20 group-hover:bg-[#0F766E]/10 transition-colors mb-2", color)}>
          <Icon className="h-5 w-5" />
       </div>
       <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
       <p className={cn("text-2xl font-bold tracking-tight", color)}>{value}</p>
    </div>
  );
}
