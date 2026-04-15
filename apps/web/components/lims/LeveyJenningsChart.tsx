"use client";

import { useMemo } from "react";

// ── Types & constants ─────────────────────────────────────────────────────────

export const ANALYTES = [
  "Glucose",
  "Creatinine",
  "Haemoglobin",
  "Sodium",
  "Potassium",
] as const;

export const ANALYSERS = ["Cobas c311", "Sysmex XN-550", "i-STAT 1"] as const;

export type Analyte = (typeof ANALYTES)[number];
export type Analyser = (typeof ANALYSERS)[number];

interface QCRun {
  run: number;
  value: number;
}

export type WestgardFlag = "1-3s" | "2-2s" | "1-2s" | "ok";

// ── Mock data generation ──────────────────────────────────────────────────────

const ANALYTE_CONFIG: Record<Analyte, { mean: number; sd: number; unit: string }> = {
  Glucose:     { mean: 5.50,  sd: 0.18, unit: "mmol/L" },
  Creatinine:  { mean: 88.0,  sd: 3.5,  unit: "µmol/L" },
  Haemoglobin: { mean: 15.20, sd: 0.40, unit: "g/dL"   },
  Sodium:      { mean: 140.0, sd: 1.80, unit: "mmol/L" },
  Potassium:   { mean: 4.200, sd: 0.12, unit: "mmol/L" },
};

/** Deterministic LCG pseudo-random, seeded, 40 values for 20 Box-Muller pairs. */
function lcgPairs(seed: number): [number, number][] {
  const pairs: [number, number][] = [];
  let s = seed >>> 0;
  for (let i = 0; i < 40; i++) {
    s = ((Math.imul(s, 1664525) + 1013904223) | 0) >>> 0;
    if (i % 2 === 0) pairs.push([s / 4294967295, 0]);
    else pairs[pairs.length - 1][1] = s / 4294967295;
  }
  return pairs;
}

function generateRuns(mean: number, sd: number, seed: number): QCRun[] {
  const pairs = lcgPairs(seed);
  const runs: QCRun[] = pairs.map(([u1, u2], i) => {
    const z = Math.sqrt(-2 * Math.log(u1 + 1e-9)) * Math.cos(2 * Math.PI * u2);
    // Introduce subtle upward drift in runs 15-20 (±2SD pressure)
    const drift = i >= 14 ? sd * 0.45 : 0;
    return { run: i + 1, value: +(mean + z * sd + drift).toFixed(4) };
  });
  // Inject deliberate 1-3s violation at run 18 for visual demonstration
  runs[17] = { run: 18, value: +(mean + 3.25 * sd).toFixed(4) };
  return runs;
}

// Pre-compute all mock datasets at module load (deterministic, never changes)
const QC_DATA: Record<Analyser, Record<Analyte, QCRun[]>> = {
  "Cobas c311":    Object.fromEntries(
    ANALYTES.map((a, i) => [a, generateRuns(ANALYTE_CONFIG[a].mean, ANALYTE_CONFIG[a].sd, 1000 + i)])
  ) as Record<Analyte, QCRun[]>,
  "Sysmex XN-550": Object.fromEntries(
    ANALYTES.map((a, i) => [a, generateRuns(ANALYTE_CONFIG[a].mean, ANALYTE_CONFIG[a].sd, 2000 + i)])
  ) as Record<Analyte, QCRun[]>,
  "i-STAT 1":      Object.fromEntries(
    ANALYTES.map((a, i) => [a, generateRuns(ANALYTE_CONFIG[a].mean, ANALYTE_CONFIG[a].sd, 3000 + i)])
  ) as Record<Analyte, QCRun[]>,
};

// ── Westgard rules ────────────────────────────────────────────────────────────

/**
 * Applies Westgard rules per-run and returns a flag for each:
 *  1-3s  — single result ≥ ±3 SD (rejection)
 *  2-2s  — two consecutive results both ≥ +2 SD or both ≤ −2 SD (rejection)
 *  1-2s  — single result ≥ ±2 SD (warning)
 *  ok    — in control
 */
export function westgardFlags(runs: QCRun[], mean: number, sd: number): WestgardFlag[] {
  const zs = runs.map(r => (r.value - mean) / sd);
  const flags: WestgardFlag[] = zs.map(z =>
    Math.abs(z) >= 3 ? "1-3s" : Math.abs(z) >= 2 ? "1-2s" : "ok"
  );
  // 2-2s: two consecutive both > +2 or both < −2 → upgrade to rejection
  for (let i = 1; i < zs.length; i++) {
    if ((zs[i - 1] >= 2 && zs[i] >= 2) || (zs[i - 1] <= -2 && zs[i] <= -2)) {
      if (flags[i] !== "1-3s") flags[i] = "2-2s";
    }
  }
  return flags;
}

