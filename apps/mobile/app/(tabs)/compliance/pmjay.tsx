import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle, Send, RefreshCw } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type ClaimStatus = "pre_auth_pending" | "pre_auth_approved" | "submitted" | "settled" | "rejected" | "query";

const STATUS_CFG: Record<ClaimStatus, { label: string; color: string; Icon: any }> = {
  pre_auth_pending:  { label: "Pre-Auth Pending",  color: "#f59e0b", Icon: Clock        },
  pre_auth_approved: { label: "Pre-Auth Approved", color: "#3b82f6", Icon: CheckCircle2 },
  submitted:         { label: "Submitted",         color: "#8b5cf6", Icon: Send         },
  settled:           { label: "Settled",           color: PRIMARY,   Icon: CheckCircle2 },
  rejected:          { label: "Rejected",          color: "#ef4444", Icon: AlertTriangle },
  query:             { label: "Query Raised",      color: "#f97316", Icon: AlertTriangle },
};

interface PmjayCase {
  id: string; patient: string; uhid: string; beneficiaryId: string;
  icd10: string; diagnosis: string; approvedAmt: number; claimedAmt: number;
  status: ClaimStatus; admitDate: string;
}

const CASES: PmjayCase[] = [
  { id: "PM-001", patient: "Ramesh Kumar",    uhid: "AY-00412", beneficiaryId: "PMJAY-TS-2024-11223", icd10: "K35.2", diagnosis: "Acute Appendicitis",    approvedAmt: 15000, claimedAmt: 14200, status: "settled",           admitDate: "2026-04-10" },
  { id: "PM-002", patient: "Sunita Sharma",   uhid: "AY-00389", beneficiaryId: "PMJAY-TS-2024-33441", icd10: "I21.0", diagnosis: "Anterior STEMI",        approvedAmt: 90000, claimedAmt: 85000, status: "submitted",          admitDate: "2026-04-14" },
  { id: "PM-003", patient: "George Mathew",   uhid: "AY-00345", beneficiaryId: "PMJAY-TS-2023-77891", icd10: "M17.1", diagnosis: "Primary Osteoarthritis", approvedAmt: 0,     claimedAmt: 0,     status: "pre_auth_pending",   admitDate: "2026-04-16" },
  { id: "PM-004", patient: "Arun Nair",       uhid: "AY-00267", beneficiaryId: "PMJAY-TS-2022-55423", icd10: "K40.9", diagnosis: "Hernia Repair",          approvedAmt: 12000, claimedAmt: 11500, status: "rejected",           admitDate: "2026-04-12" },
  { id: "PM-005", patient: "Priya Venkatesh", uhid: "AY-00298", beneficiaryId: "PMJAY-TS-2024-88901", icd10: "O80",   diagnosis: "Normal Delivery",        approvedAmt: 9000,  claimedAmt: 9000,  status: "pre_auth_approved",  admitDate: "2026-04-15" },
];

export default function PmjayScreen() {
  const [verifying, setVerifying] = useState<string | null>(null);
  const [localSt,   setLocalSt]   = useState<Record<string, ClaimStatus>>({});

  const settled   = CASES.filter(c => (localSt[c.id] ?? c.status) === "settled").length;
  const pending   = CASES.filter(c => ["pre_auth_pending","pre_auth_approved"].includes(localSt[c.id] ?? c.status)).length;

  function verifyEligibility(id: string) {
    setVerifying(id);
    setTimeout(() => {
      setLocalSt(prev => ({ ...prev, [id]: "pre_auth_approved" }));
      setVerifying(null);
    }, 1500);
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Compliance · Ayushman Bharat
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          PMJAY Claims
        </Text>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: "row", padding: 16, gap: 10 }}>
        {[
          { label: "Total Cases",   value: CASES.length.toString(), color: "#f9fafb"  },
          { label: "Settled",       value: settled.toString(),       color: PRIMARY    },
          { label: "In Progress",   value: pending.toString(),       color: "#f59e0b" },
          { label: "Rejected",      value: CASES.filter(c => (localSt[c.id] ?? c.status) === "rejected").length.toString(), color: "#ef4444" },
        ].map(s => (
          <View key={s.label} style={{ flex: 1, backgroundColor: SURFACE,
            borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 10, alignItems: "center" }}>
            <Text style={{ color: s.color, fontWeight: "800", fontSize: 20 }}>{s.value}</Text>
            <Text style={{ color: "#6b7280", fontSize: 9, textAlign: "center", marginTop: 2 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 40 }}>
        {CASES.map(c => {
          const status = (localSt[c.id] ?? c.status) as ClaimStatus;
          const scfg   = STATUS_CFG[status];
          const isVer  = verifying === c.id;
          return (
            <View key={c.id} style={{ backgroundColor: SURFACE, borderRadius: 16,
              borderWidth: 1, borderColor: BORDER, padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12,
                  backgroundColor: `${scfg.color}20`, alignItems: "center", justifyContent: "center" }}>
                  <scfg.Icon size={20} color={scfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 14 }}>{c.patient}</Text>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 1 }}>
                    {c.uhid} · Admit: {c.admitDate}
                  </Text>
                  <Text style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>
                    {c.icd10} · {c.diagnosis}
                  </Text>
                  <Text style={{ color: "#4b5563", fontSize: 10, marginTop: 2 }}>
                    BenID: {c.beneficiaryId}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <View style={{ backgroundColor: `${scfg.color}20`, borderRadius: 8,
                    paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: scfg.color, fontSize: 9, fontWeight: "700" }}>{scfg.label}</Text>
                  </View>
                  {c.approvedAmt > 0 && (
                    <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 13 }}>
                      ₹{c.approvedAmt.toLocaleString("en-IN")}
                    </Text>
                  )}
                </View>
              </View>

              {status === "pre_auth_pending" && (
                <Pressable onPress={() => verifyEligibility(c.id)} disabled={isVer}
                  style={({ pressed }) => ({
                    marginTop: 12, flexDirection: "row", alignItems: "center",
                    justifyContent: "center", gap: 6,
                    backgroundColor: "#3b82f620", borderRadius: 10, paddingVertical: 9,
                    borderWidth: 1, borderColor: "#3b82f640",
                    opacity: pressed || isVer ? 0.7 : 1,
                  })}>
                  {isVer
                    ? <ActivityIndicator size="small" color="#3b82f6" />
                    : <RefreshCw size={14} color="#3b82f6" />}
                  <Text style={{ color: "#3b82f6", fontWeight: "700", fontSize: 12 }}>
                    {isVer ? "Verifying…" : "Verify Eligibility"}
                  </Text>
                </Pressable>
              )}
              {status === "pre_auth_approved" && (
                <Pressable style={({ pressed }) => ({
                  marginTop: 12, flexDirection: "row", alignItems: "center",
                  justifyContent: "center", gap: 6, backgroundColor: PRIMARY,
                  borderRadius: 10, paddingVertical: 9, opacity: pressed ? 0.7 : 1,
                })}>
                  <Send size={14} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Submit Claim</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
