import { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft, CheckCircle, ChevronRight, Calendar, Clock,
  MapPin, User, Phone, FileText, Stethoscope,
} from "lucide-react-native";

// ── Mock data ──────────────────────────────────────────────────────────────

const DOCTORS = [
  { id: "doc-1", name: "Dr. Ananya Sharma", specialty: "General OPD",   room: "Block 2, Room 4",  fee: 500,  avatar: "AS", slotsLeft: 8 },
  { id: "doc-2", name: "Dr. Ravi Rao",      specialty: "Endocrinology",  room: "Block 1, Room 11", fee: 800,  avatar: "RR", slotsLeft: 4 },
  { id: "doc-3", name: "Dr. Priya Menon",   specialty: "Cardiology",     room: "Cardiology Wing",  fee: 1200, avatar: "PM", slotsLeft: 2 },
  { id: "doc-4", name: "Dr. Vikram Nair",   specialty: "Orthopaedics",   room: "Block 3, Room 7",  fee: 700,  avatar: "VN", slotsLeft: 6 },
];

const MORNING_TIMES   = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const AFTERNOON_TIMES = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const BOOKED_TIMES    = new Set(["09:30", "10:30", "14:30"]);

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function buildSlots() {
  return [...MORNING_TIMES, ...AFTERNOON_TIMES].map(t => ({
    id:      `slot-${t.replace(":", "")}`,
    time:    t,
    label:   formatTime(t),
    booked:  BOOKED_TIMES.has(t),
    morning: parseInt(t) < 12,
  }));
}

