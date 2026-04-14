import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Activity, FileText, Calendar, Phone } from "lucide-react-native";

const QUICK_LINKS = [
  { icon: FileText,  label: "Lab Reports",    color: "#0F766E", href: "/reports" },
  { icon: Calendar,  label: "Appointments",   color: "#6366f1", href: "/appointments" },
  { icon: Activity,  label: "Vitals",         color: "#f59e0b", href: "/reports" },
  { icon: Phone,     label: "Consult",        color: "#ec4899", href: "/appointments" },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View className="px-5 pt-16 pb-8" style={{ backgroundColor: "#0F766E" }}>
        <Text className="text-white/80 text-sm font-medium">Good morning,</Text>
        <Text className="text-white text-2xl font-bold mt-0.5">Ramesh Kumar</Text>
        <Text className="text-white/70 text-sm mt-1">MRN-1001 · ABHA: 91-1234-5678-9012</Text>
      </View>

      {/* Next Appointment Card */}
      <View className="mx-5 -mt-5 rounded-2xl bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Next Appointment
        </Text>
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 rounded-xl items-center justify-center"
            style={{ backgroundColor: "#0F766E15" }}>
            <Calendar color="#0F766E" size={22} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900">Dr. Sharma — OPD</Text>
            <Text className="text-gray-500 text-sm mt-0.5">Tomorrow, 10:30 AM · General OPD</Text>
          </View>
        </View>
      </View>

      {/* Quick Links */}
      <View className="px-5 mt-6">
        <Text className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Quick Access</Text>
        <View className="flex-row flex-wrap gap-3">
          {QUICK_LINKS.map(({ icon: Icon, label, color, href }) => (
            <Pressable
              key={label}
              onPress={() => router.push(href as any)}
              className="flex-1 min-w-[140px] rounded-2xl bg-white p-4 active:opacity-70 shadow-sm shadow-black/5"
            >
              <View className="h-10 w-10 rounded-xl items-center justify-center mb-3"
                style={{ backgroundColor: color + "15" }}>
                <Icon color={color} size={20} />
              </View>
              <Text className="font-semibold text-gray-800 text-sm">{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Recent Results */}
      <View className="px-5 mt-6">
        <Text className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Recent Results</Text>
        <View className="rounded-2xl bg-white overflow-hidden shadow-sm shadow-black/5">
          {[
            { test: "CBC Panel",    date: "Apr 14", flag: "abnormal" },
            { test: "HbA1c",        date: "Mar 22", flag: "normal" },
            { test: "Lipid Profile",date: "Mar 10", flag: "normal" },
          ].map((r, i) => (
            <Pressable key={r.test} onPress={() => router.push("/reports" as any)}
              className="flex-row items-center justify-between px-4 py-3.5 active:bg-gray-50"
              style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "#f3f4f6" }}>
              <View>
                <Text className="font-semibold text-gray-900">{r.test}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">{r.date}</Text>
              </View>
              <View className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: r.flag === "abnormal" ? "#fef3c7" : "#d1fae5" }}>
                <Text className="text-xs font-semibold"
                  style={{ color: r.flag === "abnormal" ? "#d97706" : "#059669" }}>
                  {r.flag}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
