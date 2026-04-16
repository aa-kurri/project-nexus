"use client";
import { View, Text } from "react-native";
import { TrendingUp, LogIn, LogOut, BedDouble } from "lucide-react-native";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Card }       from "../../../components/ui/card";
import { TopBar }     from "../../../components/hospital/TopBar";
import { getDashboardKPIs, getWardCensus } from "./actions";

const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// ── Mock KPI data (replace with getDashboardKPIs() call) ────────────────────
// TODO: getDashboardKPIs() — fan out to admissions (today), beds, bills tables
const KPIS = [
  {
    label:  "Admissions Today",
    value:  "14",
    sub:    "↑ 3 from yesterday",
    Icon:   LogIn,
    color:  PRIMARY,
  },
  {
    label:  "Discharges Today",
    value:  "9",
    sub:    "↓ 1 from yesterday",
    Icon:   LogOut,
    color:  "#6366f1",
  },
  {
    label:  "Bed Occupancy",
    value:  "76%",
    sub:    "38 of 50 beds",
    Icon:   BedDouble,
    color:  "#f59e0b",
  },
  {
    label:  "Revenue Today",
    value:  "₹1.8L",
    sub:    "Billed & collected",
    Icon:   TrendingUp,
    color:  "#059669",
  },
] as const;

// ── Mock ward census (replace with getWardCensus() call) ────────────────────
// TODO: getWardCensus() — aggregate admissions grouped by ward, joined with beds
const WARDS = [
  { name: "General (A)",  occupied: 12, total: 16 },
  { name: "ICU",          occupied: 8,  total: 10 },
  { name: "Maternity",    occupied: 6,  total: 8  },
  { name: "Paediatrics",  occupied: 7,  total: 10 },
  { name: "Orthopaedics", occupied: 5,  total: 6  },
];

export default function AdminDashboardScreen() {
  return (
    <ScrollArea>
      {/* Header */}
      <TopBar title="Hospital Dashboard" subtitle="Admin Portal" tinted />

      {/* ── KPI cards ─────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16,
        flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {KPIS.map(({ label, value, sub, Icon, color }) => (
          <Card key={label} style={{ flex: 1, minWidth: "44%" }}>
            <View style={{ width: 36, height: 36, borderRadius: 10,
              backgroundColor: `${color}20`, alignItems: "center",
              justifyContent: "center", marginBottom: 10 }}>
              <Icon size={18} color={color} />
            </View>
            <Text style={{ color: "#f9fafb", fontSize: 24, fontWeight: "700" }}>{value}</Text>
            <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>{label}</Text>
            <Text style={{ color: "#4b5563", fontSize: 11, marginTop: 4 }}>{sub}</Text>
          </Card>
        ))}
      </View>

      {/* ── Ward census ───────────────────────────────────────── */}
      <Card style={{ marginHorizontal: 16, marginTop: 16 }}>
        <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "600",
          textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
          Ward Census
        </Text>
        {WARDS.map(({ name, occupied, total }, i) => {
          const pct = Math.round((occupied / total) * 100);
          const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : PRIMARY;
          return (
            <View key={name} style={{
              paddingVertical: 10,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between",
                marginBottom: 6 }}>
                <Text style={{ color: "#e5e7eb", fontSize: 13 }}>{name}</Text>
                <Text style={{ color: "#9ca3af", fontSize: 13 }}>
                  {occupied} / {total}
                  <Text style={{ color: "#4b5563" }}> ({pct}%)</Text>
                </Text>
              </View>
              {/* Progress bar */}
              <View style={{ height: 4, borderRadius: 2, backgroundColor: "#1e2332" }}>
                <View style={{ height: 4, borderRadius: 2,
                  backgroundColor: barColor, width: `${pct}%` as any }} />
              </View>
            </View>
          );
        })}
      </Card>
    </ScrollArea>
  );
}
