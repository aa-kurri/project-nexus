import {
  View, Text, Pressable, ScrollView, TextInput,
} from "react-native";
import {
  Mic, MicOff, FileText, Save, ChevronDown,
} from "lucide-react-native";
import { useState, useRef, useEffect } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";
const DANGER  = "#ef4444";

// ─── SOAP section types ───────────────────────────────────────────────────────

type SOAPKey = "Subjective" | "Objective" | "Assessment" | "Plan";

interface SOAPNote {
  Subjective:  string;
  Objective:   string;
  Assessment:  string;
  Plan:        string;
}

const EMPTY_SOAP: SOAPNote = {
  Subjective: "",
  Objective:  "",
  Assessment: "",
  Plan:       "",
};

// ─── Mock patient selector ────────────────────────────────────────────────────

const MOCK_PATIENTS = [
  { id: "pt-1001", name: "Ramesh Kumar",  token: "T-001" },
  { id: "pt-1002", name: "Priya Sharma",  token: "T-002" },
  { id: "pt-1003", name: "Anita Verma",   token: "T-003" },
];

// ─── Mock transcript stream ───────────────────────────────────────────────────

const MOCK_LINES = [
  "Patient presents with chest pain radiating to the left arm for 2 days.",
  "No fever, no cough. BP is 148 over 92.",
  "History of type 2 diabetes and hypertension.",
  "Assessment: unstable angina, rule out ACS.",
  "Plan: ECG, troponin, aspirin 325mg stat, refer cardiology.",
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScribeScreen() {
  const [selectedPatient, setSelectedPatient] = useState(MOCK_PATIENTS[0]);
  const [showPicker, setShowPicker]           = useState(false);
  const [recording, setRecording]             = useState(false);
  const [transcript, setTranscript]           = useState("");
  const [soap, setSOAP]                       = useState<SOAPNote>(EMPTY_SOAP);
  const [saved, setSaved]                     = useState(false);

  // Pulse animation counter (drives the recording indicator)
  const lineRef  = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Simulate streaming transcript when recording ──
  useEffect(() => {
    if (recording) {
      setSaved(false);
      timerRef.current = setInterval(() => {
        const next = MOCK_LINES[lineRef.current % MOCK_LINES.length];
        setTranscript(prev => (prev ? `${prev}\n${next}` : next));
        lineRef.current += 1;

        // After all lines, auto-generate mock SOAP
        if (lineRef.current >= MOCK_LINES.length) {
          stopRecording();
          generateMockSOAP();
        }
      }, 1200);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  function stopRecording() {
    setRecording(false);
    lineRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
    } else {
      setTranscript("");
      setSOAP(EMPTY_SOAP);
      setRecording(true);
    }
  }

  function generateMockSOAP() {
    // TODO: replace with actions.generateSOAP(transcript) — calls AI server action
    setSOAP({
      Subjective:  "Patient presents with chest pain radiating to left arm for 2 days. No fever, no cough.",
      Objective:   "BP 148/92 mmHg. History of T2DM and hypertension.",
      Assessment:  "Unstable angina — rule out ACS.",
      Plan:        "ECG, troponin assay, Aspirin 325 mg stat, cardiology referral.",
    });
  }

  function handleSave() {
    // TODO: actions.saveNote({ patientId: selectedPatient.id, soap, transcript })
    //       inserts into encounters table and links SOAP to encounter.reason / metadata
    setSaved(true);
  }

  const hasContent = transcript.length > 0 || Object.values(soap).some(v => v.length > 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>
          AI Scribe
        </Text>
        <Text style={{ color: "#6b7280", marginTop: 4, fontSize: 13 }}>
          Dictate — auto-structured to SOAP
        </Text>
      </View>

      {/* Patient picker */}
      <Pressable
        onPress={() => setShowPicker(p => !p)}
        style={({ pressed }) => ({
          marginHorizontal: 16, marginBottom: 4,
          backgroundColor: SURFACE, borderRadius: 14,
          borderWidth: 1, borderColor: showPicker ? PRIMARY : BORDER,
          paddingHorizontal: 16, paddingVertical: 13,
          flexDirection: "row", alignItems: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600",
            textTransform: "uppercase", letterSpacing: 0.5 }}>
            Patient
          </Text>
          <Text style={{ color: "#f9fafb", fontWeight: "600", marginTop: 2 }}>
            {selectedPatient.name}
            <Text style={{ color: "#6b7280", fontWeight: "400" }}>
              {"  "}{selectedPatient.token}
            </Text>
          </Text>
        </View>
        <ChevronDown size={16} color="#6b7280"
          style={{ transform: [{ rotate: showPicker ? "180deg" : "0deg" }] }} />
      </Pressable>

      {showPicker && (
        <View style={{
          marginHorizontal: 16, borderRadius: 14, overflow: "hidden",
          backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
          marginBottom: 4,
        }}>
          {MOCK_PATIENTS.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() => { setSelectedPatient(p); setShowPicker(false); }}
              style={({ pressed }) => ({
                paddingHorizontal: 16, paddingVertical: 13,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                flexDirection: "row", alignItems: "center",
                backgroundColor: p.id === selectedPatient.id ? `${PRIMARY}15` : "transparent",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: "#f9fafb", flex: 1 }}>{p.name}</Text>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>{p.token}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Record button */}
      <Pressable
        onPress={toggleRecording}
        style={({ pressed }) => ({
          alignSelf: "center", marginTop: 28,
          width: 96, height: 96, borderRadius: 48,
          backgroundColor: recording ? `${DANGER}20` : `${PRIMARY}20`,
          borderWidth: 2, borderColor: recording ? DANGER : PRIMARY,
          alignItems: "center", justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        {/* TODO: integrate expo-av Audio.Recording for real microphone capture:
              const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
              );
              const uri = recording.getURI(); — send to Whisper / Deepgram API */}
        {recording
          ? <MicOff size={36} color={DANGER} />
          : <Mic    size={36} color={PRIMARY} />}
      </Pressable>
      <Text style={{ textAlign: "center", color: "#9ca3af", marginTop: 10, fontSize: 13 }}>
        {recording ? "Recording… tap to stop" : "Tap to start dictating"}
      </Text>

      {/* Live transcript */}
      <View style={{
        marginHorizontal: 16, marginTop: 24, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, padding: 16,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <FileText size={15} color={PRIMARY} />
          <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "700",
            textTransform: "uppercase", letterSpacing: 0.5 }}>
            Transcript
          </Text>
          {recording && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: DANGER }} />
          )}
        </View>
        {transcript ? (
          <Text style={{ color: "#d1d5db", fontSize: 13, lineHeight: 20 }}>
            {transcript}
          </Text>
        ) : (
          <Text style={{ color: "#4b5563", fontSize: 13, fontStyle: "italic" }}>
            {/* TODO: render streaming Whisper transcript tokens as they arrive */}
            Transcript will appear here as you speak…
          </Text>
        )}
      </View>

      {/* SOAP output */}
      <View style={{
        marginHorizontal: 16, marginTop: 12, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, padding: 16,
      }}>
        <Text style={{
          color: "#9ca3af", fontSize: 12, fontWeight: "700",
          textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14,
        }}>
          Structured Note (SOAP)
        </Text>
        {(["Subjective", "Objective", "Assessment", "Plan"] as SOAPKey[]).map(section => (
          <View key={section} style={{ marginBottom: 16 }}>
            <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 13, marginBottom: 4 }}>
              {section}
            </Text>
            <TextInput
              multiline
              style={{
                color: "#e5e7eb", fontSize: 13, lineHeight: 20,
                backgroundColor: BG, borderRadius: 10, borderWidth: 1,
                borderColor: BORDER, padding: 12,
                minHeight: 56,
              }}
              placeholder={`${section} notes…`}
              placeholderTextColor="#374151"
              value={soap[section]}
              onChangeText={text => setSOAP(prev => ({ ...prev, [section]: text }))}
            />
          </View>
        ))}
      </View>

      {/* Save CTA */}
      {saved ? (
        <View style={{
          marginHorizontal: 16, marginTop: 16, borderRadius: 14,
          backgroundColor: `${PRIMARY}20`, borderWidth: 1, borderColor: `${PRIMARY}40`,
          paddingVertical: 16, alignItems: "center",
        }}>
          <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 15 }}>
            Note saved to encounter
          </Text>
        </View>
      ) : (
        <Pressable
          disabled={!hasContent}
          onPress={handleSave}
          style={({ pressed }) => ({
            marginHorizontal: 16, marginTop: 16,
            backgroundColor: hasContent ? PRIMARY : "#1e2332",
            borderRadius: 14, paddingVertical: 16,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {/* TODO: actions.saveNote() — creates/updates encounter, inserts SOAP into
                encounters.reason + metadata.soap, triggers audit log */}
          <Save size={16} color={hasContent ? "#fff" : "#4b5563"} />
          <Text style={{ color: hasContent ? "#fff" : "#4b5563",
            fontWeight: "700", fontSize: 15 }}>
            Save to Encounter
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
