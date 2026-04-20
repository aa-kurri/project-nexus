"use client";

import { useState } from "react";
import { Utensils, CheckCircle, Clock, AlertCircle, ChevronDown, Plus } from "lucide-react";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "supplement"];
const DIET_TYPES = ["Regular", "Low Sodium", "Diabetic", "Liquid", "Semi-Liquid", "NDiet (Nil by Mouth)", "High Protein", "Renal", "Cardiac", "Post-Op Soft"];

const MOCK_ORDERS = [
  { id: "1", patient: "Sunita Devi", bed: "W2-04", meal: "breakfast", diet: "Diabetic", scheduled: "07:30", status: "delivered", allergy: "Dairy" },
  { id: "2", patient: "Rajan Mehta", bed: "ICU-02", meal: "breakfast", diet: "Liquid", scheduled: "07:30", status: "prepared", allergy: "" },
  { id: "3", patient: "Kartik Bose", bed: "W1-08", meal: "breakfast", diet: "Low Sodium", scheduled: "07:30", status: "ordered", allergy: "Nuts" },
  { id: "4", patient: "Priya Nair", bed: "W3-01", meal: "lunch", diet: "Regular", scheduled: "12:30", status: "ordered", allergy: "" },
  { id: "5", patient: "Mohan Kumar", bed: "W2-11", meal: "lunch", diet: "Renal", scheduled: "12:30", status: "ordered", allergy: "Eggs" },
];

const STATUS_STYLE: Record<string, { color: string; icon: typeof CheckCircle }> = {
  ordered: { color: "text-blue-400 bg-blue-500/15 border-blue-500/30", icon: Clock },
  prepared: { color: "text-amber-400 bg-amber-500/15 border-amber-500/30", icon: Utensils },
  delivered: { color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30", icon: CheckCircle },
  cancelled: { color: "text-red-400 bg-red-500/15 border-red-500/30", icon: AlertCircle },
};

export default function DietPage() {
  const [activeMeal, setActiveMeal] = useState("breakfast");

  const filtered = MOCK_ORDERS.filter((o) => o.meal === activeMeal);
  const stats = { ordered: MOCK_ORDERS.filter((o) => o.status === "ordered").length, prepared: MOCK_ORDERS.filter((o) => o.status === "prepared").length, delivered: MOCK_ORDERS.filter((o) => o.status === "delivered").length };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Diet & Nutrition Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kitchen display & IPD meal management</p>
        </div>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Diet Order
        </button>
      </div>

      {/* Status bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ordered", count: stats.ordered, color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
          { label: "Prepared", count: stats.prepared, color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
          { label: "Delivered", count: stats.delivered, color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1 opacity-70">{s.label}</p>
            <p className="text-3xl font-bold">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Meal selector */}
      <div className="flex gap-2">
        {MEAL_TYPES.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMeal(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeMeal === m ? "bg-violet-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Kitchen board */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((order) => {
          const s = STATUS_STYLE[order.status] || STATUS_STYLE.ordered;
          const Icon = s.icon;
          return (
            <div key={order.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:border-violet-500/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{order.patient}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Bed {order.bed} · {order.scheduled}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-medium border px-2.5 py-1 rounded-full ${s.color}`}>
                  <Icon className="w-3.5 h-3.5" /> {order.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs px-2.5 py-1 rounded-full font-medium">
                  {order.diet}
                </span>
                {order.allergy && (
                  <span className="bg-red-500/15 text-red-300 border border-red-500/30 text-xs px-2.5 py-1 rounded-full">
                    ⚠ Avoid: {order.allergy}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                {order.status === "ordered" && (
                  <button className="flex-1 bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 border border-amber-500/30 text-xs py-1.5 rounded-lg transition-colors font-medium">
                    Mark Prepared
                  </button>
                )}
                {order.status === "prepared" && (
                  <button className="flex-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-500/30 text-xs py-1.5 rounded-lg transition-colors font-medium">
                    Mark Delivered
                  </button>
                )}
                <button className="bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10 text-xs px-3 py-1.5 rounded-lg transition-colors">
                  Edit
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-10 text-center">
            <Utensils className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No {activeMeal} orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
