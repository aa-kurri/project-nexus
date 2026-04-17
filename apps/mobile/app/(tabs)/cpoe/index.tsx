import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator
} from "react-native";
import {
  ClipboardList, FlaskConical, Scan, Utensils, BookOpen,
  Plus, ChevronRight, CheckCircle2, Clock, XCircle, Mic2,
} from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type OrderType   = "medication" | "lab" | "radiology" | "diet" | "nursing";
type OrderStatus = "active" | "pending_cosign" | "completed" | "discontinued";

const TYPE_CFG: Record<OrderType, { label: string; color: string; Icon: any }> = {
  medication: { label: "Medication", color: PRIMARY,   Icon: ClipboardList },
  lab:        { label: "Lab",        color: "#6366f1", Icon: FlaskConical   },
  radiology:  { label: "Radiology",  color: "#f59e0b", Icon: Scan           },
  diet:       { label: "Diet",       color: "#10b981", Icon: Utensils       },
  nursing:    { label: "Nursing",    color: "#ec4899", Icon: BookOpen       },
};

const STATUS_CFG: Record<OrderStatus, { label: string; color: string }> = {
  active:          { label: "Active",        color: PRIMARY   },
  pending_cosign:  { label: "Awaiting Sign", color: "#f59e0b" },
  completed:       { label: "Completed",     color: "#6b7280" },
  discontinued:    { label: "D/C",           color: "#ef4444" },
};

interface Order {
  id: string; type: OrderType; text: string; detail: string;
  status: OrderStatus; time: string; aiGenerated?: boolean;
}

interface CpoePatient {
  id: string; name: string; bed: string; uhid: string; orders: Order[];
}

const PATIENTS: CpoePatient[] = [
  {
    id: "p1", name: "Ramesh Kumar", bed: "GA-01", uhid: "AY-00412",
    orders: [
      { id: "o1", type: "medication", text: "Amoxicillin 500 mg",    detail: "PO TDS × 5 days",         status: "active",         time: "08:30", aiGenerated: true },
      { id: "o2", type: "lab",        text: "CBC + CRP",             detail: "Stat · fasting",           status: "active",         time: "09:00" },
      { id: "o3", type: "diet",       text: "Soft diet",             detail: "Low sodium",               status: "pending_cosign", time: "10:00" },
    ],
  },
  {
    id: "p2", name: "Sunita Sharma", bed: "ICU-02", uhid: "AY-00389",
    orders: [
      { id: "o4", type: "medication", text: "Noradrenaline 8 mg/50 ml", detail: "0.1 mcg/kg/min IV continuous", status: "active", time: "06:00", aiGenerated: false },
      { id: "o5", type: "radiology",  text: "CXR Portable",          detail: "Daily morning",            status: "active",         time: "07:00" },
      { id: "o6", type: "nursing",    text: "Neuro obs Q1H",         detail: "GCS, pupils",              status: "active",         time: "Cont." },
    ],
  },
  {
    id: "p3", name: "George Mathew", bed: "SP-04", uhid: "AY-00345",
    orders: [
      { id: "o7", type: "medication", text: "Tramadol 50 mg",        detail: "PO BD PRN pain",           status: "active",         time: "12:00" },
      { id: "o8", type: "lab",        text: "PT/INR",                detail: "Tomorrow fasting",         status: "pending_cosign", time: "08:00", aiGenerated: true },
    ],
  },
];

const ORDER_TYPES: OrderType[] = ["medication", "lab", "radiology", "diet", "nursing"];

