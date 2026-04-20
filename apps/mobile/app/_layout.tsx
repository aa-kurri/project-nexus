import "../global.css";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import type { Profile } from "../lib/supabase";

const BG = "hsl(220, 15%, 6%)";

async function fetchProfile(userId: string): Promise<Profile | null> {
  // Join profiles → tenants to get hospital name in one query
  const { data } = await supabase
    .from("profiles")
    .select(`
      id, tenant_id, role, full_name, email, phone, avatar_url,
      tenants ( name, logo_url )
    `)
    .eq("id", userId)
    .single();

  if (!data) return null;

  return {
    id:          data.id,
    tenant_id:   data.tenant_id,
    role:        data.role,
    full_name:   data.full_name,
    email:       data.email,
    phone:       data.phone,
    avatar_url:  data.avatar_url,
    tenant_name: (data.tenants as any)?.name,
    tenant_logo: (data.tenants as any)?.logo_url,
  };
}

async function fetchAvailableTenants(userId: string) {
  // Staff may be linked to multiple tenants via tenant_members table
  const { data } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants ( id, name, logo_url )")
    .eq("user_id", userId);

  if (!data || data.length === 0) return [];

  return data.map((m: any) => ({
    id:   m.tenants.id,
    name: m.tenants.name,
    logo: m.tenants.logo_url,
  }));
}

export default function RootLayout() {
  const { setSession, setProfile, clearAuth, setLoading, isLoading, setAvailableTenants } =
    useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // ── 1. Hydrate from existing session on cold start ───────────────────────
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        const profile = await fetchProfile(session.user.id);
        if (profile) setProfile(profile);

        // Load any additional hospital memberships
        const tenants = await fetchAvailableTenants(session.user.id);
        if (tenants.length > 0) setAvailableTenants(tenants);
      }
      setLoading(false);
    });

    // ── 2. React to auth state changes (login / logout / token refresh) ──────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session || event === "SIGNED_OUT") {
        clearAuth();
        router.replace("/login");
        return;
      }
      setSession(session);
      const profile = await fetchProfile(session.user.id);
      if (profile) setProfile(profile);

      const tenants = await fetchAvailableTenants(session.user.id);
      if (tenants.length > 0) setAvailableTenants(tenants);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show a branded splash while we resolve the session
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#0F766E" size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