// ── Exported helper for the page summary stats ────────────────────────────────

export interface QcStats {
  total: number;
  inControl: number;
  warnings: number;
  rejections: number;
  mean: number;
  sd: number;
  unit: string;
  cv: number;
}

export function getQcStats(analyte: Analyte, analyser: Analyser): QcStats {
  const { mean, sd, unit } = ANALYTE_CONFIG[analyte];
  const runs = QC_DATA[analyser][analyte];
  const flags = westgardFlags(runs, mean, sd);
  return {
    total:      runs.length,
    inControl:  flags.filter(f => f === "ok").length,
    warnings:   flags.filter(f => f === "1-2s").length,
    rejections: flags.filter(f => f === "1-3s" || f === "2-2s").length,
    mean,
    sd,
    unit,
    cv: +((sd / mean) * 100).toFixed(2),
  };
}

// ── SVG layout constants ──────────────────────────────────────────────────────

const W = 700;
const H = 320;
const PL = 64;   // left padding  (Y-axis labels)
const PR = 20;   // right padding
const PT = 36;   // top padding
const PB = 52;   // bottom padding (X-axis labels)
const CW = W - PL - PR;   // 616
const CH = H - PT - PB;   // 232

/** Convert an SD count (−3 … +3) to a Y pixel coordinate. */
const sdToY = (n: number) => PT + ((3.5 - n) / 7) * CH;

/** Convert a 1-based run index to an X pixel coordinate. */
const runToX = (r: number) => PL + ((r - 1) / 19) * CW;

/** Clamp a value within [lo, hi]. */
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// ── Colour helpers ────────────────────────────────────────────────────────────

const TEAL = "#0F766E";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const MUTED_LINE = "#374151";

function flagColour(f: WestgardFlag): string {
  if (f === "1-3s" || f === "2-2s") return RED;
  if (f === "1-2s") return AMBER;
  return TEAL;
}

