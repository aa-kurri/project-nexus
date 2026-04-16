import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  Settings2, LogOut, Bell, HelpCircle, Shield,
  ChevronRight, User,
} from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

const ROLE_COLOR: Record<string, string> = {
  patient:    "#6366f1",
  doctor:     PRIMARY,
  admin:      "#8b5cf6",
  staff:      "#f59e0b",
  nurse:      "#6366f1",
  pharmacist: "#f59e0b",
  lab_manager:"#ec4899",
  su:         "#8b5cf6",
};

const ROLE_LABEL: Record<string, string> = {
  patient:    "Patient",
  doctor:     "Doctor",
  admin:      "Administrator",
  nurse:      "Nurse",
  pharmacist: "Pharmacist",
  lab_manager:"Lab Manager",
  su:         "Super Admin",
};

type MenuItem = {
  key:   string;
  label: string;
  sub?:  string;
  Icon:  React.ComponentType<{ size: number; color: string }>;
  color: string;
  route?: string;
  action?: () => void;
};

export default function MoreScreen() {
  const router     = useRouter();
  const profile    = useAuthStore((s) => s.profile);
  const mobileRole = useAuthStore((s) => s.mobileRole);
  const clearAuth  = useAuthStore((s) => s.clearAuth);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
    router.replace("/login");
  };

  // Admin-only item: Feature Flags
  const adminItems: MenuItem[] = mobileRole === "admin" ? [
    {
      key:   "feature-flags",
      label: "Feature Flags",
      sub:   "Role × feature matrix",
      Icon:  Settings2,
      color: "#8b5cf6",
      route: "/(tabs)/admin/feature-flags",
    },
  ] : [];

  const items: MenuItem[] = [
    ...adminItems,
    {
      key:   "notifications",
      label: "Notifications",
      sub:   "Alert preferences",
      Icon:  Bell,
      color: "#f59e0b",
      // TODO: route to notifications settings screen
    },
    {
      key:   "privacy",
      label: "Privacy & Security",
      sub:   "Session, data, 2FA",
      Icon:  Shield,
      color: PRIMARY,
      // TODO: route to security screen
    },
    {
      key:   "help",
      label: "Help & Support",
      sub:   "FAQ, contact us",
      Icon:  HelpCircle,
      color: "#6366f1",
      // TODO: route to help screen / open URL
    },
    {
      key:    "sign-out",
      label:  "Sign Out",
      Icon:   LogOut,
      color:  "#ef4444",
      action: handleSignOut,
    },
  ];

  const roleColor = ROLE_COLOR[profile?.role ?? mobileRole] ?? PRIMARY;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Profile card */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28,
            backgroundColor: `${roleColor}25`, alignItems: "center", justifyContent: "center" }}>
            <User size={26} color={roleColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "700" }}>
              {profile?.full_name ?? "—"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                backgroundColor: `${roleColor}20` }}>
                <Text style={{ color: roleColor, fontSize: 11, fontWeight: "700" }}>
                  {ROLE_LABEL[profile?.role ?? mobileRole] ?? mobileRole.toUpperCase()}
                </Text>
              </View>
              <Text style={{ color: "#4b5563", fontSize: 12 }}>
                {profile?.tenant_id ? `Tenant …${profile.tenant_id.slice(-6)}` : ""}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Menu items */}
      <View style={{ marginHorizontal: 16, borderRadius: 16,
        backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
        {items.map((item, i) => (
          <Pressable
            key={item.key}
            onPress={item.action ?? (item.route ? () => router.push(item.route as never) : undefined)}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: 16, paddingVertical: 16,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10,
              backgroundColor: `${item.color}20`, alignItems: "center",
              justifyContent: "center", marginRight: 14 }}>
              <item.Icon size={18} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: item.key === "sign-out" ? "#f87171" : "#f9fafb",
                fontWeight: "600",
              }}>
                {item.label}
              </Text>
              {item.sub && (
                <Text style={{ color: "#4b5563", fontSize: 12, marginTop: 2 }}>{item.sub}</Text>
              )}
            </View>
            {item.key !== "sign-out" && (
              <ChevronRight size={16} color="#374151" />
            )}
          </Pressable>
        ))}
      </View>

      <Text style={{ color: "#374151", fontSize: 11, textAlign: "center", marginTop: 24 }}>
        Ayura OS · v1.0.0
      </Text>
    </ScrollView>
  );
}
