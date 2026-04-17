import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { TrendingUp, AlertTriangle, CheckCircle2, Plus, IndianRupee } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type LeakStatus = "flagged" | "resolved" | "ignored";

const STATUS_CFG: Record<LeakStatus, { label: string; color: string }> = {
  flagged:  { label: "Flagged",  color: "#ef4444" },
  resolved: { label: "Resolved", color: PRIMARY   },
  ignored:  { label: "Ignored",  color: "#6b7280" },
};

const MODULE_COLOR: Record<string, string> = {
  Pharmacy:  "#6366f1", LIMS: "#3b82f6", OT: "#f59e0b",
  Services:  PRIMARY,   Diet: "#10b981", ICU: "#ec4899",
};

interface AuditItem {
  id: string; patient: string; uhid: string; module: string;
  description: string; amount: number; status: LeakStatus; time: string;
}

const ITEMS: AuditItem[] = [
  { id: "RA-001", patient: "Ramesh Kumar",    uhid: "AY-00412", module: "Pharmacy",  description: "Amoxicillin 500mg × 10 dispensed — not billed",          amount: 280,  status: "flagged",  time: "08:22" },
  { id: "RA-002", patient: "Sunita Sharma",   uhid: "AY-00389", module: "ICU",       description: "Day 3 ICU charges not posted",                           amount: 5400, status: "flagged",  time: "09:00" },
  { id: "RA-003", patient: "George Mathew",   uhid: "AY-00345", module: "OT",        description: "Implant: DePuy Attune Femur CR — not added to bill",     amount: 32000,status: "resolved", time: "09:45" },
  { id: "RA-004", patient: "Priya Venkatesh", uhid: "AY-00298", module: "LIMS",      description: "CBC + CRP ordered; only CBC billed",                     amount: 350,  status: "flagged",  time: "10:10" },
  { id: "RA-005", patient: "Arun Nair",       uhid: "AY-00267", module: "Diet",      description: "3 soft-diet trays not charged",                          amount: 450,  status: "ignored",  time: "11:00" },
  { id: "RA-006", patient: "Ramesh Kumar",    uhid: "AY-00412", module: "Services",  description: "Dressing change × 2 not billed",                         amount: 600,  status: "flagged",  time: "12:30" },
];

export default function AuditScreen() {
  const [adding,   setAdding]   = useState<string | null>(null);
  const [localSt,  setLocalSt]  = useState<Record<string, LeakStatus>>({});
  const [filter,   setFilter]   = useState<LeakStatus | "ALL">("flagged");

  const items = ITEMS.filter(i => filter === "ALL" || (localSt[i.id] ?? i.status) === filter);
  const atRisk = ITEMS.filter(i => (localSt[i.id] ?? i.status) === "flagged")
    .reduce((s, i) => s + i.amount, 0);

  function addToBill(id: string) {
    setAdding(id);
    setTimeout(() => {
      setLocalSt(prev => ({ ...prev, [id]: "resolved" }));
      setAdding(null);
    }, 1000);
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Billing · Revenue
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          Revenue Audit
        </Text>
      </View>

      {/* Risk banner */}
      <View style={{ margin: 16, backgroundColor: "#ef444415", borderRadius: 14,
        borderWidth: 1, borderColor: "#ef444430", padding: 14,
        flexDirection: "row", alignItems: "center", gap: 10 }}>
        <AlertTriangle size={20} color="#ef4444" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#f87171", fontSize: 11, fontWeight: "700",
            textTransform: "uppercase", letterSpacing: 0.5 }}>Revenue at Risk</Text>
          <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 24 }}>
            ₹{atRisk.toLocaleString("en-IN")}
          </Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
        {(["ALL","flagged","resolved","ignored"] as const).map(f => {
          const active = filter === f;
          const color  = f === "ALL" ? PRIMARY : STATUS_CFG[f].color;
          return (
            <Pressable key={f} onPress={() => setFilter(f)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                backgroundColor: active ? `${color}30` : `${color}10`,
                borderWidth: 1, borderColor: active ? color : "transparent" }}>
              <Text style={{ color, fontSize: 12, fontWeight: "700", textTransform: "capitalize" }}>
                {f}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 40 }}>
        {items.map(item => {
          const status = (localSt[item.id] ?? item.status) as LeakStatus;
          const scfg   = STATUS_CFG[status];
          const mColor = MODULE_COLOR[item.module] ?? PRIMARY;
          const isAdd  = adding === item.id;
          return (
            <View key={item.id} style={{ backgroundColor: SURFACE, borderRadius: 16,
              borderWidth: 1, borderColor: status === "flagged" ? "#ef444430" : BORDER, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10,
                  backgroundColor: `${mColor}20`, alignItems: "center", justifyContent: "center" }}>
                  <IndianRupee size={17} color={mColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 13 }}>
                      {item.patient}
                    </Text>
                    <View style={{ backgroundColor: `${mColor}20`, borderRadius: 5,
                      paddingHorizontal: 6, paddingVertical: 1 }}>
                      <Text style={{ color: mColor, fontSize: 9, fontWeight: "800" }}>{item.module}</Text>
                    </View>
                  </View>
                  <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 3 }}>{item.description}</Text>
                  <Text style={{ color: "#4b5563", fontSize: 11, marginTop: 2 }}>{item.time}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={{ color: status === "flagged" ? "#ef4444" : PRIMARY,
                    fontWeight: "800", fontSize: 15 }}>
                    ₹{item.amount.toLocaleString("en-IN")}
                  </Text>
                  <View style={{ backgroundColor: `${scfg.color}20`, borderRadius: 6,
                    paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ color: scfg.color, fontSize: 9, fontWeight: "700" }}>{scfg.label}</Text>
                  </View>
                </View>
              </View>

              {status === "flagged" && (
                <Pressable onPress={() => addToBill(item.id)} disabled={isAdd}
                  style={({ pressed }) => ({
                    marginTop: 10, flexDirection: "row", alignItems: "center",
                    justifyContent: "center", gap: 6, backgroundColor: PRIMARY,
                    borderRadius: 10, paddingVertical: 9,
                    opacity: pressed || isAdd ? 0.7 : 1,
                  })}>
                  {isAdd
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Plus size={14} color="#fff" />}
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                    {isAdd ? "Adding…" : "Add to Bill"}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
