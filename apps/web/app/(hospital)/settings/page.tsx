import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, History, HeartHandshake } from "lucide-react";

export default function SettingsPage() {
  const modules = [
    { title: "Security", desc: "Access control, password policy and 2FA", icon: ShieldCheck, href: "/settings/security" },
    { title: "Audit Log", desc: "System-wide activity and changes log", icon: History, href: "/settings/audit" },
    { title: "Concierge", desc: "Patient experience and feedback settings", icon: HeartHandshake, href: "/settings/concierge" },
  ];

  return (
    <>
      <TopBar title="Hospital Settings" />
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
