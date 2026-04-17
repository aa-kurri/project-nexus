import { View, Text, ScrollView, Pressable } from "react-native";
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ChevronDown } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type Conformance = "compliant" | "partial" | "non_compliant" | "not_assessed";

const CONF_CFG: Record<Conformance, { label: string; color: string; short: string; Icon: any }> = {
  compliant:     { label: "Compliant",     color: PRIMARY,   short: "C",  Icon: CheckCircle2 },
  partial:       { label: "Partial",       color: "#f59e0b", short: "PC", Icon: AlertTriangle },
  non_compliant: { label: "Non-Compliant", color: "#ef4444", short: "NC", Icon: XCircle      },
  not_assessed:  { label: "Not Assessed",  color: "#6b7280", short: "NA", Icon: AlertTriangle },
};

interface NabhChapter {
  code: string; title: string; weight: number;
  oes: { id: string; text: string; status: Conformance }[];
}

const CHAPTERS: NabhChapter[] = [
  { code: "AAC", title: "Access, Assessment & Continuity of Care", weight: 100, oes: [
    { id: "AAC-1", text: "Patient registration & triage process", status: "compliant"    },
    { id: "AAC-2", text: "Patient assessment within defined time", status: "partial"     },
    { id: "AAC-3", text: "Continuity of care documented",          status: "compliant"   },
  ]},
  { code: "COP", title: "Care of Patients", weight: 100, oes: [
    { id: "COP-1", text: "Care plan for high-risk patients",       status: "partial"      },
    { id: "COP-2", text: "Pain assessment & management",           status: "compliant"    },
    { id: "COP-3", text: "End-of-life care protocol",              status: "not_assessed" },
  ]},
  { code: "MOM", title: "Medication Orders & Management", weight: 100, oes: [
    { id: "MOM-1", text: "Drug storage and labelling",            status: "compliant"    },
    { id: "MOM-2", text: "High-alert drug policy",                status: "compliant"    },
    { id: "MOM-3", text: "MAR maintained for all inpatients",     status: "partial"      },
  ]},
  { code: "PRE", title: "Patient Rights & Education", weight: 50, oes: [
    { id: "PRE-1", text: "Consent process documented",            status: "compliant"    },
    { id: "PRE-2", text: "Patient education given at discharge",  status: "partial"      },
  ]},
  { code: "HIC", title: "Hospital Infection Control", weight: 100, oes: [
    { id: "HIC-1", text: "Hand hygiene audit ≥90%",               status: "non_compliant"},
    { id: "HIC-2", text: "HAI surveillance & reporting",          status: "partial"      },
    { id: "HIC-3", text: "Antibiogram published quarterly",       status: "compliant"    },
  ]},
];

function chapterScore(ch: NabhChapter): number {
  const map: Record<Conformance, number> = { compliant: 100, partial: 50, non_compliant: 0, not_assessed: 0 };
  return Math.round(ch.oes.reduce((s, oe) => s + map[oe.status], 0) / ch.oes.length);
}

export default function NabhScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const overallScore = Math.round(
    CHAPTERS.reduce((s, ch) => s + chapterScore(ch) * ch.weight, 0) /
    CHAPTERS.reduce((s, ch) => s + ch.weight, 0)
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Compliance
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          NABH Score Card
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Overall score */}
        <View style={{ backgroundColor: SURFACE, borderRadius: 20, borderWidth: 1,
          borderColor: `${PRIMARY}40`, padding: 20, marginBottom: 16, alignItems: "center" }}>
          <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "700",
            textTransform: "uppercase", letterSpacing: 0.5 }}>Overall Compliance Score</Text>
          <Text style={{ color: PRIMARY, fontSize: 56, fontWeight: "900", marginTop: 4 }}>
            {overallScore}%
          </Text>
          <View style={{ width: "100%", height: 8, backgroundColor: "#1e2332",
            borderRadius: 4, marginTop: 12, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${overallScore}%`,
              backgroundColor: overallScore >= 80 ? PRIMARY : overallScore >= 60 ? "#f59e0b" : "#ef4444",
              borderRadius: 4 }} />
          </View>
          <Text style={{ color: "#4b5563", fontSize: 12, marginTop: 8 }}>
            {overallScore >= 80 ? "On track for NABH accreditation" : "Improvements needed before survey"}
          </Text>
        </View>

        {/* Legend */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {(["compliant","partial","non_compliant","not_assessed"] as Conformance[]).map(c => {
            const cfg = CONF_CFG[c];
            return (
              <View key={c} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 16, height: 16, borderRadius: 3,
                  backgroundColor: `${cfg.color}20`, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: cfg.color, fontSize: 7, fontWeight: "800" }}>{cfg.short}</Text>
                </View>
                <Text style={{ color: "#4b5563", fontSize: 11 }}>{cfg.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Chapter accordions */}
        {CHAPTERS.map(ch => {
          const score   = chapterScore(ch);
          const isOpen  = expanded === ch.code;
          const nonComp = ch.oes.filter(oe => oe.status === "non_compliant").length;
          return (
            <View key={ch.code} style={{ backgroundColor: SURFACE, borderRadius: 16,
              borderWidth: 1, borderColor: nonComp > 0 ? "#ef444430" : BORDER,
              marginBottom: 8, overflow: "hidden" }}>
              <Pressable onPress={() => setExpanded(isOpen ? null : ch.code)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", padding: 14,
                  opacity: pressed ? 0.7 : 1,
                })}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ backgroundColor: `${PRIMARY}20`, borderRadius: 5,
                      paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: PRIMARY, fontSize: 10, fontWeight: "800" }}>{ch.code}</Text>
                    </View>
                    {nonComp > 0 && (
                      <View style={{ backgroundColor: "#ef444420", borderRadius: 5,
                        paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: "#ef4444", fontSize: 9, fontWeight: "800" }}>
                          {nonComp} NC
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: "#e5e7eb", fontWeight: "600", fontSize: 13, marginTop: 4 }}>
                    {ch.title}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4, marginLeft: 10 }}>
                  <Text style={{ color: score >= 80 ? PRIMARY : score >= 50 ? "#f59e0b" : "#ef4444",
                    fontWeight: "800", fontSize: 20 }}>{score}%</Text>
                </View>
                <ChevronDown size={16} color="#374151"
                  style={{ marginLeft: 8, transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }} />
              </Pressable>

              {isOpen && (
                <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 8 }}>
                  {ch.oes.map(oe => {
                    const cfg = CONF_CFG[oe.status];
                    return (
                      <View key={oe.id} style={{
                        flexDirection: "row", alignItems: "center", gap: 10,
                        paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER,
                      }}>
                        <cfg.Icon size={16} color={cfg.color} />
                        <Text style={{ flex: 1, color: "#9ca3af", fontSize: 12 }}>{oe.text}</Text>
                        <View style={{ backgroundColor: `${cfg.color}20`, borderRadius: 6,
                          paddingHorizontal: 7, paddingVertical: 2 }}>
                          <Text style={{ color: cfg.color, fontSize: 9, fontWeight: "700" }}>
                            {cfg.short}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
