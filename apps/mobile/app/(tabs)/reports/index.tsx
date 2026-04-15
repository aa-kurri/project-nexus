import { View, Text, ScrollView } from "react-native";
import { WifiOff } from "lucide-react-native";
import OfflineReportList from "@/components/reports/OfflineReportList";

export default function ReportsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View className="px-5 pt-14 pb-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Lab Reports</Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <WifiOff size={12} color="#9ca3af" />
          <Text className="text-xs text-gray-400">Last 10 reports available offline</Text>
        </View>
      </View>

      {/* Offline-aware list — reads from FileSystem cache when disconnected */}
      <OfflineReportList />
    </ScrollView>
  );
}
