"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { createClient } from "@/utils/supabase/client";

interface TopBarProps {
  title: string;
  action?: { label: string; href: string };
  showLogout?: boolean;
}

export function TopBar({ title, action, showLogout = true }: TopBarProps) {
  const [userName, setUserName]         = useState<string>("");
  const [alertCount, setAlertCount]     = useState(0);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile) setUserName(profile.full_name);
      }
    })();
  }, [supabase]);

  // ── Realtime anomaly badge ────────────────────────────────────────────────
  useEffect(() => {
    // Initial count
    supabase
      .from("anomaly_alerts")
      .select("id", { count: "exact", head: true })
      .eq("acknowledged", false)
      .then(({ count }) => setAlertCount(count ?? 0));

    // Subscribe to INSERT / UPDATE on anomaly_alerts
    const channel = supabase
      .channel("topbar-anomaly-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "anomaly_alerts" },
        () => {
          supabase
            .from("anomaly_alerts")
            .select("id", { count: "exact", head: true })
            .eq("acknowledged", false)
            .then(({ count }) => setAlertCount(count ?? 0));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const initial = userName ? userName[0].toUpperCase() : "U";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-sm sticky top-0 z-30">
      <h1 className="font-display text-xl font-semibold tracking-tight text-fg">{title}</h1>
      <div className="flex items-center gap-3">
        {action && (
          <Link href={action.href}>
            <Button size="sm" variant="primary">
              <Plus className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          </Link>
        )}
        <Link href="/analytics/anomalies" title={alertCount > 0 ? `${alertCount} unacknowledged anomaly alert${alertCount !== 1 ? "s" : ""}` : "Anomaly alerts"}>
          <button className="relative rounded-lg p-2 text-muted hover:bg-surface hover:text-fg transition-colors">
            <Bell className="h-4 w-4" />
            {alertCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            ) : (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#0F766E]" />
            )}
          </button>
        </Link>
        {showLogout && (
          <LogoutButton variant="ghost" className="h-8 w-8 p-0 text-muted hover:text-red-400 hover:bg-red-500/5" />
        )}
        <div className="flex items-center gap-2">
          {userName && <span className="text-[10px] uppercase tracking-widest text-muted font-bold hidden md:block">{userName}</span>}
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0F766E] to-teal-400 text-xs font-bold text-white flex items-center justify-center border border-[#0F766E]/20 shadow-lg shadow-[#0F766E]/10">
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}
