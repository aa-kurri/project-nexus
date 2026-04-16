import {
  View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { Search, Pill, CheckCircle, ChevronDown, AlertCircle, Trash2 } from "lucide-react-native";
import { useState } from "react";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DrugSuggestion {
  name:     string;
  generic:  string;
  form:     string;
  strength: string;
}

interface RxLine {
  drug:      string;
  dose:      string;
  frequency: string;
  duration:  string;
  route:     string;
}

// ─── Mock drug database ───────────────────────────────────────────────────────

const DRUG_DB: DrugSuggestion[] = [
  { name: "Metformin",      generic: "Metformin HCl",    form: "tab",  strength: "500 mg" },
  { name: "Metformin SR",   generic: "Metformin HCl",    form: "tab",  strength: "1000 mg" },
  { name: "Metoprolol",     generic: "Metoprolol Succ.", form: "tab",  strength: "25 mg" },
  { name: "Amlodipine",     generic: "Amlodipine",       form: "tab",  strength: "5 mg" },
  { name: "Atorvastatin",   generic: "Atorvastatin Ca.", form: "tab",  strength: "10 mg" },
  { name: "Pantoprazole",   generic: "Pantoprazole Na.", form: "tab",  strength: "40 mg" },
  { name: "Aspirin",        generic: "Acetylsalicylic",  form: "tab",  strength: "75 mg" },
  { name: "Glimepiride",    generic: "Glimepiride",      form: "tab",  strength: "2 mg" },
  { name: "Telmisartan",    generic: "Telmisartan",      form: "tab",  strength: "40 mg" },
  { name: "Paracetamol",    generic: "Acetaminophen",    form: "tab",  strength: "500 mg" },
  { name: "Amoxicillin",    generic: "Amoxicillin",      form: "cap",  strength: "500 mg" },
  { name: "Azithromycin",   generic: "Azithromycin",     form: "tab",  strength: "500 mg" },
];

const FREQUENCY_OPTIONS = ["OD", "BD", "TDS", "QID", "SOS", "HS", "AC", "PC", "Stat"];
const ROUTE_OPTIONS     = ["oral", "IV", "IM", "SC", "topical", "inhaled", "sublingual"];

// ─── Mock patient selector ────────────────────────────────────────────────────

const MOCK_PATIENTS = [
  { id: "pt-1001", name: "Ramesh Kumar",  token: "T-001" },
  { id: "pt-1002", name: "Priya Sharma",  token: "T-002" },
  { id: "pt-1003", name: "Anita Verma",   token: "T-003" },
];

const EMPTY_RX: RxLine = { drug: "", dose: "", frequency: "OD", duration: "7 days", route: "oral" };

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600",
        textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: BG, borderRadius: 10, borderWidth: 1, borderColor: BORDER,
          paddingHorizontal: 14, paddingVertical: 11, color: "#f9fafb", fontSize: 15,
        }}
        placeholder={placeholder ?? label}
        placeholderTextColor="#374151"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  );
}

// ─── Chip selector ────────────────────────────────────────────────────────────

