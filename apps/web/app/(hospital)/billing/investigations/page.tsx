"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Trash2, Receipt, X, FlaskConical } from "lucide-react";

// ── Investigation Tariff ──────────────────────────────────────────────────────

const INVESTIGATION_CATALOG = [
  // Hematology
  { code: "LAB-H01", dept: "Hematology", name: "Complete Blood Count (CBC)",        rate: 350, gst: 0 },
  { code: "LAB-H02", dept: "Hematology", name: "Peripheral Blood Smear",             rate: 200, gst: 0 },
  { code: "LAB-H03", dept: "Hematology", name: "Erythrocyte Sedimentation Rate (ESR)", rate: 120, gst: 0 },
  { code: "LAB-H04", dept: "Hematology", name: "PT / INR",                           rate: 250, gst: 0 },
  { code: "LAB-H05", dept: "Hematology", name: "APTT",                               rate: 300, gst: 0 },
  { code: "LAB-H06", dept: "Hematology", name: "HbA1c",                              rate: 550, gst: 0 },
  { code: "LAB-H07", dept: "Hematology", name: "Blood Group & Rh Typing",            rate: 150, gst: 0 },
  // Biochemistry
  { code: "LAB-B01", dept: "Biochemistry", name: "Liver Function Test (LFT)",        rate: 650, gst: 0 },
  { code: "LAB-B02", dept: "Biochemistry", name: "Kidney Function Test (KFT / RFT)", rate: 600, gst: 0 },
  { code: "LAB-B03", dept: "Biochemistry", name: "Fasting Blood Sugar (FBS)",        rate: 120, gst: 0 },
  { code: "LAB-B04", dept: "Biochemistry", name: "Postprandial Blood Sugar (PPBS)",  rate: 120, gst: 0 },
  { code: "LAB-B05", dept: "Biochemistry", name: "Random Blood Sugar (RBS)",         rate: 100, gst: 0 },
  { code: "LAB-B06", dept: "Biochemistry", name: "Lipid Profile",                    rate: 700, gst: 0 },
  { code: "LAB-B07", dept: "Biochemistry", name: "Serum Electrolytes (Na/K/Cl)",     rate: 450, gst: 0 },
  { code: "LAB-B08", dept: "Biochemistry", name: "Serum Uric Acid",                  rate: 200, gst: 0 },
  { code: "LAB-B09", dept: "Biochemistry", name: "Serum Albumin",                    rate: 180, gst: 0 },
  { code: "LAB-B10", dept: "Biochemistry", name: "Total Protein",                    rate: 180, gst: 0 },
  // Serology
  { code: "LAB-S01", dept: "Serology", name: "Widal Test",                           rate: 250, gst: 0 },
  { code: "LAB-S02", dept: "Serology", name: "Dengue NS1 + IgM/IgG",                rate: 900, gst: 0 },
  { code: "LAB-S03", dept: "Serology", name: "Malaria Antigen Test",                 rate: 350, gst: 0 },
  { code: "LAB-S04", dept: "Serology", name: "HIV 1 & 2 (ELISA)",                   rate: 400, gst: 0 },
  { code: "LAB-S05", dept: "Serology", name: "HBsAg",                               rate: 300, gst: 0 },
  { code: "LAB-S06", dept: "Serology", name: "HCV Antibody",                         rate: 350, gst: 0 },
  // Urine
  { code: "LAB-U01", dept: "Urine", name: "Urine Routine / Microscopy",             rate: 150, gst: 0 },
  { code: "LAB-U02", dept: "Urine", name: "Urine Culture & Sensitivity",            rate: 700, gst: 0 },
  { code: "LAB-U03", dept: "Urine", name: "24hr Urine Protein",                     rate: 300, gst: 0 },
  // Microbiology
  { code: "LAB-M01", dept: "Microbiology", name: "Blood Culture & Sensitivity",     rate: 900, gst: 0 },
  { code: "LAB-M02", dept: "Microbiology", name: "Sputum Culture",                  rate: 700, gst: 0 },
  { code: "LAB-M03", dept: "Microbiology", name: "Gram Stain",                      rate: 200, gst: 0 },
  // Cardiac
  { code: "LAB-C01", dept: "Cardiac", name: "Troponin I (STAT)",                    rate: 900, gst: 0 },
  { code: "LAB-C02", dept: "Cardiac", name: "CK-MB",                                rate: 700, gst: 0 },
  { code: "LAB-C03", dept: "Cardiac", name: "NT-proBNP",                            rate: 1400, gst: 0 },
  { code: "LAB-C04", dept: "Cardiac", name: "D-Dimer",                              rate: 1200, gst: 0 },
  // Radiology
  { code: "RAD-X01", dept: "Radiology", name: "Chest X-Ray (PA View)",              rate: 400, gst: 5 },
  { code: "RAD-X02", dept: "Radiology", name: "X-Ray — Abdomen",                    rate: 350, gst: 5 },
  { code: "RAD-X03", dept: "Radiology", name: "X-Ray — Spine (AP + Lat)",           rate: 600, gst: 5 },
  { code: "RAD-U01", dept: "Radiology", name: "USG Abdomen",                        rate: 1200, gst: 5 },
  { code: "RAD-U02", dept: "Radiology", name: "USG Pelvis",                         rate: 1000, gst: 5 },
  { code: "RAD-E01", dept: "Radiology", name: "ECG (12-Lead)",                      rate: 200, gst: 5 },
  { code: "RAD-E02", dept: "Radiology", name: "2D Echo",                            rate: 2500, gst: 5 },
];

