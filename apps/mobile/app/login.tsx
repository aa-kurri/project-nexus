import {
  View, Text, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import type { Profile } from "../lib/supabase";

type Step = "phone" | "otp";

export default function LoginScreen() {
  const router   = useRouter();
  const { setSession, setProfile } = useAuthStore();

  const [step,    setStep]    = useState<Step>("phone");
  const [phone,   setPhone]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const requestOTP = async () => {
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep("otp");
  };

  const verifyOTP = async () => {
    if (otp.length < 6) { setError("Enter the 6-digit code"); return; }
    setError("");
    setLoading(true);

    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token: otp,
      type:  "sms",
    });

    if (err || !data.session) {
      setLoading(false);
      setError(err?.message ?? "Verification failed — please retry");
      return;
    }

    setSession(data.session);

    // Load profile to derive mobileRole before navigating
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, tenant_id, role, full_name")
      .eq("id", data.session.user.id)
      .single<Profile>();

    if (profile) setProfile(profile);

    setLoading(false);
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "hsl(220, 15%, 6%)" }}
    >
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}>
        {/* Logo */}
        <View style={{ marginBottom: 40 }}>
          <View style={{
            height: 56, width: 56, borderRadius: 16,
            backgroundColor: "#0F766E",
            alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>A</Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>Ayura OS</Text>
          <Text style={{ color: "#9ca3af", marginTop: 4 }}>Sign in to your workspace</Text>
        </View>

        {step === "phone" ? (
          <View style={{ gap: 12 }}>
            <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "600",
              textTransform: "uppercase", letterSpacing: 1 }}>
              Mobile number
            </Text>
            <View style={{
              flexDirection: "row", alignItems: "center",
              borderWidth: 1, borderColor: "#1e2332", borderRadius: 12,
              backgroundColor: "hsl(220, 13%, 9%)", overflow: "hidden",
            }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 16,
                borderRightWidth: 1, borderRightColor: "#1e2332" }}>
                <Text style={{ color: "#e5e7eb", fontWeight: "600" }}>+91</Text>
              </View>
              <TextInput
                style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16,
                  color: "#f9fafb", fontSize: 16 }}
                placeholder="98765 43210"
                placeholderTextColor="#4b5563"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={t => { setPhone(t); setError(""); }}
              />
            </View>
            {error ? <Text style={{ color: "#f87171", fontSize: 13 }}>{error}</Text> : null}
            <Pressable
              onPress={requestOTP}
              disabled={loading}
              style={({ pressed }) => ({
                backgroundColor: "#0F766E",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: 4,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Send OTP</Text>}
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "600",
              textTransform: "uppercase", letterSpacing: 1 }}>
              6-digit code sent to +91 {phone}
            </Text>
            <TextInput
              style={{
                borderWidth: 1, borderColor: "#1e2332", borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 16,
                color: "#f9fafb", fontSize: 24, letterSpacing: 12,
                textAlign: "center", backgroundColor: "hsl(220, 13%, 9%)",
              }}
              placeholder="------"
              placeholderTextColor="#4b5563"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={t => { setOtp(t); setError(""); }}
              autoFocus
            />
            {error ? <Text style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>{error}</Text> : null}
            <Pressable
              onPress={verifyOTP}
              disabled={loading}
              style={({ pressed }) => ({
                backgroundColor: "#0F766E",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: 4,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Verify &amp; Continue</Text>}
            </Pressable>
            <Pressable onPress={() => { setStep("phone"); setOtp(""); }}>
              <Text style={{ textAlign: "center", color: "#6b7280", fontSize: 13, marginTop: 4 }}>
                Change number
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
