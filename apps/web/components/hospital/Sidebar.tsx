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
  ChevronDown,
  LogOut,
  Package,
  SlidersHorizontal,
  ShieldCheck,
  Scissors,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useTransition, useEffect } from "react";
import { handleLogout } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavChild {
  label: string;
  href: string;
  /** module_id from hospital_modules table — if set and module is disabled, child is hidden */
  module?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** top-level module_id — if set and disabled, whole section is hidden */
  module?: string;
  children?: NavChild[];
}

// ── Nav definition with module gates ─────────────────────────────────────────

const NAV: NavItem[] = [
  { label: "OPD",     href: "/opd",   icon: Activity,
    children: [
      { label: "Queue",       href: "/opd/queue" },
      { label: "New Patient", href: "/opd/new-patient" },
    ]},
  { label: "IPD",     href: "/ipd",   icon: BedDouble,
    children: [
      { label: "Bed Board",     href: "/ipd/beds" },
      { label: "Dashboard",     href: "/ipd/dashboard" },
      { label: "Nurse Station", href: "/ipd/nurse-station" },
      { label: "CPOE",          href: "/ipd/cpoe",  module: "cpoe" },
      { label: "MAR",           href: "/ipd/mar",   module: "mar"  },
      { label: "ICU Flowsheet", href: "/ipd/icu",   module: "icu_flowsheet" },
    ]},
  { label: "EMR",     href: "/emr",   icon: Users,
    children: [
      { label: "Patients",   href: "/emr/patients" },
      { label: "Case Files", href: "/emr/case-files" },
    ]},
  { label: "Pharmacy", href: "/pharmacy", icon: Pill,
    children: [
      { label: "Stock",          href: "/pharmacy/stock" },
      { label: "Transfers",      href: "/pharmacy/transfers" },
      { label: "Auto PO",        href: "/pharmacy/orders" },
      { label: "Dispense",       href: "/pharmacy/dispense" },
      { label: "Drug Schedules", href: "/pharmacy/schedules", module: "drug_schedule" },
      { label: "Drug CDS",       href: "/pharmacy/cds",       module: "drug_cds" },
    ]},
  { label: "LIMS",    href: "/lims",  icon: FlaskConical,
    children: [
      { label: "Worklist",    href: "/lims/worklist" },
      { label: "HL7 Feed",    href: "/lims/hl7",         module: "lims_hl7" },
      { label: "Dashboard",   href: "/lims/dashboard" },
      { label: "Antibiogram", href: "/lims/antibiogram" },
    ]},
  { label: "Billing", href: "/billing", icon: Receipt,
    children: [
      { label: "Claims",        href: "/billing/claims" },
      { label: "Payments",      href: "/billing/payments" },
      { label: "Pre-Auth",      href: "/billing/preauth" },
      { label: "Packages",      href: "/billing/packages" },
      { label: "TPA Cashless",  href: "/billing/tpa",   module: "tpa" },
      { label: "Revenue Audit", href: "/billing/audit", module: "revenue_audit" },
    ]},
  { label: "Analytics", href: "/analytics", icon: TrendingUp,
    children: [
      { label: "Pharmacy",   href: "/analytics/pharmacy" },
      { label: "MIS Report", href: "/analytics/mis" },
    ]},
  { label: "Stores",  href: "/stores", icon: Package,
    children: [
      { label: "Stock",           href: "/stores/stock" },
      { label: "Transfers",       href: "/stores/transfer" },
      { label: "Purchase Orders", href: "/stores/purchase-orders" },
      { label: "Suppliers",       href: "/stores/suppliers" },
    ]},
  { label: "OT",        href: "/ot",       icon: Scissors },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck,
    children: [
      { label: "ABHA / ABDM",    href: "/compliance/abha",   module: "abha" },
      { label: "PCPNDT Register",href: "/compliance/pcpndt", module: "pcpndt" },
      { label: "PMJAY Claims",   href: "/compliance/pmjay",  module: "pmjay" },
      { label: "NABH",           href: "/compliance/nabh",   module: "nabh" },
    ]},
  { label: "Admin",   href: "/admin", icon: SlidersHorizontal,
    children: [
      { label: "Modules",        href: "/admin/modules" },
      { label: "Services Master",href: "/admin/services" },
      { label: "Tariff Master",  href: "/admin/tariff" },
      { label: "Configuration",  href: "/admin/config" },
      { label: "Auth Inpatient", href: "/admin/auth-ip" },
      { label: "Users",          href: "/admin/users" },
      { label: "Onboard Staff",  href: "/admin/onboard" },
      { label: "Feature Flags",  href: "/admin/feature-flags" },
      { label: "Biomedical",     href: "/admin/biomedical" },
    ]},
  { label: "AI Scribe", href: "/ai/scribe", icon: Mic2,   module: "ai_scribe" },
  { label: "Settings",  href: "/settings",  icon: Settings,
    children: [
      { label: "Concierge",  href: "/settings/concierge" },
      { label: "Audit Log",  href: "/settings/audit" },
      { label: "Security",   href: "/settings/security" },
      { label: "Patient App",href: "/settings/patient-app" },
      { label: "WhatsApp",   href: "/settings/whatsapp", module: "whatsapp" },
      { label: "Surveys",    href: "/settings/surveys",  module: "surveys" },
    ]},
];

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [open, setOpen] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Set of enabled module_ids for this tenant; null = still loading (show all)
  const [enabledModules, setEnabledModules] = useState<Set<string> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("hospital_modules")
          .select("module_id, enabled");
        if (!data || data.length === 0) {
          setEnabledModules(null); // fail open
          return;
        }
        setEnabledModules(new Set(data.filter((r) => r.enabled).map((r) => r.module_id)));
      } catch {
        // Table may not exist in dev yet — fail open
        setEnabledModules(null);
      }
    })();
  }, [supabase]);

  // Returns true if a module-gated item should be visible
  const isVisible = (moduleId?: string) => {
    if (!moduleId) return true;       // no gate → always visible
    if (enabledModules === null) return true; // still loading or unconfigured → show all
    return enabledModules.has(moduleId);
  };

  const onLogout = () => {
    startTransition(async () => {
      await handleLogout();
    });
  };

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
        {NAV.filter((item) => isVisible(item.module)).map(({ label, href, icon: Icon, children }) => {
          const active   = pathname === href || pathname.startsWith(href + "/");
          const hasKids  = !!children?.length;
          const expanded = open === href || (active && hasKids);

          // Filter module-gated children
          const visibleChildren = children?.filter((c) => isVisible(c.module));
          const hasVisible = visibleChildren && visibleChildren.length > 0;

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
                  {!hasVisible && active && <ChevronRight className="h-3 w-3 text-[#0F766E]" />}
                </Link>
                {hasVisible && (
                  <button
                    onClick={() => setOpen(expanded ? null : href)}
                    className="p-2 text-muted hover:text-fg transition-colors"
                  >
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform",
                      expanded && "rotate-180")} />
                  </button>
                )}
              </div>

              {hasVisible && expanded && (
                <div className="ml-10 mt-0.5 space-y-0.5">
                  {visibleChildren!.map((c) => {
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted">Demo Hospital</p>
            <p className="mt-0.5 text-xs text-muted">Sprint 0–2 · 2026-04-17</p>
          </div>
          <button
            onClick={onLogout}
            disabled={isPending}
            className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
            title="Log Out"
          >
            <LogOut className={cn("h-4 w-4", isPending && "animate-pulse")} />
          </button>
        </div>
      </div>
    </aside>
  );
}
