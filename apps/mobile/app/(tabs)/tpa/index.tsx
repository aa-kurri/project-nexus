import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Send, RefreshCw } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type CashlessStep = "eligibility" | "pre_auth" | "enhancement" | "final_bill" | "submitted" | "settled" | "rejected";

const STEP_ORDER: CashlessStep[] = ["eligibility","pre_auth","enhancement","final_bill","submitted","settled"];

const STEP_CFG: Record<CashlessStep, { label: string; color: string; Icon: any }> = {
  eligibility: { label: "Eligibility",  color: "#3b82f6", Icon: CheckCircle2 },
  pre_auth:    { label: "Pre-Auth",     color: "#f59e0b", Icon: Clock        },
  enhancement: { label: "Enhancement", color: "#f97316", Icon: AlertTriangle },
  final_bill:  { label: "Final Bill",  color: "#06b6d4", Icon: Send          },
  submitted:   { label: "Submitted",   color: "#8b5cf6", Icon: Send          },
  settled:     { label: "Settled",     color: PRIMARY,   Icon: CheckCircle2  },
  rejected:    { label: "Rejected",    color: "#ef4444", Icon: AlertTriangle },
};

interface TpaCase {
  id: string; patient: string; uhid: string; tpa: string; insurer: string;
  diagnosis: string; ward: string; approvedAmt: number; utilised: number;
  step: CashlessStep; admitDate: string;
}

function StepBar({ current }: { current: CashlessStep }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <View style={{ flexDirection: "row", gap: 3, marginTop: 8 }}>
      {STEP_ORDER.map((step, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <View key={step} style={{
            flex: 1, height: 4, borderRadius: 2,
            backgroundColor: done ? PRIMARY : active ? STEP_CFG[step].color : "#1e2332",
          }} />
        );
      })}
    </View>
  );
}

