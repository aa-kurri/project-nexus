import { View, Text, Pressable, ScrollView } from "react-native";
import { Mic, MicOff, FileText } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

export default function ScribeScreen() {
  const [recording, setRecording] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>AI Scribe</Text>
        <Text style={{ color: "#6b7280", marginTop: 4 }}>
          Dictate clinical notes — auto-structured to SOAP format
        </Text>
      </View>

      {/* Record button */}
      <Pressable
        onPress={() => setRecording(r => !r)}
        style={({ pressed }) => ({
          alignSelf: "center", marginTop: 24,
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: recording ? "#ef444420" : `${PRIMARY}20`,
          borderWidth: 2, borderColor: recording ? "#ef4444" : PRIMARY,
          alignItems: "center", justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        {/* TODO: integrate expo-av / expo-speech for real recording */}
        {recording
          ? <MicOff size={36} color="#ef4444" />
          : <Mic    size={36} color={PRIMARY} />}
      </Pressable>
      <Text style={{ textAlign: "center", color: "#9ca3af", marginTop: 12 }}>
        {recording ? "Recording… tap to stop" : "Tap to start recording"}
      </Text>

      {/* Transcript preview */}
      <View style={{ marginHorizontal: 16, marginTop: 28, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <FileText size={16} color={PRIMARY} />
          <Text style={{ color: "#9ca3af", fontSize: 13, fontWeight: "600",
            textTransform: "uppercase", letterSpacing: 0.5 }}>Transcript</Text>
        </View>
        {/* TODO: render streaming transcript from Whisper / Deepgram */}
        <Text style={{ color: "#4b5563", fontStyle: "italic" }}>
          Transcript will appear here as you speak…
        </Text>
      </View>

      {/* SOAP output */}
      <View style={{ marginHorizontal: 16, marginTop: 12, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, padding: 16 }}>
        <Text style={{ color: "#9ca3af", fontSize: 13, fontWeight: "600",
          textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
          Structured Note (SOAP)
        </Text>
        {/* TODO: render AI-generated SOAP note from server action actions.generateSOAP() */}
        {["Subjective", "Objective", "Assessment", "Plan"].map(section => (
          <View key={section} style={{ marginBottom: 12 }}>
            <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 13 }}>{section}</Text>
            <Text style={{ color: "#4b5563", fontSize: 13, marginTop: 4 }}>—</Text>
          </View>
        ))}
      </View>

      {/* Save CTA */}
      <Pressable
        style={({ pressed }) => ({
          marginHorizontal: 16, marginTop: 16,
          backgroundColor: PRIMARY, borderRadius: 14,
          paddingVertical: 16, alignItems: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        {/* TODO: actions.saveNote() — inserts into encounters table */}
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Save to Encounter</Text>
      </Pressable>
    </ScrollView>
  );
}
