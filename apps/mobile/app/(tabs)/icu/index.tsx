import { View, Text, ScrollView, Pressable } from "react-native";
import { Activity, Wind, Droplets, Thermometer, ChevronRight, AlertTriangle, Wifi } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type VitalFlag = "critical" | "high" | "low" | "normal";

interface VitalRow {
  label: string; value: string; unit: string;
  flag: VitalFlag; trend: number[]; Icon: any;
}

interface IcuPatient {
  id: string; name: string; bed: string; uhid: string;
  ventilated: boolean; apache2: number; gcs: number;
  vitals: VitalRow[];
  vent?: { mode: string; fio2: number; peep: number; tv: number; rr: number };
  intake: number; output: number;
}

const FLAG_COLOR: Record<VitalFlag, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  low:      "#3b82f6",
  normal:   PRIMARY,
};

const PATIENTS: IcuPatient[] = [
  {
    id: "p1", name: "Sunita Sharma", bed: "ICU-02", uhid: "AY-00389",
    ventilated: true, apache2: 18, gcs: 10,
    vitals: [
      { label: "HR",   value: "112", unit: "bpm",  flag: "high",   trend: [88,94,102,108,112], Icon: Activity    },
      { label: "SpO₂", value: "94",  unit: "%",    flag: "low",    trend: [98,97,96,95,94],   Icon: Activity    },
      { label: "BP",   value: "88/54",unit: "mmHg",flag: "critical",trend: [120,110,100,92,88],Icon: Activity    },
      { label: "Temp", value: "38.9",unit: "°C",   flag: "high",   trend: [37.2,37.8,38.1,38.6,38.9], Icon: Thermometer },
      { label: "RR",   value: "24",  unit: "/min", flag: "high",   trend: [16,18,20,22,24],   Icon: Wind        },
    ],
    vent: { mode: "SIMV", fio2: 60, peep: 8, tv: 480, rr: 14 },
    intake: 1840, output: 1120,
  },
  {
    id: "p2", name: "Arun Nair", bed: "ICU-04", uhid: "AY-00267",
    ventilated: false, apache2: 9, gcs: 14,
    vitals: [
      { label: "HR",   value: "78",  unit: "bpm",  flag: "normal", trend: [80,79,77,78,78], Icon: Activity    },
      { label: "SpO₂", value: "98",  unit: "%",    flag: "normal", trend: [97,98,98,99,98], Icon: Activity    },
      { label: "BP",   value: "122/76",unit:"mmHg",flag: "normal", trend: [118,120,122,124,122],Icon: Activity },
      { label: "Temp", value: "37.1",unit: "°C",   flag: "normal", trend: [37.0,37.2,37.1,37.0,37.1], Icon: Thermometer },
      { label: "RR",   value: "16",  unit: "/min", flag: "normal", trend: [15,16,16,15,16], Icon: Wind        },
    ],
    intake: 2100, output: 1850,
  },
];

function Sparkline({ values, flag }: { values: number[]; flag: VitalFlag }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const color = FLAG_COLOR[flag];
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 24 }}>
      {values.map((v, i) => {
        const h = Math.max(3, ((v - min) / range) * 20 + 3);
        return (
          <View key={i} style={{
            width: 5, height: h, borderRadius: 2,
            backgroundColor: i === values.length - 1 ? color : `${color}50`,
          }} />
        );
      })}
    </View>
  );
}

