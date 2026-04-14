"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface QueueItem {
  token: string;
  patientName: string;
  status: 'Waiting' | 'In Consult' | 'Next';
  etaMins: number;
}

export default function LiveQueueBoard() {
  const [queue, setQueue] = useState<QueueItem[]>([
    { token: '#42', patientName: 'Ramesh K.', status: 'In Consult', etaMins: 0 },
    { token: '#43', patientName: 'Priya S.', status: 'Next', etaMins: 2 },
    { token: '#44', patientName: 'Arjun P.', status: 'Waiting', etaMins: 15 },
    { token: '#45', patientName: 'Sunita M.', status: 'Waiting', etaMins: 28 }
  ]);

  useEffect(() => {
    // Simulated Supabase WebSockets / Realtime Subscription
    const interval = setInterval(() => {
      setQueue((prevQueue) => {
        const newQueue = [...prevQueue];
        if (newQueue[1] && newQueue[1].etaMins > 0) {
          newQueue[1].etaMins -= 1;
        }
        return newQueue;
      });
    }, 60000); // Reduce ETA every minute for simulation
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen bg-slate-900 p-8 text-white font-sans overflow-hidden">
      <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-800">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#0F766E] uppercase drop-shadow-md">
          Dr. Sharma <span className="text-slate-400 font-light">— OPD Queue</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F766E] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#0F766E]"></span>
          </span>
          <span className="text-sm font-semibold tracking-widest text-[#0F766E]">LIVE SYNC</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Consultation Panel */}
        <Card className="bg-slate-800 border-none shadow-2xl p-10 flex flex-col items-center justify-center text-center animate-pulse duration-[3000ms]">
          <h2 className="text-2xl text-slate-400 uppercase tracking-widest mb-6">Currently Inside</h2>
          <div className="text-8xl font-black text-emerald-400 mb-4">{queue[0].token}</div>
          <p className="text-3xl font-medium text-white">{queue[0].patientName}</p>
        </Card>

        {/* Up Next List */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl text-slate-500 uppercase tracking-widest mb-2 px-2">Waiting List</h2>
          {queue.slice(1).map((item, idx) => (
            <Card 
              key={item.token} 
              className={`p-6 border-l-8 flex items-center justify-between transition-all duration-500 ${
                item.status === 'Next' 
                  ? 'bg-slate-800 border-l-[#0F766E] shadow-lg scale-105 my-2' 
                  : 'bg-slate-800/50 border-l-slate-700 opacity-80'
              }`}
            >
              <div className="flex items-center gap-6">
                <span className={`text-4xl font-black ${item.status === 'Next' ? 'text-[#0F766E]' : 'text-slate-500'}`}>
                  {item.token}
                </span>
                <span className="text-2xl font-medium text-slate-200">{item.patientName}</span>
              </div>
              <div className="text-right">
                <span className={`block text-xs uppercase tracking-widest mb-1 ${item.status === 'Next' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                  {item.status}
                </span>
                <span className="text-lg font-mono text-slate-300">
                  {item.etaMins} mins
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
