/**
 * OfflineReportList
 * ─────────────────
 * Renders the patient's diagnostic reports.
 *
 * Connectivity strategy:
 *  • Online  → fetch from Supabase (stubbed TODO), write to FileSystem cache,
 *              show fresh list.
 *  • Offline → load from FileSystem cache (falls back to seed data on first
 *              install), show amber offline banner.
 *
 * S-APP-2 — Offline cached reports (P0)
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { FileText, WifiOff, CloudOff } from "lucide-react-native";
import {
  cacheReports,
  loadCachedReports,
  type CachedReport,
} from "@/lib/reportCache";

// ─── Server fetch stub ────────────────────────────────────────────────────
/**
 * TODO: Replace with real Supabase query when patient auth is wired.
 *
 * Pattern from apps/web/app/(hospital)/opd/new-patient/actions.ts:
 *   const { data, error } = await supabase
 *     .from("diagnostic_reports")
 *     .select("id, code, issued, status, conclusion")
 *     .eq("tenant_id", jwt_tenant())
 *     .eq("patient_id", currentPatientId)
 *     .order("issued", { ascending: false })
 *     .limit(10);
 */
async function fetchReportsFromServer(): Promise<CachedReport[]> {
  throw new Error("TODO: wire Supabase diagnostic_reports fetch");
}

// ─── Component ────────────────────────────────────────────────────────────
export default function OfflineReportList() {
  const router = useRouter();

  const [reports, setReports] = useState<CachedReport[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to connectivity changes; fires once immediately with current state.
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const offline = state.isConnected === false;
      setIsOffline(offline);

      if (offline) {
        const cached = await loadCachedReports();
        setReports(cached);
        setFromCache(true);
        setLoading(false);
        return;
      }

      // Online path: try server, fall back gracefully to cache.
      try {
        const fresh = await fetchReportsFromServer();
        await cacheReports(fresh);
        setReports(fresh);
        setFromCache(false);
      } catch {
        // Server unavailable or TODO not yet implemented — serve cache.
        const cached = await loadCachedReports();
        setReports(cached);
        setFromCache(true);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  // ── Offline / cache-source banner ──────────────────────────────────────
  const Banner = isOffline ? (
    <View
      className="mx-5 mt-4 mb-1 rounded-xl px-4 py-3 flex-row items-center gap-2"
      style={{ backgroundColor: "#fef3c7" }}
    >
      <WifiOff size={14} color="#d97706" />
      <View className="flex-1">
        <Text className="text-xs font-bold text-amber-700">You're offline</Text>
        <Text className="text-[11px] text-amber-600 mt-0.5">
          Showing last {reports.length} cached reports. Connect to sync.
        </Text>
      </View>
    </View>
  ) : fromCache ? (
    <View
      className="mx-5 mt-4 mb-1 rounded-xl px-4 py-3 flex-row items-center gap-2"
      style={{ backgroundColor: "#ecfdf5" }}
    >
      <CloudOff size={14} color="#059669" />
      <Text className="text-xs font-semibold text-emerald-700 flex-1">
        Cached reports — server sync pending
      </Text>
    </View>
  ) : null;

  // ── Report row ─────────────────────────────────────────────────────────
  const flagBg    = (f: string) => f === "abnormal" ? "#fef3c7" : "#d1fae5";
  const flagColor = (f: string) => f === "abnormal" ? "#d97706" : "#059669";
  const iconBg    = (f: string) => f === "abnormal" ? "#fef3c720" : "#d1fae520";

  return (
    <View className="flex-1">
      {Banner}

      <View className="px-5 mt-3 gap-3">
        {reports.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => router.push(`/reports/${r.id}` as any)}
            className="bg-white rounded-2xl p-4 flex-row items-center gap-4 active:opacity-70 shadow-sm shadow-black/5"
          >
            {/* Icon */}
            <View
              className="h-11 w-11 rounded-xl items-center justify-center"
              style={{ backgroundColor: iconBg(r.flag) }}
            >
              <FileText size={20} color={flagColor(r.flag)} />
            </View>

            {/* Name + date */}
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">{r.test}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                {r.date} · {r.id}
              </Text>
            </View>

            {/* Flag badge + offline marker */}
            <View className="items-end gap-1.5">
              <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: flagBg(r.flag) }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: flagColor(r.flag) }}
                >
                  {r.flag}
                </Text>
              </View>

              {r.cached && (
                <View className="flex-row items-center gap-1">
                  <WifiOff size={9} color="#9ca3af" />
                  <Text className="text-[10px] text-gray-400">Cached</Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}

        {reports.length === 0 && (
          <View className="items-center justify-center py-20">
            <FileText size={44} color="#d1d5db" />
            <Text className="text-gray-400 font-medium mt-3">
              No cached reports available
            </Text>
            <Text className="text-gray-300 text-xs mt-1">
              Connect to the internet to sync your reports.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
