import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { TrendingUp, AlertTriangle, CheckCircle2, Plus, IndianRupee, RefreshCw } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

interface AuditEntry {
  id:        number;
  actor:     string;
  action:    string;
  payload:   Record<string, any>;
  createdAt: string;
}

const ACTION_COLOR: Record<string, string> = {
  "rx.create":         "#6366f1",
  "scribe.save_note":  "#3b82f6",
  "vitals.save":       PRIMARY,
  "dispense.given":    "#10b981",
  "bill.finalize":     "#f59e0b",
  "user.login":        "#8b5cf6",
};

function actionColor(action: string) {
  for (const key of Object.keys(ACTION_COLOR)) {
    if (action.startsWith(key)) return ACTION_COLOR[key];
  }
  return "#6b7280";
}

export default function AuditScreen() {
  const { profile }               = useAuthStore();
  const [entries, setEntries]     = useState<AuditEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState<string | null>(null);
  const [filter,  setFilter]      = useState<string>("ALL");

  const FILTERS = ["ALL", "rx", "scribe", "vitals", "dispense", "bill"];

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("audit_log")
        .select(`
          id, action, payload, created_at,
          profiles:actor_id ( full_name )
        `)
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "ALL") {
        q = q.ilike("action", `${filter}%`);
      }

      const { data, error: qErr } = await q;
      if (qErr) throw new Error(qErr.message);

      setEntries(
        (data ?? []).map((r: any) => ({
          id:        r.id,
          actor:     r.profiles?.full_name ?? "System",
          action:    r.action,
          payload:   r.payload ?? {},
          createdAt: r.created_at,
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Billing · Revenue
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          Audit Log
        </Text>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}>
        {FILTERS.map((f) => {
          const active = filter === f;
          const color  = active ? PRIMARY : "#374151";
          return (
            <Pressable key={f} onPress={() => setFilter(f)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                backgroundColor: active ? `${PRIMARY}30` : `${PRIMARY}10`,
                borderWidth: 1, borderColor: active ? PRIMARY : "transparent" }}>
              <Text style={{ color: active ? PRIMARY : "#9ca3af", fontSize: 12, fontWeight: "700",
                textTransform: "capitalize" }}>
                {f === "ALL" ? "All" : f}
              </Text>
            </Pressable>
          );
        })}
        <Pressable onPress={load}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
            backgroundColor: "#1e233220", borderWidth: 1, borderColor: BORDER }}>
          <RefreshCw size={14} color="#6b7280" />
        </Pressable>
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
          <Text style={{ color: "#6b7280", marginTop: 12 }}>Loading audit log…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 40 }}>
          {entries.length === 0 && (
            <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 40 }}>
              No audit entries found.
            </Text>
          )}
          {entries.map((entry) => {
            const color = actionColor(entry.action);
            const time  = new Date(entry.createdAt).toLocaleTimeString("en-IN",
              { hour: "2-digit", minute: "2-digit" });
            const date  = new Date(entry.createdAt).toLocaleDateString("en-IN",
              { day: "2-digit", month: "short" });

            return (
              <View key={entry.id} style={{ backgroundColor: SURFACE, borderRadius: 14,
                borderWidth: 1, borderColor: BORDER, padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10,
                    backgroundColor: `${color}20`, alignItems: "center", justifyContent: "center" }}>
                    <TrendingUp size={16} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <View style={{ backgroundColor: `${color}20`, borderRadius: 5,
                        paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Text style={{ color, fontSize: 9, fontWeight: "800" }}>{entry.action}</Text>
                      </View>
                    </View>
                    <Text style={{ color: "#f9fafb", fontWeight: "600", fontSize: 13, marginTop: 4 }}>
                      {entry.actor}
                    </Text>
                    {Object.keys(entry.payload).length > 0 && (
                      <Text style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }} numberOfLines={2}>
                        {JSON.stringify(entry.payload)}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: "#4b5563", fontSize: 11, fontWeight: "600" }}>{time}</Text>
                    <Text style={{ color: "#374151", fontSize: 10 }}>{date}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
