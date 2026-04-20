import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Search, UserRound, ChevronRight, Phone } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

interface Patient {
  id: string;
  mrn: string;
  full_name: string;
  phone: string;
  dob: string | null;
  gender: string;
}

function useDebounce(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function PatientsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();

  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const debouncedQuery = useDebounce(query);

  const fetchPatients = useCallback(async (search: string) => {
    if (!profile?.tenant_id) return;
    setLoading(true);

    let q = supabase
      .from("patients")
      .select("id, mrn, full_name, phone, dob, gender")
      .eq("tenant_id", profile.tenant_id)
      .order("full_name", { ascending: true })
      .limit(40);

    if (search.trim()) {
      // Search by name OR MRN
      q = q.or(`full_name.ilike.%${search}%,mrn.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data } = await q;
    setPatients(data ?? []);
    setLoading(false);
  }, [profile?.tenant_id]);

  useEffect(() => {
    fetchPatients(debouncedQuery);
  }, [debouncedQuery, fetchPatients]);

  function ageFromDOB(dob: string | null): string {
    if (!dob) return "—";
    const diff = Date.now() - new Date(dob).getTime();
    return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))}y`;
  }

  const GENDER_COLOR: Record<string, string> = {
    male: "#3b82f6", female: "#ec4899", other: "#8b5cf6",
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 pt-14 pb-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-3">Patients</Text>
        {/* Search bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 gap-2">
          <Search size={16} color="#9ca3af" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, MRN, or phone…"
            placeholderTextColor="#9ca3af"
            className="flex-1 text-gray-900 text-sm"
            clearButtonMode="while-editing"
            autoCapitalize="none"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0F766E" />
        </View>
      ) : patients.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <UserRound size={40} color="#d1d5db" />
          <Text className="text-gray-400">
            {query ? `No results for "${query}"` : "No patients found"}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="px-5 pt-3 pb-2 text-xs text-gray-400">
            {patients.length} patient{patients.length !== 1 ? "s" : ""}
          </Text>
          <View className="mx-5 rounded-2xl bg-white overflow-hidden shadow-sm shadow-black/5">
            {patients.map((p, i) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/patients/${p.id}` as any)}
                className="flex-row items-center px-4 py-3.5 active:bg-gray-50"
                style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "#f3f4f6" }}
              >
                {/* Avatar */}
                <View
                  className="h-10 w-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: (GENDER_COLOR[p.gender] ?? "#6b7280") + "20" }}
                >
                  <Text className="text-sm font-bold"
                    style={{ color: GENDER_COLOR[p.gender] ?? "#6b7280" }}>
                    {p.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{p.full_name}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {p.mrn} · {ageFromDOB(p.dob)} · {p.gender}
                  </Text>
                </View>

                <View className="items-end gap-1">
                  <Text className="text-xs text-gray-400">{p.phone}</Text>
                  <ChevronRight size={14} color="#d1d5db" />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
