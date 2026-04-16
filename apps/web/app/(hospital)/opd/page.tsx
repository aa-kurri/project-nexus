import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Users, Video } from "lucide-react";

export default function OpdPage() {
  const modules = [
    { title: "OPD Queue", desc: "Live doctor-wise patient queue management", icon: Users, href: "/opd/queue" },
    { title: "Appointments", desc: "Patient scheduling and slot management", icon: Calendar, href: "/opd/booking" },
    { title: "Teleconsultation", desc: "Integrate video consultation via Nexus Meet", icon: Video, href: "/opd/teleconsult" },
  ];

  return (
    <>
      <TopBar title="Out-Patient Department (OPD)" />
      <main className="p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Card key={m.title} className="hover:border-accent/50 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="mb-2 w-10 h-10 rounded-lg bg-[#0F766E]/10 flex items-center justify-center">
                  <m.icon className="h-5 w-5 text-[#0F766E]" />
                </div>
                <CardTitle className="group-hover:text-[#0F766E] transition-colors">{m.title}</CardTitle>
                <CardDescription>{m.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
