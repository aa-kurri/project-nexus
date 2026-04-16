import { View, Text, ScrollView, TextInput, Pressable } from "react-native";
import { Search, ChevronRight } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// TODO: fetch from patients table filtered by encounters.doctor_id = auth.uid()
const MOCK_PATIENTS = [
  { mrn: "MRN-1001", name: "Ramesh Kumar",  age: 54, dx: "T2 Diabetes" },
  { mrn: "MRN-1002", name: "Priya Sharma",  age: 32, dx: "Hypertension" },
  { mrn: "MRN-1003", name: "Anita Verma",   age: 67, dx: "Osteoarthritis" },
  { mrn: "MRN-1004", name: "Suresh Patel",  age: 45, dx: "GERD" },
];

export default function PatientsScreen() {
  const [query, setQuery] = useState("");
  const filtered = MOCK_PATIENTS.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.mrn.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>My Patients</Text>
      </View>

      {/* Search */}
      <View style={{ marginHorizontal: 16, marginBottom: 12,
        flexDirection: "row", alignItems: "center",
        backgroundColor: SURFACE, borderRadius: 12,
        borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14 }}>
        <Search size={16} color="#6b7280" />
        <TextInput
          style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10,
            color: "#f9fafb", fontSize: 15 }}
          placeholder="Search by name or MRN…"
          placeholderTextColor="#4b5563"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ marginHorizontal: 16, borderRadius: 16,
          backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
          {filtered.map((p, i) => (
            <Pressable
              key={p.mrn}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {/* TODO: navigate to patient detail / encounter screen */}
              <View style={{ width: 42, height: 42, borderRadius: 21,
                backgroundColor: `${PRIMARY}25`, alignItems: "center",
                justifyContent: "center", marginRight: 12 }}>
                <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 14 }}>
                  {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{p.name}</Text>
                <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                  {p.mrn} · {p.age}y · {p.dx}
                </Text>
              </View>
              <ChevronRight size={16} color="#4b5563" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
