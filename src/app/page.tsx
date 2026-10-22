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
  const [complianceIssues, setComplianceIssues] = useState<any[]>([]);
  const [complianceCounts, setComplianceCounts] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
  });
  const [accuracyStats, setAccuracyStats] = useState({
    avgConfidence: 98.6,
    reviewPercentage: 2.1,
  });
  const [currentDateFormatted, setCurrentDateFormatted] = useState("all workspaces");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Format live current date for header
    const formattedDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    setCurrentDateFormatted(`${formattedDate} · all workspaces`);

    async function fetchData() {
      try {
        const [statsRes, docsRes, complianceRes] = await Promise.all([
          fetch("/api/pipeline/status"),
          fetch("/api/documents"),
          fetch("/api/compliance"),
        ]);

        if (statsRes.ok) {
          const stats = await statsRes.json();
          setPipelineData(stats.stats);
        }

        if (docsRes.ok) {
          const docs = await docsRes.json();
          const docList = docs.documents || [];
          setRecentDocs(docList.slice(0, 5));

          if (docList.length > 0) {
            const sumConfidence = docList.reduce(
              (acc: number, d: any) =>
                acc + (typeof d.confidence === "number" ? d.confidence : 95.0),
              0
            );
            const avgConf = Number((sumConfidence / docList.length).toFixed(1));

            const needReviewCount = docList.filter(
              (d: any) => d.status === "Needs review" || d.status === "Flagged"
            ).length;
            const revPct = Number(((needReviewCount / docList.length) * 100).toFixed(1));

            setAccuracyStats({
              avgConfidence: avgConf,
              reviewPercentage: revPct,
            });
          }
        }

        // Real-time compliance issues sync with local human overrides
        let overriddenKeys: string[] = [];
        try {
          const raw = localStorage.getItem("cf_overridden_issues");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              overriddenKeys = parsed;
            } else if (parsed && typeof parsed === "object") {
              overriddenKeys = Object.keys(parsed);
            }
          }
        } catch (e) {}

        if (complianceRes.ok) {
          const compData = await complianceRes.json();
          const allIssues = compData.issues || [];

          const openIssues = allIssues.filter(
            (issue: any) =>
              issue.status === "Open" &&
              !overriddenKeys.includes(issue._id) &&
              !overriddenKeys.includes(issue.title)
          );

          setComplianceIssues(openIssues);

          const critical = openIssues.filter((i: any) => i.riskLevel === "Critical").length;
          const high = openIssues.filter((i: any) => i.riskLevel === "High").length;
          const medium = openIssues.filter((i: any) => i.riskLevel === "Medium").length;

          setComplianceCounts({
            total: openIssues.length,
            critical,
            high,
            medium,
          });
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
      {/* Global Topbar with Live Formatted Date */}
      <Topbar
        title="Dashboard"
        subtitle={currentDateFormatted}
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
              {pipelineData?.documentsProcessedToday ?? recentDocs.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Live database count</span>
          </div>
        </div>

        {/* Card 2: In queue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 font-medium">In queue</p>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pipelineData?.documentsInQueue ?? 0}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Median wait <span className="font-semibold text-slate-700">{pipelineData?.medianWaitTimeSeconds ?? 0} s</span>
          </div>
        </div>

        {/* Card 3: Field-level accuracy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Field-level accuracy · 7 days
          </p>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {accuracyStats.avgConfidence}%
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            <span className="font-semibold text-slate-700">{accuracyStats.reviewPercentage}%</span> routed to human review
          </div>
        </div>

        {/* Card 4: Open compliance alerts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Open compliance alerts
          </p>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {complianceCounts.total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[11px] font-bold">
              {complianceCounts.critical} critical
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold">
              {complianceCounts.high} high
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 text-sm">Alerts</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {complianceCounts.total}
                </span>
              </div>
              <Link
                href="/compliance"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {complianceIssues.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 text-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mb-1.5" />
                  <p className="text-xs font-semibold text-emerald-800">
                    All compliance alerts resolved
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    No active policy violations in the queue
                  </p>
                </div>
              ) : (
                complianceIssues.slice(0, 4).map((issue: any) => {
                  const isCritical = issue.riskLevel === "Critical";
                  const isHigh = issue.riskLevel === "High";

                  const badgeClass = isCritical
                    ? "bg-rose-100 text-rose-700"
                    : isHigh
                    ? "bg-amber-100 text-amber-800"
                    : "bg-yellow-100 text-yellow-800";

                  const linkTarget = issue.documentId
                    ? `/documents/${encodeURIComponent(issue.documentId)}`
                    : `/compliance`;

                  return (
                    <Link
                      key={issue._id || issue.title}
                      href={linkTarget}
                      className="block p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[10px] shrink-0 ${badgeClass}`}
                          >
                            {issue.riskLevel}
                          </span>
                          <span className="font-bold text-slate-800 truncate">
                            {issue.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                          {issue.elapsedTime || "Live"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {issue.documentTitle || "Commercial Agreement"} · {issue.assignedTo || "Comply agent"}
                      </p>
                    </Link>
                  );
                })
              )}
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
          <table className="w-full text-left text-xs min-w-[520px]">
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
                        href={`/documents/${doc._id || encodeURIComponent(doc.filename || doc.title)}`}
                        className="flex items-center gap-2"
                      >
                        {doc.filename || doc.title}
                      </Link>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-500">{doc.docType}</td>
                    <td className="py-3.5 pr-4 font-medium text-slate-700">
                      {typeof doc.confidence === "number" ? doc.confidence.toFixed(1) : "96.8"}%
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
