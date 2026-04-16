import { View, Text, ScrollView, Pressable } from "react-native";
import { Pill, Plus, ChevronRight, AlertCircle } from "lucide-react-native";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// TODO: fetch from medication_requests where requester = auth.uid(), ordered by authored_on desc
const MOCK_RX = [
  { id: "rx-1", patient: "Ramesh Kumar", drug: "Metformin 500mg",  sig: "BD × 30 days", status: "active" },
  { id: "rx-2", patient: "Priya Sharma", drug: "Amlodipine 5mg",   sig: "OD × 60 days", status: "active" },
  { id: "rx-3", patient: "Anita Verma",  drug: "Pantoprazole 40mg",sig: "BD × 14 days", status: "completed" },
];

const STATUS_COLOR: Record<string, string> = {
  active:    "#059669",
  completed: "#6b7280",
  cancelled: "#ef4444",
};

export default function RxScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>Prescriptions</Text>
        <Pressable
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: `${PRIMARY}20`, alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {/* TODO: navigate to new Rx creation form */}
          <Plus size={18} color={PRIMARY} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ marginHorizontal: 16, borderRadius: 16,
          backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
          {MOCK_RX.map((rx, i) => (
            <Pressable
              key={rx.id}
              style={({ pressed }) => ({
                paddingHorizontal: 16, paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                flexDirection: "row", alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {/* TODO: navigate to Rx detail / edit */}
              <View style={{ width: 40, height: 40, borderRadius: 10,
                backgroundColor: `${PRIMARY}15`, alignItems: "center",
                justifyContent: "center", marginRight: 12 }}>
                <Pill size={18} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{rx.drug}</Text>
                <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                  {rx.patient} · {rx.sig}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4,
                  backgroundColor: STATUS_COLOR[rx.status] ?? "#6b7280" }} />
                <ChevronRight size={14} color="#4b5563" />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Drug interaction warning banner */}
        <View style={{ marginHorizontal: 16, marginTop: 12, borderRadius: 14,
          backgroundColor: "#78350f20", borderWidth: 1, borderColor: "#92400e40",
          padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <AlertCircle size={18} color="#f59e0b" />
          {/* TODO: actions.checkInteractions() — cross-check with active medication_requests */}
          <Text style={{ color: "#fcd34d", fontSize: 13, flex: 1 }}>
            Interaction check not yet run for today's queue.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
