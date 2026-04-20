import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Activity, Heart, Wind, TrendingUp, Upload, CheckCircle, AlertCircle } from "lucide-react-native";
import { useAuthStore } from "../../../store/authStore";
import { fetchMetricTrend, syncToHospital, type MetricKind, type TrendPoint } from "./actions";

// ---------------------------------------------------------------------------
// Meta-data for UI components
// ---------------------------------------------------------------------------

const META: Record<
  MetricKind,
  { label: string; unit: string; icon: any; color: string; normal: string }
> = {
  steps: {
    label: "Steps",
    unit: "steps",
    icon: Activity,
    color: "#0F766E",
    normal: "Goal: 10,000",
  },
  hr: {
    label: "Heart Rate",
    unit: "bpm",
    icon: Heart,
    color: "#e11d48",
    normal: "Normal: 60–100",
  },
  spo2: {
    label: "SpO₂",
    unit: "%",
    icon: Wind,
    color: "#2563eb",
    normal: "Normal: ≥95%",
  },
};

// ---------------------------------------------------------------------------
// Mini bar chart — pure RN primitives
// ---------------------------------------------------------------------------

function BarChart({ data, color }: { data: TrendPoint[]; color: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View className="flex-row items-end justify-between mt-4 px-1" style={{ height: 96 }}>
      {data.map((d, i) => {
        const heightPct = d.value / max;
        return (
          <View key={`${d.timestamp}-${i}`} className="flex-1 items-center" style={{ gap: 4 }}>
            <View
              style={{
                width: "60%",
                height: Math.max(heightPct * 80, 4),
                backgroundColor: color,
                borderRadius: 4,
                opacity: 0.85,
              }}
            />
            <Text style={{ fontSize: 9, color: "#9ca3af", fontWeight: "600" }}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Summary stat pill
// ---------------------------------------------------------------------------

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center rounded-xl py-3 px-2 bg-gray-50 border border-gray-100">
      <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</Text>
      <Text className="text-sm font-bold text-gray-800 mt-1">{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({ kind, patientId }: { kind: MetricKind; patientId: string }) {
  const { label, unit, icon: Icon, color, normal } = META[kind];
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetricTrend(patientId, kind)
      .then(setData)
      .finally(() => setLoading(false));
  }, [patientId, kind]);

  if (loading) return (
    <View className="rounded-2xl bg-white mb-4 p-8 items-center justify-center border border-gray-100">
      <ActivityIndicator color={color} />
    </View>
  );

  const latest = data.length > 0 ? data[data.length - 1].value : 0;
  const avg = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.value, 0) / data.length) : 0;
  const peak = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0;

  return (
    <View
      className="rounded-2xl bg-white mb-4 p-5 shadow-sm shadow-black/5"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <View
            className="h-9 w-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: color + "18" }}
          >
            <Icon color={color} size={18} />
          </View>
          <View>
            <Text className="font-bold text-gray-900 text-base">{label}</Text>
            <Text className="text-xs text-gray-400">{normal}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-2xl font-extrabold" style={{ color }}>
            {data.length > 0 ? latest.toLocaleString() : "--"}
          </Text>
          <Text className="text-xs text-gray-400">{unit}</Text>
        </View>
      </View>

      {/* Bar chart */}
      {data.length > 0 ? (
        <BarChart data={data} color={color} />
      ) : (
        <View className="h-24 items-center justify-center bg-gray-50/50 rounded-xl mt-4 border border-dashed border-gray-200">
          <Text className="text-xs text-gray-400">No trend data available</Text>
        </View>
      )}

      {/* Stats row */}
      <View className="flex-row gap-2 mt-4">
        <StatPill label="Avg" value={data.length > 0 ? `${avg.toLocaleString()}` : "--"} />
        <StatPill label="Peak" value={data.length > 0 ? `${peak.toLocaleString()}` : "--"} />
        <StatPill label="Latest" value={data.length > 0 ? `${latest.toLocaleString()}` : "--"} />
      </View>
    </View>
  );
}


// ---------------------------------------------------------------------------
// Sync button — calls the wearable-ingest Edge Function
// ---------------------------------------------------------------------------

const EDGE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/wearable-ingest`
  : null;

type SyncState = "idle" | "syncing" | "done" | "error";

function SyncButton({ patientId, onSyncComplete }: { patientId: string; onSyncComplete: () => void }) {
  const [state, setState] = useState<SyncState>("idle");

  async function handleSync() {
    setState("syncing");
    try {
      // Mocked device data for demonstration — in production this reads from Health Connect
      const metrics = [
        {
          patient_id: patientId,
          code: "8867-4",
          code_system: "http://loinc.org",
          display: "Heart rate",
          value_num: 72 + Math.floor(Math.random() * 10),
          value_unit: "bpm",
          effective_at: new Date().toISOString(),
        },
        {
          patient_id: patientId,
          code: "59408-5",
          code_system: "http://loinc.org",
          display: "SpO2",
          value_num: 97 + Math.floor(Math.random() * 3),
          value_unit: "%",
          effective_at: new Date().toISOString(),
        }
      ];

      await syncToHospital(metrics);
      setState("done");
      onSyncComplete();
    } catch {
      setState("error");
    } finally {
      setTimeout(() => setState("idle"), 3000);
    }
  }

  const label =
    state === "syncing"
      ? "Syncing…"
      : state === "done"
      ? "Synced!"
      : state === "error"
      ? "Retry Sync"
      : "Sync to Hospital";

  const bgColor =
    state === "done" ? "#059669" : state === "error" ? "#dc2626" : "#0F766E";

  return (
    <Pressable
      onPress={handleSync}
      disabled={state === "syncing"}
      className="flex-row items-center justify-center gap-2 rounded-xl py-3.5 active:opacity-80"
      style={{ backgroundColor: bgColor }}
    >
      {state === "syncing" ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : state === "done" ? (
        <CheckCircle color="#fff" size={16} />
      ) : (
        <Upload color="#fff" size={16} />
      )}
      <Text className="text-white font-bold text-sm">{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function HealthScreen() {
  const { profile } = useAuthStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const patientId = profile?.patient_id || (profile?.role === "patient" ? profile.id : null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  if (!patientId) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-10">
        <AlertCircle size={48} color="#9ca3af" />
        <Text className="text-gray-900 font-bold text-lg mt-4">No Patient Profile</Text>
        <Text className="text-gray-500 text-center mt-2">
          This feature is only available for accounts with an associated Patient record.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F766E" />
      }
    >
      {/* Header */}
      <View className="px-5 pt-14 pb-6" style={{ backgroundColor: "#0F766E" }}>
        <View className="flex-row items-center gap-2 mb-1">
          <TrendingUp color="#fff" size={20} />
          <Text className="text-white/80 text-sm font-medium uppercase tracking-widest">
            Health
          </Text>
        </View>
        <Text className="text-white text-2xl font-bold">Clinical Trends</Text>
        <Text className="text-white/60 text-sm mt-0.5">
          Synced Observations · Last 20 readings
        </Text>
      </View>

      <View className="px-5 mt-5">
        {/* Source badge */}
        <View className="flex-row gap-2 mb-5">
          {(["Hospital Records", "Wearable Sync"] as const).map((src) => (
            <View
              key={src}
              className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 bg-white border border-gray-100"
            >
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: "#0F766E" }} />
              <Text className="text-xs font-semibold text-gray-600">{src}</Text>
            </View>
          ))}
        </View>

        {/* Metric cards */}
        <MetricCard key={`steps-${refreshKey}`} kind="steps" patientId={patientId} />
        <MetricCard key={`hr-${refreshKey}`} kind="hr" patientId={patientId} />
        <MetricCard key={`spo2-${refreshKey}`} kind="spo2" patientId={patientId} />

        {/* Sync CTA */}
        <View className="rounded-2xl bg-white p-5 shadow-sm shadow-black/5 mt-1 border border-gray-100">
          <Text className="font-bold text-gray-900 mb-1">Update Trends</Text>
          <Text className="text-xs text-gray-400 mb-4 lh-18">
            Sync your device data to push latest heart rate and oxygen saturation
            to your hospital profile.
          </Text>
          <SyncButton patientId={patientId} onSyncComplete={onRefresh} />
        </View>
      </View>
    </ScrollView>
  );
}

