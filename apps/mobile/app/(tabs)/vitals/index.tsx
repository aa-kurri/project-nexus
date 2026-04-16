import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { Thermometer, Activity, Wind, Heart, ChevronRight } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// TODO: fetch from observations where category='vital-signs' and encounter.location_id in nurse's ward
const MOCK_VITALS_QUEUE = [
  { id: "v1", patient: "Ramesh Kumar", bed: "GA-01", lastRecorded: "08:00", overdue: true  },
  { id: "v2", patient: "Priya Sharma", bed: "GA-04", lastRecorded: "09:00", overdue: false },
  { id: "v3", patient: "Anita Verma",  bed: "ICU-01",lastRecorded: "09:30", overdue: false },
];

const VITAL_FIELDS = [
  { key: "temp",   label: "Temp",   unit: "°C",   Icon: Thermometer, placeholder: "36.8" },
  { key: "spo2",   label: "SpO₂",   unit: "%",    Icon: Activity,    placeholder: "98"   },
  { key: "rr",     label: "RR",     unit: "/min",  Icon: Wind,        placeholder: "16"   },
  { key: "hr",     label: "HR",     unit: "bpm",   Icon: Heart,       placeholder: "72"   },
];

export default function VitalsScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [values,   setValues]   = useState<Record<string, string>>({});
  const [bp,       setBp]       = useState({ sys: "", dia: "" });

  const selectedPatient = MOCK_VITALS_QUEUE.find(p => p.id === selected);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>Vitals Capture</Text>
        <Text style={{ color: "#6b7280", marginTop: 4 }}>
          Select a patient to record vitals
        </Text>
      </View>

      {/* Patient selection list */}
      <View style={{ marginHorizontal: 16, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
        {MOCK_VITALS_QUEUE.map((p, i) => (
          <Pressable
            key={p.id}
            onPress={() => { setSelected(p.id); setValues({}); setBp({ sys: "", dia: "" }); }}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: 16, paddingVertical: 14,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
              backgroundColor: selected === p.id ? `${PRIMARY}15` : "transparent",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{p.patient}</Text>
              <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                {p.bed} · Last: {p.lastRecorded}
              </Text>
            </View>
            {p.overdue && (
              <View style={{ backgroundColor: "#ef444420", borderRadius: 8,
                paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 }}>
                <Text style={{ color: "#f87171", fontSize: 11, fontWeight: "700" }}>OVERDUE</Text>
              </View>
            )}
            <ChevronRight size={14} color={selected === p.id ? PRIMARY : "#4b5563"} />
          </Pressable>
        ))}
      </View>

      {/* Capture form */}
      {selectedPatient && (
        <ScrollView
          style={{ marginTop: 16 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        >
          <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "600",
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
            Vitals for {selectedPatient.patient}
          </Text>

          {/* Standard vitals */}
          <View style={{ backgroundColor: SURFACE, borderRadius: 16,
            borderWidth: 1, borderColor: BORDER, padding: 16, gap: 12 }}>
            {VITAL_FIELDS.map(({ key, label, unit, Icon, placeholder }) => (
              <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10,
                  backgroundColor: `${PRIMARY}15`, alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={PRIMARY} />
                </View>
                <Text style={{ color: "#e5e7eb", fontWeight: "600", width: 48 }}>{label}</Text>
                <TextInput
                  style={{ flex: 1, backgroundColor: BG, borderRadius: 10,
                    borderWidth: 1, borderColor: BORDER,
                    paddingHorizontal: 14, paddingVertical: 10,
                    color: "#f9fafb", fontSize: 15, textAlign: "right" }}
                  placeholder={placeholder}
                  placeholderTextColor="#4b5563"
                  keyboardType="decimal-pad"
                  value={values[key] ?? ""}
                  onChangeText={t => setValues(prev => ({ ...prev, [key]: t }))}
                />
                <Text style={{ color: "#6b7280", fontSize: 12, width: 32 }}>{unit}</Text>
              </View>
            ))}

            {/* BP row */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10,
                backgroundColor: `${PRIMARY}15`, alignItems: "center", justifyContent: "center" }}>
                <Activity size={18} color="#ec4899" />
              </View>
              <Text style={{ color: "#e5e7eb", fontWeight: "600", width: 48 }}>BP</Text>
              <TextInput
                style={{ flex: 1, backgroundColor: BG, borderRadius: 10,
                  borderWidth: 1, borderColor: BORDER,
                  paddingHorizontal: 14, paddingVertical: 10,
                  color: "#f9fafb", fontSize: 15, textAlign: "right" }}
                placeholder="120"
                placeholderTextColor="#4b5563"
                keyboardType="number-pad"
                value={bp.sys}
                onChangeText={t => setBp(prev => ({ ...prev, sys: t }))}
              />
              <Text style={{ color: "#6b7280" }}>/</Text>
              <TextInput
                style={{ flex: 1, backgroundColor: BG, borderRadius: 10,
                  borderWidth: 1, borderColor: BORDER,
                  paddingHorizontal: 14, paddingVertical: 10,
                  color: "#f9fafb", fontSize: 15, textAlign: "right" }}
                placeholder="80"
                placeholderTextColor="#4b5563"
                keyboardType="number-pad"
                value={bp.dia}
                onChangeText={t => setBp(prev => ({ ...prev, dia: t }))}
              />
              <Text style={{ color: "#6b7280", fontSize: 12, width: 32 }}>mmHg</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => ({
              marginTop: 16, backgroundColor: PRIMARY, borderRadius: 14,
              paddingVertical: 16, alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {/* TODO: actions.saveVitals() — inserts into observations with category='vital-signs' */}
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Save Vitals</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
