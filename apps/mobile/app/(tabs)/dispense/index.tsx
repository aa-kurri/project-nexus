import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Package, Search, AlertCircle, CheckCircle } from "lucide-react-native";
import { useAuthStore } from "../../../store/authStore";
import { fetchPendingRx, fetchLowStock, recordDispense, type PendingRx, type LowStockItem } from "./actions";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

export default function DispenseScreen() {
  const { profile } = useAuthStore();

  const [pendingRx,  setPendingRx]  = useState<PendingRx[]>([]);
  const [lowStock,   setLowStock]   = useState<LowStockItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dispensing, setDispensing] = useState<string | null>(null);
  const [query,      setQuery]      = useState("");

  const load = useCallback(async (soft = false) => {
    if (!profile) return;
    soft ? setRefreshing(true) : setLoading(true);
    try {
      const [rx, stock] = await Promise.all([
        fetchPendingRx(profile.tenant_id),
        fetchLowStock(profile.tenant_id),
      ]);
      setPendingRx(rx);
      setLowStock(stock);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const handleDispense = async (rxId: string) => {
    setDispensing(rxId);
    try {
      await recordDispense(rxId);
      setPendingRx(prev => prev.filter(r => r.id !== rxId));
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setDispensing(null);
    }
  };

  const filtered = pendingRx.filter(r =>
    r.patient_name.toLowerCase().includes(query.toLowerCase()) ||
    r.drug_name.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>Dispense</Text>
        <Text style={{ color: "#6b7280", marginTop: 4 }}>
          {pendingRx.length} prescription{pendingRx.length !== 1 ? "s" : ""} pending
        </Text>
      </View>

      {/* Search */}
      <View style={{ marginHorizontal: 16, marginBottom: 12,
        flexDirection: "row", alignItems: "center",
        backgroundColor: SURFACE, borderRadius: 12,
        borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14 }}>
        <Search size={16} color="#6b7280" />
        <TextInput
          style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: "#f9fafb", fontSize: 15 }}
          placeholder="Search patient or drug…"
          placeholderTextColor="#4b5563"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={PRIMARY} />}
      >
        {/* Pending Rx */}
        <View style={{ marginHorizontal: 16, borderRadius: 16,
          backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: "#4b5563" }}>
                {query ? "No matching prescriptions" : "All prescriptions dispensed ✓"}
              </Text>
            </View>
          ) : filtered.map((rx, i) => (
            <View
              key={rx.id}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 10,
                backgroundColor: rx.urgent ? "#ef444420" : `${PRIMARY}15`,
                alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Package size={18} color={rx.urgent ? "#ef4444" : PRIMARY} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: "#f9fafb", fontWeight: "600" }}>
                    {rx.drug_name}{rx.strength ? ` ${rx.strength}` : ""}
                  </Text>
                  {rx.urgent && (
                    <View style={{ backgroundColor: "#ef444420", borderRadius: 6,
                      paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: "#f87171", fontSize: 10, fontWeight: "700" }}>URGENT</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                  {rx.patient_name}{rx.bed_label ? ` · ${rx.bed_label}` : ""}
                  {rx.dosage ? ` · ${rx.dosage}` : ""}
                </Text>
              </View>

              <Pressable
                onPress={() => handleDispense(rx.id)}
                disabled={dispensing === rx.id}
                style={({ pressed }) => ({
                  backgroundColor: `${PRIMARY}20`, borderRadius: 10,
                  paddingHorizontal: 12, paddingVertical: 8,
                  opacity: pressed || dispensing === rx.id ? 0.6 : 1,
                })}
              >
                {dispensing === rx.id
                  ? <ActivityIndicator color={PRIMARY} size="small" />
                  : <CheckCircle size={18} color={PRIMARY} />}
              </Pressable>
            </View>
          ))}
        </View>

        {/* Low Stock */}
        {lowStock.length > 0 && (
          <>
            <Text style={{ color: "#f59e0b", fontSize: 12, fontWeight: "600",
              textTransform: "uppercase", letterSpacing: 0.5,
              marginHorizontal: 20, marginTop: 20, marginBottom: 10 }}>
              Low Stock Alerts
            </Text>
            <View style={{ marginHorizontal: 16, borderRadius: 16,
              backgroundColor: "#78350f20", borderWidth: 1, borderColor: "#92400e40", overflow: "hidden" }}>
              {lowStock.map((item, i) => (
                <View key={item.id} style={{
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "#92400e40",
                }}>
                  <AlertCircle size={18} color="#f59e0b" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fcd34d", fontWeight: "600" }}>{item.name}</Text>
                    <Text style={{ color: "#92400e", fontSize: 12, marginTop: 2 }}>
                      {item.quantity} {item.unit} remaining
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
