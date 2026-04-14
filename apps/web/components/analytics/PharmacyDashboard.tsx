"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  item: string;
  category: string;
  amount: number;
  qty: number;
  time: string;
}

export default function PharmacyDashboard() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const stats = [
    { label: "Today's Revenue", value: "₹ 1.4L", trend: "+12.5%" },
    { label: "Total Transactions", value: "342", trend: "+5.2%" },
    { label: "Avg Dispense Time", value: "1m 45s", trend: "-10s" },
    { label: "GST Collected", value: "₹ 12,450", trend: "+14.0%" },
  ];

  const categories = [
    { name: "Antibiotics", revenue: 45000, color: "bg-blue-500" },
    { name: "Analgesics", revenue: 32000, color: "bg-emerald-500" },
    { name: "Cardiac", revenue: 28000, color: "bg-rose-500" },
    { name: "Vitamins/Supplements", revenue: 15000, color: "bg-amber-500" },
    { name: "Others", revenue: 20000, color: "bg-slate-400" }
  ];

  const mockTransactions: Transaction[] = [
    { id: "TX-101", item: "Azithromycin 500mg", category: "Antibiotics", amount: 1250, qty: 5, time: "10:15 AM" },
    { id: "TX-102", item: "Amoxicillin CV", category: "Antibiotics", amount: 840, qty: 3, time: "10:42 AM" },
    { id: "TX-103", item: "Paracetamol 650mg", category: "Analgesics", amount: 120, qty: 10, time: "11:05 AM" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F766E] tracking-tight">Pharmacy Analytics</h1>
          <p className="text-slate-500 mt-1">High-velocity drug consumption & GST outputs</p>
        </div>
        <Badge variant="outline" className="border-[#0F766E] text-[#0F766E] bg-[#0F766E]/10">Last updated: Just now</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6 bg-white border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</h3>
            <div className="flex items-end gap-3 mt-2">
              <span className="text-3xl font-black text-slate-800">{stat.value}</span>
              <span className={`text-sm font-medium mb-1 ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-emerald-500'}`}>
                {stat.trend}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Category Breakdown (Simulated Tremor Donut) */}
        <Card className="p-6 bg-white lg:col-span-1 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">Revenue by Category</h3>
          <div className="space-y-4">
            {categories.map((cat, i) => (
              <div 
                key={i} 
                onClick={() => setActiveCategory(cat.name === activeCategory ? null : cat.name)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  activeCategory === cat.name ? 'bg-slate-100 ring-2 ring-[#0F766E]/20' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full ${cat.color}`}></span>
                  <span className="font-medium text-slate-700">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900">₹ {(cat.revenue / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Drill-down Table */}
        <Card className="p-6 bg-white lg:col-span-2 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h3 className="text-lg font-bold text-slate-800">
              {activeCategory ? `${activeCategory} Transactions` : "Recent Transactions"}
            </h3>
            <span className="text-sm bg-slate-100 px-3 py-1 rounded text-slate-600 font-medium">Last 50 records</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold">Time</th>
                  <th className="py-3 px-4 font-semibold">Item</th>
                  <th className="py-3 px-4 font-semibold text-right">Qty</th>
                  <th className="py-3 px-4 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions
                  .filter(tx => !activeCategory || tx.category === activeCategory)
                  .map(tx => (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-500">{tx.time}</td>
                    <td className="py-3 px-4 text-sm font-bold text-slate-800">{tx.item}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-700 text-right">{tx.qty}</td>
                    <td className="py-3 px-4 text-sm font-bold text-[#0F766E] text-right">₹ {tx.amount}</td>
                  </tr>
                ))}
                {activeCategory && activeCategory !== "Antibiotics" && activeCategory !== "Analgesics" && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400 italic">No recent transactions matches this drill-down.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}
