import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreditCard, User, Mail, Phone, Calendar, ArrowRight, Wallet, ShieldCheck } from "lucide-react";

export default function PaymentsPage() {
  return (
    <>
      <TopBar 
        title="Collect Payment" 
        action={{ label: "View Reports", href: "/billing/claims" }}
      />
      <main className="p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-[#0F766E]/20 to-transparent border-[#0F766E]/20 backdrop-blur-md">
            <CardContent className="pt-6">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Pending Today</p>
              <h3 className="text-3xl font-bold mt-1">₹1,24,500</h3>
              <p className="text-xs text-[#0F766E] mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +12% from yesterday
              </p>
            </CardContent>
          </Card>
          {/* Add more stats if needed */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#0F766E]" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">Patient Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                      <Input placeholder="Enter patient name" className="pl-10 bg-black/20 border-border/40 focus:border-[#0F766E]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                      <Input placeholder="+91 00000 00000" className="pl-10 bg-black/20 border-border/40 focus:border-[#0F766E]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                    <Input placeholder="email@hospital.com" className="pl-10 bg-black/20 border-border/40 focus:border-[#0F766E]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">Billed Amount</label>
                    <Input type="number" defaultValue="6250" className="bg-black/20 border-border/40" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">Pending Dues</label>
                    <Input type="number" defaultValue="0" className="bg-black/20 border-border/40" />
                  </div>
                  <div className="space-y-1.5 font-bold">
                    <label className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">Total Payable</label>
                    <div className="text-2xl text-fg px-3 py-1.5 border border-[#0F766E]/30 rounded-md bg-[#0F766E]/5">
                      ₹6,250
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">Internal Notes</label>
                  <textarea 
                    className="w-full min-h-[100px] rounded-md bg-black/20 border border-border/40 p-3 text-sm focus:border-[#0F766E] outline-none transition"
                    placeholder="Add billing notes or concessions here..."
                  />
                </div>

                <div className="pt-4 flex items-center justify-between gap-4">
                  <Button variant="ghost" className="text-muted hover:text-fg">Reset Form</Button>
                  <Button className="bg-[#0F766E] hover:bg-[#115E59] text-white px-8 h-12 text-lg font-bold shadow-lg shadow-[#0F766E]/20 group">
                    Process Payment
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary / Receipt Preview */}
          <div className="space-y-6">
            <Card className="border-[#0F766E]/30 bg-[#0F766E]/5 border-dashed relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <ShieldCheck className="h-24 w-24" />
              </div>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest text-[#0F766E]">Secure Receipt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Consultation Fee</span>
                  <span className="font-mono">₹2,500.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Pharmacy Dues</span>
                  <span className="font-mono">₹3,750.00</span>
                </div>
                <div className="border-t border-border/20 pt-4 flex justify-between items-center">
                  <span className="font-bold">Total Amount</span>
                  <span className="text-xl font-display font-bold text-[#0F766E]">₹6,250.00</span>
                </div>
                <div className="mt-8 p-4 rounded-lg bg-black/40 border border-border/40">
                  <p className="text-[10px] text-muted uppercase text-center">Scan to Pay UPI</p>
                  <div className="aspect-square w-32 mx-auto mt-2 bg-white/10 rounded flex items-center justify-center">
                    <span className="text-[10px] text-white/20 italic text-center">QR Code<br/>Gateway Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </>
  );
}

// Helper icons
function TrendingUp(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
  );
}
