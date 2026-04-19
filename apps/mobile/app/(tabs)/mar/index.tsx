import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Pill, AlertTriangle, CheckCircle2, Clock, ChevronRight, ShieldAlert } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type AdminStatus = "due" | "given" | "missed" | "held";

const STATUS_CFG: Record<AdminStatus, { label: string; color: string; bg: string }> = {
  due:    { label: "Due",    color: "#f59e0b", bg: "#f59e0b20" },
  given:  { label: "Given",  color: PRIMARY,   bg: `${PRIMARY}20` },
  missed: { label: "Missed", color: "#ef4444", bg: "#ef444420" },
  held:   { label: "Held",   color: "#6b7280", bg: "#6b728020" },
};

interface MarDrug {
  id:           string;
  mrId:         string; // medication_request_id
  name:         string;
  dose:         string;
  route:        string;
  time:         string;
  status:       AdminStatus;
  highAlert:    boolean;
  givenBy:      string | null;
  dispenseId:   string | null; // dispense_records.id if already given today
}

interface MarPatient {
  id:   string;
  name: string;
  bed:  string;
  uhid: string;
  drugs: MarDrug[];
}

// High-alert drug names (simplified list)
const HIGH_ALERT_DRUGS = ["heparin","insulin","noradrenaline","adrenaline","midazolam","morphine","fentanyl","potassium"];

function isHighAlert(name: string) {
  return HIGH_ALERT_DRUGS.some((d) => name.toLowerCase().includes(d));
}

export default function MarScreen() {
  const { profile }               = useAuthStore();
  const [patients,  setPatients]  = useState<MarPatient[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [giving,    setGiving]    = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

      // Admitted patients
      const { data: admissions, error: aErr } = await supabase
        .from("admissions")
        .select(`patient_id, patients ( id, full_name, mrn ), beds ( label )`)
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "admitted");

      if (aErr) throw new Error(aErr.message);
      if (!admissions || admissions.length === 0) { setPatients([]); return; }

      const patientIds = admissions.map((a: any) => a.patient_id);

      // Active medication requests for those patients
      const { data: meds, error: mErr } = await supabase
        .from("medication_requests")
        .select("id, patient_id, drug_name, strength, dosage, route, status")
        .eq("tenant_id", profile.tenant_id)
        .in("patient_id", patientIds)
        .eq("status", "active");

      if (mErr) throw new Error(mErr.message);

      // Today's dispense records to know what's already given
      const mrIds = (meds ?? []).map((m: any) => m.id);
      const { data: dispenses } = mrIds.length
        ? await supabase
            .from("dispense_records")
            .select("id, medication_request_id, status, administered_by, administered_at, profiles:administered_by ( full_name )")
            .eq("tenant_id", profile.tenant_id)
            .in("medication_request_id", mrIds)
            .gte("scheduled_at", todayStart.toISOString())
            .lte("scheduled_at", todayEnd.toISOString())
        : { data: [] };

      // Build a map: medication_request_id → dispense record
      const dispenseMap: Record<string, any> = {};
      for (const d of (dispenses ?? [])) {
        dispenseMap[(d as any).medication_request_id] = d;
      }

      // Group meds by patient
      const medsByPatient: Record<string, MarDrug[]> = {};
      for (const m of (meds ?? [])) {
        const pid = (m as any).patient_id;
        if (!medsByPatient[pid]) medsByPatient[pid] = [];
        const dispense = dispenseMap[(m as any).id];

        let status: AdminStatus = "due";
        let givenBy: string | null = null;
        let dispenseId: string | null = null;

        if (dispense) {
          dispenseId = dispense.id;
          givenBy    = dispense.profiles?.full_name ?? null;
          status     = dispense.status === "given"  ? "given"
                     : dispense.status === "missed" ? "missed"
                     : dispense.status === "held"   ? "held"
                     : "due";
        }

        medsByPatient[pid].push({
          id:         (m as any).id,
          mrId:       (m as any).id,
          name:       (m as any).drug_name,
          dose:       (m as any).dosage ?? "",
          route:      (m as any).route ?? "",
          time:       "Per order",
          status,
          highAlert:  isHighAlert((m as any).drug_name),
          givenBy,
          dispenseId,
        });
      }

      setPatients(
        admissions.map((a: any) => ({
          id:    a.patient_id,
          name:  a.patients?.full_name ?? "Unknown",
          bed:   a.beds?.label ?? "—",
          uhid:  a.patients?.mrn ?? "—",
          drugs: medsByPatient[a.patient_id] ?? [],
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const patient     = patients.find((p) => p.id === selected);
  const missedCount = patients.flatMap((p) => p.drugs).filter((d) => d.status === "missed").length;

  async function markGiven(drug: MarDrug) {
    if (!profile) return;
    setGiving(drug.mrId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id ?? null;
      const now    = new Date().toISOString();

      if (drug.dispenseId) {
        // Update existing dispense record
        await supabase
          .from("dispense_records")
          .update({ status: "given", administered_at: now, administered_by: userId })
          .eq("id", drug.dispenseId);
      } else {
        // Insert a new dispense record
        await supabase
          .from("dispense_records")
          .insert({
            tenant_id:             profile.tenant_id,
            medication_request_id: drug.mrId,
            patient_id:            selected,
            administered_by:       userId,
            status:                "given",
            scheduled_at:          now,
            administered_at:       now,
          });
      }

      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGiving(null);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={PRIMARY} size="large" />
        <Text style={{ color: "#6b7280", marginTop: 12 }}>Loading MAR…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
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

      {error && (
        <View style={{ margin: 16, backgroundColor: "#ef444420", borderRadius: 12,
          borderWidth: 1, borderColor: "#ef444440", padding: 12 }}>
          <Text style={{ color: "#f87171", fontSize: 13 }}>{error}</Text>
        </View>
      )}

      {!selected ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {patients.length === 0 && (
            <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 40 }}>
              No admitted patients found.
            </Text>
          )}
          {patients.map((p) => {
            const missed = p.drugs.filter((d) => d.status === "missed").length;
            const due    = p.drugs.filter((d) => d.status === "due").length;
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
            {patient!.drugs.length === 0 && (
              <Text style={{ color: "#6b7280", padding: 24, textAlign: "center" }}>
                No active medications.
              </Text>
            )}
            {patient!.drugs.map((drug, i) => {
              const cfg     = STATUS_CFG[drug.status];
              const isGiving= giving === drug.mrId;
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
                      {drug.status === "due" && (
                        <Pressable onPress={() => markGiven(drug)} disabled={isGiving}
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
