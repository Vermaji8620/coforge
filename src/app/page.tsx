/**
 * Executive Operations Dashboard Page (Screen 1).
 * Displays high-level processing KPIs, live multi-agent pipeline status,
 * documents-per-hour telemetry chart, open compliance alerts, and recently processed files.
 */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { PipelineVisualizer } from "@/components/PipelineVisualizer";
import { DocumentsPerHourChart } from "@/components/DocumentsPerHourChart";
import { IDocument, IPipelineAgentStat } from "@/types";
import { TrendingUp, AlertCircle, ArrowUpRight, Clock } from "lucide-react";

export default function DashboardPage() {
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [recentDocs, setRecentDocs] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, docsRes] = await Promise.all([
          fetch("/api/pipeline/status"),
          fetch("/api/documents"),
        ]);

        if (statsRes.ok) {
          const stats = await statsRes.json();
          setPipelineData(stats.stats);
        }

        if (docsRes.ok) {
          const docs = await docsRes.json();
          setRecentDocs(docs.documents?.slice(0, 5) || []);
        }
      } catch (err) {
        console.error("Dashboard loading error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Global Topbar */}
      <Topbar
        title="Dashboard"
        subtitle="Tuesday, 13 October · all workspaces"
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Documents processed today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Documents processed today
          </p>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pipelineData?.documentsProcessedToday?.toLocaleString() || "12,480"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>8.2% vs. yesterday</span>
          </div>
        </div>

        {/* Card 2: In queue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 font-medium">In queue</p>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pipelineData?.documentsInQueue || "342"}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Median wait <span className="font-semibold text-slate-700">41 s</span>
          </div>
        </div>

        {/* Card 3: Field-level accuracy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Field-level accuracy · 7 days
          </p>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              98.6%
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            <span className="font-semibold text-slate-700">2.1%</span> routed to human review
          </div>
        </div>

        {/* Card 4: Open compliance alerts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Open compliance alerts
          </p>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pipelineData?.openComplianceAlerts || "17"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[11px] font-bold">
              4 critical
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold">
              6 high
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Agent Telemetry Monitor */}
      <PipelineVisualizer agents={pipelineData?.agents} />

      {/* Middle Grid: Documents per hour & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Volume Distribution Chart */}
        <div className="lg:col-span-7">
          <DocumentsPerHourChart hourlyData={pipelineData?.hourlyDistribution} />
        </div>

        {/* Right: Alerts Panel */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-sm">Alerts</h3>
              <Link
                href="/compliance"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {/* Alert 1 */}
              <Link
                href="/documents/northwind"
                className="block p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                      Critical
                    </span>
                    <span className="font-bold text-slate-800">
                      Unlimited liability clause
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">4 min</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  MSA – Northwind Logistics · Comply agent
                </p>
              </Link>

              {/* Alert 2 */}
              <Link
                href="/compliance"
                className="block p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                      Critical
                    </span>
                    <span className="font-bold text-slate-800">
                      Unredacted PAN detected
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">11 min</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Invoice INV-20931 · Extract agent
                </p>
              </Link>

              {/* Alert 3 */}
              <Link
                href="/compliance"
                className="block p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      High
                    </span>
                    <span className="font-bold text-slate-800">
                      Auto-renewal without notice period
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">26 min</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  SaaS order form – Brightline · Comply agent
                </p>
              </Link>

              {/* Alert 4 */}
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 font-bold text-[10px]">
                      Medium
                    </span>
                    <span className="font-bold text-slate-800">
                      Low OCR confidence on 38 pages
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">1 h</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Batch scan-1013-B · OCR agent
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Processed Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 text-sm">
            Recently processed
          </h3>
          <Link
            href="/search"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Open archive
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 font-semibold">DOCUMENT</th>
                <th className="pb-3 font-semibold">TYPE</th>
                <th className="pb-3 font-semibold">CONFIDENCE</th>
                <th className="pb-3 font-semibold">STATUS</th>
                <th className="pb-3 font-semibold text-right">PROCESSED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentDocs.map((doc) => {
                const isFlagged = doc.status === "Flagged";
                const isApproved = doc.status === "Approved";
                const isReview = doc.status === "Needs review";

                return (
                  <tr
                    key={doc._id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 pr-4 font-semibold text-slate-800 group-hover:text-indigo-600">
                      <Link
                        href={`/documents/northwind`}
                        className="flex items-center gap-2"
                      >
                        {doc.filename || doc.title}
                      </Link>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-500">{doc.docType}</td>
                    <td className="py-3.5 pr-4 font-medium text-slate-700">
                      {doc.confidence.toFixed(1)}%
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          isFlagged
                            ? "bg-rose-100 text-rose-700"
                            : isApproved
                            ? "bg-emerald-100 text-emerald-700"
                            : isReview
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right text-slate-400 font-medium">
                      {doc.processedAt}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
