import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Calendar, Phone, Mail, MapPin, Hash, Search, ArrowRight, Activity } from "lucide-react";

export default function NewPatientPage() {
  return (
    <>
      <TopBar 
        title="Patient Registration" 
        action={{ label: "Go to Queue", href: "/opd/queue" }}
      />
      <main className="p-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Registration Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5 text-[#0F766E]" />
                  Internal Patient File
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                {/* Identification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem label="Full Name" icon={User} placeholder="John Doe" />
                  <FormItem label="Phone Number" icon={Phone} placeholder="+91 00000 00000" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormItem label="Date of Birth" icon={Calendar} placeholder="DD/MM/YYYY" type="date" />
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Gender</label>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 bg-black/20 border-border/40 hover:bg-[#0F766E]/10">Male</Button>
                      <Button variant="outline" className="flex-1 bg-black/20 border-border/40 hover:bg-[#0F766E]/10">Female</Button>
                    </div>
                  </div>
                  <FormItem label="Aadhar / Govt ID" icon={Hash} placeholder="0000 0000 0000" />
                </div>

                <FormItem label="Address" icon={MapPin} placeholder="Street, City, State, ZIP" />

                <div className="pt-4 flex items-center justify-between gap-4">
                  <Button variant="ghost" className="text-muted hover:text-fg">Clear Fields</Button>
                  <Button className="bg-[#0F766E] hover:bg-[#115E59] text-white px-8 h-12 text-lg font-bold shadow-lg shadow-[#0F766E]/20 group">
                    Create Patient Record
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Search / Existing Records */}
          <div className="space-y-6">
            <Card className="border-[#0F766E]/30 bg-[#0F766E]/5 relative overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest text-[#0F766E]">Quick Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0F766E]/50" />
                  <Input placeholder="Search existing ID..." className="pl-10 bg-black/40 border-[#0F766E]/30" />
                </div>
                <div className="p-3 rounded-lg bg-black/20 border border-border/40 text-xs text-muted">
                   Tip: Type patient mobile or UHID to see if they're already registered.
                </div>
              </CardContent>
            </Card>

            {/* Vitals Capture (Simulated) */}
            <Card className="border-border/40 bg-surface/50">
              <CardHeader><CardTitle className="text-sm">Initial Vitals</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <VitalItem label="Temp" value="98.6°F" icon={Activity} />
                <VitalItem label="BP" value="120/80" icon={Activity} />
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </>
  );
}

function FormItem({ label, icon: Icon, placeholder, type = "text" }: any) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
        <Input type={type} placeholder={placeholder} className="pl-10 bg-black/20 border-border/40 focus:border-[#0F766E] transition-all" />
      </div>
    </div>
  );
}

function VitalItem({ label, value, icon: Icon }: any) {
  return (
    <div className="p-3 rounded-xl bg-black/20 border border-border/20 flex flex-col items-center gap-1">
      <Icon className="h-3 w-3 text-[#0F766E]" />
      <span className="text-[10px] uppercase text-muted font-bold tracking-tighter">{label}</span>
      <span className="text-sm font-bold text-fg">{value}</span>
    </div>
  );
}
