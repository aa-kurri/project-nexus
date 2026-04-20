import { View, Text, ScrollView, Pressable, Alert, Switch } from "react-native";
import { useRouter } from "expo-router";
import { User, Shield, Phone, Heart, LogOut, ChevronRight, Building2, RefreshCcw } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, availableTenants, activeTenantId, switchTenant } = useAuthStore();

  const initials = profile?.full_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "??";

  const logout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          // authStore clearAuth + redirect handled by onAuthStateChange in _layout
        },
      },
    ]);
  };

  const handleSwitchHospital = () => {
    if (availableTenants.length < 2) {
      Alert.alert("Single hospital", "Your account is linked to one hospital only.");
      return;
    }
    Alert.alert(
      "Switch Hospital",
      "Select a hospital to work in:",
      availableTenants.map((t) => ({
        text: t.name,
        onPress: () => switchTenant(t.id),
      })),
      { cancelable: true }
    );
  };

  const ROWS = [
    { icon: User,   label: "Personal details",   sub: profile?.full_name ?? "—" },
    { icon: Shield, label: "ABHA ID",             sub: "Tap to link / view" },
    { icon: Heart,  label: "Medical history",     sub: "Allergies, conditions" },
    { icon: Phone,  label: "Emergency contacts",  sub: "Manage contacts" },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header — dynamic from store */}
      <View className="pt-14 pb-8 px-5 items-center" style={{ backgroundColor: "#0F766E" }}>
        <View className="h-20 w-20 rounded-full bg-white/20 items-center justify-center mb-3">
          <Text className="text-white text-3xl font-bold">{initials}</Text>
        </View>
        <Text className="text-white text-xl font-bold">{profile?.full_name ?? "Loading…"}</Text>
        <Text className="text-white/70 text-sm mt-0.5">
          {profile?.role?.toUpperCase()} · {profile?.tenant_name ?? profile?.tenant_id?.slice(0, 8)}
        </Text>
      </View>

      {/* Hospital context — shown for multi-hospital staff */}
      {availableTenants.length > 1 && (
        <Pressable
          onPress={handleSwitchHospital}
          className="mx-5 mt-4 bg-white rounded-2xl px-4 py-3.5 flex-row items-center shadow-sm shadow-black/5 active:opacity-70"
        >
          <View className="h-9 w-9 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: "#6366f115" }}>
            <Building2 size={16} color="#6366f1" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-900 text-sm">
              {availableTenants.find((t) => t.id === activeTenantId)?.name ?? "Current Hospital"}
            </Text>
            <Text className="text-xs text-indigo-400 mt-0.5">Tap to switch hospital</Text>
          </View>
          <RefreshCcw size={16} color="#6366f1" />
        </Pressable>
      )}

      {/* Profile rows */}
      <View className="mx-5 mt-4 bg-white rounded-2xl overflow-hidden shadow-sm shadow-black/5">
        {ROWS.map((r, i) => (
          <Pressable
            key={r.label}
            className="flex-row items-center px-4 py-4 active:bg-gray-50"
            style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "#f3f4f6" }}
          >
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

      {/* Contact info */}
      {(profile?.email || profile?.phone) && (
        <View className="mx-5 mt-4 bg-white rounded-2xl overflow-hidden shadow-sm shadow-black/5 px-4 py-3">
          {profile?.email && (
            <Text className="text-xs text-gray-400 mb-0.5">Email</Text>
          )}
          {profile?.email && (
            <Text className="text-sm text-gray-700 mb-2">{profile.email}</Text>
          )}
          {profile?.phone && (
            <Text className="text-xs text-gray-400 mb-0.5">Phone</Text>
          )}
          {profile?.phone && (
            <Text className="text-sm text-gray-700">{profile.phone}</Text>
          )}
        </View>
      )}

      {/* Sign out */}
      <Pressable
        onPress={logout}
        className="mx-5 mt-4 rounded-2xl py-4 flex-row items-center justify-center gap-2 bg-white shadow-sm shadow-black/5 active:opacity-70"
      >
        <LogOut size={16} color="#ef4444" />
        <Text className="font-semibold text-red-500">Sign out</Text>
      </Pressable>

      <Text className="text-center text-xs text-gray-300 mt-6">
        Ayura OS · {profile?.tenant_name ?? "—"} · v1.0.0
      </Text>
    </ScrollView>
  );
}
