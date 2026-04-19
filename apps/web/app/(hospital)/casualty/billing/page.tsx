"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Trash2, Receipt, X } from "lucide-react";

// ── Tariff items for Casualty ─────────────────────────────────────────────────

const CASUALTY_SERVICES = [
  { code: "CAS-001", name: "Casualty Registration",           rate: 100,  gst: 0  },
  { code: "CAS-002", name: "Casualty Consultation",            rate: 300,  gst: 5  },
  { code: "CAS-003", name: "Minor Procedure (Suturing)",        rate: 500,  gst: 5  },
  { code: "CAS-004", name: "Minor Procedure (Wound Dressing)", rate: 250,  gst: 5  },
  { code: "CAS-005", name: "IV Cannula Insertion",              rate: 150,  gst: 5  },
  { code: "CAS-006", name: "Nebulisation",                      rate: 200,  gst: 5  },
  { code: "CAS-007", name: "Oxygen Administration (per hour)",  rate: 100,  gst: 0  },
  { code: "CAS-008", name: "ECG",                               rate: 200,  gst: 5  },
  { code: "CAS-009", name: "ER Bed Charge (per hour)",          rate: 250,  gst: 0  },
  { code: "CAS-010", name: "Ambulance (Local)",                 rate: 800,  gst: 5  },
  { code: "CAS-011", name: "Fracture — POP Slab",               rate: 600,  gst: 5  },
  { code: "CAS-012", name: "Fracture — Reduction",              rate: 1500, gst: 5  },
  { code: "LAB-001", name: "CBC (Emergency)",                   rate: 350,  gst: 0  },
  { code: "LAB-002", name: "Blood Glucose (Random)",            rate: 120,  gst: 0  },
  { code: "LAB-003", name: "ABG (STAT)",                        rate: 700,  gst: 0  },
  { code: "LAB-004", name: "Troponin I (STAT)",                 rate: 900,  gst: 0  },
  { code: "RAD-001", name: "Chest X-Ray (Emergency)",           rate: 400,  gst: 5  },
  { code: "RAD-002", name: "X-Ray — Extremity",                 rate: 300,  gst: 5  },
];

interface PatientHit { id: string; fullName: string; uhid: string; }
interface LineItem { code: string; name: string; rate: number; gst: number; qty: number; }

function calcLine(item: LineItem) {
  const base = item.qty * item.rate;
  const gstAmt = (base * item.gst) / 100;
  return { base, gstAmt, total: base + gstAmt };
}

