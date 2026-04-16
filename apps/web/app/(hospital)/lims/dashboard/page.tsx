import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Activity, FlaskConical, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function LimsDashboardPage() {
  return (
    <>
      <TopBar 
        title="Lab Performance Dashboard" 
        action={{ label: "Download Excel", href: "#" }}
      />
      <main className="p-8 space-y-8">
        
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Revenue" value="₹2,13,500" change="+14%" positive />
          <StatCard title="Tests Processed" value="68" change="-5%" positive={false} />
          <StatCard title="External Lab Share" value="₹0" change="0%" neutral />
          <StatCard title="Avg TAT" value="2.4 Hrs" change="-12%" positive />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Revenue by Test Type - Donut Visualization stub */}
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Revenue by Test</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8 h-[300px]">
                {/* Modern Donut Mockup */}
                <div className="relative h-48 w-48 rounded-full border-[16px] border-[#0F766E]/20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[16px] border-[#0F766E] border-t-transparent border-l-transparent rotate-45" />
                  <div className="text-center">
                    <p className="text-3xl font-bold">₹2.1L</p>
                    <p className="text-[10px] text-muted uppercase tracking-tighter">Gross Rev</p>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex-1 space-y-3">
                  <LegendItem color="bg-[#0F766E]" label="2D ECHO" value="45%" />
                  <LegendItem color="bg-[#14B8A6]" label="Blood Urea" value="22%" />
                  <LegendItem color="bg-[#5EEAD4]" label="Beta-hCG" value="18%" />
                  <LegendItem color="bg-muted/20" label="Others" value="15%" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Doctor - Bar Chart Visualization stub */}
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Top Reffering Doctors</CardTitle>
              <Users className="h-4 w-4 text-muted" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6 pt-4 h-[300px]">
                <DoctorBar name="Dr. Chenna Reddy" amount="₹1,16,500" percentage={85} />
                <DoctorBar name="Dr. Vasantha" amount="₹92,500" percentage={65} />
                <DoctorBar name="Dr. Srawani" amount="₹4,500" percentage={10} />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Global Stats Table */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-black/20 border-b border-border/40">
            <CardTitle className="text-sm font-semibold text-muted uppercase tracking-wider">Historical Revenue Statistics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[200px] w-full bg-gradient-to-t from-[#0F766E]/5 to-transparent flex items-end px-8 pb-4 gap-2">
              {[40, 60, 45, 75, 50, 85, 90, 65, 70, 40, 55, 60].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-[#0F766E]/20 hover:bg-[#0F766E]/40 transition-all rounded-t-sm"
                  style={{ height: `${h}%` }}
                  title={`Day ${i+1}: ${h}% capacity`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

      </main>
    </>
  );
}

function StatCard({ title, value, change, positive, neutral = false }: any) {
  return (
    <Card className="border-border/40 bg-surface/50 hover:bg-surface/80 transition-all group overflow-hidden">
      <CardContent className="pt-6 relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <Activity className="h-12 w-12" />
        </div>
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-fg tracking-tight">{value}</h3>
        <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          neutral ? "bg-muted/10 text-muted" : 
          positive ? "bg-[#0F766E]/10 text-[#0F766E]" : "bg-red-500/10 text-red-500"
        }`}>
          {neutral ? null : positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {change}
        </div>
      </CardContent>
    </Card>
  );
}

function LegendItem({ color, label, value }: any) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-muted">{label}</span>
      </div>
      <span className="font-mono font-bold text-fg">{value}</span>
    </div>
  );
}

function DoctorBar({ name, amount, percentage }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-fg">{name}</span>
        <span className="font-mono text-muted">{amount}</span>
      </div>
      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#0F766E] to-[#14B8A6] rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
