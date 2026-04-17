"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Search, FileText, Printer, History, UserEdit, 
  Filter, Calendar, Phone, MapPin, ChevronRight,
  Database, RefreshCw, Download
} from "lucide-react";
import { cn } from "@/lib/utils";

type SearchType = "PATIENT" | "BILL" | "CARD";

export default function RecordsSearchPage() {
  const [activeTab, setActiveTab] = useState<SearchType>("PATIENT");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Form states
  const [searchForm, setSearchForm] = useState({
    name: "", phone: "", city: "", 
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    mrNo: "",
    printType: "Normal" as "Small" | "Normal"
  });

  const handleSearch = () => {
    setIsLoading(true);
    // Simulate search
    setTimeout(() => {
      setResults([
        { id: "AY-00821", name: "Anish Kurri", phone: "9900088776", city: "Chennai", date: "16 Apr 2026", status: "Active" },
        { id: "AY-00815", name: "Sarah Malik", phone: "8877666554", city: "Hyderabad", date: "15 Apr 2026", status: "Active" },
        { id: "AY-00792", name: "Priya Sharma", phone: "9440011223", city: "Bangalore", date: "12 Apr 2026", status: "Active" },
      ]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[hsl(220_15%_6%)]">
      <TopBar title="Patient Records & Search" />
      
      <main className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Search Modes (Legacy Sidebar Modernized) */}
        <aside className="lg:col-span-3 space-y-3">
          {[
            { id: "PATIENT", label: "Retrieve Patient", icon: Search, desc: "Search by Name/City" },
            { id: "BILL", label: "Reprint Bills", icon: Printer, desc: "MR No / Date Range" },
            { id: "CARD", label: "Reprint OPD Card", icon: FileText, desc: "Lost UHID recovery" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => { setActiveTab(mode.id as SearchType); setResults([]); }}
              className={cn(
                "w-full p-4 rounded-xl flex items-center gap-4 border transition-all text-left group",
                activeTab === mode.id 
                  ? "bg-[#0F766E]/10 border-[#0F766E]/50 text-[#0F766E]" 
                  : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5 hover:border-white/10"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center transition-all",
                activeTab === mode.id ? "bg-[#0F766E] text-white" : "bg-white/5 text-white/40 group-hover:text-white"
              )}>
                <mode.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">{mode.label}</p>
                <p className="text-[10px] uppercase tracking-widest opacity-60">{mode.desc}</p>
              </div>
              <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", activeTab === mode.id ? "rotate-90 text-[#0F766E]" : "opacity-0")} />
            </button>
          ))}
          
          <div className="pt-6">
             <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] uppercase tracking-widest text-orange-500">Security Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Access to medical records is logged. Ensure the patient's identity is verified before reprinting card or bills.
                  </p>
                </CardContent>
             </Card>
          </div>
        </aside>

        {/* Center: Search Parameters (Modernized Legacy Forms) */}
        <section className="lg:col-span-9 space-y-6">
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-border/10 flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-[#0F766E]" />
                <div>
                  <CardTitle className="text-sm">Search Parameters</CardTitle>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Find entries in Vaidyo Cloud Database</p>
                </div>
              </div>
              <button 
                onClick={handleSearch}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-all shadow-lg shadow-[#0F766E]/20"
              >
                {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                GET RECORDS
              </button>
            </CardHeader>
            <CardContent className="pt-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Mode-Specific Fields */}
                {activeTab === "PATIENT" && (
                  <>
                    <Field label="Patient Name">
                      <input 
                        value={searchForm.name} 
                        onChange={(e) => setSearchForm({...searchForm, name: e.target.value})}
                        placeholder="e.g. John Doe" 
                        className={inputCls} 
                      />
                    </Field>
                    <Field label="Mobile Number">
                      <input 
                        value={searchForm.phone} 
                        onChange={(e) => setSearchForm({...searchForm, phone: e.target.value})}
                        placeholder="10 digit number" 
                        className={inputCls} 
                      />
                    </Field>
                    <Field label="City">
                      <input 
                        value={searchForm.city} 
                        onChange={(e) => setSearchForm({...searchForm, city: e.target.value})}
                        placeholder="Village/Town" 
                        className={inputCls} 
                      />
                    </Field>
                  </>
                )}

                {(activeTab === "BILL" || activeTab === "CARD") && (
                  <>
                    <Field label="UHID / MR No.">
                      <input 
                        value={searchForm.mrNo} 
                        onChange={(e) => setSearchForm({...searchForm, mrNo: e.target.value})}
                        placeholder="MR-XXXXX" 
                        className={inputCls} 
                      />
                    </Field>
                    {activeTab === "BILL" && (
                      <Field label="Print Type">
                        <select 
                          value={searchForm.printType} 
                          onChange={(e) => setSearchForm({...searchForm, printType: e.target.value as any})}
                          className={inputCls}
                        >
                          <option value="Normal">Normal (A4)</option>
                          <option value="Small">Thermal (Small)</option>
                        </select>
                      </Field>
                    )}
                  </>
                )}

                {/* Common Date Filter */}
                <Field label="From Date">
                  <div className="relative">
                    <input 
                      type="date" 
                      value={searchForm.fromDate} 
                      onChange={(e) => setSearchForm({...searchForm, fromDate: e.target.value})}
                      className={inputCls} 
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 pointer-events-none" />
                  </div>
                </Field>
                <Field label="To Date">
                  <div className="relative">
                    <input 
                      type="date" 
                      value={searchForm.toDate} 
                      onChange={(e) => setSearchForm({...searchForm, toDate: e.target.value})}
                      className={inputCls} 
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 pointer-events-none" />
                  </div>
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Results Table (Modernized Grid) */}
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/10 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Search Results</CardTitle>
                <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold text-slate-500">{results.length} ENTRIES FOUND</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-slate-600 font-bold">Patient / UHID</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-slate-600 font-bold">Contact</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-slate-600 font-bold">City</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-slate-600 font-bold">Reg Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {results.map((p, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-200">{p.name}</p>
                            <p className="text-[10px] font-mono text-[#0F766E] font-bold">{p.id}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-slate-600" />
                              <span className="text-xs text-slate-300">{p.phone}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 capitalize">{p.city}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-mono">{p.date}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                               <button className="h-8 w-8 rounded-lg bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-all">
                                 <Printer className="h-4 w-4" />
                               </button>
                               <button className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 hover:bg-orange-500 hover:text-white transition-all">
                                 <UserEdit className="h-4 w-4" />
                               </button>
                               <button className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-all">
                                 <Download className="h-4 w-4" />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                  <div className="p-6 rounded-full bg-white/5">
                    <Database className="h-12 w-12 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-400">Database Ready</p>
                    <p className="text-xs text-slate-600">Enter search criteria and click "GET RECORDS"</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

const inputCls = "w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 outline-none focus:border-[#0F766E]/50 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{label}</label>
      {children}
    </div>
  );
}
