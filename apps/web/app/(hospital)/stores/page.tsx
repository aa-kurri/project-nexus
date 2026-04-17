import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, ArrowLeftRight, ShoppingCart, Truck } from "lucide-react";

export default function StoresPage() {
  const modules = [
    { title: "Stock Adjustment", desc: "Manual stock in/out, write-offs and corrections", icon: Package, href: "/stores/stock" },
    { title: "Stock Transfer", desc: "Inter-department and inter-branch transfers", icon: ArrowLeftRight, href: "/stores/transfer" },
    { title: "Purchase Orders", desc: "Raise and track POs with approval workflow", icon: ShoppingCart, href: "/stores/purchase-orders" },
    { title: "Supplier Master", desc: "Vendor directory, GST details and payment terms", icon: Truck, href: "/stores/suppliers" },
  ];

  return (
    <>
      <TopBar title="Stores & Inventory" />
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
