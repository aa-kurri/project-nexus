import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Activity, FileText, Calendar, Phone, Bell } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

interface NextAppointment {
  id: string;
  reason: string | null;
  started_at: string;
  practitioner_name: string | null;
}

interface RecentResult {
  id: string;
  display: string;
  effective_at: string;
  flag: string | null;
}

const QUICK_LINKS = [
  { icon: FileText,  label: "Lab Reports",   color: "#0F766E", href: "/reports" },
  { icon: Calendar,  label: "Appointments",  color: "#6366f1", href: "/appointments" },
  { icon: Activity,  label: "Vitals",        color: "#f59e0b", href: "/health" },
  { icon: Phone,     label: "Consult",       color: "#ec4899", href: "/appointments/booking" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();

  const [nextAppt, setNextAppt] = useState<NextAppointment | null>(null);
  const [results, setResults] = useState<RecentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    (async () => {
      // Fetch next upcoming appointment
      const { data: appts } = await supabase
        .from("encounters")
        .select("id, reason, started_at, practitioner_id")
        .eq("tenant_id", profile.tenant_id)
        .gte("started_at", new Date().toISOString())
        .eq("status", "planned")
        .order("started_at", { ascending: true })
        .limit(1);

      // Fetch recent lab observations
      const { data: obs } = await supabase
        .from("observations")
        .select("id, display, effective_at, flag")
        .eq("tenant_id", profile.tenant_id)
        .order("effective_at", { ascending: false })
        .limit(5);

      if (!cancelled) {
        setNextAppt(appts?.[0] ? {
          id:               appts[0].id,
          reason:           appts[0].reason,
          started_at:       appts[0].started_at,
          practitioner_name: null, // FK join in production
        } : null);
        setResults(obs ?? []);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profile?.tenant_id]);

  const initials = profile?.full_name
    ?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "—";

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View className="px-5 pt-16 pb-8" style={{ backgroundColor: "#0F766E" }}>
        <View className="flex-row items-center justify-between mb-1">
          <View>
            <Text className="text-white/80 text-sm font-medium">{greeting()},</Text>
            <Text className="text-white text-2xl font-bold mt-0.5">
              {profile?.full_name ?? "Loading…"}
            </Text>
          </View>
          <View className="flex-row gap-3 items-center">
            <Pressable className="p-2 rounded-full bg-white/10 active:opacity-70">
              <Bell size={20} color="white" />
            </Pressable>
            <View className="h-10 w-10 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-white font-bold">{initials}</Text>
            </View>
          </View>
        </View>
        <Text className="text-white/60 text-xs mt-1">
          {profile?.tenant_name ?? "Ayura OS"} · {profile?.role?.toUpperCase()}
        </Text>
      </View>

      {loading ? (
        <View className="items-center mt-12">
          <ActivityIndicator color="#0F766E" />
        </View>
      ) : (
        <>
          {/* Next Appointment */}
          <View className="mx-5 -mt-5 rounded-2xl bg-white p-5 shadow-sm shadow-black/5">
            <Text className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Next Appointment
            </Text>
            {nextAppt ? (
              <View className="flex-row items-center gap-4">
                <View className="h-12 w-12 rounded-xl items-center justify-center"
                  style={{ backgroundColor: "#0F766E15" }}>
                  <Calendar color="#0F766E" size={22} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900">
                    {nextAppt.practitioner_name ?? "Doctor"} — {nextAppt.reason ?? "Consultation"}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-0.5">
                    {new Date(nextAppt.started_at).toLocaleString("en-IN", {
                      dateStyle: "medium", timeStyle: "short",
                    })}
                  </Text>
                </View>
              </View>
            ) : (
              <Text className="text-gray-400 text-sm">No upcoming appointments</Text>
            )}
          </View>

          {/* Quick Links */}
          <View className="px-5 mt-6">
            <Text className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              Quick Access
            </Text>
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
            <Text className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              Recent Results
            </Text>
            <View className="rounded-2xl bg-white overflow-hidden shadow-sm shadow-black/5">
              {results.length > 0 ? results.map((r, i) => (
                <Pressable
                  key={r.id}
                  onPress={() => router.push("/reports" as any)}
                  className="flex-row items-center justify-between px-4 py-3.5 active:bg-gray-50"
                  style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "#f3f4f6" }}
                >
                  <View>
                    <Text className="font-semibold text-gray-900">{r.display}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      {new Date(r.effective_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </Text>
                  </View>
                  <View className="rounded-full px-2.5 py-1"
                    style={{ backgroundColor: r.flag && r.flag !== "normal" ? "#fef3c7" : "#d1fae5" }}>
                    <Text className="text-xs font-semibold"
                      style={{ color: r.flag && r.flag !== "normal" ? "#d97706" : "#059669" }}>
                      {r.flag ?? "normal"}
                    </Text>
                  </View>
                </Pressable>
              )) : (
                <View className="px-4 py-5">
                  <Text className="text-gray-400 text-sm text-center">No recent results</Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