export default function TpaScreen() {
  const { profile }             = useAuthStore();
  const [cases,    setCases]    = useState<TpaCase[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from("tpa_claims")
        .select(`
          id, diagnosis, insurer, tpa_name, approved_amount,
          claimed_amount, step, admit_date, payer_type,
          patients ( full_name, mrn ),
          admissions ( beds ( label ) )
        `)
        .eq("tenant_id", profile.tenant_id)
        .not("step", "eq", "settled")  // show active cases first
        .order("created_at", { ascending: false })
        .limit(50);

      if (qErr) throw new Error(qErr.message);

      setCases(
        (data ?? []).map((c: any) => ({
          id:          c.id,
          patient:     c.patients?.full_name ?? "Unknown",
          uhid:        c.patients?.mrn ?? "—",
          tpa:         c.tpa_name ?? "—",
          insurer:     c.insurer ?? "—",
          diagnosis:   c.diagnosis ?? "—",
          ward:        c.admissions?.beds?.label ?? "—",
          approvedAmt: c.approved_amount ?? 0,
          utilised:    c.claimed_amount ?? 0,
          step:        c.step as CashlessStep,
          admitDate:   c.admit_date ?? "—",
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const enhancement = cases.filter((c) => c.step === "enhancement").length;

  async function advanceStep(id: string, nextStep: CashlessStep) {
    setUpdating(id);
    try {
      const { error: uErr } = await supabase
        .from("tpa_claims")
        .update({ step: nextStep })
        .eq("id", id);
      if (uErr) throw new Error(uErr.message);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={PRIMARY} size="large" />
        <Text style={{ color: "#6b7280", marginTop: 12 }}>Loading TPA cases…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>Billing</Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>TPA Cashless</Text>
        {enhancement > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8,
            backgroundColor: "#f9730030", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
            alignSelf: "flex-start" }}>
            <AlertTriangle size={12} color="#f97316" />
            <Text style={{ color: "#f97316", fontSize: 11, fontWeight: "700" }}>
              {enhancement} enhancement needed
            </Text>
          </View>
        )}
      </View>

      {error && (
        <View style={{ margin: 16, backgroundColor: "#ef444420", borderRadius: 12,
          borderWidth: 1, borderColor: "#ef444440", padding: 12 }}>
          <Text style={{ color: "#f87171", fontSize: 13 }}>{error}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {cases.length === 0 && (
          <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 40 }}>
            No active TPA cases.
          </Text>
        )}
        {cases.map((c) => {
          const scfg  = STEP_CFG[c.step];
          const pct   = c.approvedAmt > 0 ? Math.round((c.utilised / c.approvedAmt) * 100) : 0;
          const isUpd = updating === c.id;

          return (
            <View key={c.id} style={{ backgroundColor: SURFACE, borderRadius: 16,
              borderWidth: 1, borderColor: c.step === "enhancement" ? "#f9731030" : BORDER, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12,
                  backgroundColor: `${scfg.color}20`, alignItems: "center", justifyContent: "center" }}>
                  <CreditCard size={19} color={scfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 14 }}>{c.patient}</Text>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 1 }}>
                    {c.insurer} via {c.tpa}
                  </Text>
                  <Text style={{ color: "#4b5563", fontSize: 11, marginTop: 1 }}>
                    {c.diagnosis} · {c.ward} · {c.admitDate}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <View style={{ backgroundColor: `${scfg.color}20`, borderRadius: 8,
                    paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: scfg.color, fontSize: 9, fontWeight: "700" }}>{scfg.label}</Text>
                  </View>
                  {c.approvedAmt > 0 && (
                    <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 13 }}>
                      ₹{(c.approvedAmt / 1000).toFixed(0)}K
                    </Text>
                  )}
                </View>
              </View>

              <StepBar current={c.step} />

              {c.approvedAmt > 0 && (
                <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ flex: 1, height: 4, backgroundColor: "#1e2332", borderRadius: 2, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${Math.min(pct, 100)}%`,
                      backgroundColor: pct >= 80 ? "#f97316" : PRIMARY, borderRadius: 2 }} />
                  </View>
                  <Text style={{ color: pct >= 80 ? "#f97316" : "#6b7280", fontSize: 11, fontWeight: "600" }}>
                    {pct}% utilised
                  </Text>
                </View>
              )}

              {c.step === "pre_auth" && (
                <Pressable onPress={() => advanceStep(c.id, "enhancement")} disabled={isUpd}
                  style={({ pressed }) => ({
                    marginTop: 10, flexDirection: "row", alignItems: "center",
                    justifyContent: "center", gap: 6,
                    backgroundColor: "#3b82f620", borderRadius: 10, paddingVertical: 9,
                    borderWidth: 1, borderColor: "#3b82f640",
                    opacity: pressed || isUpd ? 0.7 : 1,
                  })}>
                  {isUpd ? <ActivityIndicator size="small" color="#3b82f6" />
                         : <RefreshCw size={14} color="#3b82f6" />}
                  <Text style={{ color: "#3b82f6", fontWeight: "700", fontSize: 12 }}>
                    {isUpd ? "Saving…" : "Verify Policy"}
                  </Text>
                </Pressable>
              )}
              {c.step === "enhancement" && (
                <Pressable onPress={() => advanceStep(c.id, "final_bill")} disabled={isUpd}
                  style={({ pressed }) => ({
                    marginTop: 10, flexDirection: "row", alignItems: "center",
                    justifyContent: "center", gap: 6,
                    backgroundColor: "#f9731020", borderRadius: 10, paddingVertical: 9,
                    borderWidth: 1, borderColor: "#f9731040",
                    opacity: pressed || isUpd ? 0.7 : 1,
                  })}>
                  {isUpd ? <ActivityIndicator size="small" color="#f97316" />
                         : <Send size={14} color="#f97316" />}
                  <Text style={{ color: "#f97316", fontWeight: "700", fontSize: 12 }}>
                    {isUpd ? "Saving…" : "Request Enhancement"}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
