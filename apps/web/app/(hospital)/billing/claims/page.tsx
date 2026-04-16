import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";

const DATA = [
  { id: "TXN-7429", method: "UPI", transId: "928347293", contact: "98xxxx4500", amount: "₹6,250", date: "2026-04-16", name: "Chenna Reddy", status: "Paid" },
  { id: "TXN-7430", method: "Card", transId: "102938475", contact: "87xxxx1293", amount: "₹2,500", date: "2026-04-16", name: "Anish Kumar", status: "Paid" },
  { id: "TXN-7431", method: "Cash", transId: "-",         contact: "99xxxx0021", amount: "₹12,400", date: "2026-04-15", name: "Meena Rao", status: "Pending" },
  { id: "TXN-7432", method: "UPI", transId: "304958102", contact: "70xxxx8899", amount: "₹4,100", date: "2026-04-15", name: "Rajesh S.", status: "Failed" },
];

export default function ClaimsReportPage() {
  return (
    <>
      <TopBar title="Financial Reports" />
      <main className="p-8 space-y-6">
        
        {/* Filters Header */}
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-surface/30 p-6 rounded-2xl border border-border/40 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Date From</label>
              <Input type="date" defaultValue="2026-04-02" className="bg-black/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Date To</label>
              <Input type="date" defaultValue="2026-04-16" className="bg-black/20" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 border-border/40 hover:bg-[#0F766E]/10">
              <Filter className="h-4 w-4" /> Filter
            </Button>
            <Button className="bg-[#0F766E] hover:bg-[#115E59] gap-2">
              Generate Report
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 bg-black/10">
            <CardTitle className="text-sm font-semibold text-muted uppercase tracking-wider">Recent Transactions</CardTitle>
            <div className="flex gap-2">
              <button className="p-2 text-muted hover:text-fg hover:bg-white/5 rounded-md transition-colors" title="Export Excel">
                <FileSpreadsheet className="h-4 w-4" />
              </button>
              <button className="p-2 text-muted hover:text-fg hover:bg-white/5 rounded-md transition-colors" title="Print List">
                <Printer className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase tracking-widest text-muted border-b border-border/10 bg-black/5">
                  <tr>
                    <th className="px-6 py-4 font-semibold">SI No.</th>
                    <th className="px-6 py-4 font-semibold">Ref ID</th>
                    <th className="px-6 py-4 font-semibold">Payment Method</th>
                    <th className="px-6 py-4 font-semibold">Transaction ID</th>
                    <th className="px-6 py-4 font-semibold">Client Name</th>
                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {DATA.map((row, i) => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-muted">{i + 1}</td>
                      <td className="px-6 py-4 font-mono text-xs">{row.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-[#0F766E]/40" />
                          {row.method}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted/60 font-mono text-xs">{row.transId}</td>
                      <td className="px-6 py-4 font-medium">{row.name}</td>
                      <td className="px-6 py-4 text-right font-bold tracking-tight">{row.amount}</td>
                      <td className="px-6 py-4 text-muted">{row.date}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4 text-muted hover:text-fg" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <div className="border-t border-border/10 bg-black/5 p-4 flex items-center justify-between">
            <p className="text-xs text-muted">Showing 1 to 4 of 124 entries</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-border/20">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-[#0F766E]/20 text-[#0F766E]">1</Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-border/20">2</Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-border/20">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

      </main>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    Paid:    "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
    Pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    Failed:  "bg-red-500/10 text-red-500 border-red-500/20",
  };
  const icon: any = {
    Paid:    <CheckCircle2 className="h-3 w-3" />,
    Pending: <Clock className="h-3 w-3" />,
    Failed:  <AlertCircle className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[status]}`}>
      {icon[status]}
      {status}
    </span>
  );
}
