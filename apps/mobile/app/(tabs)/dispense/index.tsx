import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Package, Search, AlertCircle, CheckCircle, ChevronRight, Barcode } from "lucide-react-native";
import { useState } from "react";
import { recordDispense } from "./actions";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// TODO: fetch from medication_requests joined with patients where status='active'
//       and pharmacist has not yet dispensed (dispense_event absent)
const PENDING_RX = [
  { id: "rx-1", patient: "Ramesh Kumar", drug: "Metformin 500mg",   qty: "30 tabs",  ward: "GA-01", urgent: false },
  { id: "rx-2", patient: "Anita Verma",  drug: "Morphine 10mg IV",  qty: "2 vials",  ward: "ICU-01",urgent: true  },
  { id: "rx-3", patient: "Suresh Patel", drug: "Amoxicillin 500mg", qty: "21 caps",  ward: "GA-02", urgent: false },
];

// TODO: fetch from stock_items joined with stock_batches for live stock levels
const LOW_STOCK = [
  { id: "s1", name: "Morphine 10mg/mL",  remaining: "6 vials",   threshold: "10 vials" },
  { id: "s2", name: "IV Normal Saline 500mL", remaining: "12 bags", threshold: "20 bags" },
];

export default function DispenseScreen() {
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [dispensing, setDispensing] = useState<string | null>(null);
  const [dispensed, setDispensed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const filtered = PENDING_RX.filter(r =>
    !dispensed.has(r.id) && (
      r.patient.toLowerCase().includes(query.toLowerCase()) ||
      r.drug.toLowerCase().includes(query.toLowerCase())
    )
  );

  async function handleBarcodeSimulate() {
    setScanning(true);
    setError(null);
    // Mock: simulate barcode scan delay
    await new Promise((r) => setTimeout(r, 800));
    // In real app, camera would capture barcode and auto-match to Rx
    if (filtered.length > 0) {
      const first = filtered[0];
      handleDispenseRx(first.id);
    }
    setScanning(false);
  }

  async function handleDispenseRx(rxId: string) {
    setDispensing(rxId);
    setError(null);
    try {
      await recordDispense({ rxId });
      setDispensed((prev) => new Set([...prev, rxId]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispense");
    } finally {
      setDispensing(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>Dispense</Text>
        <Text style={{ color: "#6b7280", marginTop: 4 }}>
          {PENDING_RX.length} prescriptions pending
        </Text>
      </View>

      {/* Barcode scanner button */}
      <Pressable
        onPress={handleBarcodeSimulate}
        disabled={scanning}
        style={({ pressed }) => ({
          marginHorizontal: 16, marginBottom: 12,
          backgroundColor: `${PRIMARY}20`, borderRadius: 12,
          borderWidth: 1, borderColor: PRIMARY,
          flexDirection: "row", alignItems: "center",
          justifyContent: "center", gap: 8, paddingVertical: 12,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {scanning ? (
          <ActivityIndicator color={PRIMARY} size="small" />
        ) : (
          <Barcode size={18} color={PRIMARY} />
        )}
        <Text style={{ color: PRIMARY, fontWeight: "600", fontSize: 14 }}>
          {scanning ? "Scanning…" : "Scan Barcode"}
        </Text>
      </Pressable>

      {/* Search */}
      <View style={{ marginHorizontal: 16, marginBottom: 12,
        flexDirection: "row", alignItems: "center",
        backgroundColor: SURFACE, borderRadius: 12,
        borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14 }}>
        <Search size={16} color="#6b7280" />
        <TextInput
          style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10,
            color: "#f9fafb", fontSize: 15 }}
          placeholder="Search patient or drug…"
          placeholderTextColor="#4b5563"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {error && (
        <View style={{ marginHorizontal: 16, marginBottom: 12,
          backgroundColor: "#ef444420", borderRadius: 12,
          borderWidth: 1, borderColor: "#f87171", padding: 12 }}>
          <Text style={{ color: "#f87171", fontSize: 13, fontWeight: "600" }}>{error}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Pending Rx list */}
        <View style={{ marginHorizontal: 16, borderRadius: 16,
          backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
          {filtered.map((rx, i) => (
            <Pressable
              key={rx.id}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {/* TODO: actions.recordDispense(rx.id) — inserts into stock_movements + marks Rx dispensed */}
              <View style={{ width: 40, height: 40, borderRadius: 10,
                backgroundColor: rx.urgent ? "#ef444420" : `${PRIMARY}15`,
                alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Package size={18} color={rx.urgent ? "#ef4444" : PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{rx.drug}</Text>
                  {rx.urgent && (
                    <View style={{ backgroundColor: "#ef444420", borderRadius: 6,
                      paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: "#f87171", fontSize: 10, fontWeight: "700" }}>URGENT</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                  {rx.patient} · {rx.qty} · {rx.ward}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDispenseRx(rx.id)}
                disabled={dispensing === rx.id}
                style={({ pressed }) => ({
                  backgroundColor: `${PRIMARY}20`, borderRadius: 10,
                  paddingHorizontal: 12, paddingVertical: 8,
                  opacity: pressed ? 0.7 : dispensing === rx.id ? 0.6 : 1,
                })}
              >
                {dispensing === rx.id ? (
                  <ActivityIndicator color={PRIMARY} size="small" />
                ) : (
                  <CheckCircle size={18} color={PRIMARY} />
                )}
              </Pressable>
            </Pressable>
          ))}
        </View>

        {/* Low stock alerts */}
        {LOW_STOCK.length > 0 && (
          <>
            <Text style={{ color: "#f59e0b", fontSize: 12, fontWeight: "600",
              textTransform: "uppercase", letterSpacing: 0.5,
              marginHorizontal: 20, marginTop: 20, marginBottom: 10 }}>
              Low Stock Alerts
            </Text>
            <View style={{ marginHorizontal: 16, borderRadius: 16,
              backgroundColor: "#78350f20", borderWidth: 1, borderColor: "#92400e40",
              overflow: "hidden" }}>
              {LOW_STOCK.map((item, i) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    paddingHorizontal: 16, paddingVertical: 14,
                    borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "#92400e40",
                  }}
                >
                  <AlertCircle size={18} color="#f59e0b" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fcd34d", fontWeight: "600" }}>{item.name}</Text>
                    <Text style={{ color: "#92400e", fontSize: 12, marginTop: 2 }}>
                      {item.remaining} remaining · min {item.threshold}
                    </Text>
                  </View>
                  {/* TODO: actions.raiseStockRequest() — insert into stock_movements with type='request' */}
                  <ChevronRight size={14} color="#92400e" />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
