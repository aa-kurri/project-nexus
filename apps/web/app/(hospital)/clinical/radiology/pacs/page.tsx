"use client";

import { useState } from "react";
import { Monitor, ZoomIn, ZoomOut, RotateCcw, Download, Sun, Contrast, Maximize2, Grid3x3, Image } from "lucide-react";

const STUDIES = [
  { id: "1", patient: "Rajan Mehta", modality: "CT", bodyPart: "Chest", study: "CT Thorax with Contrast", date: "2026-04-19", images: 284, status: "reported", radiologist: "Dr. K. Nair" },
  { id: "2", patient: "Sunita Devi", modality: "MRI", bodyPart: "Brain", study: "MRI Brain Plain", date: "2026-04-19", images: 312, status: "pending", radiologist: null },
  { id: "3", patient: "Kartik Bose", modality: "X-Ray", bodyPart: "Chest", study: "CXR PA View", date: "2026-04-18", images: 2, status: "reported", radiologist: "Dr. K. Nair" },
  { id: "4", patient: "Priya Nair", modality: "USG", bodyPart: "Abdomen", study: "USG Abdomen & Pelvis", date: "2026-04-18", images: 18, status: "reported", radiologist: "Dr. R. Mehta" },
];

const MODALITY_COLORS: Record<string, string> = {
  CT: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  MRI: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "X-Ray": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  USG: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  PET: "bg-red-500/20 text-red-300 border-red-500/30",
};

// Simulated DICOM-style image viewer (greyscale gradient panels)
function DicomViewer({ study }: { study: typeof STUDIES[0] }) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [layout, setLayout] = useState<"1x1" | "2x2">("1x1");

  const frames = layout === "1x1" ? [0] : [0, 1, 2, 3];

  return (
    <div className="bg-black rounded-xl border border-white/10 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/10">
        <span className="text-xs text-gray-400 font-mono mr-2">{study.patient} · {study.study}</span>
        <div className="ml-auto flex items-center gap-1">
          {[
            { icon: ZoomOut, action: () => setZoom(Math.max(50, zoom - 25)), title: "Zoom Out" },
            { icon: ZoomIn, action: () => setZoom(Math.min(200, zoom + 25)), title: "Zoom In" },
            { icon: RotateCcw, action: () => { setBrightness(100); setContrast(100); setZoom(100); }, title: "Reset" },
            { icon: Maximize2, action: () => {}, title: "Fullscreen" },
          ].map(({ icon: Icon, action, title }) => (
            <button key={title} title={title} onClick={action}
              className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <Icon className="w-4 h-4" />
            </button>
          ))}
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button onClick={() => setLayout(layout === "1x1" ? "2x2" : "1x1")}
            className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <Grid3x3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DICOM frames (simulated with radial gradients) */}
      <div className={`grid gap-0.5 bg-black ${layout === "2x2" ? "grid-cols-2" : "grid-cols-1"}`}
        style={{ height: layout === "2x2" ? 400 : 380 }}>
        {frames.map((i) => (
          <div key={i} className="relative overflow-hidden flex items-center justify-center bg-black"
            style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}>
            {/* Simulated DICOM image using CSS art */}
            <div className="w-full h-full relative">
              <div className="absolute inset-0 bg-radial-gradient"
                style={{
                  background: study.modality === "CT"
                    ? `radial-gradient(ellipse 60% 70% at ${50 + i * 5}% 50%, #888 0%, #555 30%, #222 60%, #111 85%, #000 100%)`
                    : study.modality === "MRI"
                    ? `radial-gradient(ellipse 55% 65% at 50% 48%, #777 0%, #444 25%, #1a1a1a 55%, #000 100%)`
                    : study.modality === "X-Ray"
                    ? `radial-gradient(ellipse 70% 80% at 50% 50%, #aaa 0%, #777 30%, #333 60%, #0a0a0a 100%)`
                    : `radial-gradient(ellipse 40% 50% at 50% 55%, #666 0%, #333 40%, #111 80%, #000 100%)`,
                }}
              />
              {/* Measurement overlay */}
              <div className="absolute top-2 left-2 text-xs font-mono text-[#00ff88] opacity-80" style={{ textShadow: "0 0 4px #00ff88" }}>
                {study.patient.toUpperCase().slice(0, 8)}<br />
                {study.modality} · {new Date().toISOString().slice(0, 10)}<br />
                W:{brightness} L:{contrast}<br />
                {zoom}%
              </div>
              <div className="absolute bottom-2 right-2 text-xs font-mono text-[#00ff88] opacity-60">
                {i + 1}/{study.images}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* WW/WL controls */}
      <div className="flex items-center gap-4 px-4 py-2 bg-white/[0.02] border-t border-white/10">
        <div className="flex items-center gap-2 flex-1">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <input type="range" min={20} max={200} value={brightness} onChange={(e) => setBrightness(+e.target.value)}
            className="flex-1 h-1 accent-amber-400" />
          <span className="text-xs text-gray-400 w-8">{brightness}</span>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Contrast className="w-3.5 h-3.5 text-blue-400" />
          <input type="range" min={20} max={300} value={contrast} onChange={(e) => setContrast(+e.target.value)}
            className="flex-1 h-1 accent-blue-400" />
          <span className="text-xs text-gray-400 w-8">{contrast}</span>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
          <Download className="w-3.5 h-3.5" /> Export DICOM
        </button>
      </div>
    </div>
  );
}

export default function PACSPage() {
  const [selectedStudy, setSelectedStudy] = useState<typeof STUDIES[0] | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">PACS — Imaging Studies</h1>
          <p className="text-sm text-gray-400 mt-0.5">DICOM viewer · Radiology worklist</p>
        </div>
        <div className="flex gap-2">
          {["CT", "MRI", "X-Ray", "USG"].map((m) => (
            <span key={m} className={`text-xs border px-2.5 py-1 rounded-full font-medium ${MODALITY_COLORS[m]}`}>{m}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Worklist */}
        <div className="col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Worklist</h2>
          {STUDIES.map((study) => (
            <button
              key={study.id}
              onClick={() => setSelectedStudy(study)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${selectedStudy?.id === study.id ? "border-violet-500/60 bg-violet-500/10" : "border-white/10 bg-white/[0.03] hover:border-violet-500/30"}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-white text-sm">{study.patient}</p>
                <span className={`text-xs border px-2 py-0.5 rounded-full shrink-0 ${MODALITY_COLORS[study.modality]}`}>{study.modality}</span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{study.study}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{study.images} images · {study.date}</span>
                <span className={study.status === "reported" ? "text-emerald-400" : "text-amber-400"}>
                  {study.status}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Viewer */}
        <div className="col-span-3">
          {selectedStudy ? (
            <DicomViewer study={selectedStudy} />
          ) : (
            <div className="h-full min-h-[400px] bg-black border border-white/10 rounded-xl flex flex-col items-center justify-center gap-4">
              <Monitor className="w-10 h-10 text-gray-700" />
              <p className="text-gray-500 text-sm">Select a study to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