function ChipGroup({
  label, options, selected, onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600",
        textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {options.map(opt => (
            <Pressable
              key={opt}
              onPress={() => onSelect(opt)}
              style={({ pressed }) => ({
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                backgroundColor: selected === opt ? PRIMARY : BG,
                borderWidth: 1, borderColor: selected === opt ? PRIMARY : BORDER,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{
                color: selected === opt ? "#fff" : "#9ca3af",
                fontWeight: "600", fontSize: 13,
              }}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RxScreen() {
  const [selectedPatient, setSelectedPatient] = useState(MOCK_PATIENTS[0]);
  const [showPatientPicker, setShowPatientPicker] = useState(false);

  const [drugQuery, setDrugQuery]   = useState("");
  const [suggestions, setSuggestions] = useState<DrugSuggestion[]>([]);
  const [rx, setRx]                 = useState<RxLine>({ ...EMPTY_RX });
  const [rxList, setRxList]         = useState<RxLine[]>([]);
  const [signed, setSigned]         = useState(false);

  function handleDrugSearch(q: string) {
    setDrugQuery(q);
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    // TODO: actions.searchDrugs(q) — query stock_items for formulary drugs
    const results = DRUG_DB.filter(d =>
      d.name.toLowerCase().includes(q.toLowerCase()) ||
      d.generic.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 6);
    setSuggestions(results);
  }

  function selectDrug(d: DrugSuggestion) {
    setRx(prev => ({ ...prev, drug: `${d.name} ${d.strength}`, dose: "1 tab" }));
    setDrugQuery(`${d.name} ${d.strength}`);
    setSuggestions([]);
  }

  function addToList() {
    if (!rx.drug || !rx.dose || !rx.frequency || !rx.duration) return;
    setRxList(prev => [...prev, { ...rx }]);
    setRx({ ...EMPTY_RX });
    setDrugQuery("");
    setSuggestions([]);
  }

  function removeFromList(i: number) {
    setRxList(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleSign() {
    if (rxList.length === 0) return;
    // TODO: actions.createMedicationRequests({
    //   patientId: selectedPatient.id,
    //   prescriberId: auth.uid(),
    //   lines: rxList,
    //   tenantId: jwtTenant(),
    // })
    // — bulk-inserts into medication_requests, triggers pharmacy queue
    setSigned(true);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{
          paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
          flexDirection: "row", alignItems: "center",
        }}>
          <Pill size={20} color={PRIMARY} style={{ marginRight: 10 }} />
          <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>
            e-Prescription
          </Text>
        </View>

        {/* Patient picker */}
        <Pressable
          onPress={() => setShowPatientPicker(p => !p)}
          style={({ pressed }) => ({
            marginHorizontal: 16, marginBottom: 4,
            backgroundColor: SURFACE, borderRadius: 14,
            borderWidth: 1, borderColor: showPatientPicker ? PRIMARY : BORDER,
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
              {"  "}
              <Text style={{ color: "#6b7280", fontWeight: "400", fontSize: 12 }}>
                {selectedPatient.token}
              </Text>
            </Text>
          </View>
          <ChevronDown size={16} color="#6b7280" />
        </Pressable>

        {showPatientPicker && (
          <View style={{
            marginHorizontal: 16, borderRadius: 14, overflow: "hidden",
            backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, marginBottom: 8,
          }}>
            {MOCK_PATIENTS.map((p, i) => (
              <Pressable
                key={p.id}
                onPress={() => { setSelectedPatient(p); setShowPatientPicker(false); setSigned(false); }}
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

        {/* Rx form card */}
        <View style={{
          marginHorizontal: 16, marginTop: 8, borderRadius: 16,
          backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
          padding: 16,
        }}>
          <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "700",
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>
            Add Drug
          </Text>

          {/* Drug search */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600",
              textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Drug / Formulary Search
            </Text>
            <View style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: BG, borderRadius: 10, borderWidth: 1, borderColor: BORDER,
              paddingHorizontal: 12,
            }}>
              <Search size={15} color="#6b7280" />
              <TextInput
                style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 10,
                  color: "#f9fafb", fontSize: 15 }}
                placeholder="Search drug or generic name…"
                placeholderTextColor="#374151"
                value={drugQuery}
                onChangeText={handleDrugSearch}
              />
            </View>
            {suggestions.length > 0 && (
              <View style={{
                borderRadius: 10, overflow: "hidden",
                borderWidth: 1, borderColor: BORDER,
                backgroundColor: SURFACE, marginTop: 4,
              }}>
                {suggestions.map((s, i) => (
                  <Pressable
                    key={`${s.name}-${i}`}
                    onPress={() => selectDrug(s)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 14, paddingVertical: 12,
                      borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ color: "#f9fafb", fontWeight: "600" }}>
                      {s.name} {s.strength}
                    </Text>
                    <Text style={{ color: "#6b7280", fontSize: 12 }}>
                      {s.generic} · {s.form}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Field
            label="Dose"
            value={rx.dose}
            onChangeText={t => setRx(p => ({ ...p, dose: t }))}
            placeholder="e.g. 1 tab, 5 mL"
          />

          <ChipGroup
            label="Frequency"
            options={FREQUENCY_OPTIONS}
            selected={rx.frequency}
            onSelect={v => setRx(p => ({ ...p, frequency: v }))}
          />

          <Field
            label="Duration"
            value={rx.duration}
            onChangeText={t => setRx(p => ({ ...p, duration: t }))}
            placeholder="e.g. 7 days, 1 month"
          />

          <ChipGroup
            label="Route"
            options={ROUTE_OPTIONS}
            selected={rx.route}
            onSelect={v => setRx(p => ({ ...p, route: v }))}
          />

          <Pressable
            onPress={addToList}
            disabled={!rx.drug || !rx.dose}
            style={({ pressed }) => ({
              backgroundColor: (rx.drug && rx.dose) ? `${PRIMARY}20` : "#1e2332",
              borderRadius: 10, paddingVertical: 12, alignItems: "center",
              borderWidth: 1, borderColor: (rx.drug && rx.dose) ? PRIMARY : BORDER,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{
              color: (rx.drug && rx.dose) ? PRIMARY : "#4b5563",
              fontWeight: "700", fontSize: 14,
            }}>
              + Add to Prescription
            </Text>
          </Pressable>
        </View>

        {/* Rx list */}
        {rxList.length > 0 && (
          <>
            <View style={{
              marginHorizontal: 16, marginTop: 16, borderRadius: 16,
              backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
              overflow: "hidden",
            }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 12,
                borderBottomWidth: 1, borderBottomColor: BORDER }}>
                <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "700",
                  textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Prescription ({rxList.length} drug{rxList.length !== 1 ? "s" : ""})
                </Text>
              </View>
              {rxList.map((line, i) => (
                <View key={i} style={{
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 9,
                    backgroundColor: `${PRIMARY}15`,
                    alignItems: "center", justifyContent: "center", marginRight: 12,
                  }}>
                    <Pill size={16} color={PRIMARY} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#f9fafb", fontWeight: "600", fontSize: 14 }}>
                      {line.drug}
                    </Text>
                    <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
                      {line.dose} · {line.frequency} · {line.duration} · {line.route}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeFromList(i)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
                  >
                    <Trash2 size={15} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Interaction warning */}
            <View style={{
              marginHorizontal: 16, marginTop: 10, borderRadius: 14,
              backgroundColor: "#78350f20", borderWidth: 1, borderColor: "#92400e40",
              padding: 14, flexDirection: "row", alignItems: "center", gap: 10,
            }}>
              <AlertCircle size={16} color="#f59e0b" />
              <Text style={{ color: "#fcd34d", fontSize: 12, flex: 1 }}>
                {/* TODO: actions.checkInteractions(rxList) — cross-check with patient's active meds */}
                Interaction check pending. Review before signing.
              </Text>
            </View>

            {/* Sign & Send */}
            {signed ? (
              <View style={{
                marginHorizontal: 16, marginTop: 16, borderRadius: 14,
                backgroundColor: `${PRIMARY}20`, borderWidth: 1, borderColor: `${PRIMARY}40`,
                paddingVertical: 18, flexDirection: "row",
                alignItems: "center", justifyContent: "center", gap: 10,
              }}>
                <CheckCircle size={18} color={PRIMARY} />
                <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 15 }}>
                  Prescription sent to pharmacy
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={handleSign}
                style={({ pressed }) => ({
                  marginHorizontal: 16, marginTop: 16, borderRadius: 14,
                  backgroundColor: PRIMARY, paddingVertical: 17,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {/* TODO: actions.createMedicationRequests() — bulk insert into medication_requests,
                        status='active', prescriber_id = auth.uid(), tenant_id = jwt_tenant(),
                        triggers pharmacy dispense queue notification */}
                <CheckCircle size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                  Sign & Send to Pharmacy
                </Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
