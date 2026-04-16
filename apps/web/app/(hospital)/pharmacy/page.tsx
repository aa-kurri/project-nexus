import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pill, Package, Truck, ShoppingCart } from "lucide-react";

export default function PharmacyPage() {
  const modules = [
    { title: "Inventory & Stock", desc: "Real-time stock levels across all wings", icon: Package, href: "/pharmacy/stock" },
    { title: "Indent Transfers", desc: "Manage inter-department stock movement", icon: Truck, href: "/pharmacy/transfers" },
    { title: "Auto Purchase Orders", desc: "AI-driven low stock replenishments", icon: ShoppingCart, href: "/pharmacy/orders" },
    { title: "POS & Dispensing", desc: "Patient medication dispensing flow", icon: Pill, href: "/pharmacy/dispense" },
  ];

  return (
    <>
      <TopBar title="Pharmacy Management" />
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
