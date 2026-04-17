import { View, Text, ScrollView, Pressable } from "react-native";
import { FlaskConical, AlertTriangle } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type Susc = "S" | "I" | "R" | "ND";

const SUSC_CFG: Record<Susc, { color: string; bg: string }> = {
  S:  { color: PRIMARY,   bg: `${PRIMARY}30` },
  I:  { color: "#f59e0b", bg: "#f59e0b30"    },
  R:  { color: "#ef4444", bg: "#ef444430"    },
  ND: { color: "#374151", bg: "#37415130"    },
};

const ANTIBIOTICS = ["AMC", "CIP", "GEN", "MEM", "PIP", "VAN"];

const ANTIBIOTIC_FULL: Record<string, string> = {
  AMC: "Amoxicillin-Clav", CIP: "Ciprofloxacin",
  GEN: "Gentamicin",       MEM: "Meropenem",
  PIP: "Pip-Tazobactam",   VAN: "Vancomycin",
};

interface OrgRow {
  organism: string; short: string; n: number;
  data: Record<string, Susc>;
}

const ORGANISMS: OrgRow[] = [
  { organism: "E. coli",              short: "E.coli",  n: 142, data: { AMC:"R", CIP:"R", GEN:"I", MEM:"S", PIP:"S", VAN:"ND" } },
  { organism: "K. pneumoniae",        short: "K.pneu",  n: 89,  data: { AMC:"R", CIP:"I", GEN:"R", MEM:"S", PIP:"I", VAN:"ND" } },
  { organism: "S. aureus (MRSA)",     short: "MRSA",    n: 44,  data: { AMC:"R", CIP:"R", GEN:"R", MEM:"ND",PIP:"R", VAN:"S"  } },
  { organism: "P. aeruginosa",        short: "P.aer",   n: 38,  data: { AMC:"R", CIP:"S", GEN:"S", MEM:"S", PIP:"S", VAN:"ND" } },
  { organism: "Acinetobacter spp.",   short: "Acin.",   n: 27,  data: { AMC:"R", CIP:"R", GEN:"R", MEM:"I", PIP:"R", VAN:"ND" } },
  { organism: "E. faecalis",          short: "E.fae",   n: 31,  data: { AMC:"S", CIP:"I", GEN:"S", MEM:"ND",PIP:"ND",VAN:"S"  } },
];

export default function AntibiogramScreen() {
  const [highlightR, setHighlightR] = useState(false);
  const [selected,   setSelected]   = useState<string | null>(null);

  const selOrg = ORGANISMS.find(o => o.organism === selected);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          LIMS · Microbiology
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>Antibiogram</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 3 }}>
          Apr 2026 · {ORGANISMS.reduce((s,o) => s + o.n, 0)} isolates
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row",
        alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: "#6b7280", fontSize: 12 }}>Tap organism for detail</Text>
        <Pressable onPress={() => setHighlightR(!highlightR)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: highlightR ? "#ef444420" : SURFACE,
            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
            borderWidth: 1, borderColor: highlightR ? "#ef444440" : BORDER }}>
          <AlertTriangle size={13} color={highlightR ? "#ef4444" : "#6b7280"} />
          <Text style={{ color: highlightR ? "#ef4444" : "#6b7280", fontSize: 12, fontWeight: "700" }}>
            Highlight R
          </Text>
        </Pressable>
      </View>

      <ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 16 }}>
            {/* Header row */}
            <View style={{ flexDirection: "row", marginBottom: 6 }}>
              <View style={{ width: 120 }} />
              <Text style={{ color: "#4b5563", fontSize: 9, width: 24, textAlign: "center" }}>n</Text>
              {ANTIBIOTICS.map(ab => (
                <Text key={ab} style={{ color: "#6b7280", fontSize: 9, width: 42, textAlign: "center",
                  fontWeight: "700" }}>{ab}</Text>
              ))}
            </View>

            {ORGANISMS.map((org, i) => (
              <Pressable key={org.organism} onPress={() => setSelected(selected === org.organism ? null : org.organism)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center",
                  paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                  backgroundColor: selected === org.organism ? `${PRIMARY}10` : "transparent",
                  opacity: pressed ? 0.7 : 1,
                })}>
                <Text style={{ color: "#e5e7eb", fontWeight: "600", fontSize: 12, width: 120 }}
                  numberOfLines={1}>{org.organism}</Text>
                <Text style={{ color: "#4b5563", fontSize: 11, width: 24, textAlign: "center" }}>{org.n}</Text>
                {ANTIBIOTICS.map(ab => {
                  const susc = org.data[ab] as Susc;
                  const cfg  = SUSC_CFG[susc];
                  const dim  = highlightR && susc !== "R";
                  return (
                    <View key={ab} style={{ width: 42, alignItems: "center" }}>
                      <View style={{ width: 28, height: 22, borderRadius: 5,
                        backgroundColor: dim ? "#1e233260" : cfg.bg,
                        alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: dim ? "#374151" : cfg.color,
                          fontSize: 10, fontWeight: "800" }}>{susc}</Text>
                      </View>
                    </View>
                  );
                })}
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Legend */}
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 12, marginBottom: 8 }}>
          {(["S","I","R","ND"] as Susc[]).map(s => (
            <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: SUSC_CFG[s].bg,
                alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: SUSC_CFG[s].color, fontSize: 8, fontWeight: "800" }}>{s}</Text>
              </View>
              <Text style={{ color: "#4b5563", fontSize: 11 }}>
                {s === "S" ? "Sensitive" : s === "I" ? "Intermediate" : s === "R" ? "Resistant" : "No data"}
              </Text>
            </View>
          ))}
        </View>

        {/* Organism detail */}
        {selOrg && (
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: SURFACE,
            borderRadius: 16, borderWidth: 1, borderColor: `${PRIMARY}40`, padding: 16 }}>
            <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 14, marginBottom: 4 }}>
              {selOrg.organism}
            </Text>
            <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 12 }}>
              {selOrg.n} isolates tested
            </Text>
            {ANTIBIOTICS.map(ab => {
              const susc = selOrg.data[ab] as Susc;
              const cfg  = SUSC_CFG[susc];
              return (
                <View key={ab} style={{ flexDirection: "row", alignItems: "center",
                  justifyContent: "space-between", paddingVertical: 6,
                  borderBottomWidth: 1, borderBottomColor: BORDER }}>
                  <Text style={{ color: "#9ca3af", fontSize: 13 }}>{ANTIBIOTIC_FULL[ab]}</Text>
                  <View style={{ backgroundColor: cfg.bg, borderRadius: 6,
                    paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ color: cfg.color, fontSize: 12, fontWeight: "800" }}>{susc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
