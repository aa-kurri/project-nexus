import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator
} from "react-native";
import {
  ClipboardList, FlaskConical, Scan, Utensils, BookOpen,
  Plus, ChevronRight, CheckCircle2, Clock, XCircle,
} from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

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
  active:         { label: "Active",        color: PRIMARY   },
  pending_cosign: { label: "Awaiting Sign", color: "#f59e0b" },
  completed:      { label: "Completed",     color: "#6b7280" },
  discontinued:   { label: "D/C",           color: "#ef4444" },
};

interface Order {
  id: string; type: OrderType; text: string; detail: string;
  status: OrderStatus; time: string; aiGenerated?: boolean;
}

interface CpoePatient {
  id: string; name: string; bed: string; uhid: string; orders: Order[];
}

const ORDER_TYPES: OrderType[] = ["medication", "lab", "radiology", "diet", "nursing"];

/** Map service_request.category → OrderType */
function toOrderType(category: string): OrderType {
  if (category === "lab")      return "lab";
  if (category === "radiology") return "radiology";
  if (category === "diet")      return "diet";
  if (category === "nursing")   return "nursing";
  return "medication";
}

/** Map service_request.status → OrderStatus */
function toOrderStatus(status: string): OrderStatus {
  if (status === "completed") return "completed";
  if (status === "revoked")   return "discontinued";
  if (status === "draft")     return "pending_cosign";
  return "active";
}

export default function CpoeScreen() {
  const { profile }              = useAuthStore();
  const [patients,  setPatients] = useState<CpoePatient[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [selected,  setSelected] = useState<string | null>(null);
  const [showForm,  setShowForm] = useState(false);
  const [newType,   setNewType]  = useState<OrderType>("medication");
  const [newText,   setNewText]  = useState("");
  const [newDetail, setNewDetail]= useState("");
  const [submitting,setSubmitting]= useState(false);
  const [error,     setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      // Get today's admitted patients
      const { data: admissions, error: aErr } = await supabase
        .from("admissions")
        .select(`patient_id, patients ( id, full_name, mrn ), beds ( label )`)
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "admitted");

      if (aErr) throw new Error(aErr.message);
      if (!admissions || admissions.length === 0) { setPatients([]); return; }

      const patientIds = admissions.map((a: any) => a.patient_id);

      const { data: orders, error: oErr } = await supabase
        .from("service_requests")
        .select("id, patient_id, display, category, status, requested_at")
        .eq("tenant_id", profile.tenant_id)
        .in("patient_id", patientIds)
        .not("status", "eq", "revoked")
        .order("requested_at", { ascending: false });

      if (oErr) throw new Error(oErr.message);

      const ordersByPatient: Record<string, Order[]> = {};
      for (const o of (orders ?? [])) {
        const pid = (o as any).patient_id;
        if (!ordersByPatient[pid]) ordersByPatient[pid] = [];
        ordersByPatient[pid].push({
          id:     o.id,
          type:   toOrderType((o as any).category),
          text:   (o as any).display,
          detail: "",
          status: toOrderStatus((o as any).status),
          time:   new Date((o as any).requested_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        });
      }

      setPatients(
        admissions.map((a: any) => ({
          id:     a.patient_id,
          name:   a.patients?.full_name ?? "Unknown",
          bed:    a.beds?.label ?? "—",
          uhid:   a.patients?.mrn ?? "—",
          orders: ordersByPatient[a.patient_id] ?? [],
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const patient = patients.find((p) => p.id === selected);

  async function submitOrder() {
    if (!newText.trim() || !selected || !profile) return;
    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { error: iErr } = await supabase
        .from("service_requests")
        .insert({
          tenant_id:    profile.tenant_id,
          patient_id:   selected,
          requester_id: userId ?? null,
          code:         newType.toUpperCase(),
          display:      newText,
          category:     newType,
          status:       "draft",
        });

      if (iErr) throw new Error(iErr.message);
      setNewText(""); setNewDetail(""); setShowForm(false);
      await load(); // refresh
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={PRIMARY} size="large" />
        <Text style={{ color: "#6b7280", marginTop: 12 }}>Loading orders…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Computerised Orders
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>CPOE</Text>
      </View>

      {error && (
        <View style={{ margin: 16, backgroundColor: "#ef444420", borderRadius: 12,
          borderWidth: 1, borderColor: "#ef444440", padding: 12 }}>
          <Text style={{ color: "#f87171", fontSize: 13 }}>{error}</Text>
        </View>
      )}

      {!selected ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {patients.length === 0 && (
            <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 40 }}>
              No admitted patients found.
            </Text>
          )}
          {patients.map((p) => {
            const pending = p.orders.filter((o) => o.status === "pending_cosign").length;
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
          <Pressable onPress={() => { setSelected(null); setShowForm(false); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <ChevronRight size={14} color="#6b7280" style={{ transform: [{ rotate: "180deg" }] }} />
            <Text style={{ color: "#6b7280", fontSize: 13 }}>Back</Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center",
            justifyContent: "space-between", marginBottom: 16 }}>
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

          {showForm && (
            <View style={{ backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1,
              borderColor: `${PRIMARY}40`, padding: 16, marginBottom: 16, gap: 12 }}>
              <Text style={{ color: "#9ca3af", fontSize: 11, fontWeight: "700",
                textTransform: "uppercase", letterSpacing: 0.5 }}>New Order</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {ORDER_TYPES.map((t) => {
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

          <View style={{ backgroundColor: SURFACE, borderRadius: 16,
            borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
            {patient!.orders.length === 0 && (
              <Text style={{ color: "#6b7280", textAlign: "center", padding: 24 }}>
                No active orders.
              </Text>
            )}
            {patient!.orders.map((order, i) => {
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
                    <Text style={{ color: "#f9fafb", fontWeight: "600", fontSize: 14 }}>{order.text}</Text>
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