// SD reference lines metadata
const SD_LINES = [
  { n: 3,  label: "+3SD", stroke: RED,       dash: "5 3" },
  { n: 2,  label: "+2SD", stroke: AMBER,     dash: "5 3" },
  { n: 1,  label: "+1SD", stroke: MUTED_LINE, dash: "3 5" },
  { n: 0,  label: "Mean", stroke: TEAL,      dash: ""    },
  { n: -1, label: "−1SD", stroke: MUTED_LINE, dash: "3 5" },
  { n: -2, label: "−2SD", stroke: AMBER,     dash: "5 3" },
  { n: -3, label: "−3SD", stroke: RED,       dash: "5 3" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  analyte: Analyte;
  analyser: Analyser;
}

export default function LeveyJenningsChart({ analyte, analyser }: Props) {
  const { mean, sd, unit } = ANALYTE_CONFIG[analyte];
  const runs = QC_DATA[analyser][analyte];

  const flags = useMemo(
    () => westgardFlags(runs, mean, sd),
    [runs, mean, sd]
  );

  // Polyline: join all data points
  const polylinePoints = runs
    .map(r => {
      const z = (r.value - mean) / sd;
      const x = runToX(r.run);
      const y = clamp(sdToY(z), PT, PT + CH);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full select-none"
      style={{ maxHeight: 360 }}
      aria-label={`Levey–Jennings chart for ${analyte} on ${analyser}`}
    >
      {/* ── Zone fills ──────────────────────────────────────────────── */}
      {/* ±3 SD rejection zone */}
      <rect
        x={PL} y={sdToY(3)}
        width={CW} height={sdToY(2) - sdToY(3)}
        fill="rgba(239,68,68,0.06)"
      />
      <rect
        x={PL} y={sdToY(-2)}
        width={CW} height={sdToY(-3) - sdToY(-2)}
        fill="rgba(239,68,68,0.06)"
      />
      {/* ±2 SD warning zone */}
      <rect
        x={PL} y={sdToY(2)}
        width={CW} height={sdToY(1) - sdToY(2)}
        fill="rgba(245,158,11,0.06)"
      />
      <rect
        x={PL} y={sdToY(-1)}
        width={CW} height={sdToY(-2) - sdToY(-1)}
        fill="rgba(245,158,11,0.06)"
      />
      {/* ±1 SD in-control zone */}
      <rect
        x={PL} y={sdToY(1)}
        width={CW} height={sdToY(-1) - sdToY(1)}
        fill="rgba(15,118,110,0.07)"
      />

      {/* ── SD reference lines ───────────────────────────────────────── */}
      {SD_LINES.map(line => (
        <line
          key={line.label}
          x1={PL}      y1={sdToY(line.n)}
          x2={PL + CW} y2={sdToY(line.n)}
          stroke={line.stroke}
          strokeWidth={line.n === 0 ? 1.5 : 1}
          strokeDasharray={line.dash}
          strokeOpacity={0.65}
        />
      ))}

      {/* ── Axes ────────────────────────────────────────────────────── */}
      <line x1={PL} y1={PT} x2={PL} y2={PT + CH} stroke={MUTED_LINE} strokeWidth={1} />
      <line x1={PL} y1={PT + CH} x2={PL + CW} y2={PT + CH} stroke={MUTED_LINE} strokeWidth={1} />

      {/* ── Y-axis ticks + labels ────────────────────────────────────── */}
      {SD_LINES.map(line => {
        const y = sdToY(line.n);
        const actualVal = +(mean + line.n * sd).toFixed(3);
        return (
          <g key={`ytick-${line.n}`}>
            <line x1={PL - 4} y1={y} x2={PL} y2={y} stroke={MUTED_LINE} strokeWidth={1} />
            {/* SD label */}
            <text
              x={PL - 6}
              y={y - 1}
              textAnchor="end"
              fontSize={9}
              fill={line.stroke}
              opacity={0.85}
            >
              {line.label}
            </text>
            {/* Actual value */}
            <text
              x={PL - 6}
              y={y + 9}
              textAnchor="end"
              fontSize={8}
              fill="#6b7280"
              fontFamily="monospace"
            >
              {actualVal}
            </text>
          </g>
        );
      })}

      {/* Y-axis unit label (rotated) */}
      <text
        x={10}
        y={PT + CH / 2}
        textAnchor="middle"
        fontSize={10}
        fill="#6b7280"
        transform={`rotate(-90, 10, ${PT + CH / 2})`}
      >
        {unit}
      </text>

      {/* ── X-axis ticks + labels ────────────────────────────────────── */}
      {runs.map((r, i) => {
        if (i % 2 !== 0 && i !== 19) return null; // every other tick
        const x = runToX(r.run);
        return (
          <g key={`xtick-${r.run}`}>
            <line x1={x} y1={PT + CH} x2={x} y2={PT + CH + 4} stroke={MUTED_LINE} strokeWidth={1} />
            <text x={x} y={PT + CH + 16} textAnchor="middle" fontSize={10} fill="#9ca3af">
              {r.run}
            </text>
          </g>
        );
      })}

      {/* X-axis label */}
      <text
        x={PL + CW / 2}
        y={H - 6}
        textAnchor="middle"
        fontSize={11}
        fill="#6b7280"
      >
        Run Number
      </text>

      {/* ── Connecting polyline ──────────────────────────────────────── */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={TEAL}
        strokeWidth={1.5}
        strokeOpacity={0.45}
        strokeLinejoin="round"
      />

      {/* ── Data points ─────────────────────────────────────────────── */}
      {runs.map((r, i) => {
        const flag = flags[i];
        const z = (r.value - mean) / sd;
        const cx = runToX(r.run);
        const cy = clamp(sdToY(z), PT, PT + CH);
        const colour = flagColour(flag);
        const isViolation = flag !== "ok";
        return (
          <g key={`pt-${r.run}`}>
            {/* Outer glow ring for violations */}
            {isViolation && (
              <circle
                cx={cx} cy={cy} r={8}
                fill="none"
                stroke={colour}
                strokeWidth={1}
                strokeDasharray="2 2"
                opacity={0.6}
              />
            )}
            {/* Main dot */}
            <circle
              cx={cx} cy={cy} r={4.5}
              fill={colour}
              fillOpacity={0.2}
              stroke={colour}
              strokeWidth={1.5}
            />
            {/* Solid centre for violations */}
            {isViolation && (
              <circle cx={cx} cy={cy} r={2.5} fill={colour} />
            )}
            {/* SVG native tooltip */}
            <title>
              {`Run ${r.run}: ${r.value} ${unit} (z = ${z.toFixed(2)})${isViolation ? ` — ${flag} violation` : " — In control"}`}
            </title>
          </g>
        );
      })}

      {/* ── Chart title ─────────────────────────────────────────────── */}
      <text
        x={PL + CW / 2}
        y={20}
        textAnchor="middle"
        fontSize={13}
        fontWeight="600"
        fill="#f3f4f6"
      >
        {analyte} · {analyser}
      </text>
    </svg>
  );
}
