"use client";

import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Receipt, Clock, CheckCircle2 } from "lucide-react";

export default function PatientBillingPage() {
  return (
    <div className="min-h-screen bg-[hsl(220_15%_6%)]">
      <TopBar title="Billing & Payments" />
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-[#0F766E]/20 bg-[#0F766E]/5 p-6">
            <p className="text-xs font-bold text-[#0F766E] uppercase tracking-widest mb-1">Outstanding Balance</p>
            <h2 className="text-3xl font-black text-white">₹0.00</h2>
            <p className="text-xs text-white/40 mt-1">Status: Fully Paid</p>
          </Card>
          <Card className="border-white/5 bg-white/[0.02] p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white/40" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Payment Method</p>
              <p className="text-xs text-white/40">Visa ending in •••• 4242</p>
            </div>
          </Card>
        </div>

        <div>
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Invoice History</h3>
          <div className="space-y-3">
            {[
              { id: "INV-8821", amount: "₹4,250", status: "Paid", date: "15 Apr 2026", desc: "OPD Consultation & Pharmacy" },
              { id: "INV-7712", amount: "₹18,900", status: "Paid", date: "02 Apr 2026", desc: "IPD Surgery - Room Charges" },
            ].map((inv, i) => (
              <Card key={i} className="border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{inv.desc}</p>
                    <p className="text-[11px] text-white/30 uppercase tracking-widest">{inv.id} · {inv.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{inv.amount}</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <CheckCircle2 className="h-3 w-3 text-[#0F766E]" />
                      <span className="text-[10px] font-bold text-[#0F766E] uppercase">{inv.status}</span>
                    </div>
                  </div>
                  <button className="text-xs text-white/40 hover:text-white transition-colors underline">Details</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
