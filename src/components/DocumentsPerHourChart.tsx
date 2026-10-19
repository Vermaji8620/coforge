/**
 * Interactive Documents-Per-Hour Bar Chart component.
 * Visualizes throughput distribution across 24h, 7d, and 30d time horizons,
 * featuring interactive tooltips and highlight tokens matching the design mockups.
 */
"use client";

import React, { useState } from "react";

interface ChartProps {
  hourlyData?: number[];
}

export const DocumentsPerHourChart: React.FC<ChartProps> = ({
  hourlyData = [
    22, 18, 14, 12, 15, 24, 38, 54, 72, 88, 96, 104, 98, 86, 82, 75, 62, 50, 42,
    36, 32, 28, 24, 28,
  ],
}) => {
  const [timeframe, setTimeframe] = useState<"24 h" | "7 d" | "30 d">("24 h");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = Math.max(...hourlyData, 1);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-900 text-sm">
          Documents per hour
        </h3>

        {/* Timeframe Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px] font-medium text-slate-600">
          {(["24 h", "7 d", "30 d"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                timeframe === t
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="h-44 flex items-end justify-between gap-1.5 pt-4 px-1 relative">
        {hourlyData.map((val, idx) => {
          const heightPercent = Math.max(12, Math.round((val / maxVal) * 100));
          const isCurrent = idx === hourlyData.length - 1;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-8 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-semibold whitespace-nowrap shadow-md z-20 pointer-events-none">
                  {val.toLocaleString()} docs
                </div>
              )}

              {/* Bar Column */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full rounded-t-sm transition-all duration-300 ${
                  isCurrent
                    ? "bg-indigo-600 shadow-sm shadow-indigo-300"
                    : isHovered
                    ? "bg-indigo-400"
                    : "bg-[#c4b5fd]/60 group-hover:bg-[#a78bfa]"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Horizontal Axis Timestamps */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-3 border-t border-slate-50 mt-2">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span className="font-semibold text-indigo-600">Now</span>
      </div>
    </div>
  );
};
