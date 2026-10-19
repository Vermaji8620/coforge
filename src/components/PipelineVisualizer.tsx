/**
 * Pipeline Telemetry Visualizer component.
 * Displays operational workload across the 4 autonomous stages:
 * 01 OCR, 02 Classify, 03 Extract, and 04 Comply with health indicators and latencies.
 */
import React from "react";
import { IPipelineAgentStat } from "@/types";

interface PipelineVisualizerProps {
  agents?: IPipelineAgentStat[];
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  agents = [
    { code: "01", name: "OCR", activeCount: 128, queuedCount: 142, latencyP50: "p50 1.8 s" },
    { code: "02", name: "Classify", activeCount: 96, queuedCount: 88, latencyP50: "p50 0.4 s" },
    { code: "03", name: "Extract", activeCount: 171, queuedCount: 97, latencyP50: "p50 2.6 s" },
    { code: "04", name: "Comply", activeCount: 54, queuedCount: 15, latencyP50: "p50 1.1 s" },
  ],
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 text-sm">
          Pipeline right now
        </h3>
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>All agents healthy</span>
        </div>
      </div>

      {/* 4 Agent Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {agents.map((agent) => {
          return (
            <div
              key={agent.code}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                      {agent.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {agent.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">
                    <span className="font-bold">{agent.activeCount}</span>{" "}
                    <span className="text-slate-400 font-normal">active</span>
                  </span>
                </div>

                {/* Progress bar line */}
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          25,
                          (agent.activeCount /
                            (agent.activeCount + agent.queuedCount)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Footer info: queued and p50 latency */}
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{agent.queuedCount} queued</span>
                <span className="font-mono text-slate-400 text-[10px]">
                  {agent.latencyP50}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
