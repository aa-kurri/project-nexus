import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Send, RefreshCw } from "lucide-react-native";
import { useState } from "react";

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

const CASES: TpaCase[] = [
  { id: "CS-001", patient: "Ramesh Kumar",    uhid: "AY-00412", tpa: "Vidal Health",   insurer: "Star Health",  diagnosis: "Acute Appendicitis",   ward: "General",      approvedAmt: 45000,  utilised: 38200, step: "final_bill",  admitDate: "2026-04-13" },
  { id: "CS-002", patient: "Sunita Sharma",   uhid: "AY-00389", tpa: "Paramount TPA",  insurer: "Niva Bupa",    diagnosis: "STEMI Post-PCI",        ward: "ICU",          approvedAmt: 180000, utilised: 162000,step: "enhancement", admitDate: "2026-04-15" },
  { id: "CS-003", patient: "George Mathew",   uhid: "AY-00345", tpa: "Health India",   insurer: "New India",    diagnosis: "Knee Replacement",      ward: "Semi-Private", approvedAmt: 350000, utilised: 180000,step: "pre_auth",    admitDate: "2026-04-16" },
  { id: "CS-004", patient: "Priya Venkatesh", uhid: "AY-00298", tpa: "—",             insurer: "CGHS",         diagnosis: "Normal Delivery",       ward: "Semi-Private", approvedAmt: 28000,  utilised: 28000, step: "settled",     admitDate: "2026-04-12" },
  { id: "CS-005", patient: "Arun Nair",       uhid: "AY-00267", tpa: "Raksha TPA",    insurer: "United India", diagnosis: "Hernia Repair",         ward: "General",      approvedAmt: 0,      utilised: 32000, step: "rejected",    admitDate: "2026-04-12" },
];

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
  const [verifying, setVer] = useState<string | null>(null);
  const [localSt,   setLocalSt] = useState<Record<string, CashlessStep>>({});

  function verifyPolicy(id: string) {
    setVer(id);
    setTimeout(() => {
      setLocalSt(prev => ({ ...prev, [id]: "enhancement" }));
      setVer(null);
    }, 1500);
  }

  const enhancement = CASES.filter(c => (localSt[c.id] ?? c.step) === "enhancement").length;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Billing
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          TPA Cashless
        </Text>
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

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {CASES.map(c => {
          const step = (localSt[c.id] ?? c.step) as CashlessStep;
          const scfg = STEP_CFG[step];
          const pct  = c.approvedAmt > 0 ? Math.round((c.utilised / c.approvedAmt) * 100) : 0;
          const isVer = verifying === c.id;

          return (
            <View key={c.id} style={{ backgroundColor: SURFACE, borderRadius: 16,
              borderWidth: 1, borderColor: step === "enhancement" ? "#f9731030" : BORDER, padding: 14 }}>
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

              <StepBar current={step} />

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

              {step === "pre_auth" && (
                <Pressable onPress={() => verifyPolicy(c.id)} disabled={isVer}
                  style={({ pressed }) => ({
                    marginTop: 10, flexDirection: "row", alignItems: "center",
                    justifyContent: "center", gap: 6,
                    backgroundColor: "#3b82f620", borderRadius: 10, paddingVertical: 9,
                    borderWidth: 1, borderColor: "#3b82f640",
                    opacity: pressed || isVer ? 0.7 : 1,
                  })}>
                  {isVer
                    ? <ActivityIndicator size="small" color="#3b82f6" />
                    : <RefreshCw size={14} color="#3b82f6" />}
                  <Text style={{ color: "#3b82f6", fontWeight: "700", fontSize: 12 }}>
                    {isVer ? "Verifying…" : "Verify Policy"}
                  </Text>
                </Pressable>
              )}
              {step === "enhancement" && (
                <Pressable style={({ pressed }) => ({
                  marginTop: 10, flexDirection: "row", alignItems: "center",
                  justifyContent: "center", gap: 6,
                  backgroundColor: "#f9731020", borderRadius: 10, paddingVertical: 9,
                  borderWidth: 1, borderColor: "#f9731040",
                  opacity: pressed ? 0.7 : 1,
                })}>
                  <Send size={14} color="#f97316" />
                  <Text style={{ color: "#f97316", fontWeight: "700", fontSize: 12 }}>Request Enhancement</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
