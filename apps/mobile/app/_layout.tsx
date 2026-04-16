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
  const { data } = await supabase
    .from("profiles")
    .select("id, tenant_id, role, full_name")
    .eq("id", userId)
    .single<Profile>();
  return data ?? null;
}

export default function RootLayout() {
  const { setSession, setProfile, clearAuth, setLoading, isLoading } =
    useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // ── 1. Hydrate from existing session on cold start ───────────────────────
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        const profile = await fetchProfile(session.user.id);
        if (profile) setProfile(profile);
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
