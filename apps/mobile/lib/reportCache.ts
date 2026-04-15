/**
 * reportCache.ts
 * ─────────────
 * Persists the last 10 diagnostic reports to the device filesystem using
 * expo-file-system so they are accessible when the patient is offline.
 *
 * Cache file: <documentDirectory>/ayura_lab_reports.json
 */

import * as FileSystem from "expo-file-system";

export interface CachedReport {
  id: string;
  test: string;
  date: string;
  flag: "normal" | "abnormal";
  /** true once written to disk */
  cached: boolean;
  /** ISO timestamp of the last successful sync */
  cachedAt?: string;
}

/** Max number of reports kept in the on-device cache. */
const MAX_CACHED = 10;

const CACHE_PATH = `${FileSystem.documentDirectory ?? ""}ayura_lab_reports.json`;

/**
 * Write `reports` (trimmed to MAX_CACHED) to the device cache.
 * Stamps every entry with the current ISO time.
 */
export async function cacheReports(reports: CachedReport[]): Promise<void> {
  const payload: CachedReport[] = reports.slice(0, MAX_CACHED).map((r) => ({
    ...r,
    cached: true,
    cachedAt: new Date().toISOString(),
  }));
  await FileSystem.writeAsStringAsync(CACHE_PATH, JSON.stringify(payload));
}

/**
 * Read reports from the on-device cache.
 * Falls back to `SEED_REPORTS` on first install (before any sync).
 */
export async function loadCachedReports(): Promise<CachedReport[]> {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_PATH);
    if (!info.exists) {
      return SEED_REPORTS;
    }
    const raw = await FileSystem.readAsStringAsync(CACHE_PATH);
    const parsed = JSON.parse(raw) as CachedReport[];
    return parsed.length > 0 ? parsed : SEED_REPORTS;
  } catch {
    return SEED_REPORTS;
  }
}

/**
 * Returns how many milliseconds ago the cache was last written,
 * or `null` if the cache hasn't been populated yet.
 */
export async function getCacheAgeMs(): Promise<number | null> {
  try {
    const raw = await FileSystem.readAsStringAsync(CACHE_PATH);
    const data = JSON.parse(raw) as CachedReport[];
    const first = data[0];
    if (first?.cachedAt) {
      return Date.now() - new Date(first.cachedAt).getTime();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Removes the cache file from disk (e.g. on logout).
 */
export async function clearReportCache(): Promise<void> {
  try {
    await FileSystem.deleteAsync(CACHE_PATH, { idempotent: true });
  } catch {
    // best-effort
  }
}

// ─── Seed data ─────────────────────────────────────────────────────────────
// Used on first install before any network sync has occurred.
// Matches the mock data in app/(tabs)/reports/[id].tsx detail view.
const SEED_REPORTS: CachedReport[] = [
  {
    id: "DR-441",
    test: "CBC + LFT Panel",
    date: "Apr 14, 2026",
    flag: "abnormal",
    cached: true,
    cachedAt: "2026-04-14T08:00:00.000Z",
  },
  {
    id: "DR-440",
    test: "HbA1c",
    date: "Mar 22, 2026",
    flag: "normal",
    cached: true,
    cachedAt: "2026-04-14T08:00:00.000Z",
  },
  {
    id: "DR-439",
    test: "Lipid Profile",
    date: "Mar 10, 2026",
    flag: "normal",
    cached: true,
    cachedAt: "2026-04-14T08:00:00.000Z",
  },
];
