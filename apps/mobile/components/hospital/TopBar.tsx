import { View, Text, Pressable } from "react-native";
import { Building2, Bell } from "lucide-react-native";
import { useAuthStore } from "../../store/authStore";

interface TopBarProps {
  title?: string;
  showHospital?: boolean;
}

export default function TopBar({ title, showHospital = true }: TopBarProps) {
  const { profile, availableTenants, activeTenantId, switchTenant } = useAuthStore();

  const hospitalName =
    availableTenants.find((t) => t.id === activeTenantId)?.name ??
    profile?.tenant_name ??
    "Ayura OS";

  return (
    <View
      style={{
        backgroundColor: "hsl(220, 13%, 9%)",
        borderBottomWidth: 1,
        borderBottomColor: "#1e2332",
        paddingTop: 52,
        paddingBottom: 12,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        {showHospital && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 1 }}>
            <Building2 size={11} color="#6b7280" />
            <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "500" }}>
              {hospitalName}
            </Text>
          </View>
        )}
        <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "700" }}>
          {title ?? "Ayura OS"}
        </Text>
      </View>

      <Pressable
        style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: "rgba(255,255,255,0.05)",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Bell size={18} color="#9ca3af" />
      </Pressable>
    </View>
  );
}
