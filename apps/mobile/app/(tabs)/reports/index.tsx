import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { FileText, WifiOff } from "lucide-react-native";

const REPORTS = [
  { id: "DR-441", test: "CBC + LFT Panel",  date: "Apr 14, 2026", flag: "abnormal", cached: true },
  { id: "DR-440", test: "HbA1c",            date: "Mar 22, 2026", flag: "normal",   cached: true },
  { id: "DR-439", test: "Lipid Profile",     date: "Mar 10, 2026", flag: "normal",   cached: true },
  { id: "DR-420", test: "Urine Routine",     date: "Feb 01, 2026", flag: "normal",   cached: false },
];

export default function ReportsScreen() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="px-5 pt-14 pb-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Lab Reports</Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <WifiOff size={12} color="#9ca3af" />
          <Text className="text-xs text-gray-400">Last 10 reports available offline</Text>
        </View>
      </View>

      <View className="px-5 mt-4 space-y-3">
        {REPORTS.map(r => (
          <Pressable key={r.id}
            onPress={() => router.push(`/reports/${r.id}` as any)}
            className="bg-white rounded-2xl p-4 flex-row items-center gap-4 active:opacity-70 shadow-sm shadow-black/5">
            <View className="h-11 w-11 rounded-xl items-center justify-center"
              style={{ backgroundColor: r.flag === "abnormal" ? "#fef3c720" : "#d1fae520" }}>
              <FileText size={20} color={r.flag === "abnormal" ? "#d97706" : "#059669"} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">{r.test}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">{r.date} · {r.id}</Text>
            </View>
            <View className="items-end gap-1.5">
              <View className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: r.flag === "abnormal" ? "#fef3c7" : "#d1fae5" }}>
                <Text className="text-xs font-semibold"
                  style={{ color: r.flag === "abnormal" ? "#d97706" : "#059669" }}>
                  {r.flag}
                </Text>
              </View>
              {r.cached && (
                <View className="flex-row items-center gap-1">
                  <WifiOff size={9} color="#9ca3af" />
                  <Text className="text-[10px] text-gray-400">Offline</Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