function getDates(count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

function displayDate(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// ── Types ──────────────────────────────────────────────────────────────────

type Doctor = (typeof DOCTORS)[number];
interface Slot { id: string; time: string; label: string; booked: boolean; morning: boolean }
type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: "Choose Doctor",
  2: "Pick Date",
  3: "Choose Time",
  4: "Confirm",
};

// ── Component ──────────────────────────────────────────────────────────────

export default function BookingScreen() {
  const router = useRouter();

  const [step, setStep]         = useState<Step>(1);
  const [doctor, setDoctor]     = useState<Doctor | null>(null);
  const [date, setDate]         = useState<Date>(() => new Date());
  const [slot, setSlot]         = useState<Slot | null>(null);
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [reason, setReason]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const dates    = getDates();
  const allSlots = buildSlots();
  const morning   = allSlots.filter(s => s.morning);
  const afternoon = allSlots.filter(s => !s.morning);

  const confirm = async () => {
    setLoading(true);
    // TODO: call API route for appointment booking
    // POST /api/appointments/book with:
    //   { slotId, practitionerId, slotDate, startTime, patientName, patientPhone, reason }
    // On success: invalidate appointments list cache and navigate back
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setConfirmed(`BK-${Date.now().toString(36).toUpperCase()}`);
  };

  const goBack = () => {
    if (step === 1) router.back();
    else setStep((step - 1) as Step);
  };

  // ── Confirmed screen ───────────────────────────────────────────────────
  if (confirmed) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: "#0F766E20",
            alignItems: "center", justifyContent: "center", marginBottom: 20,
          }}>
            <CheckCircle color="#0F766E" size={36} />
          </View>

          <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 4 }}>
            Appointment Confirmed!
          </Text>
          <Text style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>
            Booking ID:{" "}
            <Text style={{ color: "#0F766E", fontWeight: "700" }}>{confirmed}</Text>
          </Text>

          <View style={{
            width: "100%", backgroundColor: "#fff", borderRadius: 16,
            padding: 18, marginBottom: 24, gap: 12,
          }}>
            <MRow icon={<User size={15} color="#0F766E" />}        label={name} />
            <MRow icon={<Stethoscope size={15} color="#0F766E" />} label={doctor?.name ?? ""} />
            <MRow icon={<Calendar size={15} color="#0F766E" />}    label={displayDate(date)} />
            <MRow icon={<Clock size={15} color="#0F766E" />}       label={slot?.label ?? ""} />
            <MRow icon={<MapPin size={15} color="#0F766E" />}      label={doctor?.room ?? ""} />
          </View>

          <Text style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20, textAlign: "center" }}>
            ₹{doctor?.fee} consultation fee payable at the clinic
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={{
              width: "100%", backgroundColor: "#0F766E",
              borderRadius: 14, paddingVertical: 15, alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14,
          backgroundColor: "#fff",
          borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
        }}>
          <Pressable onPress={goBack} style={{ padding: 6, marginRight: 10 }}>
            <ArrowLeft size={20} color="#374151" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827" }}>
              Book Appointment
            </Text>
            <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
              {STEP_LABELS[step]}
            </Text>
          </View>
          {/* Step dots */}
          <View style={{ flexDirection: "row", gap: 5 }}>
            {([1, 2, 3, 4] as Step[]).map(n => (
              <View
                key={n}
                style={{
                  width: 7, height: 7, borderRadius: 4,
                  backgroundColor: n <= step ? "#0F766E" : "#e5e7eb",
                }}
              />
            ))}
          </View>
        </View>

        {/* ── Step 1: Doctor ─────────────────────────────────────────── */}
        {step === 1 && (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {DOCTORS.map(doc => (
              <Pressable
                key={doc.id}
                onPress={() => { setDoctor(doc); setSlot(null); setStep(2); }}
                style={{
                  backgroundColor: "#fff", borderRadius: 16, padding: 16,
                  shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <View style={{
                    width: 46, height: 46, borderRadius: 13,
                    backgroundColor: "#0F766E20",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ fontWeight: "800", fontSize: 13, color: "#0F766E" }}>
                      {doc.avatar}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", color: "#111827", fontSize: 15 }}>
                      {doc.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      {doc.specialty}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                      <View style={{ backgroundColor: "#f3f4f6", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, color: "#374151", fontWeight: "600" }}>
                          ₹{doc.fee}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: "#0F766E15", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, color: "#0F766E", fontWeight: "600" }}>
                          {doc.slotsLeft} slots today
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={18} color="#9ca3af" />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── Step 2: Date ───────────────────────────────────────────── */}
        {step === 2 && (
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>
              Select a date
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 28 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {dates.map((d, i) => {
                  const sel = isoDate(d) === isoDate(date);
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setDate(d)}
                      style={{
                        width: 64, borderRadius: 14, paddingVertical: 14, alignItems: "center",
                        backgroundColor: sel ? "#0F766E" : "#fff",
                        shadowColor: sel ? "#0F766E" : "#000",
                        shadowOpacity: sel ? 0.35 : 0.04,
                        shadowRadius: sel ? 10 : 4,
                        elevation: sel ? 5 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", color: sel ? "#fff" : "#9ca3af" }}>
                        {d.toLocaleDateString("en-IN", { weekday: "short" })}
                      </Text>
                      <Text style={{ fontSize: 24, fontWeight: "800", color: sel ? "#fff" : "#111827", marginTop: 2 }}>
                        {d.getDate()}
                      </Text>
                      <Text style={{ fontSize: 10, color: sel ? "#fff" : "#9ca3af" }}>
                        {d.toLocaleDateString("en-IN", { month: "short" })}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
              {displayDate(date)}
            </Text>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={() => setStep(3)}
              style={{ backgroundColor: "#0F766E", borderRadius: 14, paddingVertical: 15, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                See Available Slots
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Step 3: Time slot ──────────────────────────────────────── */}
        {step === 3 && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <SlotSection label="Morning"   slots={morning}   selected={slot} onSelect={setSlot} />
            <SlotSection label="Afternoon" slots={afternoon} selected={slot} onSelect={setSlot} />

            <Pressable
              onPress={() => setStep(4)}
              disabled={!slot}
              style={{
                backgroundColor: slot ? "#0F766E" : "#d1d5db",
                borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 24,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                {slot ? `Continue — ${slot.label}` : "Select a slot to continue"}
              </Text>
            </Pressable>
          </ScrollView>
        )}

        {/* ── Step 4: Confirm ────────────────────────────────────────── */}
        {step === 4 && doctor && slot && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Summary */}
            <View style={{
              backgroundColor: "#fff", borderRadius: 16, padding: 18,
              marginBottom: 24, gap: 12,
            }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
                Booking Summary
              </Text>
              <MRow icon={<Stethoscope size={14} color="#0F766E" />} label={`${doctor.name} · ${doctor.specialty}`} />
              <MRow icon={<Calendar size={14} color="#0F766E" />}    label={displayDate(date)} />
              <MRow icon={<Clock size={14} color="#0F766E" />}       label={slot.label} />
              <MRow icon={<MapPin size={14} color="#0F766E" />}      label={doctor.room} />
            </View>

            <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 14 }}>
              Your details
            </Text>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, color: "#6b7280", marginBottom: 5 }}>Full name</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: "#e5e7eb" }}>
                <User size={14} color="#9ca3af" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9ca3af"
                  style={{ flex: 1, paddingVertical: 13, fontSize: 14, color: "#111827" }}
                />
              </View>
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, color: "#6b7280", marginBottom: 5 }}>Phone number</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: "#e5e7eb" }}>
                <Phone size={14} color="#9ca3af" />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  style={{ flex: 1, paddingVertical: 13, fontSize: 14, color: "#111827" }}
                />
              </View>
            </View>

            <View style={{ marginBottom: 28 }}>
              <Text style={{ fontSize: 11, color: "#6b7280", marginBottom: 5 }}>
                Reason for visit{" "}
                <Text style={{ color: "#d1d5db" }}>(optional)</Text>
              </Text>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingTop: 13, borderWidth: 1, borderColor: "#e5e7eb" }}>
                <FileText size={14} color="#9ca3af" style={{ marginTop: 1 }} />
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Brief description of symptoms"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  style={{ flex: 1, fontSize: 14, color: "#111827", textAlignVertical: "top", minHeight: 70, paddingBottom: 12 }}
                />
              </View>
            </View>

            <Pressable
              onPress={confirm}
              disabled={loading || !name || !phone}
              style={{
                backgroundColor: loading || !name || !phone ? "#d1d5db" : "#0F766E",
                borderRadius: 14, paddingVertical: 15, alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                {loading ? "Confirming…" : "Confirm Appointment"}
              </Text>
            </Pressable>

            <Text style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 12 }}>
              ₹{doctor.fee} consultation fee · payable at the clinic
            </Text>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SlotSection({
  label, slots, selected, onSelect,
}: {
  label: string;
  slots: Slot[];
  selected: Slot | null;
  onSelect: (s: Slot) => void;
}) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{
        fontSize: 11, fontWeight: "700", color: "#9ca3af",
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12,
      }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {slots.map(s => {
          const isSelected = selected?.id === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => !s.booked && onSelect(s)}
              disabled={s.booked}
              style={{
                borderRadius: 9,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: 1,
                borderStyle: s.booked ? "dashed" : "solid",
                borderColor: s.booked ? "#e5e7eb" : isSelected ? "#0F766E" : "#e5e7eb",
                backgroundColor: s.booked ? "transparent" : isSelected ? "#0F766E" : "#fff",
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: "600",
                color: s.booked ? "#d1d5db" : isSelected ? "#fff" : "#374151",
              }}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      {icon}
      <Text style={{ fontSize: 14, color: "#374151", flex: 1 }}>{label}</Text>
    </View>
  );
}
