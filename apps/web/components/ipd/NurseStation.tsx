"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Gauge,
  Smile,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  Clock3,
  CircleDot,
  Plus,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AdmittedPatient, NursingTask } from "@/app/(hospital)/ipd/nurse-station/actions";

// ── LOINC code map ────────────────────────────────────────────────────────────

const LOINC = {
  BP:   { code: "85354-9", display: "Blood pressure panel",  unit: "mmHg"  },
  HR:   { code: "8867-4",  display: "Heart rate",            unit: "bpm"   },
  SPO2: { code: "59408-5", display: "Oxygen saturation",     unit: "%"     },
  TEMP: { code: "8310-5",  display: "Body temperature",      unit: "°C"    },
  PAIN: { code: "38208-5", display: "Pain severity 0–10",    unit: "score" },
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface VitalsForm {
  systolicBp: string;
  diastolicBp: string;
  hr: string;
  spo2: string;
  tempC: string;
  pain: string;
}

const EMPTY_VITALS: VitalsForm = {
  systolicBp: "",
  diastolicBp: "",
  hr: "",
  spo2: "",
  tempC: "",
  pain: "",
};

type TaskStatus = NursingTask["status"];

const COLUMNS: { key: TaskStatus; label: string; icon: React.ReactNode; colour: string }[] = [
  {
    key:    "pending",
    label:  "Pending",
    icon:   <Clock3 className="h-3.5 w-3.5" />,
    colour: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  },
  {
    key:    "in-progress",
    label:  "In Progress",
    icon:   <CircleDot className="h-3.5 w-3.5" />,
    colour: "border-[#0F766E]/50 text-[#0F766E] bg-[#0F766E]/10",
  },
  {
    key:    "done",
    label:  "Done",
    icon:   <CheckCircle2 className="h-3.5 w-3.5" />,
    colour: "border-slate-500/40 text-slate-400 bg-slate-500/10",
  },
];

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  "pending":     "in-progress",
  "in-progress": "done",
  "done":        "pending",
};

// ── Mock seed data (UI visible before real DB rows exist) ─────────────────────

const MOCK_PATIENTS: AdmittedPatient[] = [
  { admissionId: "adm-001", patientId: "p-001", displayName: "Sunita Rao",    bedNumber: "GW-04", ward: "General" },
  { admissionId: "adm-002", patientId: "p-002", displayName: "Arjun Kumar",   bedNumber: "ICU-02", ward: "ICU" },
  { admissionId: "adm-003", patientId: "p-003", displayName: "Priya Nair",    bedNumber: "MW-07", ward: "Maternity" },
];

const MOCK_TASKS: NursingTask[] = [
  { id: "t-1", admissionId: "adm-001", title: "Administer IV antibiotics",   status: "pending",     assignedTo: null, dueAt: null, notes: null, createdAt: new Date().toISOString() },
  { id: "t-2", admissionId: "adm-001", title: "Change wound dressing",       status: "in-progress", assignedTo: null, dueAt: null, notes: null, createdAt: new Date().toISOString() },
  { id: "t-3", admissionId: "adm-001", title: "Record vitals (08:00 round)", status: "done",        assignedTo: null, dueAt: null, notes: null, createdAt: new Date().toISOString() },
  { id: "t-4", admissionId: "adm-001", title: "Notify physician — BP spike", status: "pending",     assignedTo: null, dueAt: null, notes: null, createdAt: new Date().toISOString() },
];

// ── Vitals field config ───────────────────────────────────────────────────────

interface FieldMeta {
  key: keyof VitalsForm;
  label: string;
  placeholder: string;
  unit: string;
  icon: React.ReactNode;
  min: number;
  max: number;
}

