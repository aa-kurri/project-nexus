"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText, Search, Filter, Layers } from "lucide-react";

const mockRadiologyWorklist = [
  { id: "R-101", patient: "Arun Kumar", study: "Chest X-Ray AP/Lat", modality: "CR", status: "pending", priority: "urgent", time: "10 mins ago" },
  { id: "R-102", patient: "Meena Devi", study: "Brain MRI w/ Contrast", modality: "MR", status: "in-progress", priority: "routine", time: "45 mins ago" },
  { id: "R-103", patient: "Suresh Pillai", study: "Abdomen CT", modality: "CT", status: "pending", priority: "stat", time: "5 mins ago" },
  { id: "R-104", patient: "Kavita Singh", study: "Knee X-Ray", modality: "CR", status: "reported", priority: "routine", time: "2 hours ago" },
];

export default function RadiologyWorklist() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Radiology Worklist</h1>
          <p className="text-slate-500 font-medium">Reporting worklist and PACS imaging access</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border">
            {['CR', 'CT', 'MR', 'US'].map((m) => (
              <button key={m} className="px-3 py-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-800">{m}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockRadiologyWorklist.map((item) => (
          <Card key={item.id} className="p-4 hover:shadow-lg transition-all border-0 shadow-sm bg-white flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className={`p-3 rounded-lg ${
                item.priority === 'stat' ? 'bg-rose-100 text-rose-600' : 
                item.priority === 'urgent' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'
              }`}>
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">{item.patient}</h3>
                  <Badge variant="outline" className="text-[10px] font-black uppercase">{item.modality}</Badge>
                  {item.priority !== 'routine' && (
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                      item.priority === 'stat' ? 'bg-rose-500 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {item.priority}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">{item.study} · {item.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">{item.time}</p>
                <div className="flex items-center gap-1.5 mt-1 justify-end">
                  <span className={`w-2 h-2 rounded-full ${
                    item.status === 'reported' ? 'bg-emerald-500' : 
                    item.status === 'in-progress' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
                  }`}></span>
                  <span className="text-[10px] font-black uppercase text-slate-600">{item.status}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-[#0F766E]/10 rounded-lg text-[#0F766E] transition-colors">
                  <Eye className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-[#0F766E]/10 rounded-lg text-[#0F766E] transition-colors">
                  <FileText className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Simple Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        {[
          { label: 'Unreported', value: '12', color: 'text-rose-500' },
          { label: 'Avg Turnaround', value: '42m', color: 'text-[#0F766E]' },
          { label: 'Urgent Studies', value: '3', color: 'text-orange-500' },
          { label: 'System Health', value: 'PACS OK', color: 'text-emerald-500' }
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center border-0 shadow-sm">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
