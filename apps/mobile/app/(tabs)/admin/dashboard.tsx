import { View, Text, ScrollView } from "react-native";
import { Bed, Users, CreditCard, Activity } from "lucide-react-native";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// TODO: fetch KPIs from admissions, beds, bills, queue_tokens via actions.getDashboardKPIs()
const KPI = [
  { label: "Beds Occupied",   value: "38 / 50", sub: "76% occupancy",  Icon: Bed,      color: "#6366f1" },
  { label: "OPD Today",       value: "124",      sub: "↑ 12 from yest", Icon: Users,    color: PRIMARY },
  { label: "Pending Bills",   value: "₹4.2L",   sub: "23 invoices",    Icon: CreditCard,color: "#f59e0b" },
  { label: "Avg Wait Time",   value: "18 min",   sub: "OPD queue",      Icon: Activity, color: "#ec4899" },
];

export default function AdminDashboardScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>
          Admin Portal
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          Hospital Dashboard
        </Text>
      </View>

      {/* KPI cards */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16,
        flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {KPI.map(({ label, value, sub, Icon, color }) => (
          <View key={label} style={{
            flex: 1, minWidth: "44%",
            backgroundColor: SURFACE, borderRadius: 16,
            borderWidth: 1, borderColor: BORDER, padding: 16,
          }}>
            <View style={{ width: 36, height: 36, borderRadius: 10,
              backgroundColor: `${color}20`, alignItems: "center",
              justifyContent: "center", marginBottom: 10 }}>
              <Icon size={18} color={color} />
            </View>
            <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>{value}</Text>
            <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>{label}</Text>
            <Text style={{ color: "#4b5563", fontSize: 11, marginTop: 4 }}>{sub}</Text>
          </View>
        ))}
      </View>

      {/* Census section */}
      <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, padding: 16 }}>
        <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "600",
          textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
          Ward Census
        </Text>
        {/* TODO: actions.getWardCensus() — aggregate from admissions grouped by ward */}
        {["General (A)", "ICU", "Maternity", "Paediatrics"].map((ward, i) => (
          <View key={ward} style={{
            flexDirection: "row", justifyContent: "space-between",
            paddingVertical: 10,
            borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
          }}>
            <Text style={{ color: "#e5e7eb" }}>{ward}</Text>
            <Text style={{ color: "#9ca3af" }}>— / —</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
