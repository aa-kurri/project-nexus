import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { TrendingUp, LogIn, LogOut, BedDouble } from "lucide-react-native";
import { useAuthStore } from "../../../store/authStore";
import { getDashboardKPIs, getWardCensus, type DashboardKPIs, type WardCensus } from "./actions";

const PRIMARY = "#0F766E";
const SURFACE = "hsl(220, 13%, 9%)";
const BORDER  = "#1e2332";
const BG      = "hsl(220, 15%, 6%)";

function KPICard({ label, value, sub, Icon, color }: {
  label: string; value: string; sub: string;
  Icon: React.ComponentType<any>; color: string;
}) {
  return (
    <View style={{
      flex: 1, minWidth: "44%",
      backgroundColor: SURFACE, borderRadius: 16,
      borderWidth: 1, borderColor: BORDER, padding: 16,
    }}>
      <View style={{ width: 36, height: 36, borderRadius: 10,
        backgroundColor: `${color}20`, alignItems: "center",
        justifyContent: "center", marginBottom: 10 }}>
        <Icon size={18} color={color} />
      </View>
      <Text style={{ color: "#f9fafb", fontSize: 24, fontWeight: "700" }}>{value}</Text>
      <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>{label}</Text>
      <Text style={{ color: "#4b5563", fontSize: 11, marginTop: 4 }}>{sub}</Text>
    </View>
  );
}

function rupees(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export default function AdminDashboardScreen() {
  const { profile } = useAuthStore();

  const [kpis,      setKpis]       = useState<DashboardKPIs | null>(null);
  const [wards,     setWards]      = useState<WardCensus[]>([]);
  const [loading,   setLoading]    = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [error,     setError]      = useState<string | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!profile) return;
    soft ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [k, w] = await Promise.all([
        getDashboardKPIs(profile.tenant_id),
        getWardCensus(profile.tenant_id),
      ]);
      setKpis(k);
      setWards(w);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

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
          {profile?.tenant_name ?? "Hospital Dashboard"}
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          Admin Overview
        </Text>
      </View>

      {error && (
        <View style={{ margin: 16, backgroundColor: "#ef444420", borderRadius: 12,
          borderWidth: 1, borderColor: "#f87171", padding: 12 }}>
          <Text style={{ color: "#f87171", fontSize: 13 }}>{error}</Text>
        </View>
      )}

      {/* KPI cards */}
      {kpis && (
        <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <KPICard label="Admissions Today" value={String(kpis.admissionsToday)}
            sub="vs yesterday" Icon={LogIn} color={PRIMARY} />
          <KPICard label="Discharges Today" value={String(kpis.dischargesToday)}
            sub="completed" Icon={LogOut} color="#6366f1" />
          <KPICard label="Bed Occupancy"
            value={`${kpis.occupancyPct}%`}
            sub={`${kpis.bedsOccupied} of ${kpis.bedsTotal} beds`}
            Icon={BedDouble} color="#f59e0b" />
          <KPICard label="Revenue Today"
            value={rupees(kpis.revenueToday)}
            sub="Billed & collected"
            Icon={TrendingUp} color="#059669" />
        </View>
      )}

      {/* Ward census */}
      {wards.length > 0 && (
        <View style={{ marginHorizontal: 16, marginTop: 16,
          backgroundColor: SURFACE, borderRadius: 16,
          borderWidth: 1, borderColor: BORDER, padding: 16 }}>
          <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "600",
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
            Ward Census
          </Text>
          {wards.map(({ ward, occupied, total }, i) => {
            const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
            const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : PRIMARY;
            return (
              <View key={ward} style={{
                paddingVertical: 10,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ color: "#e5e7eb", fontSize: 13 }}>{ward}</Text>
                  <Text style={{ color: "#9ca3af", fontSize: 13 }}>
                    {occupied}/{total}
                    <Text style={{ color: "#4b5563" }}> ({pct}%)</Text>
                  </Text>
                </View>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: "#1e2332" }}>
                  <View style={{ height: 4, borderRadius: 2,
                    backgroundColor: barColor, width: `${pct}%` as any }} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {wards.length === 0 && !error && (
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text style={{ color: "#4b5563" }}>No bed data found. Add beds in the Beds screen.</Text>
        </View>
      )}
    </ScrollView>
  );
}
