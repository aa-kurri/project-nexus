import {
  View, Text, ScrollView, Pressable, Switch, ActivityIndicator,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { Settings2 } from "lucide-react-native";
import { getFeatureFlags, toggleFeatureFlag, bulkSetRoleFlags } from "./actions";
import type { FeatureFlag, MobileRole } from "./actions";
import { useAuthStore } from "../../../store/authStore";

const BG      = "hsl(220, 15%, 6%)";
const SURFACE = "hsl(220, 13%, 9%)";
const PRIMARY = "#0F766E";
const BORDER  = "#1e2332";

const ROLES: MobileRole[] = ["patient", "doctor", "admin", "staff"];

const ROLE_COLOR: Record<MobileRole, string> = {
  patient: "#6366f1",
  doctor:  PRIMARY,
  admin:   "#8b5cf6",
  staff:   "#f59e0b",
};

const ROLE_LABEL: Record<MobileRole, string> = {
  patient: "Patient",
  doctor:  "Doctor",
  admin:   "Admin",
  staff:   "Staff",
};

export default function FeatureFlagsScreen() {
  const profile = useAuthStore((s) => s.profile);

  const [flags,   setFlags]   = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState<Record<string, boolean>>({});
  const [activeRole, setActiveRole] = useState<MobileRole>("patient");

  // ── Load flags on mount ────────────────────────────────────────────────────
  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const data = await getFeatureFlags();
      setFlags(data);
    } catch {
      // TODO: surface toast error
    } finally {
      setLoading(false);
    }
  };

  // ── Optimistic toggle ──────────────────────────────────────────────────────
  const handleToggle = useCallback(async (flag: FeatureFlag) => {
    const next = !flag.enabled;
    // Optimistic update
    setFlags(prev =>
      prev.map(f => f.id === flag.id ? { ...f, enabled: next } : f)
    );
    setBusy(prev => ({ ...prev, [flag.id]: true }));
    try {
      await toggleFeatureFlag(flag.id, next);
    } catch {
      // Revert on failure
      setFlags(prev =>
        prev.map(f => f.id === flag.id ? { ...f, enabled: flag.enabled } : f)
      );
    } finally {
      setBusy(prev => ({ ...prev, [flag.id]: false }));
    }
  }, []);

  // ── Bulk toggle for a role ─────────────────────────────────────────────────
  const handleBulk = useCallback(async (role: MobileRole, enabled: boolean) => {
    if (!profile?.tenant_id) return;
    setFlags(prev =>
      prev.map(f => f.mobile_role === role ? { ...f, enabled } : f)
    );
    try {
      await bulkSetRoleFlags(role, enabled, profile.tenant_id);
    } catch {
      await loadFlags(); // re-sync on error
    }
  }, [profile?.tenant_id]);

  // ── Filtered flags for selected role ──────────────────────────────────────
  const visibleFlags = flags.filter(f => f.mobile_role === activeRole);
  const allOn  = visibleFlags.every(f => f.enabled);
  const allOff = visibleFlags.every(f => !f.enabled);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10,
            backgroundColor: `${PRIMARY}20`, alignItems: "center", justifyContent: "center" }}>
            <Settings2 size={18} color={PRIMARY} />
          </View>
          <View>
            <Text style={{ color: "#f9fafb", fontSize: 20, fontWeight: "700" }}>Feature Flags</Text>
            <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 1 }}>
              Role × feature matrix for this tenant
            </Text>
          </View>
        </View>
      </View>

      {/* Role tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, flexDirection: "row" }}
      >
        {ROLES.map(role => {
          const active = activeRole === role;
          const color  = ROLE_COLOR[role];
          return (
            <Pressable
              key={role}
              onPress={() => setActiveRole(role)}
              style={({ pressed }) => ({
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                backgroundColor: active ? `${color}20` : SURFACE,
                borderWidth: 1, borderColor: active ? color : BORDER,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: active ? color : "#9ca3af", fontWeight: "600", fontSize: 13 }}>
                {ROLE_LABEL[role]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Bulk actions */}
      <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 8,
        flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={() => handleBulk(activeRole, true)}
          disabled={allOn}
          style={({ pressed }) => ({
            flex: 1, paddingVertical: 10, borderRadius: 10,
            backgroundColor: allOn ? SURFACE : `${PRIMARY}20`,
            borderWidth: 1, borderColor: allOn ? BORDER : PRIMARY,
            alignItems: "center", opacity: pressed || allOn ? 0.5 : 1,
          })}
        >
          <Text style={{ color: allOn ? "#4b5563" : PRIMARY, fontWeight: "600", fontSize: 13 }}>
            Enable All
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleBulk(activeRole, false)}
          disabled={allOff}
          style={({ pressed }) => ({
            flex: 1, paddingVertical: 10, borderRadius: 10,
            backgroundColor: allOff ? SURFACE : "#ef444420",
            borderWidth: 1, borderColor: allOff ? BORDER : "#ef4444",
            alignItems: "center", opacity: pressed || allOff ? 0.5 : 1,
          })}
        >
          <Text style={{ color: allOff ? "#4b5563" : "#f87171", fontWeight: "600", fontSize: 13 }}>
            Disable All
          </Text>
        </Pressable>
      </View>

      {/* Flag list */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={PRIMARY} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          <View style={{ borderRadius: 16, backgroundColor: SURFACE,
            borderWidth: 1, borderColor: BORDER, overflow: "hidden" }}>
            {visibleFlags.length === 0 ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <Text style={{ color: "#4b5563" }}>No flags for this role.</Text>
              </View>
            ) : (
              visibleFlags.map((flag, i) => (
                <View
                  key={flag.id}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    paddingHorizontal: 16, paddingVertical: 14,
                    borderTopWidth: i === 0 ? 0 : 1, borderTopColor: BORDER,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#f9fafb", fontWeight: "600" }}>{flag.label}</Text>
                    <Text style={{ color: "#4b5563", fontSize: 11, marginTop: 3, fontFamily: "monospace" }}>
                      {flag.feature_key}
                    </Text>
                  </View>
                  {busy[flag.id] ? (
                    <ActivityIndicator color={PRIMARY} size="small" />
                  ) : (
                    <Switch
                      value={flag.enabled}
                      onValueChange={() => handleToggle(flag)}
                      trackColor={{ false: "#374151", true: `${PRIMARY}80` }}
                      thumbColor={flag.enabled ? PRIMARY : "#6b7280"}
                    />
                  )}
                </View>
              ))
            )}
          </View>

          {/* Stats footer */}
          <Text style={{ color: "#4b5563", fontSize: 12, textAlign: "center", marginTop: 16 }}>
            {visibleFlags.filter(f => f.enabled).length} / {visibleFlags.length} features enabled
            for {ROLE_LABEL[activeRole]}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
