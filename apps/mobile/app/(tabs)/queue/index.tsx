import { View, Text, ScrollView, Pressable } from "react-native";
import { List, Clock, User } from "lucide-react-native";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// TODO: fetch from queue_tokens joined with patients for the doctor's OPD slot today
const MOCK_QUEUE = [
  { token: "T-001", name: "Ramesh Kumar",   wait: "Now",    status: "in_progress" },
  { token: "T-002", name: "Priya Sharma",   wait: "~5 min", status: "waiting" },
  { token: "T-003", name: "Anita Verma",    wait: "~12 min",status: "waiting" },
  { token: "T-004", name: "Suresh Patel",   wait: "~20 min",status: "waiting" },
];

export default function QueueScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>
          OPD Queue — Today
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          4 patients waiting
        </Text>
      </View>

      {/* Queue list */}
      <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
        {MOCK_QUEUE.map((item, i) => (
          <Pressable
            key={item.token}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: 16, paddingVertical: 14,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24,
              backgroundColor: item.status === "in_progress" ? `${PRIMARY}30` : "#1e2332",
              alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Text style={{ color: item.status === "in_progress" ? PRIMARY : "#9ca3af",
                fontWeight: "700", fontSize: 12 }}>{item.token}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{item.name}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 4 }}>
                <Clock size={12} color="#6b7280" />
                <Text style={{ color: "#6b7280", fontSize: 12 }}>{item.wait}</Text>
              </View>
            </View>
            {item.status === "in_progress" && (
              <View style={{ backgroundColor: `${PRIMARY}20`, borderRadius: 8,
                paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: PRIMARY, fontSize: 11, fontWeight: "700" }}>ACTIVE</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Call next CTA */}
      <Pressable
        style={({ pressed }) => ({
          marginHorizontal: 16, marginTop: 16, borderRadius: 14,
          backgroundColor: PRIMARY, paddingVertical: 16,
          alignItems: "center", opacity: pressed ? 0.8 : 1,
        })}
      >
        {/* TODO: actions.callNextPatient() — updates queue_tokens.status */}
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Call Next Patient</Text>
      </Pressable>
    </ScrollView>
  );
}
