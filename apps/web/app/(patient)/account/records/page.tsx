"use client";

import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Filter } from "lucide-react";

export default function PatientRecordsPage() {
  return (
    <div className="min-h-screen bg-[hsl(220_15%_6%)]">
      <TopBar title="Medical Records" />
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Your Health Records</h2>
            <p className="text-sm text-white/40">Securely stored and FHIR-compliant.</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 transition-colors">
            <Filter className="h-3.5 w-3.5" />
            Filter by Date
          </button>
        </div>

        <div className="grid gap-4">
          {[
            { date: "15 Apr 2026", title: "General Consultation Summary", dept: "OPD", doctor: "Dr. Sharma" },
            { date: "12 Apr 2026", title: "Complete Blood Count (CBC)", dept: "LIMS", doctor: "Lab System" },
            { date: "02 Apr 2026", title: "Discharge Summary", dept: "IPD", doctor: "Dr. Patel" },
          ].map((rec, i) => (
            <Card key={i} className="border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-4 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[#0F766E]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{rec.title}</p>
                    <p className="text-[11px] text-white/30 uppercase tracking-widest">{rec.dept} · {rec.doctor} · {rec.date}</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 rounded-lg border border-[#0F766E]/30 bg-[#0F766E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0F766E] hover:bg-[#0F766E]/20 transition-all">
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
