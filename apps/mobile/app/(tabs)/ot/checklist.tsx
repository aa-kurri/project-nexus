import { View, Text, ScrollView, Pressable } from "react-native";
import { Scissors, CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type OtStatus = "scheduled" | "prep" | "in_progress" | "completed";
type Phase    = "sign_in" | "time_out" | "sign_out";

const STATUS_CFG: Record<OtStatus, { label: string; color: string }> = {
  scheduled:   { label: "Scheduled",  color: "#6b7280" },
  prep:        { label: "Prep",       color: "#f59e0b" },
  in_progress: { label: "In Progress",color: "#3b82f6" },
  completed:   { label: "Completed",  color: PRIMARY   },
};

const CHECKLIST: Record<Phase, string[]> = {
  sign_in: [
    "Patient identity confirmed (name, DOB, UHID)",
    "Consent form signed & present",
    "Operative site marked",
    "Anaesthesia safety check completed",
    "Pulse oximetry attached & functional",
    "Known allergies noted",
    "Difficult airway / aspiration risk assessed",
    "Blood loss risk: >500 ml anticipated?",
  ],
  time_out: [
    "All team members introduced by name and role",
    "Surgeon confirms: patient, site, procedure",
    "Anticipated critical steps discussed",
    "Prophylactic antibiotics given (within 60 min)",
    "Imaging displayed (if applicable)",
    "Implant / prosthesis available",
  ],
  sign_out: [
    "Nurse verifies: procedure performed on record",
    "Instruments, sponges, needles counted — correct",
    "Specimen labelled correctly",
    "Equipment malfunctions to report",
    "Surgeon & anaesthetist: key concerns for recovery",
  ],
};

interface OtCase {
  id: string; patient: string; uhid: string;
  procedure: string; surgeon: string; ot: string;
  scheduledTime: string; status: OtStatus;
}

const CASES: OtCase[] = [
  { id: "c1", patient: "George Mathew",   uhid: "AY-00345", procedure: "Right TKR",           surgeon: "Dr. Subramaniam", ot: "OT-1", scheduledTime: "09:00", status: "in_progress" },
  { id: "c2", patient: "Priya Venkatesh", uhid: "AY-00298", procedure: "Lap Appendicectomy",  surgeon: "Dr. Krishnamurthy",ot: "OT-2", scheduledTime: "11:30", status: "prep"        },
  { id: "c3", patient: "Arun Nair",       uhid: "AY-00267", procedure: "Inguinal Hernia Mesh", surgeon: "Dr. Subramaniam", ot: "OT-1", scheduledTime: "14:00", status: "scheduled"   },
];

export default function OtChecklistScreen() {
  const [selected,  setSelected]  = useState<string | null>(null);
  const [phase,     setPhase]     = useState<Phase>("sign_in");
  const [checked,   setChecked]   = useState<Set<string>>(new Set());

  const cas = CASES.find(c => c.id === selected);

  function toggleItem(key: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const phaseItems = CHECKLIST[phase];
  const doneCount  = phaseItems.filter((_, i) => checked.has(`${phase}-${i}`)).length;
  const allDone    = doneCount === phaseItems.length;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: PRIMARY }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
          WHO Surgical Safety
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 }}>
          OT Checklist
        </Text>
      </View>

      {!selected ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {CASES.map(c => {
            const scfg = STATUS_CFG[c.status];
            return (
              <Pressable key={c.id} onPress={() => { setSelected(c.id); setPhase("sign_in"); setChecked(new Set()); }}
                style={({ pressed }) => ({
                  backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: BORDER,
                  padding: 16, opacity: pressed ? 0.7 : 1,
                })}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12,
                    backgroundColor: `${scfg.color}20`, alignItems: "center", justifyContent: "center" }}>
                    <Scissors size={20} color={scfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 15 }}>{c.patient}</Text>
                    <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                      {c.procedure} · {c.surgeon}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Clock size={11} color="#4b5563" />
                      <Text style={{ color: "#4b5563", fontSize: 11 }}>{c.scheduledTime} · {c.ot}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: `${scfg.color}20`, borderRadius: 8,
                    paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: scfg.color, fontSize: 11, fontWeight: "700" }}>{scfg.label}</Text>
                  </View>
                  <ChevronRight size={16} color="#374151" />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Pressable onPress={() => setSelected(null)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <ChevronRight size={14} color="#6b7280" style={{ transform: [{ rotate: "180deg" }] }} />
            <Text style={{ color: "#6b7280", fontSize: 13 }}>Back</Text>
          </Pressable>

          <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "700" }}>{cas!.patient}</Text>
          <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 16 }}>
            {cas!.procedure} · {cas!.surgeon} · {cas!.ot}
          </Text>

          {/* Phase tabs */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {(["sign_in","time_out","sign_out"] as Phase[]).map(p => {
              const labels: Record<Phase,string> = { sign_in: "Sign In", time_out: "Time Out", sign_out: "Sign Out" };
              const done = CHECKLIST[p].filter((_,i) => checked.has(`${p}-${i}`)).length;
              const total = CHECKLIST[p].length;
              const complete = done === total;
              return (
                <Pressable key={p} onPress={() => setPhase(p)}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
                    backgroundColor: phase === p ? PRIMARY : `${PRIMARY}15`,
                    borderWidth: 1, borderColor: phase === p ? PRIMARY : `${PRIMARY}30` }}>
                  {complete && <CheckCircle2 size={12} color={phase === p ? "#fff" : PRIMARY} style={{ marginBottom: 2 }} />}
                  <Text style={{ color: phase === p ? "#fff" : PRIMARY, fontSize: 11, fontWeight: "700" }}>
                    {labels[p]}
                  </Text>
                  <Text style={{ color: phase === p ? "rgba(255,255,255,0.6)" : "#4b5563", fontSize: 9 }}>
                    {done}/{total}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Progress bar */}
          <View style={{ height: 4, backgroundColor: "#1e2332", borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${(doneCount / phaseItems.length) * 100}%`,
              backgroundColor: allDone ? PRIMARY : "#f59e0b", borderRadius: 2 }} />
          </View>

          {allDone && (
            <View style={{ backgroundColor: `${PRIMARY}20`, borderRadius: 12, borderWidth: 1,
              borderColor: `${PRIMARY}40`, padding: 12, marginBottom: 16,
              flexDirection: "row", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={16} color={PRIMARY} />
              <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 13 }}>
                Phase complete — proceed to next step
              </Text>
            </View>
          )}

          {/* Checklist items */}
          <View style={{ backgroundColor: SURFACE, borderRadius: 16,
            borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
            {phaseItems.map((item, i) => {
              const key  = `${phase}-${i}`;
              const done = checked.has(key);
              return (
                <Pressable key={key} onPress={() => toggleItem(key)}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", gap: 12,
                    padding: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                    backgroundColor: done ? `${PRIMARY}08` : "transparent",
                    opacity: pressed ? 0.7 : 1,
                  })}>
                  {done
                    ? <CheckCircle2 size={20} color={PRIMARY} />
                    : <Circle size={20} color="#374151" />}
                  <Text style={{
                    flex: 1, color: done ? "#6b7280" : "#e5e7eb", fontSize: 13,
                    textDecorationLine: done ? "line-through" : "none",
                  }}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
