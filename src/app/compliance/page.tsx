/**
 * Compliance & Audit Log Page (Screen 5).
 * Monitors enterprise policy violations grouped by risk severity tiers,
 * renders detailed multi-agent decision trails, and provides audit export capabilities.
 */
"use client";

import React, { useState, useEffect } from "react";
import { Download, ShieldCheck, CheckCircle2 } from "lucide-react";
import { DecisionTrail } from "@/components/DecisionTrail";
import { IComplianceIssue } from "@/types";
import { INITIAL_COMPLIANCE_ISSUES } from "@/lib/sampleData";

export default function CompliancePage() {
  const [selectedRiskTab, setSelectedRiskTab] = useState<string>("All");
  const [issues, setIssues] = useState<IComplianceIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<IComplianceIssue | null>(null);
  const [counts, setCounts] = useState({
    all: 17,
    critical: 4,
    high: 6,
    medium: 5,
    low: 2,
  });

  useEffect(() => {
    async function fetchCompliance() {
      try {
        const res = await fetch("/api/compliance");
        if (res.ok) {
          const data = await res.json();
          if (data.issues && data.issues.length > 0) {
            setIssues(data.issues);
            setSelectedIssue(data.issues[0]);
            if (data.counts) setCounts(data.counts);
            return;
          }
        }
      } catch (err) {
        console.error("Compliance fetch error:", err);
      }

      // Default fallback
      const fallbackList = INITIAL_COMPLIANCE_ISSUES as IComplianceIssue[];
      setIssues(fallbackList);
      setSelectedIssue(fallbackList[0]);
    }

    fetchCompliance();
  }, []);

  const filteredIssues =
    selectedRiskTab === "All"
      ? issues
      : issues.filter((i) => i.riskLevel === selectedRiskTab);

  const handleExportAudit = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(issues, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `codeforge-compliance-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Compliance & audit log
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Policy: Commercial contracts v4 · last 7 days
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all w-full sm:w-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export audit log</span>
        </button>
      </div>

      {/* Severity Tabs Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
        {[
          { label: "All open issues", key: "All", count: counts.all, dotColor: "bg-indigo-600" },
          { label: "Critical", key: "Critical", count: counts.critical, dotColor: "bg-rose-500" },
          { label: "High", key: "High", count: counts.high, dotColor: "bg-amber-500" },
          { label: "Medium", key: "Medium", count: counts.medium, dotColor: "bg-yellow-500" },
          { label: "Low", key: "Low", count: counts.low, dotColor: "bg-sky-500", fullWidthOnMobile: true },
        ].map((tab) => {
          const isSelected = selectedRiskTab === tab.key;
          return (
            <button
              key={tab.label}
              onClick={() => setSelectedRiskTab(tab.key)}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                tab.fullWidthOnMobile ? "col-span-2 sm:col-span-1" : ""
              } ${
                isSelected
                  ? "border-indigo-600 bg-white shadow-sm ring-1 ring-indigo-600"
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-2">
                <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />
                <span className="truncate">{tab.label}</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column: Flagged Issues List & Decision Trail Audit Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Flagged Issues List */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-slate-900 text-sm">Flagged issues</h3>
            <span className="text-xs text-slate-400 font-medium">
              {filteredIssues.length} shown
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredIssues.map((item) => {
              const isSelected = selectedIssue?._id === item._id || selectedIssue?.title === item.title;
              const isCritical = item.riskLevel === "Critical";
              const isHigh = item.riskLevel === "High";
              const isMedium = item.riskLevel === "Medium";

              return (
                <div
                  key={item._id || item.title}
                  onClick={() => setSelectedIssue(item)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 ${
                        isCritical
                          ? "bg-rose-100 text-rose-700"
                          : isHigh
                          ? "bg-amber-100 text-amber-800"
                          : isMedium
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {item.riskLevel}
                    </span>

                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.documentTitle} · {item.sectionRef}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-slate-600 font-semibold block text-[11px]">
                      {item.assignedTo}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {item.elapsedTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Decision Trail Inspector */}
        <div className="lg:col-span-5 min-h-[500px]">
          {selectedIssue ? (
            <DecisionTrail
              issue={selectedIssue}
              onOverrideSuccess={(updated) => {
                setSelectedIssue(updated);
                setIssues((prev) =>
                  prev.map((i) => (i._id === updated._id ? updated : i))
                );
              }}
            />
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-slate-400 text-xs">
              Select an issue on the left to view the decision trail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
