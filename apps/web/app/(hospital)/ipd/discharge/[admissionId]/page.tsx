"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Circle, FileDown, ClipboardCheck,
  User, BedDouble, AlertTriangle, Loader2
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PRIMARY = "#0F766E";
const SURFACE = "hsl(220,13%,9%)";
const BORDER  = "#1e2332";

const CHECKLIST_ITEMS = [
  { key: "summary",      label: "Discharge summary signed" },
  { key: "bill",        label: "Final bill approved"       },
  { key: "medicines",   label: "Medicines issued"          },
  { key: "instructions",label: "Patient instructions given"},
];

interface AdmissionDetail {
  id:          string;
  status:      string;
  admitted_at: string;
  bed_id:      string;
  encounter_id:string;
  patient_id:  string;
  patient_name:string;
  bed_label:   string;
  ward:        string;
  bill_status: string | null;
  bill_amount: number | null;
}

export default function DischargePage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const router = useRouter();

  const [admission, setAdmission] = useState<AdmissionDetail | null>(null);
  const [checked,   setChecked]   = useState<Record<string, boolean>>({});
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fhirUrl,   setFhirUrl]   = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from("admissions")
        .select(`
          id, status, admitted_at, bed_id, encounter_id, patient_id,
          patients ( full_name ),
          beds     ( label, ward )
        `)
        .eq("id", admissionId)
        .single();

      if (qErr) throw new Error(qErr.message);

      // Fetch latest bill for this encounter
      const { data: billData } = await supabase
        .from("bills")
        .select("status, total_amount")
        .eq("encounter_id", data.encounter_id)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      setAdmission({
        id:           data.id,
        status:       data.status,
        admitted_at:  data.admitted_at,
        bed_id:       data.bed_id,
        encounter_id: data.encounter_id,
        patient_id:   data.patient_id,
        patient_name: (data as any).patients?.full_name ?? "Unknown",
        bed_label:    (data as any).beds?.label ?? "—",
        ward:         (data as any).beds?.ward  ?? "—",
        bill_status:  billData?.status  ?? null,
        bill_amount:  billData?.total_amount ?? null,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [admissionId]);

  useEffect(() => { load(); }, [load]);

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const allChecked = CHECKLIST_ITEMS.every((i) => checked[i.key]);

  async function confirmDischarge() {
    if (!admission || !allChecked) return;
    setSaving(true);
    setError(null);
    try {
      // 1. Mark admission discharged
      const { error: e1 } = await supabase
        .from("admissions")
        .update({ status: "discharged" })
        .eq("id", admission.id);
      if (e1) throw new Error(e1.message);

      // 2. Set bed to cleaning
      const { error: e2 } = await supabase
        .from("beds")
        .update({ status: "cleaning" })
        .eq("id", admission.bed_id);
      if (e2) throw new Error(e2.message);

      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function exportFhir() {
    if (!admission) return;
    setExporting(true);
    setError(null);
    try {
      // Fetch all resources for FHIR bundle
      const [condRes, rxRes, labRes] = await Promise.all([
        supabase.from("conditions")
          .select("id, code, display, onset_at, resolved_at")
          .eq("encounter_id", admission.encounter_id),
        supabase.from("medication_requests")
          .select("id, drug_name, dose, frequency, duration_days, status")
          .eq("patient_id", admission.patient_id),
        supabase.from("diagnostic_reports")
          .select("id, code, display, status, issued_at")
          .eq("patient_id", admission.patient_id),
      ]);

      // Build FHIR R4 Bundle
      const now = new Date().toISOString();
      const bundle = {
        resourceType: "Bundle",
        id:           admission.id,
        type:         "document",
        timestamp:    now,
        entry: [
          {
            resource: {
              resourceType: "Encounter",
              id:           admission.encounter_id,
              status:       "finished",
              subject:      { reference: `Patient/${admission.patient_id}` },
              period:       { start: admission.admitted_at, end: now },
            },
          },
          ...(condRes.data ?? []).map((c: any) => ({
            resource: {
              resourceType:    "Condition",
              id:              c.id,
              code:            { text: c.display, coding: [{ code: c.code }] },
              subject:         { reference: `Patient/${admission.patient_id}` },
              onsetDateTime:   c.onset_at,
              abatementDateTime: c.resolved_at ?? undefined,
            },
          })),
          ...(rxRes.data ?? []).map((r: any) => ({
            resource: {
              resourceType: "MedicationRequest",
              id:           r.id,
              status:       r.status ?? "active",
              intent:       "order",
              subject:      { reference: `Patient/${admission.patient_id}` },
              medicationCodeableConcept: { text: r.drug_name },
              dosageInstruction: [{ text: `${r.dose} ${r.frequency}` }],
            },
          })),
          ...(labRes.data ?? []).map((d: any) => ({
            resource: {
              resourceType: "DiagnosticReport",
              id:           d.id,
              status:       d.status ?? "final",
              code:         { text: d.display, coding: [{ code: d.code }] },
              subject:      { reference: `Patient/${admission.patient_id}` },
              issued:       d.issued_at,
            },
          })),
        ],
      };

      // Upload to Supabase Storage
      const path = `fhir/${admission.id}/discharge-bundle-${Date.now()}.json`;
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });

      const { error: upErr } = await supabase.storage
        .from("discharge-bundles")
        .upload(path, blob, { upsert: true });

      if (upErr) throw new Error(`Storage: ${upErr.message}`);

      const { data: signed } = await supabase.storage
        .from("discharge-bundles")
        .createSignedUrl(path, 3600);

      setFhirUrl(signed?.signedUrl ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  }

  if (loading) return (
    <>
      <TopBar title="Discharge Workflow" />
      <main className="flex flex-1 items-center justify-center p-8">
        <Loader2 className="animate-spin text-[#0F766E]" size={32} />
      </main>
    </>
  );

  if (!admission) return (
    <>
      <TopBar title="Discharge Workflow" />
      <main className="p-8"><p className="text-gray-400">Admission not found.</p></main>
    </>
  );

  const isAlreadyDischarged = admission.status === "discharged";

  return (
    <>
      <TopBar title="Discharge Workflow" />
      <main className="p-6 max-w-2xl mx-auto space-y-5">

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {/* Patient summary card */}
        <Card>
          <CardContent className="pt-5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${PRIMARY}20` }}>
                <User size={18} color={PRIMARY} />
              </div>
              <div>
                <p className="font-bold text-white">{admission.patient_name}</p>
                <p className="text-xs text-gray-400">
                  {admission.ward} · Bed {admission.bed_label} ·
                  Admitted {new Date(admission.admitted_at).toLocaleDateString("en-IN")}
                </p>
              </div>
              <span className="ml-auto rounded-lg px-3 py-1 text-xs font-bold uppercase"
                style={{
                  background: isAlreadyDischarged ? "#05966920" : `${PRIMARY}20`,
                  color:      isAlreadyDischarged ? "#059669"   : PRIMARY,
                }}>
                {admission.status}
              </span>
            </div>
            {admission.bill_amount != null && (
              <div className="rounded-lg border px-4 py-2 flex items-center justify-between"
                style={{ borderColor: BORDER, background: SURFACE }}>
                <span className="text-sm text-gray-400">Final Bill</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    ₹{admission.bill_amount.toLocaleString("en-IN")}
                  </span>
                  <span className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: admission.bill_status === "paid" ? "#05966920" : "#f59e0b20",
                      color:      admission.bill_status === "paid" ? "#059669"   : "#f59e0b",
                    }}>
                    {admission.bill_status ?? "—"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck size={17} color={PRIMARY} /> Discharge Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CHECKLIST_ITEMS.map((item) => {
              const done = !!checked[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => !isAlreadyDischarged && toggle(item.key)}
                  disabled={isAlreadyDischarged}
                  className="w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:border-teal-600/40 disabled:cursor-default"
                  style={{
                    borderColor: done ? `${PRIMARY}60` : BORDER,
                    background:  done ? `${PRIMARY}10` : SURFACE,
                  }}
                >
                  {done
                    ? <CheckCircle2 size={18} color={PRIMARY} />
                    : <Circle      size={18} color="#374151" />}
                  <span className="text-sm font-medium" style={{ color: done ? "#f9fafb" : "#9ca3af" }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          {!isAlreadyDischarged && (
            <Button
              onClick={confirmDischarge}
              disabled={!allChecked || saving}
              className="flex-1 gap-2"
              style={{ background: allChecked ? PRIMARY : "#374151", color: "#fff" }}
            >
              {saving
                ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                : <><BedDouble size={15} /> Confirm Discharge</>}
            </Button>
          )}

          <Button
            onClick={exportFhir}
            disabled={exporting}
            variant="outline"
            className="flex-1 gap-2 border-[#1e2332] text-gray-300 hover:text-white"
          >
            {exporting
              ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
              : <><FileDown size={15} /> Export FHIR Bundle</>}
          </Button>
        </div>

        {fhirUrl && (
          <div className="rounded-xl border p-4 flex items-center justify-between gap-4"
            style={{ borderColor: `${PRIMARY}40`, background: `${PRIMARY}10` }}>
            <p className="text-sm text-teal-300 font-medium">FHIR R4 bundle ready (valid 1 hr)</p>
            <a
              href={fhirUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
              style={{ background: PRIMARY }}
            >
              <FileDown size={13} /> Download
            </a>
          </div>
        )}
      </main>
    </>
  );
}
