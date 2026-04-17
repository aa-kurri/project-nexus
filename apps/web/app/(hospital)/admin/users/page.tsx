"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Search, UserPlus, Mail, Copy, Check, Shield, Clock,
  CheckCircle2, XCircle, MoreHorizontal, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "Super Admin" | "Hospital Admin" | "Doctor" | "Nurse" | "Billing" | "Pharmacist" | "Lab Tech" | "Receptionist";
type Status = "Active" | "Inactive" | "Invited";

interface StaffUser {
  id: string; name: string; email: string; role: Role;
  dept: string; status: Status; lastLogin: string; phone: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ROLES: Role[] = ["Super Admin", "Hospital Admin", "Doctor", "Nurse", "Billing", "Pharmacist", "Lab Tech", "Receptionist"];
const DEPTS = ["All", "OPD", "IPD / Wards", "ICU", "OT", "Laboratory", "Pharmacy", "Radiology", "Billing", "Administration"];

const ROLE_COLORS: Record<Role, string> = {
  "Super Admin":    "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "Hospital Admin": "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",
  "Doctor":         "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Nurse":          "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  "Billing":        "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "Pharmacist":     "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  "Lab Tech":       "text-pink-400 bg-pink-500/10 border-pink-500/20",
  "Receptionist":   "text-slate-400 bg-white/5 border-white/10",
};

const STAFF: StaffUser[] = [
  { id: "USR-001", name: "Dr. Ramesh Babu",      email: "ramesh.babu@hospital.com",     role: "Hospital Admin", dept: "Administration",  status: "Active",   lastLogin: "2026-04-16 09:12", phone: "+91 98765 43210" },
  { id: "USR-002", name: "Dr. Priya Sharma",     email: "priya.sharma@hospital.com",    role: "Doctor",         dept: "OPD",             status: "Active",   lastLogin: "2026-04-16 08:45", phone: "+91 98765 43211" },
  { id: "USR-003", name: "Dr. Anil Kumar",       email: "anil.kumar@hospital.com",      role: "Doctor",         dept: "IPD / Wards",     status: "Active",   lastLogin: "2026-04-15 22:30", phone: "+91 98765 43212" },
  { id: "USR-004", name: "Sr. Nurse Lakshmi",    email: "lakshmi.nurse@hospital.com",   role: "Nurse",          dept: "ICU",             status: "Active",   lastLogin: "2026-04-16 07:00", phone: "+91 98765 43213" },
  { id: "USR-005", name: "Sr. Nurse Rekha",      email: "rekha.nurse@hospital.com",     role: "Nurse",          dept: "IPD / Wards",     status: "Active",   lastLogin: "2026-04-16 06:55", phone: "+91 98765 43214" },
  { id: "USR-006", name: "Suresh Billing",       email: "suresh.billing@hospital.com",  role: "Billing",        dept: "Billing",         status: "Active",   lastLogin: "2026-04-16 09:01", phone: "+91 98765 43215" },
  { id: "USR-007", name: "Mohan Pharm",          email: "mohan.pharm@hospital.com",     role: "Pharmacist",     dept: "Pharmacy",        status: "Active",   lastLogin: "2026-04-15 18:20", phone: "+91 98765 43216" },
  { id: "USR-008", name: "Kavitha Lab",          email: "kavitha.lab@hospital.com",     role: "Lab Tech",       dept: "Laboratory",      status: "Active",   lastLogin: "2026-04-16 07:30", phone: "+91 98765 43217" },
  { id: "USR-009", name: "Ravi Reception",       email: "ravi.reception@hospital.com",  role: "Receptionist",   dept: "OPD",             status: "Active",   lastLogin: "2026-04-16 08:00", phone: "+91 98765 43218" },
  { id: "USR-010", name: "Dr. Sneha Reddy",      email: "sneha.reddy@hospital.com",     role: "Doctor",         dept: "OT",              status: "Inactive", lastLogin: "2026-04-10 14:00", phone: "+91 98765 43219" },
  { id: "USR-011", name: "Amina Radiology",      email: "amina.rad@hospital.com",       role: "Lab Tech",       dept: "Radiology",       status: "Invited",  lastLogin: "—",                phone: "+91 98765 43220" },
  { id: "USR-012", name: "Deepak Admin",         email: "deepak.admin@hospital.com",    role: "Hospital Admin", dept: "Administration",  status: "Invited",  lastLogin: "—",                phone: "+91 98765 43221" },
];

const PAGE_SIZE = 8;
const inputCls = "w-full bg-black/20 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#0F766E]/50 transition-colors";
const labelCls = "block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5";

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [search, setSearch]       = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState<Role | "All">("All");
  const [page, setPage]           = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const [openMenu, setOpenMenu]   = useState<string | null>(null);