export default function CasualtyBillingPage() {
  const supabase = createClient();

  // Patient search
  const [search, setSearch]       = useState("");
  const [results, setResults]     = useState<PatientHit[]>([]);
  const [selected, setSelected]   = useState<PatientHit | null>(null);
  const [searching, setSearching] = useState(false);

  // Bill items
  const [items, setItems]         = useState<LineItem[]>([]);
  const [serviceSearch, setSvcSearch] = useState("");

  // Saving
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState<string | null>(null);

  const searchPatients = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("patients")
      .select("id, full_name, uhid")
      .or(`full_name.ilike.%${q}%,uhid.ilike.%${q}%`)
      .limit(8);
    setResults(
      (data ?? []).map((r) => ({
        id:       (r as { id: string }).id,
        fullName: (r as { full_name: string }).full_name,
        uhid:     (r as { uhid?: string | null }).uhid ?? "—",
      }))
    );
    setSearching(false);
  }, [supabase]);

  useEffect(() => {
    const t = setTimeout(() => searchPatients(search), 300);
    return () => clearTimeout(t);
  }, [search, searchPatients]);

  function addService(svc: typeof CASUALTY_SERVICES[0]) {
    setItems((prev) => {
      const existing = prev.find((i) => i.code === svc.code);
      if (existing) {
        return prev.map((i) => i.code === svc.code ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...svc, qty: 1 }];
    });
    setSvcSearch("");
  }

  function removeItem(code: string) {
    setItems((prev) => prev.filter((i) => i.code !== code));
  }

  function setQty(code: string, qty: number) {
    if (qty < 1) { removeItem(code); return; }
    setItems((prev) => prev.map((i) => i.code === code ? { ...i, qty } : i));
  }

  const subtotal  = items.reduce((s, i) => s + calcLine(i).base, 0);
  const totalGst  = items.reduce((s, i) => s + calcLine(i).gstAmt, 0);
  const grandTotal = subtotal + totalGst;

  async function generateBill() {
    if (!selected || items.length === 0) return;
    setSaving(true);

    const { data: tenantRow } = await supabase.from("tenants").select("id").limit(1).single();
    if (!tenantRow) { setSaving(false); return; }
    const tenantId = (tenantRow as { id: string }).id;

    const billNumber = `CAS-${Date.now().toString(36).toUpperCase()}`;

    const { data: bill, error: billErr } = await supabase
      .from("bills")
      .insert({
        tenant_id:  tenantId,
        patient_id: selected.id,
        number:     billNumber,
        status:     "pending",
        total:      grandTotal,
        paid:       0,
        balance:    grandTotal,
      })
      .select("id")
      .single();

    if (billErr || !bill) { setSaving(false); return; }
    const billId = (bill as { id: string }).id;

    await supabase.from("bill_items").insert(
      items.map((i) => {
        const { base, gstAmt, total } = calcLine(i);
        return {
          tenant_id:   tenantId,
          bill_id:     billId,
          source:      "casualty",
          description: i.name,
          qty:         i.qty,
          unit_price:  i.rate,
          gst_pct:     i.gst,
          line_total:  total,
        };
      })
    );

    setSaved(billNumber);
    setSaving(false);
  }

  const filteredSvc = CASUALTY_SERVICES.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  if (saved) {
    return (
      <>
        <TopBar title="Casualty Billing" />
        <main className="p-8 flex items-center justify-center min-h-[500px]">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Receipt className="h-10 w-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-fg">Bill Generated</h2>
              <p className="text-muted mt-1">Casualty bill saved successfully</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 p-6 space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Patient</span>
                <span className="font-bold text-fg">{selected?.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Bill No.</span>
                <span className="font-bold font-mono text-[#0F766E]">{saved}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Grand Total</span>
                <span className="font-bold text-fg">₹ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-[#0F766E] text-white" onClick={() => { setItems([]); setSelected(null); setSearch(""); setSaved(null); }}>
                New Bill
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                Print Receipt
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Casualty Billing" />
      <main className="p-8 max-w-6xl mx-auto space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Patient + Services */}
          <div className="lg:col-span-2 space-y-5">

            {/* Patient Search */}
            <Card className="border-border/40 bg-surface/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Patient Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selected ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#0F766E]/40 bg-[#0F766E]/5 px-4 py-3">
                    <div>
                      <p className="font-bold text-fg">{selected.fullName}</p>
                      <p className="text-xs text-muted">{selected.uhid}</p>
                    </div>
                    <button onClick={() => { setSelected(null); setSearch(""); }} className="text-muted hover:text-red-400 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name or ER number…"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface/40 text-sm text-fg outline-none focus:border-[#0F766E]"
                    />
                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted" />}
                    {results.length > 0 && (
                      <div className="absolute top-full mt-1 w-full rounded-xl border border-border bg-surface shadow-xl z-20 overflow-hidden">
                        {results.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => { setSelected(r); setResults([]); setSearch(""); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 text-left transition-colors"
                          >
                            <span className="text-sm font-medium text-fg">{r.fullName}</span>
                            <span className="text-xs text-muted font-mono">{r.uhid}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Picker */}
            <Card className="border-border/40 bg-surface/50">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Add Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                  <input
                    value={serviceSearch}
                    onChange={(e) => setSvcSearch(e.target.value)}
                    placeholder="Filter casualty services…"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface/40 text-sm text-fg outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto">
                  {filteredSvc.map((svc) => (
                    <button
                      key={svc.code}
                      onClick={() => addService(svc)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5 border border-transparent hover:border-border transition-all text-left"
                    >
                      <div>
                        <span className="text-sm text-fg font-medium">{svc.name}</span>
                        <span className="ml-2 text-[10px] text-muted font-mono">{svc.code}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {svc.gst > 0 && <Badge variant="secondary" className="text-[9px]">GST {svc.gst}%</Badge>}
                        <span className="font-mono font-bold text-[#0F766E] text-sm">₹{svc.rate}</span>
                        <Plus className="h-3.5 w-3.5 text-muted" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bill Items */}
            {items.length > 0 && (
              <Card className="border-border/40 bg-surface/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Bill Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const { total } = calcLine(item);
                      return (
                        <div key={item.code} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-fg truncate">{item.name}</p>
                            <p className="text-[11px] text-muted">₹{item.rate} × {item.qty}{item.gst > 0 ? ` + ${item.gst}% GST` : ""}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => setQty(item.code, item.qty - 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted hover:text-fg hover:bg-white/5">−</button>
                            <span className="w-6 text-center text-sm font-mono">{item.qty}</span>
                            <button onClick={() => setQty(item.code, item.qty + 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted hover:text-fg hover:bg-white/5">+</button>
                          </div>
                          <span className="font-mono font-bold text-[#0F766E] w-20 text-right text-sm shrink-0">₹{total.toFixed(2)}</span>
                          <button onClick={() => removeItem(item.code)} className="text-muted hover:text-red-400 transition-colors shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Summary */}
          <div className="space-y-4">
            <Card className="border-border/40 bg-surface/50 sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Bill Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span><span className="font-mono">₹ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>GST</span><span className="font-mono">₹ {totalGst.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-lg font-bold text-fg">
                    <span>Grand Total</span><span className="font-mono">₹ {grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Badge variant="secondary" className="text-[10px] text-muted">Source: Casualty</Badge>
                  {selected && <Badge variant="outline" className="text-[10px] text-[#0F766E] border-[#0F766E]/40">{selected.fullName}</Badge>}
                </div>

                <Button
                  onClick={generateBill}
                  disabled={saving || !selected || items.length === 0}
                  className="w-full bg-[#0F766E] hover:bg-[#115E59] text-white py-5"
                >
                  {saving
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Receipt className="h-4 w-4 mr-2" />Generate Bill</>
                  }
                </Button>
                {!selected && <p className="text-[11px] text-muted text-center">Select a patient first</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
