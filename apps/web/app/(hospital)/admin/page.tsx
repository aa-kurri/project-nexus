import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListChecks, BadgeDollarSign, SlidersHorizontal, ClipboardCheck } from "lucide-react";

export default function AdminPage() {
  const modules = [
    { title: "Services Master", desc: "Define and manage billable services and procedures", icon: ListChecks, href: "/admin/services" },
    { title: "Tariff Master", desc: "Set ward-wise, payee-wise pricing and packages", icon: BadgeDollarSign, href: "/admin/tariff" },
    { title: "Configuration", desc: "Hospital settings, departments and parameters", icon: SlidersHorizontal, href: "/admin/config" },
    { title: "Authorise Inpatient", desc: "Pre-auth and insurance approval for IP admissions", icon: ClipboardCheck, href: "/admin/auth-ip" },
  ];

  return (
    <>
      <TopBar title="Administration" />
      <main className="p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