export default function CpoeScreen() {
  const [selected,   setSelected]   = useState<string | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [newType,    setNewType]    = useState<OrderType>("medication");
  const [newText,    setNewText]    = useState("");
  const [newDetail,  setNewDetail]  = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localOrders, setLocal]     = useState<Order[]>([]);

  const patient = PATIENTS.find(p => p.id === selected);

  function submitOrder() {
    if (!newText.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setLocal(prev => [...prev, {
        id: `new-${Date.now()}`, type: newType,
        text: newText, detail: newDetail,
        status: "pending_cosign", time: "Now", aiGenerated: false,
      }]);
      setNewText(""); setNewDetail(""); setShowForm(false); setSubmitting(false);
    }, 800);
  }

  const allOrders = [...(patient?.orders ?? []), ...localOrders.filter(() => selected !== null)];

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Computerised Orders
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>CPOE</Text>
      </View>

      {!selected ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {PATIENTS.map(p => {
            const pending = p.orders.filter(o => o.status === "pending_cosign").length;
            return (
              <Pressable key={p.id} onPress={() => setSelected(p.id)}
                style={({ pressed }) => ({
                  backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: BORDER,
                  padding: 16, opacity: pressed ? 0.7 : 1,
                  flexDirection: "row", alignItems: "center", gap: 12,
                })}>
                <View style={{ width: 40, height: 40, borderRadius: 12,
                  backgroundColor: `${PRIMARY}20`, alignItems: "center", justifyContent: "center" }}>
                  <ClipboardList size={20} color={PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 15 }}>{p.name}</Text>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                    {p.bed} · {p.orders.length} active orders
                  </Text>
                </View>
                {pending > 0 && (
                  <View style={{ backgroundColor: "#f59e0b20", borderRadius: 8,
                    paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: "#f59e0b", fontSize: 11, fontWeight: "700" }}>
                      {pending} awaiting sign
                    </Text>
                  </View>
                )}
                <ChevronRight size={16} color="#374151" />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Pressable onPress={() => { setSelected(null); setLocal([]); setShowForm(false); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <ChevronRight size={14} color="#6b7280" style={{ transform: [{ rotate: "180deg" }] }} />
            <Text style={{ color: "#6b7280", fontSize: 13 }}>Back</Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <View>
              <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "700" }}>{patient!.name}</Text>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>{patient!.bed} · {patient!.uhid}</Text>
            </View>
            <Pressable onPress={() => setShowForm(!showForm)}
              style={({ pressed }) => ({
                backgroundColor: PRIMARY, borderRadius: 12,
                paddingHorizontal: 14, paddingVertical: 8,
                flexDirection: "row", alignItems: "center", gap: 6,
                opacity: pressed ? 0.8 : 1,
              })}>
              <Plus size={15} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>New Order</Text>
            </Pressable>
          </View>

          {/* New order form */}
          {showForm && (
            <View style={{ backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1,
              borderColor: `${PRIMARY}40`, padding: 16, marginBottom: 16, gap: 12 }}>
              <Text style={{ color: "#9ca3af", fontSize: 11, fontWeight: "700",
                textTransform: "uppercase", letterSpacing: 0.5 }}>New Order</Text>

              {/* Type selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {ORDER_TYPES.map(t => {
                    const cfg = TYPE_CFG[t];
                    return (
                      <Pressable key={t} onPress={() => setNewType(t)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 6,
                          paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
                          backgroundColor: newType === t ? `${cfg.color}30` : `${cfg.color}10`,
                          borderWidth: 1, borderColor: newType === t ? cfg.color : "transparent" }}>
                        <cfg.Icon size={13} color={cfg.color} />
                        <Text style={{ color: cfg.color, fontSize: 12, fontWeight: "600" }}>{cfg.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              <TextInput
                value={newText} onChangeText={setNewText}
                placeholder="Order (e.g. Amoxicillin 500 mg PO TDS)"
                placeholderTextColor="#4b5563"
                style={{ backgroundColor: BG, borderRadius: 10, borderWidth: 1,
                  borderColor: BORDER, padding: 12, color: "#f9fafb", fontSize: 14 }}
              />
              <TextInput
                value={newDetail} onChangeText={setNewDetail}
                placeholder="Instructions / frequency (optional)"
                placeholderTextColor="#4b5563"
                style={{ backgroundColor: BG, borderRadius: 10, borderWidth: 1,
                  borderColor: BORDER, padding: 12, color: "#f9fafb", fontSize: 14 }}
              />

              <Pressable onPress={submitOrder} disabled={submitting || !newText.trim()}
                style={({ pressed }) => ({
                  backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 12,
                  alignItems: "center", opacity: pressed || submitting ? 0.7 : 1,
                })}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: "#fff", fontWeight: "700" }}>Submit for Co-sign</Text>}
              </Pressable>
            </View>
          )}

          {/* Orders list */}
          <View style={{ backgroundColor: SURFACE, borderRadius: 16,
            borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
            {allOrders.map((order, i) => {
              const tcfg = TYPE_CFG[order.type];
              const scfg = STATUS_CFG[order.status];
              return (
                <View key={order.id} style={{
                  padding: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                  flexDirection: "row", alignItems: "flex-start", gap: 10,
                }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10,
                    backgroundColor: `${tcfg.color}20`, alignItems: "center", justifyContent: "center" }}>
                    <tcfg.Icon size={17} color={tcfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Text style={{ color: "#f9fafb", fontWeight: "600", fontSize: 14 }}>{order.text}</Text>
                      {order.aiGenerated && (
                        <View style={{ backgroundColor: "#7c3aed20", borderRadius: 4,
                          paddingHorizontal: 5, paddingVertical: 1 }}>
                          <Text style={{ color: "#a78bfa", fontSize: 9, fontWeight: "800" }}>AI</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{order.detail}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Clock size={10} color="#4b5563" />
                      <Text style={{ color: "#4b5563", fontSize: 11 }}>{order.time}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: `${scfg.color}20`, borderRadius: 8,
                    paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
                    <Text style={{ color: scfg.color, fontSize: 10, fontWeight: "700" }}>{scfg.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