const VITAL_FIELDS: FieldMeta[] = [
  { key: "systolicBp",  label: "Systolic BP",   placeholder: "120",  unit: "mmHg", icon: <Gauge       className="h-3.5 w-3.5" />, min: 60,  max: 250 },
  { key: "diastolicBp", label: "Diastolic BP",  placeholder: "80",   unit: "mmHg", icon: <Gauge       className="h-3.5 w-3.5" />, min: 40,  max: 150 },
  { key: "hr",          label: "Heart Rate",    placeholder: "72",   unit: "bpm",  icon: <Heart       className="h-3.5 w-3.5" />, min: 30,  max: 220 },
  { key: "spo2",        label: "SpO₂",          placeholder: "98",   unit: "%",    icon: <Wind        className="h-3.5 w-3.5" />, min: 70,  max: 100 },
  { key: "tempC",       label: "Temperature",   placeholder: "37.0", unit: "°C",   icon: <Thermometer className="h-3.5 w-3.5" />, min: 34,  max: 43  },
  { key: "pain",        label: "Pain Score",    placeholder: "0",    unit: "/10",  icon: <Smile       className="h-3.5 w-3.5" />, min: 0,   max: 10  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function vitalsValid(form: VitalsForm): boolean {
  return VITAL_FIELDS.every((f) => {
    const v = parseFloat(form[f.key]);
    return !isNaN(v) && v >= f.min && v <= f.max;
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VitalInput({
  field,
  value,
  onChange,
}: {
  field: FieldMeta;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
        <span style={{ color: "#0F766E" }}>{field.icon}</span>
        {field.label}
      </label>
      <div className="relative">
        <Input
          type="number"
          min={field.min}
          max={field.max}
          step={field.key === "tempC" ? 0.1 : 1}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-12 bg-[hsl(220_13%_11%)] border-border text-fg placeholder:text-muted/50 focus:border-[#0F766E]/60 focus:ring-[#0F766E]/20"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted">
          {field.unit}
        </span>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onAdvance,
  advancing,
}: {
  task: NursingTask;
  onAdvance: (id: string, next: TaskStatus) => void;
  advancing: boolean;
}) {
  const next = STATUS_NEXT[task.status];

  return (
    <div className="group rounded-lg border border-border bg-[hsl(220_13%_11%)] p-3 transition-all hover:border-[#0F766E]/30">
      <p className="text-[12px] font-medium leading-snug text-fg">{task.title}</p>
      {task.dueAt && (
        <p className="mt-1 text-[10px] text-muted">Due {fmtTime(task.dueAt)}</p>
      )}
      {task.status !== "done" && (
        <button
          onClick={() => onAdvance(task.id, next)}
          disabled={advancing}
          className="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-[#0F766E] opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40"
        >
          <ChevronRight className="h-3 w-3" />
          {next === "in-progress" ? "Start" : "Mark done"}
        </button>
      )}
    </div>
  );
}

function KanbanColumn({
  col,
  tasks,
  onAdvance,
  advancing,
}: {
  col: (typeof COLUMNS)[number];
  tasks: NursingTask[];
  onAdvance: (id: string, next: TaskStatus) => void;
  advancing: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 border text-[10px] font-bold uppercase tracking-widest ${col.colour}`}
        >
          {col.icon}
          {col.label}
        </Badge>
        <span className="text-[10px] text-muted">{tasks.length}</span>
      </div>

      <ScrollArea className="max-h-[460px]">
        <div className="flex flex-col gap-2 pr-1">
          {tasks.length === 0 && (
            <p className="rounded-lg border border-dashed border-border py-6 text-center text-[10px] text-muted">
              No tasks
            </p>
          )}
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onAdvance={onAdvance}
              advancing={advancing}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NurseStation() {
  const supabase = createClient();

  // ── State ────────────────────────────────────────────────────────────────────
  const [patients, setPatients]             = useState<AdmittedPatient[]>(MOCK_PATIENTS);
  const [selectedId, setSelectedId]         = useState<string>(MOCK_PATIENTS[0].admissionId);
  const [vitals, setVitals]                 = useState<VitalsForm>(EMPTY_VITALS);
  const [saveStatus, setSaveStatus]         = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [tasks, setTasks]                   = useState<NursingTask[]>(MOCK_TASKS);
  const [taskLoading, setTaskLoading]       = useState(false);
  const [advancing, setAdvancing]           = useState(false);
  const [lastObsAt, setLastObsAt]           = useState<Date | null>(null);
  const [newTaskTitle, setNewTaskTitle]     = useState("");
  const [addingTask, startAddingTask]       = useTransition();

  // ── Selected patient ─────────────────────────────────────────────────────────
  const selected = patients.find((p) => p.admissionId === selectedId) ?? patients[0];

  // ── Load patients ────────────────────────────────────────────────────────────
  const loadPatients = useCallback(async () => {
    const { data } = await supabase
      .from("admissions")
      .select(`
        id,
        patient_id,
        patients ( given_name, family_name ),
        beds ( bed_number, ward )
      `)
      .eq("status", "admitted")
      .order("admitted_at", { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      const mapped: AdmittedPatient[] = (data as any[]).map((row) => ({
        admissionId: row.id,
        patientId:   row.patient_id,
        displayName: row.patients
          ? `${row.patients.given_name ?? ""} ${row.patients.family_name ?? ""}`.trim()
          : "Unknown Patient",
        bedNumber:   row.beds?.bed_number ?? "—",
        ward:        row.beds?.ward       ?? "—",
      }));
      setPatients(mapped);
      if (!mapped.find((p) => p.admissionId === selectedId)) {
        setSelectedId(mapped[0].admissionId);
      }
    }
    // Falls back to MOCK_PATIENTS if no DB rows
  }, [supabase, selectedId]);

  // ── Load tasks ───────────────────────────────────────────────────────────────
  const loadTasks = useCallback(async (admissionId: string) => {
    setTaskLoading(true);
    const { data } = await supabase
      .from("nursing_tasks")
      .select("*")
      .eq("admission_id", admissionId)
      .order("due_at", { ascending: true });

    if (data && data.length > 0) {
      setTasks(data as NursingTask[]);
    } else {
      // Keep mock tasks if no real data yet
      setTasks(MOCK_TASKS.filter((t) => t.admissionId === admissionId));
    }
    setTaskLoading(false);
  }, [supabase]);

  // ── Realtime: observations (live refresh indicator) ───────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("nurse-station-obs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "observations" },
        (payload) => {
          // Only care about the selected patient
          if (selected && (payload.new as any).patient_id === selected.patientId) {
            setLastObsAt(new Date());
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, selected]);

  // ── Realtime: nursing tasks ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) return;

    const channel = supabase
      .channel("nurse-station-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nursing_tasks" },
        () => { loadTasks(selectedId); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, selectedId, loadTasks]);

  // ── Initial loads ─────────────────────────────────────────────────────────────
  useEffect(() => { loadPatients(); }, [loadPatients]);
  useEffect(() => { if (selectedId) loadTasks(selectedId); }, [selectedId, loadTasks]);

  // ── Save vitals ───────────────────────────────────────────────────────────────
  async function handleSaveVitals(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !vitalsValid(vitals)) return;

    setSaveStatus("saving");
    try {
      // Build observation rows (LOINC-coded)
      const base = {
        patient_id:   selected.patientId,
        code_system:  "http://loinc.org",
        status:       "final",
        effective_at: new Date().toISOString(),
      };

      const rows = [
        { ...base, code: LOINC.BP.code,   display: LOINC.BP.display,
          value_text: `${vitals.systolicBp}/${vitals.diastolicBp}`, value_unit: LOINC.BP.unit },
        { ...base, code: LOINC.HR.code,   display: LOINC.HR.display,
          value_num: parseFloat(vitals.hr),   value_unit: LOINC.HR.unit },
        { ...base, code: LOINC.SPO2.code, display: LOINC.SPO2.display,
          value_num: parseFloat(vitals.spo2), value_unit: LOINC.SPO2.unit },
        { ...base, code: LOINC.TEMP.code, display: LOINC.TEMP.display,
          value_num: parseFloat(vitals.tempC), value_unit: LOINC.TEMP.unit },
        { ...base, code: LOINC.PAIN.code, display: LOINC.PAIN.display,
          value_num: parseFloat(vitals.pain), value_unit: LOINC.PAIN.unit },
      ];

      const { error } = await supabase.from("observations").insert(rows);
      if (error) throw error;

      setSaveStatus("saved");
      setVitals(EMPTY_VITALS);
      setLastObsAt(new Date());
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  // ── Advance task status ───────────────────────────────────────────────────────
  async function handleAdvanceTask(taskId: string, next: TaskStatus) {
    setAdvancing(true);
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: next } : t))
    );
    try {
      await supabase
        .from("nursing_tasks")
        .update({ status: next })
        .eq("id", taskId);
    } catch {
      // Revert on error
      await loadTasks(selectedId);
    } finally {
      setAdvancing(false);
    }
  }

  // ── Add task (inline) ─────────────────────────────────────────────────────────
  function handleAddTask() {
    if (!newTaskTitle.trim() || !selected) return;
    startAddingTask(async () => {
      const tempId = `temp-${Date.now()}`;
      const tempTask: NursingTask = {
        id:          tempId,
        admissionId: selected.admissionId,
        title:       newTaskTitle.trim(),
        status:      "pending",
        assignedTo:  null,
        dueAt:       null,
        notes:       null,
        createdAt:   new Date().toISOString(),
      };
      setTasks((prev) => [tempTask, ...prev]);
      setNewTaskTitle("");

      await supabase.from("nursing_tasks").insert({
        admission_id: selected.admissionId,
        title:        tempTask.title,
        status:       "pending",
      });
    });
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const tasksByStatus = {
    "pending":     tasks.filter((t) => t.status === "pending"),
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    "done":        tasks.filter((t) => t.status === "done"),
  };

  const canSave = selected && vitalsValid(vitals) && saveStatus !== "saving";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden">

      {/* ── LEFT PANEL: Patient selector + Vitals form ─────────────────────── */}
      <aside
        className="flex w-[340px] shrink-0 flex-col gap-0 border-r border-border"
        style={{ background: "hsl(220 13% 9%)" }}
      >
        {/* Patient selector */}
        <div className="border-b border-border px-5 py-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
            <Stethoscope className="h-3 w-3" style={{ color: "#0F766E" }} />
            Admitted Patient
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-border bg-[hsl(220_13%_11%)] px-3 py-2.5 text-sm text-fg outline-none focus:border-[#0F766E]/60 focus:ring-1 focus:ring-[#0F766E]/20"
          >
            {patients.map((p) => (
              <option key={p.admissionId} value={p.admissionId}>
                {p.displayName} — {p.ward} {p.bedNumber}
              </option>
            ))}
          </select>
          {selected && (
            <div className="mt-2 flex gap-2">
              <Badge variant="outline" className="border-[#0F766E]/40 text-[10px] text-[#0F766E]">
                {selected.ward}
              </Badge>
              <Badge variant="outline" className="border-border text-[10px] text-muted">
                Bed {selected.bedNumber}
              </Badge>
            </div>
          )}
        </div>

        {/* Vitals form */}
        <ScrollArea className="flex-1">
          <form onSubmit={handleSaveVitals} className="flex flex-col gap-5 p-5">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" style={{ color: "#0F766E" }} />
              <span className="text-sm font-semibold text-fg">Record Vitals</span>
              {lastObsAt && (
                <span className="ml-auto text-[9px] text-muted">
                  Last: {fmtTime(lastObsAt.toISOString())}
                </span>
              )}
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-2 gap-3">
              {VITAL_FIELDS.map((field) => (
                <VitalInput
                  key={field.key}
                  field={field}
                  value={vitals[field.key]}
                  onChange={(v) => setVitals((prev) => ({ ...prev, [field.key]: v }))}
                />
              ))}
            </div>

            {/* LOINC legend */}
            <div className="rounded-md border border-border bg-[hsl(220_15%_6%)] px-3 py-2.5">
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted">
                LOINC codes
              </p>
              <div className="grid grid-cols-1 gap-0.5">
                {Object.values(LOINC).map((l) => (
                  <p key={l.code} className="text-[9px] text-muted/70">
                    <span className="font-mono text-muted">{l.code}</span> — {l.display}
                  </p>
                ))}
              </div>
            </div>

            {/* Save button */}
            <Button
              type="submit"
              disabled={!canSave}
              className="w-full"
              variant="primary"
              size="sm"
            >
              {saveStatus === "saving" ? (
                <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving…</>
              ) : saveStatus === "saved" ? (
                <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</>
              ) : saveStatus === "error" ? (
                "Error — retry"
              ) : (
                "Save Vitals"
              )}
            </Button>

            {saveStatus === "error" && (
              <p className="text-center text-[11px] text-red-400">
                Failed to save. Check connection.
              </p>
            )}
          </form>
        </ScrollArea>
      </aside>

      {/* ── RIGHT PANEL: Nursing task board ────────────────────────────────── */}
      <main
        className="flex flex-1 flex-col overflow-hidden"
        style={{ background: "hsl(220 15% 6%)" }}
      >
        {/* Board header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="h-4 w-4" style={{ color: "#0F766E" }} />
            <span className="text-sm font-semibold text-fg">Nursing Task Board</span>
            {selected && (
              <span className="text-[11px] text-muted">— {selected.displayName}</span>
            )}
          </div>

          {/* Add task inline */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="New task…"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTask(); } }}
              className="h-8 w-52 bg-[hsl(220_13%_9%)] text-sm border-border placeholder:text-muted/50 focus:border-[#0F766E]/60"
            />
            <Button
              size="sm"
              variant="primary"
              disabled={!newTaskTitle.trim() || addingTask}
              onClick={handleAddTask}
              className="h-8 px-3"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
            {taskLoading && (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted" />
            )}
          </div>
        </div>

        {/* Kanban grid */}
        <div className="flex flex-1 gap-0 overflow-hidden">
          {COLUMNS.map((col, i) => (
            <div
              key={col.key}
              className={`flex flex-1 flex-col gap-3 overflow-hidden p-5 ${
                i < COLUMNS.length - 1 ? "border-r border-border" : ""
              }`}
            >
              <KanbanColumn
                col={col}
                tasks={tasksByStatus[col.key]}
                onAdvance={handleAdvanceTask}
                advancing={advancing}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
