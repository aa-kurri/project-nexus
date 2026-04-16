import { View, Text, ScrollView, Pressable } from "react-native";
import { FlaskConical, Clock, CheckCircle, Upload, ChevronRight } from "lucide-react-native";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

type SampleStatus = "pending_collection" | "collected" | "processing" | "resulted";

const STATUS_META: Record<SampleStatus, { label: string; color: string }> = {
  pending_collection: { label: "Pending",    color: "#f59e0b" },
  collected:          { label: "Collected",  color: "#6366f1" },
  processing:         { label: "Processing", color: PRIMARY   },
  resulted:           { label: "Resulted",   color: "#059669" },
};

// TODO: fetch from lab_samples joined with service_requests and patients
//       filtered by tenant_id = jwt_tenant() and collected_at IS NULL (for collection queue)
const MOCK_SAMPLES = [
  { id: "ls-1", barcode: "LAB-20260415-001", patient: "Ramesh Kumar", test: "CBC + LFT",    ward: "GA-01",  status: "pending_collection" as SampleStatus },
  { id: "ls-2", barcode: "LAB-20260415-002", patient: "Priya Sharma", test: "HbA1c",        ward: "GA-04",  status: "collected"          as SampleStatus },
  { id: "ls-3", barcode: "LAB-20260415-003", patient: "Anita Verma",  test: "Blood Culture", ward: "ICU-01", status: "processing"         as SampleStatus },
  { id: "ls-4", barcode: "LAB-20260415-004", patient: "Suresh Patel", test: "Urine R/M",    ward: "GA-02",  status: "resulted"           as SampleStatus },
];

const TABS: { key: SampleStatus | "all"; label: string }[] = [
  { key: "all",                label: "All"        },
  { key: "pending_collection", label: "Pending"    },
  { key: "collected",          label: "Collected"  },
  { key: "processing",         label: "Processing" },
  { key: "resulted",           label: "Resulted"   },
];

import { useState } from "react";

export default function LabScreen() {
  const [activeTab, setActiveTab] = useState<SampleStatus | "all">("all");

  const visible = activeTab === "all"
    ? MOCK_SAMPLES
    : MOCK_SAMPLES.filter(s => s.status === activeTab);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "700" }}>Lab Collection</Text>
        <Text style={{ color: "#6b7280", marginTop: 4 }}>
          {MOCK_SAMPLES.filter(s => s.status === "pending_collection").length} samples awaiting collection
        </Text>
      </View>

      {/* Status filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 48 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, flexDirection: "row" }}
      >
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={({ pressed }) => ({
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                backgroundColor: active ? `${PRIMARY}20` : SURFACE,
                borderWidth: 1, borderColor: active ? PRIMARY : BORDER,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: active ? PRIMARY : "#9ca3af", fontWeight: "600", fontSize: 13 }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sample list */}
      <ScrollView
        style={{ marginTop: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <View style={{ borderRadius: 16, backgroundColor: SURFACE,
          borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
          {visible.length === 0 ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: "#4b5563" }}>No samples in this category.</Text>
            </View>
          ) : visible.map((sample, i) => {
            const meta = STATUS_META[sample.status];
            return (
              <Pressable
                key={sample.id}
                style={({ pressed }) => ({
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                  flexDirection: "row", alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10,
                  backgroundColor: `${meta.color}15`, alignItems: "center",
                  justifyContent: "center", marginRight: 12 }}>
                  <FlaskConical size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{sample.patient}</Text>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                    {sample.test} · {sample.ward}
                  </Text>
                  <Text style={{ color: "#4b5563", fontSize: 11, marginTop: 2,
                    fontFamily: "monospace" }}>{sample.barcode}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                    backgroundColor: `${meta.color}20` }}>
                    <Text style={{ color: meta.color, fontSize: 11, fontWeight: "700" }}>
                      {meta.label}
                    </Text>
                  </View>
                  {sample.status === "pending_collection" && (
                    /* TODO: actions.markCollected(sample.id) — updates lab_samples.collected_at */
                    <CheckCircle size={18} color={PRIMARY} />
                  )}
                  {sample.status === "resulted" && (
                    /* TODO: actions.uploadResult(sample.id) — attaches to diagnostic_reports */
                    <Upload size={18} color="#6366f1" />
                  )}
                  {!["pending_collection", "resulted"].includes(sample.status) && (
                    <ChevronRight size={14} color="#4b5563" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
