import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus, User, MoreVertical, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const PATIENTS = [
  { id: "UHID-2039", name: "Anish Kurri", age: "29", gender: "M", phone: "+91 99000 88776", lastVisit: "2026-04-14", status: "Active" },
  { id: "UHID-1102", name: "Sarah Malik", age: "34", gender: "F", phone: "+91 88776 66554", lastVisit: "2026-04-10", status: "Active" },
  { id: "UHID-7492", name: "Vikram Seth", age: "52", gender: "M", phone: "+91 77665 55443", lastVisit: "2026-04-01", status: "Archive" },
];

export default function PatientsListPage() {
  return (
    <>
      <TopBar 
        title="Electronic Medical Records" 
        action={{ label: "New Patient", href: "/opd/new-patient" }}
      />
      <main className="p-8 space-y-6">
        
        {/* Search & Filter Header */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
             <Input placeholder="Search patient by Name, UHID or Phone..." className="pl-10 bg-surface/50 border-border/40" />
           </div>
           <Button variant="outline" className="gap-2 border-border/40 hover:bg-[#0F766E]/10">
              <Filter className="h-4 w-4" /> Filter Records
           </Button>
        </div>

        {/* Global Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {PATIENTS.map(p => (
             <Card key={p.id} className="border-border/40 bg-surface/50 backdrop-blur-xl hover:bg-surface/80 transition-all cursor-pointer group shadow-lg">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                   <div className="h-12 w-12 rounded-full bg-[#0F766E]/10 flex items-center justify-center border border-[#0F766E]/20">
                      <User className="h-6 w-6 text-[#0F766E]" />
                   </div>
                   <div className="flex-1">
                      <CardTitle className="text-sm font-bold group-hover:text-[#0F766E] transition-colors">{p.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{p.id}</p>
                   </div>
                   <button className="text-muted hover:text-fg"><MoreVertical className="h-4 w-4" /></button>
                </CardHeader>
                <CardContent className="pt-2">
                   <div className="grid grid-cols-2 gap-y-4 text-xs">
                      <div>
                        <p className="text-[10px] uppercase text-muted font-bold mb-0.5">Demographics</p>
                        <p className="font-medium text-fg">{p.age}y · {p.gender}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-muted font-bold mb-0.5">Contact</p>
                        <p className="font-medium text-fg">{p.phone.split(" ")[1]}</p>
                      </div>
                      <div className="col-span-2 p-2.5 rounded-lg bg-black/20 border border-border/10 flex justify-between items-center text-[10px] uppercase font-bold">
                        <span className="text-muted">Last Clinical Visit</span>
                        <span className="text-fg">{p.lastVisit}</span>
                      </div>
                   </div>
                   
                   <div className="mt-4 pt-4 border-t border-border/10 flex gap-2">
                      <Button variant="ghost" className="flex-1 text-[10px] uppercase font-bold h-8 border border-border/20 hover:bg-[#0F766E]/10">
                        <FileText className="h-3 w-3 mr-1.5" /> E-Reports
                      </Button>
                      <Button variant="ghost" className="flex-1 text-[10px] uppercase font-bold h-8 border border-border/20 hover:bg-[#0F766E]/10">
                        <Activity className="h-3 w-3 mr-1.5" /> Vitals
                      </Button>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>

      </main>
    </>
  );
}
