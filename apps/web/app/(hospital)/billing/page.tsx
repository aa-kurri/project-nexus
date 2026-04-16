import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Receipt, CreditCard, ShieldCheck } from "lucide-react";

export default function BillingPage() {
  const modules = [
    { title: "Claims Management", desc: "Insurance claim tracking and processing", icon: ShieldCheck, href: "/billing/claims" },
    { title: "Cashier & Payments", desc: "Patient settlement and bill generation", icon: CreditCard, href: "/billing/payments" },
  ];

  return (
    <>
      <TopBar title="Revenue Cycle Management (RCM)" />
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
