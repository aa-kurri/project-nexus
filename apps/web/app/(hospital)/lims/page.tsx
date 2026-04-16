import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlaskConical, FileBarChart, Zap } from "lucide-react";

export default function LimsPage() {
  const modules = [
    { title: "Lab Worklist", desc: "Manage pending tests and sample collection", icon: FlaskConical, href: "/lims/worklist" },
    { title: "HL7 Data Feed", desc: "Real-time analyzer integration logs", icon: Zap, href: "/lims/hl7" },
    { title: "Quality Control", desc: "Levey-Jennings charts and re-agent tracking", icon: FileBarChart, href: "/lims/qc" },
  ];

  return (
    <>
      <TopBar title="Laboratory Information System (LIMS)" />
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
