"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, Building2, Users, FileText, Bell, Shield } from "lucide-react";

type ConfigSection = "hospital" | "departments" | "billing" | "notifications" | "security";

const SECTIONS: { id: ConfigSection; label: string; icon: React.ElementType }[] = [
  { id: "hospital",      label: "Hospital Info",    icon: Building2 },
  { id: "departments",   label: "Departments",      icon: Users },
  { id: "billing",       label: "Billing",          icon: FileText },
  { id: "notifications", label: "Notifications",    icon: Bell },
  { id: "security",      label: "Security",         icon: Shield },
];

const HOSPITAL_CONFIG = [
  { label: "Hospital Name",     value: "Chenna Reddy Hospitals",   editable: true },
  { label: "License Number",    value: "HOS-TS-2019-00123",        editable: false },
  { label: "GSTIN",             value: "36AAACH1234F1ZP",          editable: true },
  { label: "Address",           value: "Himayatnagar, Hyderabad",  editable: true },
  { label: "State",             value: "Telangana",                editable: true },
  { label: "Timezone",          value: "Asia/Kolkata (IST)",       editable: true },
  { label: "Date Format",       value: "DD-MM-YYYY",               editable: true },
  { label: "Currency",          value: "INR (₹)",                  editable: false },
];

const DEPARTMENTS = [
  { name: "Out-Patient Dept (OPD)",  code: "OPD", beds: 0,  active: true },
  { name: "In-Patient Dept (IPD)",   code: "IPD", beds: 55, active: true },
  { name: "Intensive Care Unit",     code: "ICU", beds: 8,  active: true },
  { name: "Operation Theater",       code: "OT",  beds: 3,  active: true },
  { name: "Emergency / Casualty",    code: "ER",  beds: 6,  active: true },
  { name: "Radiology",               code: "RAD", beds: 0,  active: true },
  { name: "Laboratory (LIMS)",       code: "LAB", beds: 0,  active: true },
  { name: "Physiotherapy",           code: "PHY", beds: 0,  active: false },
];

export default function ConfigMasterPage() {
  const [section, setSection] = useState<ConfigSection>("hospital");

  return (
    <>
      <TopBar title="Configuration Master" action={{ label: "Save Changes", href: "#" }} />
      <main className="p-8 flex gap-8">
        {/* Left nav */}
        <aside className="w-52 shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left",
                    section === s.id
                      ? "bg-[#0F766E]/15 text-[#0F766E]"
                      : "text-muted hover:bg-white/5 hover:text-fg"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content panel */}
        <div className="flex-1">
          {section === "hospital" && (
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/20 pb-4">
                <CardTitle className="text-sm">Hospital Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-0">
                {HOSPITAL_CONFIG.map((item) => (
                  <div key={item.label} className="flex items-center py-3.5 border-b border-white/5 last:border-0 gap-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 w-44 shrink-0">
                      {item.label}
                    </span>
                    {item.editable ? (
                      <input
                        defaultValue={item.value}
                        className="flex-1 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-[#0F766E]/50 transition-colors"
                      />
                    ) : (
                      <span className="text-sm text-slate-400 font-mono">{item.value}</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {section === "departments" && (
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/20 pb-4">
                <CardTitle className="text-sm">Departments & Units</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Dept Name", "Code", "Beds", "Status"].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEPARTMENTS.map((d) => (
                      <tr key={d.code} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 pl-0 pr-4 font-medium text-slate-200">{d.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">{d.code}</td>
                        <td className="py-3 px-4 text-slate-400">{d.beds || "—"}</td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            d.active
                              ? "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20"
                              : "text-slate-500 bg-white/5 border-white/8"
                          )}>
                            {d.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {(section === "billing" || section === "notifications" || section === "security") && (
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl h-64 flex items-center justify-center">
              <p className="text-slate-600 text-sm italic">
                {SECTIONS.find((s) => s.id === section)?.label} configuration coming soon
              </p>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