  // New user form
  const [form, setForm] = useState({ name: "", email: "", role: "Nurse" as Role, dept: "OPD", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const filtered = STAFF.filter((u) =>
    (deptFilter === "All" || u.dept === deptFilter) &&
    (roleFilter === "All" || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    active:   STAFF.filter((u) => u.status === "Active").length,
    inactive: STAFF.filter((u) => u.status === "Inactive").length,
    invited:  STAFF.filter((u) => u.status === "Invited").length,
  };

  function copyLink(id: string, link: string) {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleInvite() {
    const token = "INV-" + Math.random().toString(36).slice(2, 10).toUpperCase();
    setInviteLink(`https://app.ayura.health/register?token=${token}`);
    setSubmitted(true);
  }

  function closeModal() {
    setShowModal(false); setSubmitted(false);
    setForm({ name: "", email: "", role: "Nurse", dept: "OPD", phone: "" });
    setInviteLink("");
  }

  function statusBadge(s: Status) {
    if (s === "Active")   return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20"><CheckCircle2 className="h-3 w-3" /> Active</span>;
    if (s === "Inactive") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border-red-500/20"><XCircle className="h-3 w-3" /> Inactive</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-500/10 border-yellow-500/20"><Clock className="h-3 w-3" /> Invited</span>;
  }

  return (
    <>
      <TopBar title="Users & Roles" action={{ label: "Invite User", href: "#" }} />
      <main className="p-8 space-y-6">

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Staff",    value: counts.active,   color: "text-[#0F766E]" },
            { label: "Inactive",        value: counts.inactive, color: "text-red-400" },
            { label: "Invite Pending",  value: counts.invited,  color: "text-yellow-400" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{k.label}</p>
              <p className={cn("text-3xl font-bold mt-1", k.color)}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5 flex-1 min-w-48">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or email…"
              className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none flex-1" />
          </div>
          <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="bg-black/20 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none">
            {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as Role | "All"); setPage(1); }}
            className="bg-black/20 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none">
            <option value="All">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#0F766E]/90 transition-all">
            <UserPlus className="h-3.5 w-3.5" /> Invite User
          </button>
        </div>

        {/* Table */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardContent className="pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["User", "Role", "Department", "Status", "Last Login", "Actions"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((u) => {
                  const initials = u.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
                  return (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pl-0 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#0F766E]/20 flex items-center justify-center text-xs font-bold text-[#0F766E] shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{u.name}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider", ROLE_COLORS[u.role])}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">{u.dept}</td>
                      <td className="py-3 px-4">{statusBadge(u.status)}</td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">{u.lastLogin}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {u.status === "Invited" && (
                            <button
                              title="Copy invite link"
                              onClick={() => copyLink(u.id, `https://app.ayura.health/register?token=INV-${u.id}`)}
                              className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-slate-500 hover:text-yellow-400 transition-colors">
                              {copiedId === u.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <div className="relative">
                            <button onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-200 transition-colors">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                            {openMenu === u.id && (
                              <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-white/10 bg-[#0d1117] shadow-xl py-1">
                                {["Edit Role", "Resend Invite", u.status === "Active" ? "Deactivate" : "Activate", "Remove User"].map((action) => (
                                  <button key={action}
                                    onClick={() => setOpenMenu(null)}
                                    className={cn(
                                      "w-full text-left px-4 py-2 text-xs hover:bg-white/5 transition-colors",
                                      action === "Remove User" ? "text-red-400" :
                                      action === "Deactivate" ? "text-red-400" : "text-slate-300"
                                    )}>
                                    {action}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                <p className="text-xs text-slate-500">{filtered.length} users · page {page} of {totalPages}</p>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      className={cn("h-7 w-7 rounded-lg text-xs font-medium transition-all",
                        p === page ? "bg-[#0F766E] text-white" : "text-muted hover:bg-white/5")}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ── Invite User Modal ──────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#0F766E]" /> Invite New Staff Member
              </h3>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-200 text-xl leading-none">×</button>
            </div>

            {!submitted ? (
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input className={inputCls} placeholder="Dr. Name Surname"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Email Address *</label>
                  <input className={inputCls} placeholder="staff@hospital.com" type="email"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Role *</label>
                    <select className={inputCls} value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Department</label>
                    <select className={inputCls} value={form.dept}
                      onChange={(e) => setForm({ ...form, dept: e.target.value })}>
                      {DEPTS.filter((d) => d !== "All").map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Phone (optional)</label>
                  <input className={inputCls} placeholder="+91 98765 43210"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-[11px] text-slate-500">
                    A 72-hour single-use invite link will be generated. The staff member sets their own password at registration.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl border border-white/8 text-sm text-slate-400 hover:bg-white/5 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleInvite} disabled={!form.name || !form.email}
                    className="flex-1 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-bold hover:bg-[#0F766E]/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" /> Generate Invite
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-5 text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-[#0F766E]/20 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-[#0F766E]" />
                </div>
                <div>
                  <p className="font-bold text-slate-100">Invite Generated!</p>
                  <p className="text-xs text-slate-500 mt-1">Send this link to <span className="text-slate-300">{form.email}</span></p>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 text-left">
                  <code className="flex-1 text-xs text-[#0F766E] font-mono truncate">{inviteLink}</code>
                  <button onClick={() => copyLink("modal", inviteLink)}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-[#0F766E]/20 transition-colors">
                    {copiedId === "modal" ? <Check className="h-4 w-4 text-[#0F766E]" /> : <Copy className="h-4 w-4 text-[#0F766E]" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">Expires in 72 hours · Single-use · Role: <span className="text-slate-400">{form.role}</span></p>
                <button onClick={closeModal}
                  className="w-full py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-bold hover:bg-[#0F766E]/90 transition-all">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