export default function IcuScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const patient = PATIENTS.find(p => p.id === selected);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Intensive Care Unit
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          ICU Flowsheet
        </Text>
      </View>

      {!selected ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {PATIENTS.map(p => {
            const hasCritical = p.vitals.some(v => v.flag === "critical");
            return (
              <Pressable key={p.id} onPress={() => setSelected(p.id)}
                style={({ pressed }) => ({
                  backgroundColor: SURFACE, borderRadius: 16,
                  borderWidth: 1, borderColor: hasCritical ? "#ef444440" : BORDER,
                  padding: 16, opacity: pressed ? 0.7 : 1,
                  flexDirection: "row", alignItems: "center", gap: 12,
                })}>
                <View style={{ width: 44, height: 44, borderRadius: 12,
                  backgroundColor: hasCritical ? "#ef444420" : `${PRIMARY}20`,
                  alignItems: "center", justifyContent: "center" }}>
                  <Activity size={22} color={hasCritical ? "#ef4444" : PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 15 }}>{p.name}</Text>
                    {p.ventilated && (
                      <View style={{ backgroundColor: "#f59e0b20", borderRadius: 5,
                        paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Text style={{ color: "#f59e0b", fontSize: 9, fontWeight: "800" }}>VENT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                    {p.bed} · APACHE II: {p.apache2} · GCS: {p.gcs}
                  </Text>
                </View>
                {hasCritical && <AlertTriangle size={18} color="#ef4444" />}
                <ChevronRight size={16} color="#374151" />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Pressable onPress={() => setSelected(null)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <ChevronRight size={14} color="#6b7280" style={{ transform: [{ rotate: "180deg" }] }} />
            <Text style={{ color: "#6b7280", fontSize: 13 }}>Back</Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "700" }}>{patient!.name}</Text>
            {patient!.ventilated && (
              <View style={{ backgroundColor: "#f59e0b20", borderRadius: 6,
                paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Wifi size={11} color="#f59e0b" />
                <Text style={{ color: "#f59e0b", fontSize: 10, fontWeight: "800" }}>VENTILATED</Text>
              </View>
            )}
          </View>

          {/* Score badges */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            {[
              { label: "APACHE II", value: patient!.apache2, warn: patient!.apache2 >= 15 },
              { label: "GCS",       value: patient!.gcs,     warn: patient!.gcs <= 12     },
            ].map(s => (
              <View key={s.label} style={{
                flex: 1, backgroundColor: s.warn ? "#ef444415" : `${PRIMARY}15`,
                borderRadius: 12, borderWidth: 1,
                borderColor: s.warn ? "#ef444430" : `${PRIMARY}30`,
                padding: 12, alignItems: "center",
              }}>
                <Text style={{ color: "#6b7280", fontSize: 10, fontWeight: "700",
                  textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</Text>
                <Text style={{ color: s.warn ? "#ef4444" : PRIMARY, fontSize: 26,
                  fontWeight: "800", marginTop: 4 }}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Vitals */}
          <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "700",
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Live Vitals</Text>
          <View style={{ backgroundColor: SURFACE, borderRadius: 16,
            borderWidth: 1, borderColor: BORDER, overflow: "hidden", marginBottom: 16 }}>
            {patient!.vitals.map((v, i) => {
              const color = FLAG_COLOR[v.flag];
              return (
                <View key={v.label} style={{
                  flexDirection: "row", alignItems: "center",
                  padding: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER, gap: 10,
                }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8,
                    backgroundColor: `${color}20`, alignItems: "center", justifyContent: "center" }}>
                    <v.Icon size={15} color={color} />
                  </View>
                  <Text style={{ color: "#9ca3af", width: 42, fontSize: 12 }}>{v.label}</Text>
                  <Text style={{ color, fontWeight: "800", fontSize: 18, width: 72 }}>{v.value}</Text>
                  <Text style={{ color: "#4b5563", fontSize: 11, width: 36 }}>{v.unit}</Text>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Sparkline values={v.trend} flag={v.flag} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Vent params */}
          {patient!.vent && (
            <>
              <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "700",
                textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Ventilator</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {[
                  { label: "Mode",  value: patient!.vent.mode },
                  { label: "FiO₂",  value: `${patient!.vent.fio2}%` },
                  { label: "PEEP",  value: `${patient!.vent.peep} cmH₂O` },
                  { label: "TV",    value: `${patient!.vent.tv} ml` },
                  { label: "RR set",value: `${patient!.vent.rr} /min` },
                ].map(p => (
                  <View key={p.label} style={{
                    backgroundColor: "#f59e0b15", borderRadius: 10, borderWidth: 1,
                    borderColor: "#f59e0b30", paddingHorizontal: 12, paddingVertical: 8,
                    minWidth: 90, alignItems: "center",
                  }}>
                    <Text style={{ color: "#6b7280", fontSize: 10 }}>{p.label}</Text>
                    <Text style={{ color: "#f59e0b", fontWeight: "700", fontSize: 14, marginTop: 2 }}>{p.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Fluid balance */}
          <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "700",
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Fluid Balance (24h)</Text>
          <View style={{ backgroundColor: SURFACE, borderRadius: 16,
            borderWidth: 1, borderColor: BORDER, padding: 16,
            flexDirection: "row", justifyContent: "space-around" }}>
            {[
              { label: "Intake",  value: patient!.intake,  color: "#3b82f6" },
              { label: "Output",  value: patient!.output,  color: "#ef4444" },
              { label: "Balance", value: patient!.intake - patient!.output,
                color: patient!.intake - patient!.output > 0 ? "#f59e0b" : PRIMARY },
            ].map(f => (
              <View key={f.label} style={{ alignItems: "center" }}>
                <Text style={{ color: "#6b7280", fontSize: 11 }}>{f.label}</Text>
                <Text style={{ color: f.color, fontWeight: "800", fontSize: 22, marginTop: 4 }}>
                  {f.value > 0 ? "+" : ""}{f.value}
                </Text>
                <Text style={{ color: "#4b5563", fontSize: 11 }}>ml</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
