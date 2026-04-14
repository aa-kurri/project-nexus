import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, WifiOff, Download } from "lucide-react-native";

const DETAIL: Record<string, { test: string; results: { name: string; value: string; ref: string; flag: string }[] }> = {
  "DR-441": {
    test: "CBC + LFT Panel",
    results: [
      { name: "WBC",         value: "15.2 10³/µL", ref: "4.0–11.0",    flag: "H" },
      { name: "Haemoglobin", value: "9.1 g/dL",    ref: "12.0–17.5",   flag: "L" },
      { name: "Platelets",   value: "220 10³/µL",  ref: "150–400",     flag: "N" },
      { name: "ALT",         value: "38 U/L",       ref: "7–56",        flag: "N" },
      { name: "Creatinine",  value: "1.9 mg/dL",   ref: "0.6–1.2",    flag: "H" },
    ],
  },
};

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const data    = DETAIL[id] ?? { test: id, results: [] };

  const flagColor = (f: string) =>
    f === "H" ? "#dc2626" : f === "L" ? "#d97706" : "#059669";

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="bg-white pt-14 px-5 pb-5 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2 mb-3 active:opacity-60">
          <ArrowLeft size={18} color="#6b7280" />
          <Text className="text-gray-500 text-sm">Reports</Text>
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">{data.test}</Text>
        <View className="flex-row items-center gap-3 mt-2">
          <Text className="text-xs text-gray-400 font-mono">{id}</Text>
          <View className="flex-row items-center gap-1">
            <WifiOff size={10} color="#9ca3af" />
            <Text className="text-xs text-gray-400">Cached</Text>
          </View>
        </View>
      </View>

      {/* Results table */}
      <View className="mx-5 mt-5 bg-white rounded-2xl overflow-hidden shadow-sm shadow-black/5">
        <View className="flex-row px-4 py-3 bg-gray-50 border-b border-gray-100">
          {["Test", "Value", "Ref Range", "Flag"].map(h => (
            <Text key={h} className="flex-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</Text>
          ))}
        </View>
        {data.results.map((r, i) => (
          <View key={r.name}
            className="flex-row items-center px-4 py-3.5"
            style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "#f3f4f6" }}>
            <Text className="flex-1 text-sm font-medium text-gray-900">{r.name}</Text>
            <Text className="flex-1 text-sm font-mono text-gray-700">{r.value}</Text>
            <Text className="flex-1 text-xs text-gray-400">{r.ref}</Text>
            <View className="flex-1 items-start">
              <View className="rounded-full w-6 h-6 items-center justify-center"
                style={{ backgroundColor: flagColor(r.flag) + "20" }}>
                <Text className="text-xs font-bold" style={{ color: flagColor(r.flag) }}>{r.flag}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Download */}
      <Pressable className="mx-5 mt-4 rounded-2xl py-4 flex-row items-center justify-center gap-2 active:opacity-80"
        style={{ backgroundColor: "#0F766E" }}>
        <Download size={18} color="#fff" />
        <Text className="text-white font-bold">Download PDF</Text>
      </Pressable>
    </ScrollView>
  );
}