const DEPTS = ["All", ...Array.from(new Set(INVESTIGATION_CATALOG.map((i) => i.dept)))];

interface PatientHit { id: string; fullName: string; uhid: string; }
interface LineItem { code: string; dept: string; name: string; rate: number; gst: number; qty: number; }

function calcLine(item: LineItem) {
  const base   = item.qty * item.rate;
  const gstAmt = (base * item.gst) / 100;
  return { base, gstAmt, total: base + gstAmt };
}

export default function InvestigationBillingPage() {
  const supabase = createClient();

  // Patient
  const [search, setSearch]       = useState("");
  const [results, setResults]     = useState<PatientHit[]>([]);
  const [selected, setSelected]   = useState<PatientHit | null>(null);
  const [searching, setSearching] = useState(false);

  // Catalog
  const [activeDept, setActiveDept] = useState("All");
  const [catalogSearch, setCatalogSearch] = useState("");

  // Bill
  const [items, setItems]   = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState<string | null>(null);
  const [encType, setEncType] = useState<"OP" | "IP">("OP");

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

  function addItem(svc: typeof INVESTIGATION_CATALOG[0]) {
    setItems((prev) => {
      const ex = prev.find((i) => i.code === svc.code);
      if (ex) return prev.map((i) => i.code === svc.code ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...svc, qty: 1 }];
    });
  }

  function removeItem(code: string) { setItems((prev) => prev.filter((i) => i.code !== code)); }
  function setQty(code: string, qty: number) {
    if (qty < 1) { removeItem(code); return; }
    setItems((prev) => prev.map((i) => i.code === code ? { ...i, qty } : i));
  }

  const subtotal   = items.reduce((s, i) => s + calcLine(i).base, 0);
  const totalGst   = items.reduce((s, i) => s + calcLine(i).gstAmt, 0);
  const grandTotal = subtotal + totalGst;

  const filteredCatalog = INVESTIGATION_CATALOG.filter((svc) => {
    const matchDept = activeDept === "All" || svc.dept === activeDept;
    const matchQ    = svc.name.toLowerCase().includes(catalogSearch.toLowerCase()) || svc.code.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchDept && matchQ;
  });

  async function generateBill() {
    if (!selected || items.length === 0) return;
    setSaving(true);

    const { data: tenantRow } = await supabase.from("tenants").select("id").limit(1).single();
    if (!tenantRow) { setSaving(false); return; }
    const tenantId = (tenantRow as { id: string }).id;

    const billNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
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
        const { total } = calcLine(i);
        return {
          tenant_id:   tenantId,
          bill_id:     billId,
          source:      "lab",
          description: i.name,
          qty:         i.qty,
          unit_price:  i.rate,
          gst_pct:     i.gst,
          line_total:  total,
        };
      })
    );

    // Also create service_requests for each lab test
    await supabase.from("service_requests").insert(
      items.map((i) => ({
        tenant_id:  tenantId,
        patient_id: selected.id,
        code:       i.code,
        display:    i.name,
        status:     "active",
      }))
    );

    setSaved(billNumber);
    setSaving(false);
  }

  if (saved) {
    return (
      <>
        <TopBar title="Investigation Billing" />
        <main className="p-8 flex items-center justify-center min-h-[500px]">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Receipt className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-fg">Investigation Bill Generated</h2>
            <div className="rounded-xl border border-border bg-surface/40 p-6 space-y-3 text-left text-sm">
              <div className="flex justify-between"><span className="text-muted">Patient</span><span className="font-bold text-fg">{selected?.fullName}</span></div>
              <div className="flex justify-between"><span className="text-muted">Bill No.</span><span className="font-bold font-mono text-[#0F766E]">{saved}</span></div>
              <div className="flex justify-between"><span className="text-muted">Tests</span><span className="font-bold">{items.length}</span></div>
              <div className="flex justify-between"><span className="text-muted">Grand Total</span><span className="font-bold">₹ {grandTotal.toFixed(2)}</span></div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-[#0F766E] text-white" onClick={() => { setItems([]); setSelected(null); setSearch(""); setSaved(null); }}>New Bill</Button>
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>Print</Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Investigation Billing" />
      <main className="p-8 max-w-7xl mx-auto space-y-5">

        {/* OP / IP toggle + Patient search */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex bg-surface/40 border border-border rounded-xl p-1">
            {(["OP", "IP"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setEncType(t)}
                className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  encType === t ? "bg-[#0F766E] text-white" : "text-muted hover:text-fg"
                }`}
              >
                {t === "OP" ? "Out-Patient" : "In-Patient"}
              </button>
            ))}
          </div>

          {/* Patient search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            {selected ? (
              <div className="flex items-center gap-2 pl-9 pr-3 py-2 rounded-lg border border-[#0F766E]/40 bg-[#0F766E]/5 text-sm">
                <span className="font-medium text-fg flex-1">{selected.fullName}</span>
                <span className="text-muted font-mono">{selected.uhid}</span>
                <button onClick={() => { setSelected(null); setSearch(""); }} className="text-muted hover:text-red-400 ml-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient by name or UHID…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface/40 text-sm text-fg outline-none focus:border-[#0F766E]"
              />
            )}
            {!selected && searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted" />}
            {!selected && results.length > 0 && (
              <div className="absolute top-full mt-1 w-full rounded-xl border border-border bg-surface shadow-xl z-20 overflow-hidden">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setSelected(r); setResults([]); setSearch(""); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 text-left"
                  >
                    <span className="text-sm font-medium text-fg">{r.fullName}</span>
                    <span className="text-xs text-muted font-mono">{r.uhid}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Catalog */}
          <div className="lg:col-span-2 space-y-4">
            {/* Dept tabs */}
            <div className="flex flex-wrap gap-1.5">
              {DEPTS.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDept(d)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                    activeDept === d
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                      : "border-border text-muted hover:text-fg hover:bg-white/5"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search investigations…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface/40 text-sm text-fg outline-none focus:border-[#0F766E]"
              />
            </div>

            <Card className="border-border/40 bg-surface/50">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-rose-400" /> Investigation Catalog
                </CardTitle>
                <span className="text-xs text-muted">{filteredCatalog.length} tests</span>
              </CardHeader>
              <CardContent>
                <div className="space-y-0.5 max-h-[420px] overflow-y-auto">
                  {filteredCatalog.map((svc) => {
                    const inBill = items.find((i) => i.code === svc.code);
                    return (
                      <button
                        key={svc.code}
                        onClick={() => addItem(svc)}
                        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 transition-all text-left hover:bg-white/5 ${
                          inBill ? "bg-[#0F766E]/5 border border-[#0F766E]/20" : "border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Badge variant="secondary" className="text-[9px] shrink-0 font-mono">{svc.dept}</Badge>
                          <span className="text-sm text-fg font-medium truncate">{svc.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {svc.gst > 0 && <span className="text-[9px] text-muted">+{svc.gst}%</span>}
                          <span className="font-mono font-bold text-[#0F766E] text-sm">₹{svc.rate}</span>
                          {inBill
                            ? <Badge className="bg-[#0F766E]/20 text-[#0F766E] text-[9px] border-none">×{inBill.qty}</Badge>
                            : <Plus className="h-3.5 w-3.5 text-muted" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bill panel */}
          <div className="space-y-4">
            <Card className="border-border/40 bg-surface/50 sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Selected Tests ({items.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-xs text-muted text-center py-6">Click tests from the catalog to add them</p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {items.map((item) => {
                        const { total } = calcLine(item);
                        return (
                          <div key={item.code} className="flex items-start gap-2 rounded-lg border border-border px-2.5 py-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-fg truncate">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <button onClick={() => setQty(item.code, item.qty - 1)} className="w-5 h-5 rounded border border-border text-[10px] text-muted hover:text-fg flex items-center justify-center">−</button>
                                <span className="text-xs font-mono">{item.qty}</span>
                                <button onClick={() => setQty(item.code, item.qty + 1)} className="w-5 h-5 rounded border border-border text-[10px] text-muted hover:text-fg flex items-center justify-center">+</button>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-mono font-bold text-[#0F766E] text-xs">₹{total.toFixed(0)}</span>
                              <button onClick={() => removeItem(item.code)} className="text-muted hover:text-red-400 transition-colors">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-1.5 border-t border-border pt-3 text-xs">
                      <div className="flex justify-between text-muted"><span>Subtotal</span><span className="font-mono">₹ {subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-muted"><span>GST</span><span className="font-mono">₹ {totalGst.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-base text-fg border-t border-border pt-2">
                        <span>Grand Total</span><span className="font-mono">₹ {grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}

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
                {!selected && (
                  <p className="text-[10px] text-muted text-center">Select a patient to generate</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
