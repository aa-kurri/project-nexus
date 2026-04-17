"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt } from "lucide-react";

interface BillItem {
  id: string;
  source: string;
  description: string;
  qty: number;
  unitPrice: number;
  gstPct: number;
  lineTotal: number;
}

interface Bill {
  id: string;
  number: string;
  status: string;
  total: number;
  paid: number;
  balance: number;
}

export default function ChargeAggregator({ encounterId }: { encounterId?: string }) {
  const supabase = createClient();
  const [bill, setBill]       = useState<Bill | null>(null);
  const [items, setItems]     = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  const fetchBill = useCallback(async () => {
    setLoading(true);

    // Find bill for this encounter (or latest bill if no encounterId)
    const query = supabase
      .from("bills")
      .select("id, number, status, total, paid, balance")
      .order("created_at", { ascending: false })
      .limit(1);

    if (encounterId) query.eq("encounter_id", encounterId);

    const { data: billData } = await query.maybeSingle();

    if (!billData) {
      setLoading(false);
      return;
    }

    setBill(billData as Bill);

    const { data: itemData } = await supabase
      .from("bill_items")
      .select("id, source, description, qty, unit_price, gst_pct, line_total")
      .eq("bill_id", billData.id)
      .order("created_at", { ascending: true });

    if (itemData) {
      setItems(
        (itemData as Record<string, unknown>[]).map((r) => ({
          id:          r.id as string,
          source:      r.source as string,
          description: r.description as string,
          qty:         r.qty as number,
          unitPrice:   r.unit_price as number,
          gstPct:      r.gst_pct as number,
          lineTotal:   r.line_total as number,
        }))
      );
    }
    setLoading(false);
  }, [supabase, encounterId]);

  useEffect(() => { fetchBill(); }, [fetchBill]);

  const settleBill = async () => {
    if (!bill) return;
    setSettling(true);
    const grandTotal = items.reduce((acc, i) => acc + i.lineTotal, 0);
    await supabase
      .from("bills")
      .update({ status: "paid", paid: grandTotal, balance: 0 })
      .eq("id", bill.id);
    setBill((prev) => prev ? { ...prev, status: "paid", paid: grandTotal, balance: 0 } : null);
    setSettling(false);
  };

  const subtotal = items.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
  const totalGst = items.reduce((acc, i) => acc + (i.qty * i.unitPrice * i.gstPct / 100), 0);
  const grandTotal = subtotal + totalGst;

  const sourceColor: Record<string, string> = {
    opd:      "bg-indigo-100 text-indigo-700",
    lab:      "bg-rose-100 text-rose-700",
    pharmacy: "bg-emerald-100 text-emerald-700",
    ipd:      "bg-blue-100 text-blue-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading charges from DB…
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
        <Receipt className="h-10 w-10 opacity-30" />
        <p className="text-sm">No bill found{encounterId ? ` for encounter ${encounterId}` : ""}</p>
      </div>
    );
  }

  const settled = bill.status === "paid";

  return (
    <Card className="max-w-4xl mx-auto p-8 shadow-xl bg-white border-t-8 border-t-[#0F766E]">
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Encounter Billing</h2>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Bill #{bill.number}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`px-4 py-1 text-sm font-bold uppercase tracking-wider border-2 ${
            settled
              ? "border-emerald-500 text-emerald-600 bg-emerald-50"
              : "border-amber-500 text-amber-600 bg-amber-50"
          }`}
        >
          {settled ? "Paid" : bill.status}
        </Badge>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-8 min-h-[100px]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
            No line items on this bill
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Rate</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">GST</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const gstVal = item.qty * item.unitPrice * item.gstPct / 100;
                return (
                  <tr key={item.id} className="hover:bg-white transition-colors">
                    <td className="py-3 px-4">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold tracking-widest ${
                          sourceColor[item.source.toLowerCase()] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.source.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.description}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{item.qty}</td>
                    <td className="py-3 px-4 text-right text-slate-600">₹ {item.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-500 text-sm">
                      {item.gstPct > 0 ? `${item.gstPct}%` : "NIL"}
                      <span className="ml-1">₹ {gstVal.toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#0F766E]">₹ {item.lineTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="w-full md:w-1/2">
          {settled && (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
              <p className="font-bold flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Bill settled — ₹ {bill.paid.toFixed(2)} received
              </p>
              <p className="text-sm mt-1">Balance: ₹ {bill.balance.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="w-full md:w-1/3 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm font-medium text-slate-600">
              <span>Subtotal</span><span>₹ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-slate-600">
              <span>GST</span><span>₹ {totalGst.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between text-xl font-bold text-slate-900">
              <span>Grand Total</span><span>₹ {grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <Button
            onClick={settleBill}
            disabled={settled || settling || items.length === 0}
            className="w-full bg-[#0F766E] hover:bg-[#115E59] text-white py-6 shadow-xl"
          >
            {settling
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : settled ? "Print Receipt" : "Settle Bill"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
