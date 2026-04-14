import {
  View, Text, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

type Step = "phone" | "otp";

export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep]     = useState<Step>("phone");
  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const requestOTP = () => {
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setLoading(true);
    // TODO: supabase.auth.signInWithOtp({ phone: "+91" + phone })
    setTimeout(() => { setLoading(false); setStep("otp"); }, 1200);
  };

  const verifyOTP = () => {
    if (otp.length < 6) { setError("Enter the 6-digit code"); return; }
    setError("");
    setLoading(true);
    // TODO: supabase.auth.verifyOtp({ phone, token: otp, type: "sms" })
    setTimeout(() => { setLoading(false); router.replace("/(tabs)"); }, 1500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        {/* Logo */}
        <View className="mb-10 items-start">
          <View className="h-14 w-14 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: "#0F766E" }}>
            <Text className="text-white text-2xl font-bold">A</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900">Ayura Patient</Text>
          <Text className="text-gray-500 mt-1">Your health records, always with you</Text>
        </View>

        {step === "phone" ? (
          <View className="space-y-4">
            <Text className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Mobile number
            </Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              <View className="px-4 py-4 border-r border-gray-200">
                <Text className="text-gray-700 font-semibold">+91</Text>
              </View>
              <TextInput
                className="flex-1 px-4 py-4 text-gray-900 text-base"
                placeholder="98765 43210"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={t => { setPhone(t); setError(""); }}
              />
            </View>
            {error ? <Text className="text-red-500 text-sm">{error}</Text> : null}
            <Pressable
              onPress={requestOTP}
              disabled={loading}
              className="rounded-xl py-4 items-center mt-2 active:opacity-80"
              style={{ backgroundColor: "#0F766E" }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">Send OTP</Text>}
            </Pressable>
          </View>
        ) : (
          <View className="space-y-4">
            <Text className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">
              6-digit code sent to +91 {phone}
            </Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-2xl tracking-[12px] text-center bg-gray-50"
              placeholder="------"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={t => { setOtp(t); setError(""); }}
              autoFocus
            />
            {error ? <Text className="text-red-500 text-sm text-center">{error}</Text> : null}
            <Pressable
              onPress={verifyOTP}
              disabled={loading}
              className="rounded-xl py-4 items-center mt-2 active:opacity-80"
              style={{ backgroundColor: "#0F766E" }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">Verify &amp; Continue</Text>}
            </Pressable>
            <Pressable onPress={() => { setStep("phone"); setOtp(""); }}>
              <Text className="text-center text-gray-400 text-sm mt-2">Change number</Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
