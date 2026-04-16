import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
} from "react-native";
import {
  ArrowLeft, User, AlertTriangle, Pill, ClipboardList, ChevronRight,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";
const DANGER  = "#ef4444";

// ─── Mock types & data ───────────────────────────────────────────────────────

interface Encounter {
  id: string;
  date: string;
  class: string;
  reason: string | null;
  status: string;
  doctor: string;
}

interface Medication {
  id: string;
  drug_name: string;
  strength: string | null;
  dosage: string | null;
  route: string | null;
  status: string;
}

interface Allergy {
  id: string;
  substance: string;
  reaction: string | null;
  severity: string | null;
}

interface PatientDetail {
  id: string;
  mrn: string;
  full_name: string;
  age: number;
  gender: string;
  phone: string;
  primary_dx: string;
  encounters: Encounter[];
  medications: Medication[];
  allergies: Allergy[];
}

// TODO: replace with fetchPatientChart(id) from actions.ts
const MOCK: Record<string, PatientDetail> = {
  "pt-1001": {
    id: "pt-1001", mrn: "MRN-1001", full_name: "Ramesh Kumar",
    age: 54, gender: "Male", phone: "+91 98765 43210",
    primary_dx: "Type 2 Diabetes Mellitus",
    encounters: [
      { id: "enc-1", date: "2026-04-10", class: "OPD", reason: "Routine diabetes review", status: "finished", doctor: "Dr. Sharma" },
      { id: "enc-2", date: "2026-03-15", class: "OPD", reason: "BP monitoring, foot exam",  status: "finished", doctor: "Dr. Sharma" },
      { id: "enc-3", date: "2026-02-01", class: "OPD", reason: "HbA1c follow-up",           status: "finished", doctor: "Dr. Mehta" },
    ],
    medications: [
      { id: "rx-1", drug_name: "Metformin",    strength: "500 mg",  dosage: "1 tab BD", route: "oral", status: "active" },
      { id: "rx-2", drug_name: "Glimepiride",  strength: "2 mg",    dosage: "1 tab OD before breakfast", route: "oral", status: "active" },
      { id: "rx-3", drug_name: "Aspirin",      strength: "75 mg",   dosage: "1 tab OD", route: "oral", status: "active" },
    ],
    allergies: [
      { id: "al-1", substance: "Penicillin",  reaction: "Anaphylaxis", severity: "severe" },
      { id: "al-2", substance: "Sulfa drugs", reaction: "Rash",        severity: "moderate" },
    ],
  },
  "pt-1002": {
    id: "pt-1002", mrn: "MRN-1002", full_name: "Priya Sharma",
    age: 32, gender: "Female", phone: "+91 87654 32109",
    primary_dx: "Essential Hypertension",
    encounters: [
      { id: "enc-4", date: "2026-04-08", class: "OPD", reason: "BP check, medication review", status: "finished", doctor: "Dr. Sharma" },
      { id: "enc-5", date: "2026-03-10", class: "OPD", reason: "Headache, elevated BP",        status: "finished", doctor: "Dr. Sharma" },
      { id: "enc-6", date: "2026-01-20", class: "OPD", reason: "Annual check-up",              status: "finished", doctor: "Dr. Mehta" },
    ],
    medications: [
      { id: "rx-4", drug_name: "Amlodipine",   strength: "5 mg",  dosage: "1 tab OD",  route: "oral", status: "active" },
      { id: "rx-5", drug_name: "Telmisartan",  strength: "40 mg", dosage: "1 tab OD",  route: "oral", status: "active" },
    ],
    allergies: [],
  },
};

// ─── Severity color ───────────────────────────────────────────────────────────

function severityColor(s: string | null): string {
  switch (s?.toLowerCase()) {
    case "severe":   return "#ef4444";
    case "moderate": return "#f59e0b";
    case "mild":     return "#22c55e";
    default:         return "#6b7280";
  }
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8,
      marginHorizontal: 16, marginTop: 24, marginBottom: 8 }}>
      {icon}
      <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "700",
        textTransform: "uppercase", letterSpacing: 0.8 }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PatientChartScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  // TODO: replace with useSWR / React Query calling fetchPatientChart(id)
  const patient = MOCK[id ?? ""] ?? null;

  if (!patient) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={PRIMARY} />
        {/* TODO: show error state when fetchPatientChart rejects */}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ── Top bar ── */}
      <View style={{
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20,
        backgroundColor: PRIMARY,
        flexDirection: "row", alignItems: "flex-start",
      }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginRight: 14, marginTop: 2, opacity: pressed ? 0.7 : 1,
          })}
        >
          <ArrowLeft size={20} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
            {patient.full_name}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }}>
            {patient.mrn} · {patient.age} y · {patient.gender}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 1 }}>
            {patient.primary_dx}
          </Text>
        </View>
      </View>

      {/* ── Allergies banner (if any) ── */}
      {patient.allergies.length > 0 && (
        <View style={{
          marginHorizontal: 16, marginTop: 16, borderRadius: 14,
          backgroundColor: `${DANGER}15`, borderWidth: 1, borderColor: `${DANGER}40`,
          padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10,
        }}>
          <AlertTriangle size={18} color={DANGER} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: DANGER, fontWeight: "700", fontSize: 13, marginBottom: 4 }}>
              Known Allergies
            </Text>
            {patient.allergies.map(al => (
              <View key={al.id} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: severityColor(al.severity),
                }} />
                <Text style={{ color: "#fca5a5", fontSize: 13 }}>
                  {al.substance}
                  {al.reaction ? ` — ${al.reaction}` : ""}
                  {al.severity ? ` (${al.severity})` : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Last 3 Encounters ── */}
      <SectionHeader
        icon={<ClipboardList size={14} color="#9ca3af" />}
        label="Last 3 Encounters"
      />
      <View style={{
        marginHorizontal: 16, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
        overflow: "hidden",
      }}>
        {patient.encounters.length === 0 ? (
          <Text style={{ color: "#4b5563", padding: 16, fontStyle: "italic" }}>
            No encounters recorded.
          </Text>
        ) : patient.encounters.slice(0, 3).map((enc, i) => (
          <Pressable
            key={enc.id}
            style={({ pressed }) => ({
              paddingHorizontal: 16, paddingVertical: 14,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
              flexDirection: "row", alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
            onPress={() => {
              // TODO: navigate to encounter detail / SOAP note screen
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{
                  borderRadius: 6, backgroundColor: `${PRIMARY}20`,
                  paddingHorizontal: 8, paddingVertical: 2,
                }}>
                  <Text style={{ color: PRIMARY, fontSize: 10, fontWeight: "700" }}>
                    {enc.class}
                  </Text>
                </View>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>{enc.date}</Text>
              </View>
              <Text style={{ color: "#f9fafb", fontWeight: "600", marginTop: 4, fontSize: 14 }}>
                {enc.reason ?? "No reason recorded"}
              </Text>
              <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                {enc.doctor}
              </Text>
            </View>
            <ChevronRight size={14} color="#4b5563" />
          </Pressable>
        ))}
      </View>

      {/* ── Active Medications ── */}
      <SectionHeader
        icon={<Pill size={14} color="#9ca3af" />}
        label="Active Medications"
      />
      <View style={{
        marginHorizontal: 16, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
        overflow: "hidden",
      }}>
        {patient.medications.filter(m => m.status === "active").length === 0 ? (
          <Text style={{ color: "#4b5563", padding: 16, fontStyle: "italic" }}>
            No active medications.
          </Text>
        ) : patient.medications
            .filter(m => m.status === "active")
            .map((med, i) => (
              <View
                key={med.id}
                style={{
                  paddingHorizontal: 16, paddingVertical: 13,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                  flexDirection: "row", alignItems: "center",
                }}
              >
                <View style={{
                  width: 38, height: 38, borderRadius: 10,
                  backgroundColor: `${PRIMARY}15`,
                  alignItems: "center", justifyContent: "center", marginRight: 12,
                }}>
                  <Pill size={16} color={PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f9fafb", fontWeight: "600" }}>
                    {med.drug_name}
                    {med.strength ? ` ${med.strength}` : ""}
                  </Text>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                    {[med.dosage, med.route].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: "#059669",
                }} />
              </View>
            ))}
      </View>

      {/* ── Allergy detail section (no-banner fallback) ── */}
      {patient.allergies.length === 0 && (
        <>
          <SectionHeader
            icon={<AlertTriangle size={14} color="#9ca3af" />}
            label="Allergies"
          />
          <View style={{
            marginHorizontal: 16, borderRadius: 14,
            backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
            padding: 16,
          }}>
            <Text style={{ color: "#4b5563", fontStyle: "italic" }}>
              No known allergies on record.
            </Text>
          </View>
        </>
      )}

      {/* ── Quick actions ── */}
      <View style={{
        marginHorizontal: 16, marginTop: 24,
        flexDirection: "row", gap: 10,
      }}>
        <Pressable
          style={({ pressed }) => ({
            flex: 1, backgroundColor: PRIMARY, borderRadius: 14,
            paddingVertical: 14, alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
          onPress={() => router.push("/scribe")}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
            Start Scribe
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => ({
            flex: 1, backgroundColor: SURFACE, borderRadius: 14,
            paddingVertical: 14, alignItems: "center",
            borderWidth: 1, borderColor: BORDER,
            opacity: pressed ? 0.8 : 1,
          })}
          onPress={() => router.push("/rx")}
        >
          <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 14 }}>
            New Rx
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
