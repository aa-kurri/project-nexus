import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Pill, AlertTriangle, CheckCircle2, Clock, ChevronRight, ShieldAlert } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type AdminStatus = "due" | "given" | "missed" | "held";

interface MarDrug {
  id: string;
  name: string;
  dose: string;
  route: string;
  time: string;
  status: AdminStatus;
  highAlert?: boolean;
  schedule?: "H" | "H1" | "X";
  givenBy?: string;
}

interface MarPatient {
  id: string;
  name: string;
  bed: string;
  uhid: string;
  drugs: MarDrug[];
}

const STATUS_CFG: Record<AdminStatus, { label: string; color: string; bg: string }> = {
  due:    { label: "Due",    color: "#f59e0b", bg: "#f59e0b20" },
  given:  { label: "Given",  color: PRIMARY,   bg: `${PRIMARY}20` },
  missed: { label: "Missed", color: "#ef4444", bg: "#ef444420" },
  held:   { label: "Held",   color: "#6b7280", bg: "#6b728020" },
};

const PATIENTS: MarPatient[] = [
  {
    id: "p1", name: "Ramesh Kumar", bed: "GA-01", uhid: "AY-00412",
    drugs: [
      { id: "d1", name: "Amoxicillin", dose: "500 mg", route: "Oral", time: "08:00", status: "given", givenBy: "Nurse Ravi" },
      { id: "d2", name: "Metformin",   dose: "850 mg", route: "Oral", time: "12:00", status: "due" },
      { id: "d3", name: "Heparin",     dose: "5000 IU", route: "SC",  time: "14:00", status: "due", highAlert: true },
    ],
  },
  {
    id: "p2", name: "Sunita Sharma", bed: "ICU-02", uhid: "AY-00389",
    drugs: [
      { id: "d4", name: "Noradrenaline", dose: "0.1 mcg/kg/min", route: "IV",   time: "Continuous", status: "given", highAlert: true },
      { id: "d5", name: "Midazolam",     dose: "2 mg",           route: "IV",   time: "10:00",      status: "missed", highAlert: true, schedule: "X" },
      { id: "d6", name: "Pantoprazole",  dose: "40 mg",          route: "IV",   time: "06:00",      status: "given", givenBy: "Nurse Anita" },
    ],
  },
  {
    id: "p3", name: "George Mathew", bed: "SP-04", uhid: "AY-00345",
    drugs: [
      { id: "d7", name: "Cefuroxime", dose: "1.5 g", route: "IV",   time: "08:00", status: "given", givenBy: "Nurse Priya" },
      { id: "d8", name: "Tramadol",   dose: "50 mg", route: "Oral", time: "14:00", status: "due",   schedule: "H" },
    ],
  },
];

