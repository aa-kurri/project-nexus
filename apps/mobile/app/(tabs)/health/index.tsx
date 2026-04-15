import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Activity, Heart, Wind, TrendingUp, Upload, CheckCircle } from "lucide-react-native";

// ---------------------------------------------------------------------------
// Mock data — replace with expo-health / Health Connect reads when available
// ---------------------------------------------------------------------------

type MetricKind = "steps" | "hr" | "spo2";

interface DataPoint {
  label: string;   // e.g. "Mon", "10:00"
  value: number;
}

const MOCK: Record<MetricKind, DataPoint[]> = {
  steps: [
    { label: "Mon", value: 6_200 },
    { label: "Tue", value: 8_750 },
    { label: "Wed", value: 5_100 },
    { label: "Thu", value: 9_340 },
    { label: "Fri", value: 7_800 },
    { label: "Sat", value: 11_200 },
    { label: "Sun", value: 4_650 },
  ],
  hr: [
    { label: "00:00", value: 58 },
    { label: "04:00", value: 55 },
    { label: "08:00", value: 72 },
    { label: "12:00", value: 88 },
    { label: "16:00", value: 94 },
    { label: "20:00", value: 76 },
    { label: "23:00", value: 62 },
  ],
  spo2: [
    { label: "00:00", value: 97 },
    { label: "04:00", value: 96 },
    { label: "08:00", value: 98 },
    { label: "12:00", value: 99 },
    { label: "16:00", value: 98 },
    { label: "20:00", value: 97 },
    { label: "23:00", value: 97 },
  ],
};

const META: Record<
  MetricKind,
  { label: string; unit: string; icon: typeof Activity; color: string; normal: string }
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
// Mini bar chart — pure RN primitives, no external chart library needed
// ---------------------------------------------------------------------------

function BarChart({ data, color }: { data: DataPoint[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View className="flex-row items-end justify-between mt-4 px-1" style={{ height: 96 }}>
      {data.map((d) => {
        const heightPct = d.value / max;
        return (
          <View key={d.label} className="flex-1 items-center" style={{ gap: 4 }}>
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
    <View className="flex-1 items-center rounded-xl py-3 px-2 bg-gray-50">
      <Text className="text-xs text-gray-400 font-medium">{label}</Text>
      <Text className="text-sm font-bold text-gray-800 mt-0.5">{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({ kind }: { kind: MetricKind }) {
  const { label, unit, icon: Icon, color, normal } = META[kind];
  const data = MOCK[kind];
  const latest = data[data.length - 1].value;
  const avg = Math.round(data.reduce((s, d) => s + d.value, 0) / data.length);
  const peak = Math.max(...data.map((d) => d.value));

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
            {latest.toLocaleString()}
          </Text>
          <Text className="text-xs text-gray-400">{unit}</Text>
        </View>
      </View>

      {/* Bar chart */}
      <BarChart data={data} color={color} />

      {/* Stats row */}
      <View className="flex-row gap-2 mt-4">
        <StatPill label="Avg" value={`${avg.toLocaleString()} ${unit}`} />
        <StatPill label="Peak" value={`${peak.toLocaleString()} ${unit}`} />
        <StatPill label="Latest" value={`${latest.toLocaleString()} ${unit}`} />
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

function SyncButton() {
  const [state, setState] = useState<SyncState>("idle");

  async function handleSync() {
    setState("syncing");
    try {
      // TODO: replace mock payload with real expo-health / Health Connect reads
      const metrics = [
        ...MOCK.steps.map((d) => ({
          code: "55423-8",
          code_system: "http://loinc.org",
          display: "Number of steps in unspecified time Pedometer",
          value_num: d.value,
          value_unit: "steps/day",
          effective_at: new Date().toISOString(),
          source: "apple_health",
        })),
        ...MOCK.hr.map((d) => ({
          code: "8867-4",
          code_system: "http://loinc.org",
          display: "Heart rate",
          value_num: d.value,
          value_unit: "beats/min",
          effective_at: new Date().toISOString(),
          source: "apple_health",
        })),
        ...MOCK.spo2.map((d) => ({
          code: "59408-5",
          code_system: "http://loinc.org",
          display: "Oxygen saturation in Arterial blood by Pulse oximetry",
          value_num: d.value,
          value_unit: "%",
          effective_at: new Date().toISOString(),
          source: "apple_health",
        })),
      ];

      if (!EDGE_URL) {
        // Dev mode: just simulate delay
        await new Promise((r) => setTimeout(r, 1200));
        setState("done");
        return;
      }

      const res = await fetch(EDGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics }),
      });

      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    } finally {
      if (state !== "error") setTimeout(() => setState("idle"), 3000);
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
  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View className="px-5 pt-14 pb-5" style={{ backgroundColor: "#0F766E" }}>
        <View className="flex-row items-center gap-2 mb-1">
          <TrendingUp color="#fff" size={20} />
          <Text className="text-white/80 text-sm font-medium uppercase tracking-widest">
            Health
          </Text>
        </View>
        <Text className="text-white text-2xl font-bold">Wearable Metrics</Text>
        <Text className="text-white/60 text-sm mt-0.5">
          Apple Health · Google Fit · Last 7 days
        </Text>
      </View>

      <View className="px-5 mt-5">
        {/* Source badge */}
        <View className="flex-row gap-2 mb-5">
          {(["Apple Health", "Google Fit"] as const).map((src) => (
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
        <MetricCard kind="steps" />
        <MetricCard kind="hr" />
        <MetricCard kind="spo2" />

        {/* Sync CTA */}
        <View className="rounded-2xl bg-white p-5 shadow-sm shadow-black/5 mt-1">
          <Text className="font-bold text-gray-900 mb-1">Push to EMR</Text>
          <Text className="text-xs text-gray-400 mb-4">
            Securely upload your wearable readings to the hospital record as
            FHIR Observations (LOINC coded).
          </Text>
          <SyncButton />
        </View>
      </View>
    </ScrollView>
  );
}
