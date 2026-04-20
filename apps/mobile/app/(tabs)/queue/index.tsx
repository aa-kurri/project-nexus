import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { Clock, ChevronRight, AlertCircle, RefreshCw } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../store/authStore";
import { fetchTodayQueue, callNextPatient, type QueueToken, type QueueStatus } from "./actions";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

const STATUS_META: Record<QueueStatus, { label: string; color: string }> = {
  in_progress: { label: "ACTIVE",  color: PRIMARY    },
  waiting:     { label: "",        color: ""          },
  done:        { label: "DONE",    color: "#6b7280"   },
  skipped:     { label: "SKIPPED", color: "#6b7280"   },
};

function waitLabel(createdAt: string, status: QueueStatus): string {
  if (status === "in_progress") return "Now";
  if (status === "done")        return "Done";
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  return mins < 1 ? "< 1 min" : `${mins} min`;
}

export default function QueueScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();

  const [queue,      setQueue]      = useState<QueueToken[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advancing,  setAdvancing]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!profile) return;
    soft ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await fetchTodayQueue(profile.id, profile.tenant_id);
      setQueue(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => load(true), 30_000);
    return () => clearInterval(t);
  }, [load]);

  const handleCallNext = async () => {
    if (!profile) return;
    setAdvancing(true);
    try {
      await callNextPatient(profile.id, profile.tenant_id);
      await load(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdvancing(false);
    }
  };

  const active  = queue.filter(t => t.status !== "done" && t.status !== "skipped");
  const waiting = active.filter(t => t.status === "waiting").length;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={PRIMARY} />}
    >
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          OPD Queue — Today
        </Text>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", marginTop: 2 }}>
          {waiting} patient{waiting !== 1 ? "s" : ""} waiting
        </Text>
      </View>

      {error && (
        <View style={{ margin: 16, backgroundColor: "#ef444420", borderRadius: 12,
          borderWidth: 1, borderColor: "#f87171", padding: 12 }}>
          <Text style={{ color: "#f87171", fontSize: 13 }}>{error}</Text>
        </View>
      )}

      {/* Token list */}
      {queue.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Text style={{ color: "#4b5563" }}>No patients in queue today</Text>
        </View>
      ) : (
        <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 16,
          backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
          {queue.map((item, i) => {
            const meta = STATUS_META[item.status];
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/patients/${item.patient_id}` as any)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                  opacity: pressed ? 0.7 : item.status === "done" ? 0.4 : 1,
                  backgroundColor: item.status === "in_progress" ? `${PRIMARY}12` : "transparent",
                })}
              >
                <View style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: item.status === "in_progress" ? `${PRIMARY}30` : "#1e2332",
                  alignItems: "center", justifyContent: "center", marginRight: 12,
                }}>
                  <Text style={{
                    color: item.status === "in_progress" ? PRIMARY : "#9ca3af",
                    fontWeight: "700", fontSize: 11,
                  }}>
                    T-{String(item.token_number).padStart(3, "0")}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f9fafb", fontWeight: "600", fontSize: 15 }}>
                    {item.patient_name}
                  </Text>
                  {item.complaint && (
                    <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      {item.complaint}
                    </Text>
                  )}
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
                    <Clock size={11} color="#6b7280" />
                    <Text style={{ color: "#6b7280", fontSize: 11 }}>
                      {waitLabel(item.created_at, item.status)}
                    </Text>
                  </View>
                </View>

                {meta.label ? (
                  <View style={{ backgroundColor: `${meta.color}20`, borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 }}>
                    <Text style={{ color: meta.color, fontSize: 11, fontWeight: "700" }}>{meta.label}</Text>
                  </View>
                ) : null}
                <ChevronRight size={14} color="#4b5563" />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Call Next CTA */}
      <Pressable
        style={({ pressed }) => ({
          marginHorizontal: 16, marginTop: 16, borderRadius: 14,
          backgroundColor: PRIMARY, paddingVertical: 16,
          alignItems: "center", opacity: pressed || advancing ? 0.8 : 1,
          flexDirection: "row", justifyContent: "center", gap: 8,
        })}
        onPress={handleCallNext}
        disabled={advancing || waiting === 0}
      >
        {advancing
          ? <ActivityIndicator color="#fff" size="small" />
          : <RefreshCw size={16} color="#fff" />}
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          {advancing ? "Calling…" : "Call Next Patient"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