export default function MarScreen() {
  const [selected,  setSelected]  = useState<string | null>(null);
  const [giving,    setGiving]    = useState<string | null>(null);
  const [localDrugs, setLocal]    = useState<Record<string, AdminStatus>>({});

  const patient = PATIENTS.find(p => p.id === selected);
  const missedCount = PATIENTS.flatMap(p => p.drugs).filter(d => d.status === "missed").length;

  function markGiven(drugId: string) {
    setGiving(drugId);
    setTimeout(() => {
      setLocal(prev => ({ ...prev, [drugId]: "given" }));
      setGiving(null);
    }, 900);
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Medication Administration
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          MAR — Today
        </Text>
        {missedCount > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8,
            backgroundColor: "#ef444430", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
            alignSelf: "flex-start" }}>
            <AlertTriangle size={13} color="#f87171" />
            <Text style={{ color: "#f87171", fontSize: 12, fontWeight: "700" }}>
              {missedCount} missed dose{missedCount > 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Patient list */}
      {!selected ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {PATIENTS.map(p => {
            const missed = p.drugs.filter(d => (localDrugs[d.id] ?? d.status) === "missed").length;
            const due    = p.drugs.filter(d => (localDrugs[d.id] ?? d.status) === "due").length;
            return (
              <Pressable key={p.id} onPress={() => setSelected(p.id)}
                style={({ pressed }) => ({
                  backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: BORDER,
                  padding: 16, opacity: pressed ? 0.7 : 1,
                  flexDirection: "row", alignItems: "center", gap: 12,
                })}>
                <View style={{ width: 40, height: 40, borderRadius: 12,
                  backgroundColor: `${PRIMARY}20`, alignItems: "center", justifyContent: "center" }}>
                  <Pill size={20} color={PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 15 }}>{p.name}</Text>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                    {p.bed} · {p.uhid} · {p.drugs.length} meds
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  {missed > 0 && (
                    <View style={{ backgroundColor: "#ef444420", borderRadius: 6,
                      paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: "#f87171", fontSize: 11, fontWeight: "700" }}>
                        {missed} missed
                      </Text>
                    </View>
                  )}
                  {due > 0 && (
                    <View style={{ backgroundColor: "#f59e0b20", borderRadius: 6,
                      paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: "#f59e0b", fontSize: 11, fontWeight: "700" }}>
                        {due} due
                      </Text>
                    </View>
                  )}
                </View>
                <ChevronRight size={16} color="#374151" />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Pressable onPress={() => setSelected(null)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <ChevronRight size={14} color="#6b7280" style={{ transform: [{ rotate: "180deg" }] }} />
            <Text style={{ color: "#6b7280", fontSize: 13 }}>Back to patients</Text>
          </Pressable>

          <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "700" }}>{patient!.name}</Text>
          <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 16 }}>
            {patient!.bed} · {patient!.uhid}
          </Text>

          <View style={{ backgroundColor: SURFACE, borderRadius: 16,
            borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
            {patient!.drugs.map((drug, i) => {
              const status = (localDrugs[drug.id] ?? drug.status) as AdminStatus;
              const cfg    = STATUS_CFG[status];
              const isGiving = giving === drug.id;
              return (
                <View key={drug.id} style={{
                  padding: 16, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 14 }}>{drug.name}</Text>
                        {drug.highAlert && (
                          <View style={{ backgroundColor: "#ef444420", borderRadius: 4,
                            paddingHorizontal: 5, paddingVertical: 1 }}>
                            <Text style={{ color: "#f87171", fontSize: 9, fontWeight: "800" }}>HIGH ALERT</Text>
                          </View>
                        )}
                        {drug.schedule && (
                          <View style={{ backgroundColor: "#a78bfa20", borderRadius: 4,
                            paddingHorizontal: 5, paddingVertical: 1 }}>
                            <Text style={{ color: "#a78bfa", fontSize: 9, fontWeight: "800" }}>
                              Sch-{drug.schedule}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 3 }}>
                        {drug.dose} · {drug.route}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <Clock size={11} color="#6b7280" />
                        <Text style={{ color: "#6b7280", fontSize: 11 }}>{drug.time}</Text>
                        {drug.givenBy && (
                          <Text style={{ color: "#4b5563", fontSize: 11 }}>· by {drug.givenBy}</Text>
                        )}
                      </View>
                    </View>

                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <View style={{ backgroundColor: cfg.bg, borderRadius: 8,
                        paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: cfg.color, fontSize: 11, fontWeight: "700" }}>{cfg.label}</Text>
                      </View>
                      {status === "due" && (
                        <Pressable onPress={() => markGiven(drug.id)} disabled={isGiving}
                          style={({ pressed }) => ({
                            backgroundColor: PRIMARY, borderRadius: 10,
                            paddingHorizontal: 12, paddingVertical: 6,
                            opacity: pressed || isGiving ? 0.7 : 1,
                            flexDirection: "row", alignItems: "center", gap: 4,
                          })}>
                          {isGiving
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <CheckCircle2 size={13} color="#fff" />}
                          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                            {isGiving ? "Saving…" : "Mark Given"}
                          </Text>
                        </Pressable>
                      )}
                    </View>
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
