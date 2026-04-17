"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MessageCircle, CheckCircle2, Clock, Send, ToggleLeft, ToggleRight,
  RefreshCw, Eye,
} from "lucide-react";

interface WaNotif {
  key: string;
  label: string;
  desc: string;
  templateId: string;
  enabled: boolean;
  sent24h: number;
  delivered: number;
  preview: string;
}

const GATEWAY_STATUS = [
  { label: "API Status",     value: "Connected",   green: true  },
  { label: "Messages (24h)", value: "248",          green: true  },
  { label: "Delivery Rate",  value: "97.2%",        green: true  },
  { label: "Template Status",value: "6 / 9 live",  green: false },
];

const INITIAL_NOTIFS: WaNotif[] = [
  { key: "appt_reminder",    label: "Appointment Reminder",      desc: "24h before appointment",                    templateId: "appt_reminder_v2",   enabled: true,  sent24h: 42,  delivered: 41, preview: "Hi {{name}}, your appointment with {{doctor}} at Chenna Reddy Hospitals is confirmed for {{date}} at {{time}}. Reply HELP for assistance." },
  { key: "token_call",       label: "OPD Token Call",            desc: "When patient's token is called",            templateId: "opd_token_call_v1",  enabled: true,  sent24h: 118, delivered: 115,preview: "Hi {{name}}, your token {{token}} has been called at {{counter}}. Please proceed to the OPD counter. ({{hospital}})" },
  { key: "lab_ready",        label: "Lab Report Ready",          desc: "On report validation",                      templateId: "lab_report_v3",      enabled: true,  sent24h: 38,  delivered: 37, preview: "Your lab report is ready. Download securely: {{link}} (valid 48h). — Chenna Reddy Hospitals" },
  { key: "discharge_summary",label: "Discharge Summary",         desc: "On patient discharge",                      templateId: "discharge_v2",       enabled: true,  sent24h: 9,   delivered: 9,  preview: "Dear {{name}}, your discharge summary is attached. Please follow the advice of {{doctor}}. For queries: {{helpline}}" },
  { key: "bill_receipt",     label: "Bill Receipt",              desc: "On payment confirmation",                   templateId: "bill_receipt_v1",    enabled: true,  sent24h: 31,  delivered: 30, preview: "Payment of ₹{{amount}} received. Receipt No: {{receipt_no}}. Thank you — Chenna Reddy Hospitals" },
  { key: "admit_family",     label: "IPD Admission Alert",       desc: "Notify family number on admit",             templateId: "ipd_admit_v1",       enabled: false, sent24h: 0,   delivered: 0,  preview: "{{patient}} has been admitted to {{ward}} at Chenna Reddy Hospitals. For information: {{helpline}}" },
  { key: "pre_auth_status",  label: "Pre-Auth Status Update",    desc: "On TPA approval / rejection",               templateId: "preauth_status_v1",  enabled: true,  sent24h: 4,   delivered: 4,  preview: "Your pre-authorisation ({{auth_id}}) has been {{status}} by {{tpa}}. Amount: {{amount}}." },
  { key: "otp",              label: "OTP Verification",          desc: "For patient portal login",                  templateId: "otp_v2",             enabled: false, sent24h: 0,   delivered: 0,  preview: "Your OTP for Chenna Reddy Hospitals patient portal: {{otp}}. Valid for 5 minutes. Do not share." },
  { key: "survey",           label: "Post-Discharge Survey",     desc: "Triggered by survey module",                templateId: "survey_v1",          enabled: true,  sent24h: 7,   delivered: 6,  preview: "Hi {{name}}, how was your experience at Chenna Reddy Hospitals? Rate us: {{link}} (30 sec)" },
];

export default function WhatsappPage() {
  const [notifs, setNotifs] = useState<WaNotif[]>(INITIAL_NOTIFS);
  const [preview, setPreview] = useState<string | null>(null);

  function toggle(key: string) {
    setNotifs((prev) => prev.map((n) => n.key === key ? { ...n, enabled: !n.enabled } : n));
  }

  const totalSent = notifs.reduce((s, n) => s + n.sent24h, 0);
  const totalDel  = notifs.reduce((s, n) => s + n.delivered, 0);

  return (
    <>
      <TopBar title="WhatsApp Notifications" />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {GATEWAY_STATUS.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className={cn("text-2xl font-bold mt-1", s.green ? "text-[#0F766E]" : "text-yellow-400")}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 p-4">
          <MessageCircle className="h-4 w-4 text-[#0F766E] mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            Connected to <strong className="text-slate-300">WATI Business API</strong> (+91-9100000000).
            Delivery rate <strong className="text-[#0F766E]">{totalDel}/{totalSent}</strong> in last 24h.
            Templates in <strong className="text-yellow-400">Pending Approval</strong> will not send until approved by Meta.
          </p>
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="text-sm">Notification Templates</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-white/5">
              {notifs.map((n) => (
                <div key={n.key} className="py-4 space-y-3">
                  <div className="flex items-center gap-5">
                    <div className="h-9 w-9 rounded-xl bg-[#0F766E]/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="h-4 w-4 text-[#0F766E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-slate-200 text-sm">{n.label}</p>
                        <span className="font-mono text-[10px] text-slate-600">{n.templateId}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        <span>{n.sent24h}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#0F766E]" />
                        <span className="text-[#0F766E]">{n.sent24h > 0 ? Math.round((n.delivered / n.sent24h) * 100) : 0}%</span>
                      </div>
                      <button onClick={() => setPreview(preview === n.key ? null : n.key)}
                        className="flex items-center gap-1 px-2 py-1 rounded border border-white/8 text-slate-400 hover:text-fg hover:bg-white/5 transition-all text-[10px]">
                        <Eye className="h-3 w-3" /> Preview
                      </button>
                    </div>
                    <button onClick={() => toggle(n.key)} className="shrink-0 transition-transform hover:scale-105">
                      {n.enabled
                        ? <ToggleRight className="h-7 w-7 text-[#0F766E]" />
                        : <ToggleLeft  className="h-7 w-7 text-slate-600" />}
                    </button>
                  </div>
                  {preview === n.key && (
                    <div className="ml-14 rounded-xl border border-[#0F766E]/10 bg-[#0F766E]/5 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Template Preview</p>
                      <div className="bg-black/30 rounded-xl p-4 max-w-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-4 w-4 text-[#0F766E]" />
                          <span className="text-xs font-bold text-[#0F766E]">Chenna Reddy Hospitals</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{n.preview}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
