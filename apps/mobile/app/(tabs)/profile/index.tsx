import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { User, Shield, Phone, Heart, LogOut, ChevronRight } from "lucide-react-native";

const ROWS = [
  { icon: User,   label: "Personal details",    sub: "Name, DOB, address" },
  { icon: Shield, label: "ABHA ID",             sub: "91-1234-5678-9012" },
  { icon: Heart,  label: "Medical history",     sub: "Allergies, conditions" },
  { icon: Phone,  label: "Emergency contacts",  sub: "2 contacts saved" },
];

export default function ProfileScreen() {
  const router = useRouter();

  const logout = () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive",
        onPress: () => router.replace("/login") },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="pt-14 pb-8 px-5 items-center" style={{ backgroundColor: "#0F766E" }}>
        <View className="h-20 w-20 rounded-full bg-white/20 items-center justify-center mb-3">
          <Text className="text-white text-3xl font-bold">RK</Text>
        </View>
        <Text className="text-white text-xl font-bold">Ramesh Kumar</Text>
        <Text className="text-white/70 text-sm mt-0.5">MRN-1001</Text>
      </View>

      <View className="mx-5 mt-5 bg-white rounded-2xl overflow-hidden shadow-sm shadow-black/5">
        {ROWS.map((r, i) => (
          <Pressable key={r.label}
            className="flex-row items-center px-4 py-4 active:bg-gray-50"
            style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "#f3f4f6" }}>
            <View className="h-9 w-9 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: "#0F766E15" }}>
              <r.icon size={16} color="#0F766E" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 text-sm">{r.label}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">{r.sub}</Text>
            </View>
            <ChevronRight size={16} color="#d1d5db" />
          </Pressable>
        ))}
      </View>

      <Pressable onPress={logout}
        className="mx-5 mt-4 rounded-2xl py-4 flex-row items-center justify-center gap-2 bg-white shadow-sm shadow-black/5 active:opacity-70">
        <LogOut size={16} color="#ef4444" />
        <Text className="font-semibold text-red-500">Sign out</Text>
      </Pressable>

      <Text className="text-center text-xs text-gray-300 mt-6">Ayura Patient v1.0.0 · health.ayura.patient</Text>
    </ScrollView>
  );
}
