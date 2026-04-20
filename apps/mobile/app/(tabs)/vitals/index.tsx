import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Thermometer, Activity, Wind, Heart, AlertCircle, RefreshCw } from "lucide-react-native";
import { useAuthStore } from "../../../store/authStore";
import { fetchVitalsQueue, saveVitals, type VitalsQueueItem } from "./actions";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

const VITAL_FIELDS = [
  { key: "temp",  label: "Temp",  unit: "°C",   Icon: Thermometer, placeholder: "36.8" },
  { key: "spo2",  label: "SpO₂",  unit: "%",    Icon: Activity,    placeholder: "98"   },
  { key: "rr",    label: "RR",    unit: "/min",  Icon: Wind,        placeholder: "16"   },
  { key: "hr",    label: "HR",    unit: "bpm",   Icon: Heart,       placeholder: "72"   },
  { key: "pain",  label: "Pain",  unit: "0-10",  Icon: AlertCircle, placeholder: "0"    },
] as const;

function timeAgo(iso: string | null): string {
  if (!iso) return "Never recorded";
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  return h < 1 ? "< 1 h ago" : `${h}h ago`;
}

export default function VitalsScreen() {
  const { profile } = useAuthStore();

  const [queue,      setQueue]      = useState<VitalsQueueItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected,   setSelected]   = useState<VitalsQueueItem | null>(null);
  const [values,     setValues]     = useState<Record<string, string>>({});
  const [bp,         setBp]         = useState({ sys: "", dia: "" });
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async (soft = false) => {
    if (!profile) return;
    soft ? setRefreshing(true) : setLoading(true);
    try {
      const data = await fetchVitalsQueue(profile.tenant_id);
      setQueue(data);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!selected) return;
    const hasAny = Object.values(values).some(v => v.trim() !== "") || bp.sys || bp.dia;
    if (!hasAny) { Alert.alert("No data", "Enter at least one vital value"); return; }

    setSaving(true);
    try {
      await saveVitals({
        patientId: selected.patient_id,
        temp:  values.temp  ? parseFloat(values.temp)  : undefined,
        spo2:  values.spo2  ? parseFloat(values.spo2)  : undefined,
        rr:    values.rr    ? parseFloat(values.rr)    : undefined,
        hr:    values.hr    ? parseFloat(values.hr)    : undefined,
        pain:  values.pain  ? parseFloat(values.pain)  : undefined,
        sysBp: bp.sys       ? parseFloat(bp.sys)       : undefined,
        diaBp: bp.dia       ? parseFloat(bp.dia)       : undefined,
      });
      Alert.alert("✓ Saved", `Vitals recorded for ${selected.patient_name}`);
      setSelected(null);
      setValues({});
      setBp({ sys: "", dia: "" });
      load(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>Vitals Capture</Text>
        <Text style={{ color: "#6b7280", marginTop: 4 }}>
          {queue.filter(p => p.overdue).length} patients overdue · tap to record
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={PRIMARY} />}
      >
        {/* Patient list */}
        <View style={{ marginHorizontal: 16, borderRadius: 16,
          backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
          {queue.length === 0 && (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: "#4b5563" }}>No admitted patients</Text>
            </View>
          )}
          {queue.map((p, i) => (
            <Pressable
              key={p.patient_id}
              onPress={() => { setSelected(p); setValues({}); setBp({ sys: "", dia: "" }); }}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                backgroundColor: selected?.patient_id === p.patient_id ? `${PRIMARY}15` : "transparent",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{p.patient_name}</Text>
                <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                  {p.bed_label} · {timeAgo(p.last_recorded)}
                </Text>
              </View>
              {p.overdue && (
                <View style={{ backgroundColor: "#ef444420", borderRadius: 8,
                  paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: "#f87171", fontSize: 11, fontWeight: "700" }}>OVERDUE</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Capture form */}
        {selected && (
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "600",
              textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
              Recording for {selected.patient_name}
            </Text>

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

              {/* BP */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10,
                  backgroundColor: "#ec489920", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={18} color="#ec4899" />
                </View>
                <Text style={{ color: "#e5e7eb", fontWeight: "600", width: 48 }}>BP</Text>
                <TextInput
                  style={{ flex: 1, backgroundColor: BG, borderRadius: 10,
                    borderWidth: 1, borderColor: BORDER,
                    paddingHorizontal: 14, paddingVertical: 10,
                    color: "#f9fafb", fontSize: 15, textAlign: "right" }}
                  placeholder="120" placeholderTextColor="#4b5563"
                  keyboardType="number-pad" value={bp.sys}
                  onChangeText={t => setBp(prev => ({ ...prev, sys: t }))}
                />
                <Text style={{ color: "#6b7280" }}>/</Text>
                <TextInput
                  style={{ flex: 1, backgroundColor: BG, borderRadius: 10,
                    borderWidth: 1, borderColor: BORDER,
                    paddingHorizontal: 14, paddingVertical: 10,
                    color: "#f9fafb", fontSize: 15, textAlign: "right" }}
                  placeholder="80" placeholderTextColor="#4b5563"
                  keyboardType="number-pad" value={bp.dia}
                  onChangeText={t => setBp(prev => ({ ...prev, dia: t }))}
                />
                <Text style={{ color: "#6b7280", fontSize: 12, width: 32 }}>mmHg</Text>
              </View>
            </View>

            <Pressable
              disabled={saving}
              onPress={handleSave}
              style={({ pressed }) => ({
                marginTop: 16, backgroundColor: PRIMARY, borderRadius: 14,
                paddingVertical: 16, alignItems: "center",
                opacity: pressed ? 0.8 : saving ? 0.6 : 1,
                flexDirection: "row", justifyContent: "center", gap: 8,
              })}
            >
              {saving && <ActivityIndicator color="#fff" size="small" />}
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                {saving ? "Saving…" : "Save Vitals"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
