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
  TrendingUp,
  Receipt,
  FileBarChart2,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const NAV: NavItem[] = [
  { label: "OPD Queue",   href: "/opd/queue",        icon: Activity,
    children: [{ label: "New Patient", href: "/opd/new-patient" }] },
  { label: "IPD",          href: "/ipd/beds",           icon: BedDouble,
    children: [
      { label: "Bed Board",      href: "/ipd/beds" },
      { label: "Dashboard",      href: "/ipd/dashboard" },
      { label: "Nurse Station",  href: "/ipd/nurse-station" },
    ]},
  { label: "Patients",    href: "/emr/patients",      icon: Users },
  { label: "Pharmacy",    href: "/pharmacy/stock",    icon: Pill,
    children: [
      { label: "Transfers",   href: "/pharmacy/transfers" },
      { label: "Auto PO",     href: "/pharmacy/orders" },
      { label: "Dispense",    href: "/pharmacy/dispense" },
    ]},
  { label: "LIMS",        href: "/lims/worklist",     icon: FlaskConical,
    children: [{ label: "HL7 Feed", href: "/lims/hl7" }] },
  { label: "Billing",     href: "/billing/claims",    icon: Receipt,
    children: [{ label: "Claims",   href: "/billing/claims" }] },
  { label: "Analytics",   href: "/analytics/pharmacy", icon: TrendingUp,
    children: [
      { label: "Pharmacy",  href: "/analytics/pharmacy" },
      { label: "MIS Report", href: "/analytics/mis" },
    ]},
  { label: "AI Scribe",   href: "/ai/scribe",         icon: Mic2 },
  { label: "Settings",    href: "/settings",          icon: Settings,
    children: [
      { label: "Concierge",   href: "/settings/concierge" },
      { label: "Audit Log",   href: "/settings/audit" },
      { label: "Security",    href: "/settings/security" },
    ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);

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
        {NAV.map(({ label, href, icon: Icon, children }) => {
          const active    = pathname === href || pathname.startsWith(href + "/");
          const hasKids   = !!children?.length;
          const expanded  = open === href || (active && hasKids);

          return (
            <div key={href}>
              <div className="flex items-center">
                <Link
                  href={href}
                  className={cn(
                    "group flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active ? "bg-[#0F766E]/15 text-[#0F766E]" : "text-muted hover:bg-surface hover:text-fg"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0",
                    active ? "text-[#0F766E]" : "text-muted group-hover:text-fg")} />
                  <span className="flex-1 truncate">{label}</span>
                  {!hasKids && active && <ChevronRight className="h-3 w-3 text-[#0F766E]" />}
                </Link>
                {hasKids && (
                  <button
                    onClick={() => setOpen(expanded ? null : href)}
                    className="p-2 text-muted hover:text-fg transition-colors"
                  >
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform",
                      expanded && "rotate-180")} />
                  </button>
                )}
              </div>

              {hasKids && expanded && (
                <div className="ml-10 mt-0.5 space-y-0.5">
                  {children!.map(c => {
                    const cActive = pathname === c.href;
                    return (
                      <Link key={c.href} href={c.href}
                        className={cn(
                          "block rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          cActive ? "text-[#0F766E] bg-[#0F766E]/10" : "text-muted hover:text-fg hover:bg-surface"
                        )}>
                        {c.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4">
        <p className="text-[10px] uppercase tracking-widest text-muted">Demo Hospital</p>
        <p className="mt-0.5 text-xs text-muted">Sprint 0–2 · 2026-04-14</p>
      </div>
    </aside>
  );
}
