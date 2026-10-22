/**
 * Pipeline Telemetry Visualizer component.
 * Displays operational workload across the 4 autonomous stages:
 * 01 OCR, 02 Classify, 03 Extract, and 04 Comply with health indicators and latencies.
 */
import React from "react";
import Link from "next/link";
import { IPipelineAgentStat } from "@/types";
import { FileText, ArrowUpRight } from "lucide-react";

interface PipelineVisualizerProps {
  agents?: IPipelineAgentStat[];
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  agents = [
    {
      code: "01",
      name: "OCR",
      activeCount: 1,
      queuedCount: 0,
      latencyP50: "p50 1.8 s",
      documentId: "scan_0044.tiff",
      documentFilename: "scan_0044.tiff",
    },
    {
      code: "02",
      name: "Classify",
      activeCount: 1,
      queuedCount: 0,
      latencyP50: "p50 0.4 s",
      documentId: "INV-20944",
      documentFilename: "INV-20944.pdf",
    },
    {
      code: "03",
      name: "Extract",
      activeCount: 1,
      queuedCount: 0,
      latencyP50: "p50 2.6 s",
      documentId: "northwind",
      documentFilename: "MSA – Northwind Logistics.pdf",
    },
    {
      code: "04",
      name: "Comply",
      activeCount: 1,
      queuedCount: 0,
      latencyP50: "p50 1.1 s",
      documentId: "northwind",
      documentFilename: "MSA – Northwind Logistics.pdf",
    },
  ],
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">
            Pipeline right now
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click any agent card to inspect the document currently in its pipeline stage
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>All agents healthy</span>
        </div>
      </div>

      {/* 4 Agent Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {agents.map((agent) => {
          const docTarget =
            agent.documentId ||
            agent.documentFilename ||
            agent.documentTitle ||
            agent.name;
          const targetUrl = `/documents/${encodeURIComponent(docTarget)}`;

          return (
            <Link
              key={agent.code}
              href={targetUrl}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-indigo-600 font-semibold group-hover:text-indigo-700">
                      {agent.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {agent.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">
                    {agent.activeCount > 0 ? (
                      <>
                        <span className="font-bold text-indigo-600">{agent.activeCount}</span>{" "}
                        <span className="text-slate-500 font-normal">active</span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-normal">Idle</span>
                    )}
                  </span>
                </div>

                {/* Progress bar line */}
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mb-2.5">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500 group-hover:bg-indigo-500"
                    style={{
                      width:
                        agent.activeCount === 0 && agent.queuedCount === 0
                          ? "0%"
                          : `${Math.min(
                              100,
                              Math.max(
                                20,
                                (agent.activeCount /
                                  (agent.activeCount + agent.queuedCount || 1)) *
                                  100
                              )
                            )}%`,
                    }}
                  />
                </div>

                {/* Active Document target link preview */}
                <div className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-indigo-600 transition-colors py-1 truncate">
                  <FileText className="w-3 h-3 shrink-0 text-slate-400 group-hover:text-indigo-500" />
                  <span className="truncate font-medium">
                    {agent.documentFilename || agent.documentTitle || "View document"}
                  </span>
                  <ArrowUpRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-indigo-600" />
                </div>
              </div>

              {/* Footer info: queued and p50 latency */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100/70 mt-2">
                {agent.activeCount === 0 && agent.queuedCount === 0 ? (
                  <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Standby · 0 queued</span>
                  </span>
                ) : (
                  <span>{agent.queuedCount} queued</span>
                )}
                <span className="font-mono text-slate-400 text-[10px]">
                  {agent.latencyP50}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
