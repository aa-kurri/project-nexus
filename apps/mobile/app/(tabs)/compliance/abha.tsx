import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { ShieldCheck, Link2, RefreshCw, Search, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type LinkStatus = "linked" | "pending" | "failed" | "not_initiated";

const STATUS_CFG: Record<LinkStatus, { label: string; color: string; Icon: any }> = {
  linked:        { label: "Linked",        color: PRIMARY,   Icon: CheckCircle2 },
  pending:       { label: "Pending",       color: "#f59e0b", Icon: Clock        },
  failed:        { label: "Failed",        color: "#ef4444", Icon: XCircle      },
  not_initiated: { label: "Not Initiated", color: "#6b7280", Icon: AlertCircle  },
};

interface AbhaPatient {
  id: string; name: string; uhid: string; mobile: string;
  abhaNumber?: string; status: LinkStatus;
}

const PATIENTS: AbhaPatient[] = [
  { id: "p1", name: "Ramesh Kumar",    uhid: "AY-00412", mobile: "9876543210", abhaNumber: "91-1234-5678-9012", status: "linked"        },
  { id: "p2", name: "Sunita Sharma",   uhid: "AY-00389", mobile: "9812345678", status: "pending"       },
  { id: "p3", name: "George Mathew",   uhid: "AY-00345", mobile: "9800112233", status: "not_initiated" },
  { id: "p4", name: "Priya Venkatesh", uhid: "AY-00298", mobile: "9911223344", status: "failed"        },
  { id: "p5", name: "Arun Nair",       uhid: "AY-00267", mobile: "9955443322", abhaNumber: "91-9876-5432-1098", status: "linked" },
];

export default function AbhaScreen() {
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<LinkStatus | "ALL">("ALL");
  const [linking,   setLinking]   = useState<string | null>(null);
  const [localSt,   setLocalSt]   = useState<Record<string, LinkStatus>>({});

  const filtered = PATIENTS.filter(p =>
    (filter === "ALL" || (localSt[p.id] ?? p.status) === filter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.uhid.toLowerCase().includes(search.toLowerCase()))
  );

  const linked = PATIENTS.filter(p => (localSt[p.id] ?? p.status) === "linked").length;

  function initiateLink(patientId: string) {
    setLinking(patientId);
    setTimeout(() => {
      setLocalSt(prev => ({ ...prev, [patientId]: "pending" }));
      setLinking(null);
    }, 1200);
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          Compliance · ABDM
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          ABHA Linking
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}>
          {linked} / {PATIENTS.length} patients linked
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8,
          backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
          paddingHorizontal: 12, paddingVertical: 10 }}>
          <Search size={15} color="#4b5563" />
          <TextInput value={search} onChangeText={setSearch}
            placeholder="Search patient or UHID…" placeholderTextColor="#4b5563"
            style={{ flex: 1, color: "#f9fafb", fontSize: 13 }} />
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
        {(["ALL","linked","pending","failed","not_initiated"] as const).map(f => {
          const active = filter === f;
          const color  = f === "ALL" ? PRIMARY : STATUS_CFG[f]?.color ?? PRIMARY;
          return (
            <Pressable key={f} onPress={() => setFilter(f)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                backgroundColor: active ? `${color}30` : `${color}10`,
                borderWidth: 1, borderColor: active ? color : "transparent" }}>
              <Text style={{ color, fontSize: 12, fontWeight: "700" }}>
                {f === "ALL" ? "All" : STATUS_CFG[f].label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 40 }}>
        {filtered.map(p => {
          const status = (localSt[p.id] ?? p.status) as LinkStatus;
          const scfg   = STATUS_CFG[status];
          const isLinking = linking === p.id;
          return (
            <View key={p.id} style={{ backgroundColor: SURFACE, borderRadius: 16,
              borderWidth: 1, borderColor: BORDER, padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12,
                  backgroundColor: `${scfg.color}20`, alignItems: "center", justifyContent: "center" }}>
                  <scfg.Icon size={20} color={scfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 14 }}>{p.name}</Text>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                    {p.uhid} · {p.mobile}
                  </Text>
                  {p.abhaNumber && (
                    <Text style={{ color: PRIMARY, fontSize: 12, fontWeight: "600", marginTop: 4 }}>
                      ABHA: {p.abhaNumber}
                    </Text>
                  )}
                </View>
                <View style={{ backgroundColor: `${scfg.color}20`, borderRadius: 8,
                  paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: scfg.color, fontSize: 10, fontWeight: "700" }}>{scfg.label}</Text>
                </View>
              </View>

              {(status === "not_initiated" || status === "failed") && (
                <Pressable onPress={() => initiateLink(p.id)} disabled={isLinking}
                  style={({ pressed }) => ({
                    marginTop: 12, flexDirection: "row", alignItems: "center",
                    justifyContent: "center", gap: 6, backgroundColor: PRIMARY,
                    borderRadius: 10, paddingVertical: 10,
                    opacity: pressed || isLinking ? 0.7 : 1,
                  })}>
                  {isLinking
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Link2 size={14} color="#fff" />}
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                    {isLinking ? "Initiating…" : status === "failed" ? "Retry Link" : "Initiate ABHA Link"}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
