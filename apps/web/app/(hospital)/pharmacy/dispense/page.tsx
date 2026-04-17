"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, Pill, User, Package, CheckCircle2, AlertCircle, Trash2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

type PatientType = "Outpatient" | "Inpatient";

const DRUG_DB: { name: string; generic: string; batch: string; stock: number; mrp: number; unit: string }[] = [
  { name: "Paracetamol 500mg",     generic: "Paracetamol",    batch: "PCM-2024-01", stock: 1240, mrp: 2.50,   unit: "Tab" },
  { name: "Amoxicillin 250mg Cap", generic: "Amoxicillin",    batch: "AMX-2024-02", stock: 45,   mrp: 8.00,   unit: "Cap" },
  { name: "Metformin 500mg",       generic: "Metformin HCl",  batch: "MET-2025-01", stock: 890,  mrp: 1.20,   unit: "Tab" },
  { name: "Amlodipine 5mg",        generic: "Amlodipine",     batch: "AML-2025-02", stock: 320,  mrp: 3.50,   unit: "Tab" },
  { name: "Ciprofloxacin 500mg",   generic: "Ciprofloxacin",  batch: "CIP-2024-03", stock: 88,   mrp: 12.00,  unit: "Tab" },
  { name: "Atorvastatin 10mg",     generic: "Atorvastatin",   batch: "ATO-2025-01", stock: 560,  mrp: 4.00,   unit: "Tab" },
  { name: "Ondansetron 4mg",       generic: "Ondansetron",    batch: "OND-2024-04", stock: 0,    mrp: 7.50,   unit: "Tab" },
  { name: "Betadine 100ml",        generic: "Povidone Iodine",batch: "BET-2025-01", stock: 95,   mrp: 48.00,  unit: "Bot" },
  { name: "Azithromycin 500mg",    generic: "Azithromycin",   batch: "AZI-2025-01", stock: 420,  mrp: 18.00,  unit: "Tab" },
  { name: "Insulin Glargine 300U", generic: "Insulin Glargine",batch:"INS-2025-01", stock: 18,   mrp: 850.00, unit: "Inj" },
  { name: "Ceftriaxone 1g Inj",    generic: "Ceftriaxone",    batch: "CEF-2025-02", stock: 240,  mrp: 65.00,  unit: "Inj" },
  { name: "Normal Saline 500ml",   generic: "NaCl 0.9%",      batch: "NS-2025-03",  stock: 72,   mrp: 38.00,  unit: "Bag" },
];

type CartItem = { drug: typeof DRUG_DB[0]; qty: number };

