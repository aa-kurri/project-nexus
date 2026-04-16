import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { Search, ChevronRight } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// TODO: fetch from profiles where tenant_id = jwt_tenant() via actions.getStaffList()
const MOCK_STAFF = [
  { id: "s1", name: "Dr. Anita Mehta",    role: "Doctor",     dept: "Cardiology",  status: "on_duty" },
  { id: "s2", name: "Ravi Nair",          role: "Nurse",      dept: "ICU",         status: "on_duty" },
  { id: "s3", name: "Sunita Desai",       role: "Pharmacist", dept: "Pharmacy",    status: "off_duty" },
  { id: "s4", name: "Dr. Kiran Patel",    role: "Doctor",     dept: "Orthopedics", status: "on_duty" },
  { id: "s5", name: "Meena Rao",          role: "Lab Manager",dept: "Pathology",   status: "on_duty" },
];

const ROLE_COLOR: Record<string, string> = {
  Doctor: PRIMARY, Nurse: "#6366f1", Pharmacist: "#f59e0b",
  "Lab Manager": "#ec4899", Admin: "#8b5cf6",
};

export default function StaffScreen() {
  const [query, setQuery] = useState("");
  const filtered = MOCK_STAFF.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.role.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>Staff Directory</Text>
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
          placeholder="Search staff…"
          placeholderTextColor="#4b5563"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ marginHorizontal: 16, borderRadius: 16,
          backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
          {filtered.map((s, i) => {
            const color = ROLE_COLOR[s.role] ?? "#6b7280";
            return (
              <Pressable
                key={s.id}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {/* TODO: navigate to staff detail / shift assignment */}
                <View style={{ width: 42, height: 42, borderRadius: 21,
                  backgroundColor: `${color}20`, alignItems: "center",
                  justifyContent: "center", marginRight: 12 }}>
                  <Text style={{ color, fontWeight: "700" }}>
                    {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{s.name}</Text>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                    {s.role} · {s.dept}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4,
                    backgroundColor: s.status === "on_duty" ? "#059669" : "#6b7280" }} />
                  <ChevronRight size={14} color="#4b5563" />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
