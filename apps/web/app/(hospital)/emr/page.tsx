import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText } from "lucide-react";

export default function EmrPage() {
  const modules = [
    { title: "Patient Records", desc: "Master patient index and medical histories", icon: Users, href: "/emr/patients" },
    { title: "Clinical Documents", desc: "Digital health records, scans and consent forms", icon: FileText, href: "/emr/documents" },
  ];

  return (
    <>
      <TopBar title="Electronic Medical Records (EMR)" />
      <main className="p-8">
        <div className="grid gap-6 md:grid-cols-2">
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
