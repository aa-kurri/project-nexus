import { View, Text, ScrollView, Pressable } from "react-native";
import { Bed } from "lucide-react-native";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type BedStatus = "occupied" | "vacant" | "reserved" | "maintenance";

const BED_COLOR: Record<BedStatus, string> = {
  occupied:    "#ef4444",
  vacant:      "#059669",
  reserved:    "#f59e0b",
  maintenance: "#6b7280",
};

// TODO: fetch from beds joined with admissions via actions.getBedMap()
const MOCK_WARDS = [
  { ward: "General A", beds: [
    { id: "GA-01", status: "occupied" as BedStatus,    patient: "Ramesh K." },
    { id: "GA-02", status: "vacant" as BedStatus,      patient: null },
    { id: "GA-03", status: "reserved" as BedStatus,    patient: "—" },
    { id: "GA-04", status: "occupied" as BedStatus,    patient: "Priya S." },
    { id: "GA-05", status: "maintenance" as BedStatus, patient: null },
    { id: "GA-06", status: "vacant" as BedStatus,      patient: null },
  ]},
  { ward: "ICU", beds: [
    { id: "ICU-01", status: "occupied" as BedStatus, patient: "Anita V." },
    { id: "ICU-02", status: "occupied" as BedStatus, patient: "Suresh P." },
    { id: "ICU-03", status: "vacant" as BedStatus,   patient: null },
  ]},
];

export default function BedsScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>Bed Management</Text>
      </View>

      {/* Legend */}
      <View style={{ marginHorizontal: 16, flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        {Object.entries(BED_COLOR).map(([status, color]) => (
          <View key={status} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
            <Text style={{ color: "#9ca3af", fontSize: 12, textTransform: "capitalize" }}>{status}</Text>
          </View>
        ))}
      </View>

      {/* Ward grids */}
      {MOCK_WARDS.map(({ ward, beds }) => (
        <View key={ward} style={{ marginHorizontal: 16, marginBottom: 16,
          backgroundColor: SURFACE, borderRadius: 16,
          borderWidth: 1, borderColor: BORDER, padding: 16 }}>
          <Text style={{ color: "#e5e7eb", fontWeight: "700", marginBottom: 12 }}>{ward}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {beds.map(bed => (
              <Pressable
                key={bed.id}
                style={({ pressed }) => ({
                  width: 72, borderRadius: 10,
                  backgroundColor: `${BED_COLOR[bed.status]}15`,
                  borderWidth: 1, borderColor: BED_COLOR[bed.status],
                  padding: 8, alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {/* TODO: actions.transferPatient() / actions.dischargeBed() */}
                <Bed size={16} color={BED_COLOR[bed.status]} />
                <Text style={{ color: "#e5e7eb", fontSize: 11, fontWeight: "600", marginTop: 4 }}>
                  {bed.id}
                </Text>
                {bed.patient && (
                  <Text style={{ color: "#6b7280", fontSize: 10, marginTop: 2 }} numberOfLines={1}>
                    {bed.patient}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
