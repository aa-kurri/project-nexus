import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Activity, 
  Thermometer, 
  Droplet, 
  Wind, 
  User, 
  Timer, 
  Clock, 
  CheckCircle2, 
  Bell,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

const PATIENTS = [
  { 
    id: "B-201", 
    name: "Rajesh Kumar", 
    vitals: { hr: 78, bp: "120/80", spO2: 98, temp: 98.4 }, 
    tasks: ["Injection", "Wound Care", "Meal"],
    urgent: false 
  },
  { 
    id: "B-205", 
    name: "Meena Sharma", 
    vitals: { hr: 112, bp: "145/95", spO2: 92, temp: 101.2 }, 
    tasks: ["Nebulize", "Medication"],
    urgent: true 
  },
  { 
    id: "B-208", 
    name: "Sam Arthur", 
    vitals: { hr: 65, bp: "110/70", spO2: 99, temp: 97.8 }, 
    tasks: ["Report Review"],
    urgent: false 
  },
];

export default function NurseStationPage() {
  return (
    <>
      <TopBar 
        title="Nurse Station Dashboard" 
        action={{ label: "Emergency Call", href: "#" }}
      />
      <main className="p-8 space-y-8">
        
        {/* Urgent Alerts Header */}
        <div className="flex gap-4 items-center bg-red-500/10 border border-red-500/20 p-4 rounded-xl backdrop-blur-md">
          <div className="bg-red-500 p-2 rounded-lg animate-pulse">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm font-medium text-red-100 flex-1">
            <strong>Critical Alert:</strong> Bed B-205 (Meena Sharma) - High BP & Elevated Temperature detected. 
          </p>
          <Button variant="outline" size="sm" className="bg-red-500 text-white border-none hover:bg-red-600">
            Acknowledge
          </Button>
        </div>

        {/* Patient Monitoring Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {PATIENTS.map((p) => (
            <Card key={p.id} className={cn(
              "border-border/40 bg-surface/50 backdrop-blur-xl relative overflow-hidden",
              p.urgent && "ring-2 ring-red-500/40"
            )}>
              {p.urgent && <div className="absolute top-0 right-0 p-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>}
              
              <CardHeader className="flex flex-row items-center gap-3 border-b border-border/10">
                 <div className="h-10 w-10 rounded-full bg-black/40 flex items-center justify-center border border-border/20">
                    <User className="h-5 w-5 text-muted-foreground" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{p.id}</p>
                    <CardTitle className="text-sm">{p.name}</CardTitle>
                 </div>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-6">
                 {/* Live Vitals Grid */}
                 <div className="grid grid-cols-2 gap-4">
                    <VitalItem label="Pulse" value={p.vitals.hr} unit="bpm" icon={Heart} alert={p.vitals.hr > 100} />
                    <VitalItem label="BP" value={p.vitals.bp} unit="mmhg" icon={Activity} alert={p.vitals.bp === "145/95"} />
                    <VitalItem label="SpO2" value={p.vitals.spO2} unit="%" icon={Wind} alert={p.vitals.spO2 < 95} />
                    <VitalItem label="Temp" value={p.vitals.temp} unit="°F" icon={Thermometer} alert={p.vitals.temp > 100} />
                 </div>

                 {/* Pending Care Plan */}
                 <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Pending Care Actions</p>
                    <div className="space-y-2">
                       {p.tasks.map(t => (
                         <div key={t} className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-border/10 group cursor-pointer hover:bg-[#0F766E]/5 transition-colors">
                            <Clock className="h-3 w-3 text-muted" />
                            <span className="text-xs text-muted-foreground flex-1">{t}</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-40" />
                         </div>
                       ))}
                    </div>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </main>
    </>
  );
}

function VitalItem({ label, value, unit, icon: Icon, alert }: any) {
  return (
    <div className={cn(
      "p-3 rounded-xl border border-border/10 flex items-center gap-3 transition-all",
      alert ? "bg-red-500/10 border-red-500/20" : "bg-black/20"
    )}>
       <Icon className={cn("h-4 w-4", alert ? "text-red-500" : "text-[#0F766E]")} />
       <div>
          <p className="text-[10px] uppercase text-muted font-bold tracking-tighter leading-none mb-1">{label}</p>
          <p className={cn("text-xs font-bold", alert ? "text-red-400" : "text-fg")}>
            {value} <span className="text-[8px] font-normal text-muted uppercase">{unit}</span>
          </p>
       </div>
    </div>
  );
}

function Heart(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
  );
}

function Button({ variant, size, className, children }: any) {
  return (
    <button className={cn("inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 px-3 py-1.5", className)}>
      {children}
    </button>
  );
}
