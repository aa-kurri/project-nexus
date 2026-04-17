import { View, Text, ScrollView, Pressable } from "react-native";
import { Pill, CheckCircle2, AlertTriangle, Filter } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type Schedule = "H" | "H1" | "X";

const SCH_CFG: Record<Schedule, { color: string; bg: string; label: string; desc: string }> = {
  H:  { color: "#f59e0b", bg: "#f59e0b20", label: "Sch-H",  desc: "Requires valid prescription" },
  H1: { color: "#f97316", bg: "#f97316 20", label: "Sch-H1", desc: "Narcotic / high-risk" },
  X:  { color: "#ef4444", bg: "#ef444420", label: "Sch-X",  desc: "Controlled substance" },
};

interface DispenseLog {
  id: string; drug: string; schedule: Schedule; qty: string;
  patient: string; prescriberId?: string; rxId?: string;
  witness?: string; time: string; compliant: boolean;
}

const LOGS: DispenseLog[] = [
  { id: "DL-001", drug: "Tramadol 50mg",     schedule: "H",  qty: "10 tabs", patient: "George Mathew / SP-04",  prescriberId: "MCI-12345", rxId: "RX-4421", witness: "Nurse Ravi",  time: "08:14", compliant: true  },
  { id: "DL-002", drug: "Midazolam 5mg/ml",  schedule: "X",  qty: "2 amp",   patient: "Sunita Sharma / ICU-02", prescriberId: "MCI-67890", rxId: "RX-4399", witness: "Dr. Suresh",  time: "09:30", compliant: true  },
  { id: "DL-003", drug: "Codeine Linctus",   schedule: "H1", qty: "100 ml",  patient: "Ramesh Kumar / GA-01",   prescriberId: undefined,   rxId: "RX-4410", witness: undefined,     time: "10:05", compliant: false },
  { id: "DL-004", drug: "Alprazolam 0.25mg", schedule: "H",  qty: "30 tabs", patient: "Priya Venkatesh / SP-02",prescriberId: "MCI-22111", rxId: undefined,  witness: "Nurse Anita", time: "11:20", compliant: false },
  { id: "DL-005", drug: "Fentanyl 50mcg",    schedule: "X",  qty: "1 amp",   patient: "Arun Nair / ICU-04",     prescriberId: "MCI-55443", rxId: "RX-4388", witness: "Dr. Priya",   time: "12:00", compliant: true  },
];

export default function SchedulesScreen() {
  const [filter, setFilter] = useState<Schedule | "ALL">("ALL");

  const filtered = LOGS.filter(l => filter === "ALL" || l.schedule === filter);
  const nonCompliant = LOGS.filter(l => !l.compliant).length;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Pharmacy · Compliance
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          Drug Schedules Log
        </Text>
        {nonCompliant > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8,
            backgroundColor: "#ef444430", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
            alignSelf: "flex-start" }}>
            <AlertTriangle size={12} color="#f87171" />
            <Text style={{ color: "#f87171", fontSize: 11, fontWeight: "700" }}>
              {nonCompliant} compliance issue{nonCompliant > 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Filter chips */}
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
        {(["ALL","H","H1","X"] as const).map(f => {
          const active = filter === f;
          const color  = f === "ALL" ? PRIMARY : SCH_CFG[f].color;
          return (
            <Pressable key={f} onPress={() => setFilter(f)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
                backgroundColor: active ? `${color}30` : `${color}10`,
                borderWidth: 1, borderColor: active ? color : "transparent" }}>
              <Text style={{ color, fontSize: 12, fontWeight: "700" }}>
                {f === "ALL" ? "All" : SCH_CFG[f].label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 40 }}>
        {filtered.map(log => {
          const scfg = SCH_CFG[log.schedule];
          const missing = !log.prescriberId || !log.rxId || (log.schedule !== "H" && !log.witness);
          return (
            <View key={log.id} style={{ backgroundColor: SURFACE, borderRadius: 16,
              borderWidth: 1, borderColor: missing ? "#ef444430" : BORDER, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10,
                  backgroundColor: scfg.bg, alignItems: "center", justifyContent: "center" }}>
                  <Pill size={18} color={scfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 13 }}>{log.drug}</Text>
                    <View style={{ backgroundColor: scfg.bg, borderRadius: 5,
                      paddingHorizontal: 6, paddingVertical: 1 }}>
                      <Text style={{ color: scfg.color, fontSize: 9, fontWeight: "800" }}>{scfg.label}</Text>
                    </View>
                  </View>
                  <Text style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{log.patient}</Text>
                  <Text style={{ color: "#4b5563", fontSize: 11, marginTop: 1 }}>
                    {log.qty} · {log.time}
                  </Text>
                </View>
                {log.compliant
                  ? <CheckCircle2 size={18} color={PRIMARY} />
                  : <AlertTriangle size={18} color="#ef4444" />}
              </View>

              {/* Compliance fields */}
              <View style={{ marginTop: 10, paddingTop: 10,
                borderTopWidth: 1, borderTopColor: BORDER, gap: 5 }}>
                {[
                  { label: "Prescriber NMC", value: log.prescriberId, required: true  },
                  { label: "Rx ID",           value: log.rxId,          required: true  },
                  { label: "Witness",         value: log.witness,       required: log.schedule !== "H" },
                ].map(f => (
                  <View key={f.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: "#4b5563", fontSize: 11, width: 100 }}>{f.label}:</Text>
                    {f.value ? (
                      <Text style={{ color: "#9ca3af", fontSize: 11 }}>{f.value}</Text>
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <AlertTriangle size={10} color="#ef4444" />
                        <Text style={{ color: "#ef4444", fontSize: 10, fontWeight: "700" }}>MISSING</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
