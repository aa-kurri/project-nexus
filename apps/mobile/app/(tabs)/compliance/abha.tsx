import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { ShieldCheck, Link2, RefreshCw, Search, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type LinkStatus = "linked" | "pending" | "failed" | "not_initiated";

const STATUS_CFG: Record<LinkStatus, { label: string; color: string; Icon: any }> = {
  linked:        { label: "Linked",        color: PRIMARY,   Icon: CheckCircle2 },
  pending:       { label: "Pending",       color: "#f59e0b", Icon: Clock        },
  failed:        { label: "Failed",        color: "#ef4444", Icon: XCircle      },
  not_initiated: { label: "Not Initiated", color: "#6b7280", Icon: AlertCircle  },
};

interface AbhaPatient {
  id:          string;
  name:        string;
  uhid:        string;
  mobile:      string;
  abhaNumber?: string;
  status:      LinkStatus;
}

function deriveStatus(patient: any): LinkStatus {
  if (patient.abha_id) return "linked";
  if (patient.abha_linking_status === "pending") return "pending";
  if (patient.abha_linking_status === "failed")  return "failed";
  return "not_initiated";
}

export default function AbhaScreen() {
  const { profile }               = useAuthStore();
  const [patients,  setPatients]  = useState<AbhaPatient[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [linking,   setLinking]   = useState<string | null>(null);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<LinkStatus | "ALL">("ALL");
  const [error,     setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from("patients")
        .select("id, full_name, mrn, phone, abha_id, abha_linking_status")
        .eq("tenant_id", profile.tenant_id)
        .order("full_name")
        .limit(200);

      if (qErr) throw new Error(qErr.message);

      setPatients(
        (data ?? []).map((p: any) => ({
          id:          p.id,
          name:        p.full_name,
          uhid:        p.mrn,
          mobile:      p.phone ?? "—",
          abhaNumber:  p.abha_id ?? undefined,
          status:      deriveStatus(p),
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const filtered = patients.filter((p) =>
    (filter === "ALL" || p.status === filter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.uhid.toLowerCase().includes(search.toLowerCase()))
  );

  const linked = patients.filter((p) => p.status === "linked").length;

  async function initiateLink(patientId: string) {
    setLinking(patientId);
    try {
      // Mark as pending in DB — real ABDM OTP flow would happen via NHA sandbox
      await supabase
        .from("patients")
        .update({ abha_linking_status: "pending" } as any)
        .eq("id", patientId);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLinking(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Compliance · ABDM
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          ABHA Linking
        </Text>
        {!loading && (
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}>
            {linked} / {patients.length} patients linked
          </Text>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8,
          backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
          paddingHorizontal: 12, paddingVertical: 10 }}>
          <Search size={15} color="#4b5563" />
          <TextInput value={search} onChangeText={setSearch}
            placeholder="Search patient or UHID…" placeholderTextColor="#4b5563"
            style={{ flex: 1, color: "#f9fafb", fontSize: 13 }} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
        {(["ALL","linked","pending","failed","not_initiated"] as const).map((f) => {
          const active = filter === f;
          const color  = f === "ALL" ? PRIMARY : STATUS_CFG[f]?.color ?? PRIMARY;
          return (
            <Pressable key={f} onPress={() => setFilter(f)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                backgroundColor: active ? `${color}30` : `${color}10`,
                borderWidth: 1, borderColor: active ? color : "transparent" }}>
              <Text style={{ color, fontSize: 12, fontWeight: "700" }}>
                {f === "ALL" ? "All" : STATUS_CFG[f].label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
          {filtered.length === 0 && (
            <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 40 }}>
              No patients match the filter.
            </Text>
          )}
          {filtered.map((p) => {
            const scfg      = STATUS_CFG[p.status];
            const isLinking = linking === p.id;
            return (
              <View key={p.id} style={{ backgroundColor: SURFACE, borderRadius: 16,
                borderWidth: 1, borderColor: BORDER, padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12,
                    backgroundColor: `${scfg.color}20`, alignItems: "center", justifyContent: "center" }}>
                    <scfg.Icon size={20} color={scfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 14 }}>{p.name}</Text>
                    <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                      {p.uhid} · {p.mobile}
                    </Text>
                    {p.abhaNumber && (
                      <Text style={{ color: PRIMARY, fontSize: 12, fontWeight: "600", marginTop: 4 }}>
                        ABHA: {p.abhaNumber}
                      </Text>
                    )}
                  </View>
                  <View style={{ backgroundColor: `${scfg.color}20`, borderRadius: 8,
                    paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: scfg.color, fontSize: 10, fontWeight: "700" }}>{scfg.label}</Text>
                  </View>
                </View>

                {(p.status === "not_initiated" || p.status === "failed") && (
                  <Pressable onPress={() => initiateLink(p.id)} disabled={isLinking}
                    style={({ pressed }) => ({
                      marginTop: 12, flexDirection: "row", alignItems: "center",
                      justifyContent: "center", gap: 6, backgroundColor: PRIMARY,
                      borderRadius: 10, paddingVertical: 10,
                      opacity: pressed || isLinking ? 0.7 : 1,
                    })}>
                    {isLinking
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Link2 size={14} color="#fff" />}
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                      {isLinking ? "Initiating…" : p.status === "failed" ? "Retry Link" : "Initiate ABHA Link"}
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
