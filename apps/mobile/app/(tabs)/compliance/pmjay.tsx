import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle, Send, RefreshCw } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type ClaimStatus = "pre_auth_pending" | "pre_auth_approved" | "submitted" | "settled" | "rejected" | "query";

const STATUS_CFG: Record<string, { label: string; color: string; Icon: any }> = {
  pre_auth:         { label: "Pre-Auth Pending",  color: "#f59e0b", Icon: Clock         },
  eligibility:      { label: "Pre-Auth Pending",  color: "#f59e0b", Icon: Clock         },
  enhancement:      { label: "Pre-Auth Approved", color: "#3b82f6", Icon: CheckCircle2  },
  final_bill:       { label: "Final Bill",        color: "#06b6d4", Icon: Send          },
  submitted:        { label: "Submitted",         color: "#8b5cf6", Icon: Send          },
  settled:          { label: "Settled",           color: PRIMARY,   Icon: CheckCircle2  },
  rejected:         { label: "Rejected",          color: "#ef4444", Icon: AlertTriangle },
  query:            { label: "Query Raised",      color: "#f97316", Icon: AlertTriangle },
};

interface PmjayCase {
  id:            string;
  patient:       string;
  uhid:          string;
  beneficiaryId: string;
  icd10:         string;
  diagnosis:     string;
  approvedAmt:   number;
  claimedAmt:    number;
  step:          string;
  admitDate:     string;
}

export default function PmjayScreen() {
  const { profile }              = useAuthStore();
  const [cases,    setCases]     = useState<PmjayCase[]>([]);
  const [loading,  setLoading]   = useState(true);
  const [updating, setUpdating]  = useState<string | null>(null);
  const [error,    setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from("tpa_claims")
        .select(`
          id, diagnosis, icd10_code, approved_amount, claimed_amount,
          step, admit_date, beneficiary_id,
          patients ( full_name, mrn )
        `)
        .eq("tenant_id", profile.tenant_id)
        .eq("payer_type", "pmjay")
        .order("created_at", { ascending: false })
        .limit(50);

      if (qErr) throw new Error(qErr.message);

      setCases(
        (data ?? []).map((c: any) => ({
          id:            c.id,
          patient:       c.patients?.full_name ?? "Unknown",
          uhid:          c.patients?.mrn ?? "—",
          beneficiaryId: c.beneficiary_id ?? "—",
          icd10:         c.icd10_code ?? "—",
          diagnosis:     c.diagnosis ?? "—",
          approvedAmt:   c.approved_amount ?? 0,
          claimedAmt:    c.claimed_amount ?? 0,
          step:          c.step,
          admitDate:     c.admit_date ?? "—",
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const settled  = cases.filter((c) => c.step === "settled").length;
  const pending  = cases.filter((c) => ["pre_auth","eligibility","enhancement"].includes(c.step)).length;
  const rejected = cases.filter((c) => c.step === "rejected").length;

  async function advanceStep(id: string, nextStep: string) {
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
          { label: "Total",      value: cases.length, color: "#f9fafb" },
          { label: "Settled",    value: settled,       color: PRIMARY   },
          { label: "In Progress",value: pending,       color: "#f59e0b" },
          { label: "Rejected",   value: rejected,      color: "#ef4444" },
        ].map((s) => (
          <View key={s.label} style={{ flex: 1, backgroundColor: SURFACE,
            borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 10, alignItems: "center" }}>
            <Text style={{ color: s.color, fontWeight: "800", fontSize: 20 }}>{s.value}</Text>
            <Text style={{ color: "#6b7280", fontSize: 9, textAlign: "center", marginTop: 2 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {error && (
        <View style={{ marginHorizontal: 16, marginBottom: 8,
          backgroundColor: "#ef444420", borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: "#ef444440" }}>
          <Text style={{ color: "#f87171", fontSize: 13 }}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={PRIMARY} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 40 }}>
          {cases.length === 0 && (
            <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 40 }}>
              No PMJAY claims found.
            </Text>
          )}
          {cases.map((c) => {
            const scfg  = STATUS_CFG[c.step] ?? STATUS_CFG["query"];
            const isUpd = updating === c.id;

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

                {c.step === "pre_auth" && (
                  <Pressable onPress={() => advanceStep(c.id, "enhancement")} disabled={isUpd}
                    style={({ pressed }) => ({
                      marginTop: 12, flexDirection: "row", alignItems: "center",
                      justifyContent: "center", gap: 6,
                      backgroundColor: "#3b82f620", borderRadius: 10, paddingVertical: 9,
                      borderWidth: 1, borderColor: "#3b82f640",
                      opacity: pressed || isUpd ? 0.7 : 1,
                    })}>
                    {isUpd
                      ? <ActivityIndicator size="small" color="#3b82f6" />
                      : <RefreshCw size={14} color="#3b82f6" />}
                    <Text style={{ color: "#3b82f6", fontWeight: "700", fontSize: 12 }}>
                      {isUpd ? "Saving…" : "Verify Eligibility"}
                    </Text>
                  </Pressable>
                )}
                {c.step === "enhancement" && (
                  <Pressable onPress={() => advanceStep(c.id, "submitted")} disabled={isUpd}
                    style={({ pressed }) => ({
                      marginTop: 12, flexDirection: "row", alignItems: "center",
                      justifyContent: "center", gap: 6, backgroundColor: PRIMARY,
                      borderRadius: 10, paddingVertical: 9,
                      opacity: pressed || isUpd ? 0.7 : 1,
                    })}>
                    {isUpd
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Send size={14} color="#fff" />}
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                      {isUpd ? "Saving…" : "Submit Claim"}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
