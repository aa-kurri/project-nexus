import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Bed } from "lucide-react-native";
import { useAuthStore } from "../../../store/authStore";
import { getBedMap, changeBedStatus, type BedMapItem, type BedStatus } from "./actions";

const BG     = "hsl(220, 15%, 6%)";
const BORDER = "#1e2332";

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

const NEXT_STATUS: Record<BedStatus, BedStatus> = {
  occupied:    "vacant",
  vacant:      "occupied",
  reserved:    "occupied",
  maintenance: "vacant",
};

function BedTile({ bed, onPress }: { bed: BedMapItem; onPress: () => void }) {
  const color = BED_COLOR[bed.status];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 76, borderRadius: 10,
        backgroundColor: `${color}15`,
        borderWidth: 1, borderColor: color,
        padding: 8, alignItems: "center",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Bed size={16} color={color} />
      <Text style={{ color: "#e5e7eb", fontSize: 11, fontWeight: "700", marginTop: 4 }}>{bed.label}</Text>
      <View style={{ backgroundColor: `${color}30`, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginTop: 3 }}>
        <Text style={{ color, fontSize: 9, fontWeight: "700" }}>{BADGE_LABEL[bed.status]}</Text>
      </View>
      {bed.patientName && (
        <Text style={{ color: "#6b7280", fontSize: 9, marginTop: 3 }} numberOfLines={1}>
          {bed.patientName.split(" ")[0]}
        </Text>
      )}
    </Pressable>
  );
}

interface Ward { ward: string; beds: BedMapItem[]; }

export default function BedsScreen() {
  const { profile } = useAuthStore();

  const [wards,      setWards]     = useState<Ward[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing]= useState(false);

  const load = useCallback(async (soft = false) => {
    if (!profile) return;
    soft ? setRefreshing(true) : setLoading(true);
    try {
      const beds = await getBedMap(profile.tenant_id);
      // Group by ward
      const map: Record<string, BedMapItem[]> = {};
      for (const b of beds) {
        if (!map[b.ward]) map[b.ward] = [];
        map[b.ward].push(b);
      }
      setWards(Object.entries(map).map(([ward, beds]) => ({ ward, beds })));
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const handleBedTap = (bed: BedMapItem) => {
    const next = NEXT_STATUS[bed.status];
    Alert.alert(
      `Bed ${bed.label}`,
      bed.patientName
        ? `Patient: ${bed.patientName}\nChange status to "${next}"?`
        : `Change status to "${next}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Mark ${next}`,
          onPress: async () => {
            try {
              await changeBedStatus(bed.id, next);
              load(true);
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#0F766E" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>Bed Management</Text>
        <Text style={{ color: "#6b7280", marginTop: 2 }}>
          {wards.reduce((s, w) => s + w.beds.length, 0)} total beds · tap to change status
        </Text>
      </View>

      {/* Legend */}
      <View style={{ marginHorizontal: 16, flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 14 }}>
        {(Object.entries(BED_COLOR) as [BedStatus, string][]).map(([status, color]) => (
          <View key={status} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
            <Text style={{ color: "#9ca3af", fontSize: 12, textTransform: "capitalize" }}>{status}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={wards}
        keyExtractor={item => item.ward}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#0F766E" />}
        renderItem={({ item }) => {
          const occupied = item.beds.filter(b => b.status === "occupied").length;
          return (
            <View style={{
              marginHorizontal: 16, marginBottom: 14,
              backgroundColor: "hsl(220, 13%, 9%)",
              borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between",
                alignItems: "center", marginBottom: 12 }}>
                <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 15 }}>{item.ward}</Text>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>
                  {occupied}/{item.beds.length} occupied
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {item.beds.map(bed => (
                  <BedTile key={bed.id} bed={bed} onPress={() => handleBedTap(bed)} />
                ))}
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ color: "#4b5563" }}>No beds configured for this hospital</Text>
          </View>
        }
      />
    </View>
  );
}
