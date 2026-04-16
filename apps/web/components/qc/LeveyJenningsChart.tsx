'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface QCDataPoint {
  id: string;
  run_number: number;
  value: number;
  z_score: number;
  run_at: string;
  accepted: boolean;
  westgard_flags?: string[];
}

interface LeveyJenningsChartProps {
  data: QCDataPoint[];
  targetMean: number;
  targetSD: number;
  analyteName: string;
  unit: string;
}

export const LeveyJenningsChart: React.FC<LeveyJenningsChartProps> = ({
  data,
  targetMean,
  targetSD,
  analyteName,
  unit,
}) => {
  const width = 800;
  const height = 400;
  const padding = 60;
  
  // Chart bounds (+/- 4 SD)
  const minY = targetMean - 4 * targetSD;
  const maxY = targetMean + 4 * targetSD;
  
  const scaleY = (val: number) => {
    return height - padding - ((val - minY) / (maxY - minY)) * (height - 2 * padding);
  };
  
  const scaleX = (index: number) => {
    const range = data.length > 1 ? data.length - 1 : 1;
    return padding + (index / range) * (width - 2 * padding);
  };

  const getPointColor = (zScore: number) => {
    const absZ = Math.abs(zScore);
    if (absZ > 3) return '#EF4444'; // Red-500
    if (absZ > 2) return '#F59E0B'; // Amber-500
    return '#0F766E'; // Ayura Teal
  };

  return (
    <div className="bg-[#0A0E14] p-6 rounded-xl border border-teal-900/30 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-teal-50">{analyteName} QC Chart</h3>
          <p className="text-sm text-teal-400/70">Target Mean: {targetMean} {unit} | SD: {targetSD}</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span className="text-teal-300">Normal</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-amber-300">Warning (2s)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-red-300">Rejection (3s)</span>
          </div>
        </div>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Y-Axis Reference Lines (Mean, +/- 1s, 2s, 3s) */}
        {[-3, -2, -1, 0, 1, 2, 3].map((s) => {
          const y = scaleY(targetMean + s * targetSD);
          const isMean = s === 0;
          const isCritical = Math.abs(s) === 3;
          const isWarning = Math.abs(s) === 2;
          
          return (
            <g key={s}>
              <line 
                x1={padding} 
                y1={y} 
                x2={width - padding} 
                y2={y} 
                stroke={isMean ? '#0F766E' : isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#1F2937'} 
                strokeWidth={isMean ? 2 : 1}
                strokeDasharray={isMean ? "0" : "4 4"}
                opacity={isMean ? 0.8 : 0.4}
              />
              <text 
                x={padding - 10} 
                y={y + 4} 
                textAnchor="end" 
                className="text-[10px] fill-teal-400 font-mono"
              >
                {isMean ? 'Mean' : `${s > 0 ? '+' : ''}${s}SD`}
              </text>
            </g>
          );
        })}

        {/* The Connection Line */}
        <polyline
          fill="none"
          stroke="#0F766E"
          strokeWidth="1.5"
          points={data.map((p, i) => `${scaleX(i)},${scaleY(p.value)}`).join(' ')}
          opacity="0.3"
        />

        {/* Data Points */}
        {data.map((p, i) => (
          <g key={p.id} className="group cursor-pointer">
            <motion.circle
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              cx={scaleX(i)}
              cy={scaleY(p.value)}
              r={p.accepted ? 4 : 5}
              fill={getPointColor(p.z_score)}
              className="hover:stroke-white hover:stroke-2"
            />
            {/* Tooltip on hover */}
            <foreignObject
              x={scaleX(i) + 10}
              y={scaleY(p.value) - 40}
              width="120"
              height="35"
              className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            >
              <div className="bg-[#111827] border border-teal-500/50 rounded p-1 text-[10px] text-teal-50 shadow-xl">
                <div className="font-bold">Run {p.run_number}</div>
                <div>{p.value} {unit} | z: {Number(p.z_score).toFixed(2)}</div>
              </div>
            </foreignObject>
          </g>
        ))}

        {/* X-Axis labels */}
        {data.filter((_, i) => i % 5 === 0).map((p, i) => (
          <text 
            key={p.id}
            x={scaleX(i * 5)} 
            y={height - padding + 20} 
            textAnchor="middle" 
            className="text-[10px] fill-teal-600 font-mono"
          >
            Run {p.run_number}
          </text>
        ))}
      </svg>
    </div>
  );
};