export default function DispensePage() {
  const [patientType, setPatientType] = useState<PatientType>("Outpatient");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientSelected, setPatientSelected] = useState<{ id: string; name: string; age: string; diagnosis: string } | null>(null);
  const [drugSearch, setDrugSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dispensed, setDispensed] = useState(false);
  const [billNo, setBillNo] = useState<number | null>(null);

  const MOCK_PATIENTS = [
    { id: "AY-00001", name: "Anish Kurri",       age: "29y M", diagnosis: "Hypertension" },
    { id: "AY-00004", name: "Priya Nair",         age: "28y F", diagnosis: "Migraine" },
    { id: "AY-00005", name: "Ramesh Kumar",       age: "45y M", diagnosis: "Acute Appendicitis" },
    { id: "AY-00009", name: "Deepa Reddy",        age: "31y F", diagnosis: "PCOS" },
  ];

  const matchedPatients = patientSearch.length > 1
    ? MOCK_PATIENTS.filter(p =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(patientSearch.toLowerCase()))
    : [];

  const filteredDrugs = drugSearch.length > 1
    ? DRUG_DB.filter(d =>
        d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
        d.generic.toLowerCase().includes(drugSearch.toLowerCase()))
    : [];

  const addToCart = (drug: typeof DRUG_DB[0]) => {
    if (drug.stock === 0) return;
    setCart(c => {
      const existing = c.find(i => i.drug.batch === drug.batch);
      if (existing) return c.map(i => i.drug.batch === drug.batch ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { drug, qty: 1 }];
    });
    setDrugSearch("");
  };

  const removeFromCart = (batch: string) => setCart(c => c.filter(i => i.drug.batch !== batch));
  const updateQty = (batch: string, qty: number) => {
    if (qty <= 0) { removeFromCart(batch); return; }
    setCart(c => c.map(i => i.drug.batch === batch ? { ...i, qty } : i));
  };

  const total = cart.reduce((s, i) => s + i.drug.mrp * i.qty, 0);

  const handleDispense = () => {
    if (!patientSelected || cart.length === 0) return;
    setBillNo(Math.floor(1500 + Math.random() * 200));
    setDispensed(true);
  };

  const handleReset = () => {
    setPatientSelected(null); setPatientSearch(""); setCart([]); setDrugSearch("");
    setDispensed(false); setBillNo(null);
  };

  if (dispensed && billNo) {
    return (
      <>
        <TopBar title="Pharmacy Dispense" />
        <main className="p-8 max-w-xl mx-auto">
          <Card className="border-[#0F766E]/30 bg-[#0F766E]/5">
            <CardContent className="pt-8 pb-8 text-center space-y-5">
              <div className="mx-auto h-16 w-16 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[#0F766E]" />
              </div>
              <h2 className="text-xl font-bold">Dispensed Successfully</h2>
              <p className="text-slate-400 text-sm">
                {cart.length} item{cart.length > 1 ? "s" : ""} dispensed to <span className="text-slate-200 font-bold">{patientSelected?.name}</span>
              </p>
              <div className="inline-flex flex-col items-center bg-black/30 border border-[#0F766E]/20 rounded-xl px-8 py-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Dispense Bill No.</p>
                <p className="text-3xl font-bold font-mono text-[#0F766E]">{billNo}</p>
                <p className="text-sm font-bold text-slate-200 mt-2">₹{total.toFixed(2)}</p>
              </div>
              <div className="text-left divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden">
                {cart.map(i => (
                  <div key={i.drug.batch} className="flex justify-between px-4 py-2 text-xs">
                    <span className="text-slate-300">{i.drug.name} × {i.qty}</span>
                    <span className="font-mono text-slate-400">₹{(i.drug.mrp * i.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-center pt-1">
                <button onClick={handleReset}
                  className="px-6 py-2 rounded-lg bg-[#0F766E] text-white text-sm font-bold hover:bg-[#115E59] transition-colors">
                  New Dispense
                </button>
                <button className="px-6 py-2 rounded-lg border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/5 transition-colors">
                  Print Receipt
                </button>
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Pharmacy Dispense" action={{ label: "Stock", href: "/pharmacy/stock" }} />
      <main className="p-8 space-y-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Patient + Drug selection */}
          <div className="lg:col-span-2 space-y-5">

            {/* Patient lookup */}
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/10 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0F766E]" /> Patient
                  </CardTitle>
                  <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/40">
                    {(["Outpatient", "Inpatient"] as PatientType[]).map((t) => (
                      <button key={t} onClick={() => setPatientType(t)}
                        className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all",
                          patientType === t ? "bg-[#0F766E] text-white" : "text-muted hover:text-fg hover:bg-white/5")}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {patientSelected ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5">
                    <div className="h-10 w-10 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-[#0F766E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-200 text-sm">{patientSelected.name}</p>
                      <p className="text-xs text-slate-500">{patientSelected.id} · {patientSelected.age} · {patientSelected.diagnosis}</p>
                    </div>
                    <button onClick={() => { setPatientSelected(null); setPatientSearch(""); }}
                      className="text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-3 py-2">
                      <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                        placeholder="Search patient by name or UHID…"
                        className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none flex-1" />
                    </div>
                    {matchedPatients.length > 0 && (
                      <div className="absolute z-20 top-full mt-1 w-full bg-[#0f1a24] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                        {matchedPatients.map(p => (
                          <button key={p.id} onClick={() => { setPatientSelected(p); setPatientSearch(""); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                            <p className="text-sm font-bold text-slate-200">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.id} · {p.age} · {p.diagnosis}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Drug search */}
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/10 pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Pill className="h-4 w-4 text-[#0F766E]" /> Add Medicines
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="relative">
                  <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-3 py-2">
                    <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <input value={drugSearch} onChange={e => setDrugSearch(e.target.value)}
                      placeholder="Search drug by name or generic…"
                      className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none flex-1" />
                  </div>
                  {filteredDrugs.length > 0 && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-[#0f1a24] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                      {filteredDrugs.map(d => (
                        <button key={d.batch} onClick={() => addToCart(d)}
                          disabled={d.stock === 0}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 disabled:opacity-40 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-200">{d.name}</p>
                            <p className="text-xs text-slate-500">{d.generic} · Batch: {d.batch}</p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-xs font-mono text-[#0F766E]">₹{d.mrp}</p>
                            <p className={cn("text-[10px]", d.stock === 0 ? "text-red-400" : "text-slate-500")}>
                              {d.stock === 0 ? "Out of stock" : `${d.stock} in stock`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {cart.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">
                    Search and add medicines to the cart
                  </p>
                )}
                {cart.length > 0 && (
                  <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden">
                    {cart.map(item => (
                      <div key={item.drug.batch} className="flex items-center gap-3 px-4 py-3">
                        <div className="h-8 w-8 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-[#0F766E]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-200 truncate">{item.drug.name}</p>
                          <p className="text-xs text-slate-500">{item.drug.batch} · ₹{item.drug.mrp}/{item.drug.unit}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => updateQty(item.drug.batch, item.qty - 1)}
                            className="h-6 w-6 rounded border border-white/10 text-slate-400 hover:bg-white/5 flex items-center justify-center text-sm">−</button>
                          <span className="w-8 text-center text-sm font-bold text-slate-200">{item.qty}</span>
                          <button onClick={() => updateQty(item.drug.batch, item.qty + 1)}
                            className="h-6 w-6 rounded border border-white/10 text-slate-400 hover:bg-white/5 flex items-center justify-center text-sm">+</button>
                        </div>
                        <p className="w-16 text-right font-mono text-xs text-[#0F766E] font-bold">
                          ₹{(item.drug.mrp * item.qty).toFixed(2)}
                        </p>
                        <button onClick={() => removeFromCart(item.drug.batch)}
                          className="text-slate-600 hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right — Bill summary */}
          <div className="space-y-5">
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl sticky top-6">
              <CardHeader className="border-b border-border/10 pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-[#0F766E]" /> Dispense Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Patient */}
                <div className="text-xs space-y-1">
                  <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Patient</p>
                  {patientSelected
                    ? <p className="text-slate-200 font-bold">{patientSelected.name} <span className="text-slate-500 font-normal">({patientSelected.id})</span></p>
                    : <p className="text-slate-600 italic">Not selected</p>
                  }
                </div>

                {/* Items */}
                {cart.length === 0
                  ? <p className="text-slate-600 text-xs italic text-center py-4">No items added</p>
                  : (
                    <div className="space-y-2">
                      {cart.map(i => (
                        <div key={i.drug.batch} className="flex justify-between text-xs">
                          <span className="text-slate-400 truncate flex-1 mr-2">{i.drug.name} ×{i.qty}</span>
                          <span className="font-mono text-slate-300 shrink-0">₹{(i.drug.mrp * i.qty).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-bold">
                        <span className="text-slate-300">Total</span>
                        <span className="text-[#0F766E] font-mono">₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  )
                }

                {!patientSelected && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <AlertCircle className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-yellow-400/80">Select a patient before dispensing</p>
                  </div>
                )}

                <button
                  onClick={handleDispense}
                  disabled={!patientSelected || cart.length === 0}
                  className="w-full py-3 rounded-xl bg-[#0F766E] text-white font-bold text-sm hover:bg-[#115E59] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Dispense & Bill
                </button>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </>
  );
}
