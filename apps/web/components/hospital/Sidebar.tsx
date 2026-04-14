"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  BedDouble,
  FlaskConical,
  Pill,
  Mic2,
  Settings,
  Activity,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "OPD Queue",   href: "/opd/queue",        icon: Activity },
  { label: "IPD Beds",    href: "/ipd/beds",          icon: BedDouble },
  { label: "Patients",    href: "/emr/patients",      icon: Users },
  { label: "Pharmacy",    href: "/pharmacy/stock",    icon: Pill },
  { label: "LIMS",        href: "/lims/worklist",     icon: FlaskConical },
  { label: "AI Scribe",   href: "/ai/scribe",         icon: Mic2 },
  { label: "Settings",    href: "/settings",          icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F766E] text-white">
          <LayoutGrid className="h-4 w-4" />
        </span>
        <span className="font-display text-lg font-bold tracking-tight text-fg">Ayura OS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-[#0F766E]/15 text-[#0F766E]"
                  : "text-muted hover:bg-surface hover:text-fg"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#0F766E]" : "text-muted group-hover:text-fg")} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3 w-3 text-[#0F766E]" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4">
        <p className="text-[10px] uppercase tracking-widest text-muted">Demo Hospital</p>
        <p className="mt-0.5 text-xs text-muted">Sprint 0 · 2026-04-14</p>
      </div>
    </aside>
  );
}
