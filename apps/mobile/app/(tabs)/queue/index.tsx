import { View, Text, ScrollView, Pressable } from "react-native";
import { Clock, ChevronRight, AlertCircle } from "lucide-react-native";
import { useRouter } from "expo-router";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type QueueStatus = "in_progress" | "waiting" | "next" | "done";

interface QueueToken {
  token: string;
  patientId: string;
  name: string;
  complaint: string;
  wait: string;
  status: QueueStatus;
}

// TODO: replace with fetchTodayQueue() from actions.ts
const MOCK_QUEUE: QueueToken[] = [
  { token: "T-001", patientId: "pt-1001", name: "Ramesh Kumar",  complaint: "Chest pain, shortness of breath",  wait: "Now",     status: "in_progress" },
  { token: "T-002", patientId: "pt-1002", name: "Priya Sharma",  complaint: "Headache, BP follow-up",           wait: "~5 min",  status: "next" },
  { token: "T-003", patientId: "pt-1003", name: "Anita Verma",   complaint: "Knee pain, difficulty walking",    wait: "~12 min", status: "waiting" },
  { token: "T-004", patientId: "pt-1004", name: "Suresh Patel",  complaint: "Acidity, bloating after meals",    wait: "~20 min", status: "waiting" },
  { token: "T-005", patientId: "pt-1005", name: "Meena Joshi",   complaint: "Fever for 3 days, mild cough",     wait: "~28 min", status: "waiting" },
];

const STATUS_META: Record<QueueStatus, { label: string; color: string }> = {
  in_progress: { label: "ACTIVE",  color: PRIMARY },
  next:        { label: "NEXT",    color: "#f59e0b" },
  waiting:     { label: "",        color: "" },
  done:        { label: "DONE",    color: "#6b7280" },
};

export default function QueueScreen() {
  const router = useRouter();

  const waiting = MOCK_QUEUE.filter(t => t.status !== "done").length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20,
        backgroundColor: PRIMARY,
      }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          OPD Queue — Today
        </Text>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", marginTop: 2 }}>
          {waiting} patient{waiting !== 1 ? "s" : ""} waiting
        </Text>
      </View>

      {/* Token list */}
      <View style={{
        marginHorizontal: 16, marginTop: 16, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
        overflow: "hidden",
      }}>
        {MOCK_QUEUE.map((item, i) => {
          const meta = STATUS_META[item.status];
          return (
            <Pressable
              key={item.token}
              onPress={() => router.push(`/patients/${item.patientId}`)}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                opacity: pressed ? 0.7 : 1,
                backgroundColor: item.status === "in_progress" ? `${PRIMARY}12` : "transparent",
              })}
            >
              {/* Token badge */}
              <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: item.status === "in_progress" ? `${PRIMARY}30`
                  : item.status === "next" ? "#78350f30" : "#1e2332",
                alignItems: "center", justifyContent: "center", marginRight: 12,
              }}>
                <Text style={{
                  color: item.status === "in_progress" ? PRIMARY
                    : item.status === "next" ? "#f59e0b" : "#9ca3af",
                  fontWeight: "700", fontSize: 11,
                }}>
                  {item.token}
                </Text>
              </View>

              {/* Patient info */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f9fafb", fontWeight: "600", fontSize: 15 }}>
                  {item.name}
                </Text>
                <Text style={{
                  color: "#9ca3af", fontSize: 12, marginTop: 2,
                  numberOfLines: 1,
                } as any} numberOfLines={1}>
                  {item.complaint}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
                  <Clock size={11} color="#6b7280" />
                  <Text style={{ color: "#6b7280", fontSize: 11 }}>{item.wait}</Text>
                </View>
              </View>

              {/* Status badge / chevron */}
              {meta.label ? (
                <View style={{
                  backgroundColor: `${meta.color}20`, borderRadius: 8,
                  paddingHorizontal: 10, paddingVertical: 4, marginRight: 6,
                }}>
                  <Text style={{ color: meta.color, fontSize: 11, fontWeight: "700" }}>
                    {meta.label}
                  </Text>
                </View>
              ) : null}
              <ChevronRight size={14} color="#4b5563" />
            </Pressable>
          );
        })}
      </View>

      {/* Call Next CTA */}
      <Pressable
        style={({ pressed }) => ({
          marginHorizontal: 16, marginTop: 16, borderRadius: 14,
          backgroundColor: PRIMARY, paddingVertical: 16,
          alignItems: "center", opacity: pressed ? 0.8 : 1,
        })}
        onPress={() => {
          // TODO: actions.callNextPatient() — sets current token to in_progress,
          // advances queue in queue_tokens, triggers push notification to patient
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          Call Next Patient
        </Text>
      </Pressable>

      {/* Interaction alert */}
      <View style={{
        marginHorizontal: 16, marginTop: 12, borderRadius: 14,
        backgroundColor: "#78350f20", borderWidth: 1, borderColor: "#92400e40",
        padding: 14, flexDirection: "row", alignItems: "center", gap: 10,
      }}>
        <AlertCircle size={16} color="#f59e0b" />
        <Text style={{ color: "#fcd34d", fontSize: 12, flex: 1 }}>
          {/* TODO: actions.checkInteractions() — cross-check active meds */}
          Drug interaction check not yet run for today's queue.
        </Text>
      </View>
    </ScrollView>
  );
}
