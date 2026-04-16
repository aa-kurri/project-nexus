import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pill, Package, AlertCircle, ShoppingCart, RefreshCw, Filter, Search, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const STOCK = [
  { name: "Paracetamol 500mg", category: "Analgesics", stock: 1240, expiry: "2026-12", status: "In Stock" },
  { name: "Amoxicillin 250mg", category: "Antibiotics", stock: 45, expiry: "2026-08", status: "Low Stock" },
  { name: "Metformin 500mg", category: "Anti-Diabetic", stock: 890, expiry: "2026-05", status: "Near Expiry" },
  { name: "Pantoprazole 40mg", category: "Anti-Acid", stock: 0, expiry: "2026-09", status: "Out of Stock" },
];

export default function PharmacyStockPage() {
  return (
    <>
      <TopBar 
        title="Inventory & Stock" 
        action={{ label: "Purchase Order", href: "/pharmacy/orders" }}
      />
      <main className="p-8 space-y-8">
        
        {/* Inventory Analytics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total SKUs" value="1,248" count="active" icon={Pill} />
          <StatCard title="Low Stock Items" value="12" count="action required" icon={ShoppingCart} color="text-red-500" />
          <StatCard title="Near Expiry" value="08" count="review items" icon={AlertCircle} color="text-yellow-500" />
          <StatCard title="Returns / Damages" value="₹12.4K" count="this month" icon={RefreshCw} />
        </div>

        {/* Stock Management Table */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl shadow-2xl overflow-hidden">
           <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 bg-black/10">
              <div className="relative w-72">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                 <Input placeholder="Search medicine / SKU..." className="pl-10 h-9 bg-black/20 border-border/40" />
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" className="gap-2 border-border/40">
                    <Filter className="h-3.5 w-3.5" /> Filter
                 </Button>
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                 <thead className="text-[10px] uppercase tracking-widest text-muted border-b border-border/10">
                    <tr>
                       <th className="px-6 py-4 font-bold">Item Description</th>
                       <th className="px-6 py-4 font-bold">Category</th>
                       <th className="px-6 py-4 font-bold text-center">Batch Stock</th>
                       <th className="px-6 py-4 font-bold">Expiry Date</th>
                       <th className="px-6 py-4 font-bold">Stock Status</th>
                       <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/10">
                    {STOCK.map(item => (
                      <tr key={item.name} className="hover:bg-white/5 transition-colors group">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-lg bg-[#0F766E]/10 flex items-center justify-center border border-[#0F766E]/20">
                                  <Package className="h-4 w-4 text-[#0F766E]" />
                               </div>
                               <span className="font-bold">{item.name}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-muted font-medium">{item.category}</td>
                         <td className="px-6 py-4 text-center font-mono font-bold">{item.stock}</td>
                         <td className="px-6 py-4 text-muted">{item.expiry}</td>
                         <td className="px-6 py-4">
                            <StockBadge status={item.status} />
                         </td>
                         <td className="px-6 py-4 text-center">
                            <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4 text-muted hover:text-fg" /></button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </CardContent>
        </Card>

      </main>
    </>
  );
}

function StatCard({ title, value, count, icon: Icon, color = "text-[#0F766E]" }: any) {
  return (
     <Card className="border-border/40 bg-surface/50 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
           <Icon className="h-12 w-12" />
        </div>
        <CardContent className="pt-6">
           <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{title}</p>
           <h3 className="text-2xl font-bold mt-1 text-fg tracking-tight">{value}</h3>
           <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-tighter">{count}</p>
        </CardContent>
     </Card>
  );
}

function StockBadge({ status }: { status: string }) {
  const styles: any = {
    "In Stock":      "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
    "Low Stock":     "bg-orange-500/10 text-orange-500 border-orange-500/20",
    "Near Expiry":   "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    "Out of Stock":  "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border", styles[status])}>
      {status}
    </span>
  );
}
