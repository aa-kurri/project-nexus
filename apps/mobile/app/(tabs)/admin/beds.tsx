"use client";
import { View, Text, FlatList, Pressable } from "react-native";
import { Bed } from "lucide-react-native";
import { Card }   from "../../../components/ui/card";
import { Badge }  from "../../../components/ui/badge";
import { TopBar } from "../../../components/hospital/TopBar";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { getBedMap } from "./actions";

const BG      = "hsl(220, 15%, 6%)";
const BORDER  = "#1e2332";

// ── Types ────────────────────────────────────────────────────────────────────
type BedStatus = "occupied" | "vacant" | "reserved" | "maintenance";

const BED_COLOR: Record<BedStatus, string> = {
  occupied:    "#ef4444",
  vacant:      "#059669",
  reserved:    "#f59e0b",
  maintenance: "#6b7280",
};

const BADGE_LABEL: Record<BedStatus, string> = {
  occupied:    "Occupied",
  vacant:      "Vacant",
  reserved:    "Reserved",
  maintenance: "Maint.",
};

interface BedItem {
  id: string;
  status: BedStatus;
  patient: string | null;
}

interface Ward {
  ward: string;
  beds: BedItem[];
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// TODO: getBedMap() — SELECT b.*, a.patient_id, p.full_name
//       FROM beds b LEFT JOIN admissions a ON a.bed_id = b.id AND a.status = 'admitted'
//       LEFT JOIN patients p ON p.id = a.patient_id
//       WHERE b.tenant_id = jwt_tenant()
const MOCK_WARDS: Ward[] = [
  { ward: "General A", beds: [
    { id: "GA-01", status: "occupied",    patient: "Ramesh K." },
    { id: "GA-02", status: "vacant",      patient: null },
    { id: "GA-03", status: "reserved",    patient: "Priya S." },
    { id: "GA-04", status: "occupied",    patient: "Anand M." },
    { id: "GA-05", status: "maintenance", patient: null },
    { id: "GA-06", status: "vacant",      patient: null },
  ]},
  { ward: "ICU", beds: [
    { id: "ICU-01", status: "occupied", patient: "Anita V." },
    { id: "ICU-02", status: "occupied", patient: "Suresh P." },
    { id: "ICU-03", status: "vacant",   patient: null },
    { id: "ICU-04", status: "reserved", patient: "Neha R." },
  ]},
  { ward: "Maternity", beds: [
    { id: "MAT-01", status: "occupied", patient: "Kavita D." },
    { id: "MAT-02", status: "vacant",   patient: null },
    { id: "MAT-03", status: "occupied", patient: "Sunita J." },
  ]},
  { ward: "Paediatrics", beds: [
    { id: "PAE-01", status: "vacant",      patient: null },
    { id: "PAE-02", status: "occupied",    patient: "Arjun K. (6y)" },
    { id: "PAE-03", status: "maintenance", patient: null },
    { id: "PAE-04", status: "occupied",    patient: "Meera S. (3y)" },
  ]},
];

// ── Bed tile ─────────────────────────────────────────────────────────────────
function BedTile({ bed }: { bed: BedItem }) {
  const color = BED_COLOR[bed.status];
  return (
    <Pressable
      style={({ pressed }) => ({
        width: 76, borderRadius: 10,
        backgroundColor: `${color}15`,
        borderWidth: 1, borderColor: color,
        padding: 8, alignItems: "center",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {/* TODO: actions.changeBedStatus(bed.id, newStatus) — sheet picker */}
      <Bed size={16} color={color} />
      <Text style={{ color: "#e5e7eb", fontSize: 11, fontWeight: "700", marginTop: 4 }}>
        {bed.id}
      </Text>
      <Badge label={BADGE_LABEL[bed.status]} color={color} />
      {bed.patient && (
        <Text style={{ color: "#6b7280", fontSize: 10, marginTop: 3 }} numberOfLines={1}>
          {bed.patient}
        </Text>
      )}
    </Pressable>
  );
}

// ── Ward card ─────────────────────────────────────────────────────────────────
function WardCard({ ward, beds }: Ward) {
  const occupied = beds.filter(b => b.status === "occupied").length;
  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 12 }}>
        <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 15 }}>{ward}</Text>
        <Text style={{ color: "#6b7280", fontSize: 12 }}>
          {occupied}/{beds.length} occupied
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {beds.map(bed => <BedTile key={bed.id} bed={bed} />)}
      </View>
    </Card>
  );
}

export default function BedsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <TopBar title="Bed Management" />

      {/* Legend */}
      <View style={{ marginHorizontal: 16, flexDirection: "row",
        flexWrap: "wrap", gap: 14, marginBottom: 14 }}>
        {(Object.entries(BED_COLOR) as [BedStatus, string][]).map(([status, color]) => (
          <View key={status} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
            <Text style={{ color: "#9ca3af", fontSize: 12, textTransform: "capitalize" }}>
              {status}
            </Text>
          </View>
        ))}
      </View>

      <FlatList
        data={MOCK_WARDS}
        keyExtractor={item => item.ward}
        renderItem={({ item }) => <WardCard {...item} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}
