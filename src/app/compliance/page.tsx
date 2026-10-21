/**
 * Compliance & Audit Log Page (Screen 5).
 * Monitors enterprise policy violations grouped by risk severity tiers,
 * renders detailed multi-agent decision trails, live human override workflows,
 * dynamic severity count telemetry, and certified PDF / JSON audit export capabilities.
 */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Download, ShieldCheck, CheckCircle2, FileText, Printer, Check, Sparkles } from "lucide-react";
import { DecisionTrail } from "@/components/DecisionTrail";
import { IComplianceIssue } from "@/types";
import { INITIAL_COMPLIANCE_ISSUES } from "@/lib/sampleData";

export default function CompliancePage() {
  const [selectedRiskTab, setSelectedRiskTab] = useState<string>("All");
  const [issues, setIssues] = useState<IComplianceIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<IComplianceIssue | null>(null);

  useEffect(() => {
    async function fetchCompliance() {
      let rawList: IComplianceIssue[] = [];

      try {
        const res = await fetch("/api/compliance");
        if (res.ok) {
          const data = await res.json();
          if (data.issues && data.issues.length > 0) {
            rawList = data.issues;
          }
        }
      } catch (err) {
        console.error("Compliance fetch error:", err);
      }

      if (!rawList || rawList.length === 0) {
        rawList = INITIAL_COMPLIANCE_ISSUES as IComplianceIssue[];
      }

      // Restore any stored human overrides from localStorage for refresh persistence
      try {
        const storedOverrides = JSON.parse(localStorage.getItem("cf_overridden_issues") || "{}");
        rawList = rawList.map((item) => {
          const key = item._id || item.title;
          if (storedOverrides[key]) {
            const ov = storedOverrides[key];
            const hasStep = item.decisionTrail.some((s) => s.agentName.includes("Human Override"));
            return {
              ...item,
              status: "Overridden",
              overrideReason: ov.overrideReason,
              overriddenBy: ov.overriddenBy,
              decisionTrail: hasStep ? item.decisionTrail : [...item.decisionTrail, ov.newStep],
            };
          }
          return item;
        });
      } catch (e) {}

      setIssues(rawList);
      setSelectedIssue(rawList[0]);
    }

    fetchCompliance();
  }, []);

  // Compute live open severity counts dynamically
  const liveCounts = useMemo(() => {
    const openIssues = issues.filter((i) => i.status !== "Overridden" && i.status !== "Resolved");
    return {
      all: openIssues.length,
      critical: openIssues.filter((i) => i.riskLevel === "Critical").length,
      high: openIssues.filter((i) => i.riskLevel === "High").length,
      medium: openIssues.filter((i) => i.riskLevel === "Medium").length,
      low: openIssues.filter((i) => i.riskLevel === "Low").length,
    };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    if (selectedRiskTab === "All") return issues;
    return issues.filter((i) => i.riskLevel === selectedRiskTab);
  }, [issues, selectedRiskTab]);

  const handleSelectTab = (tabKey: string) => {
    setSelectedRiskTab(tabKey);
    const subset = tabKey === "All" ? issues : issues.filter((i) => i.riskLevel === tabKey);
    if (subset.length > 0) {
      setSelectedIssue(subset[0]);
    }
  };

  // Export audit as PDF (opens formatted Executive Print Report ready to Save as PDF)
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CodeForge Compliance Audit Report - ${dateStr}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
            .badge-critical { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
            .badge-high { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
            .badge-medium { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
            .badge-low { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
            .badge-overridden { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
            .summary-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; background: #f8fafc; }
            .summary-val { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            .issue-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .issue-table th { text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; color: #64748b; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
            .issue-table td { padding: 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            .timeline { margin-top: 6px; padding-left: 12px; border-left: 2px solid #e2e8f0; }
            .timeline-step { margin-bottom: 6px; font-size: 10.5px; line-height: 1.4; }
            .footer { margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">CodeForge AI Compliance & Audit Report</h1>
              <div class="subtitle">Standard: Commercial Contracts Policy v4 · Telemetry: Last 7 Days</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; font-weight: bold; color: #4338ca;">Certified Compliance Audit</div>
              <div style="font-size: 10.5px; color: #64748b;">Generated: ${dateStr}</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Open Findings</div>
              <div class="summary-val">${liveCounts.all}</div>
            </div>
            <div class="summary-card">
              <div style="font-size: 10px; color: #be123c; text-transform: uppercase; font-weight: 600;">Critical Severity</div>
              <div class="summary-val">${liveCounts.critical}</div>
            </div>
            <div class="summary-card">
              <div style="font-size: 10px; color: #b45309; text-transform: uppercase; font-weight: 600;">High Severity</div>
              <div class="summary-val">${liveCounts.high}</div>
            </div>
            <div class="summary-card">
              <div style="font-size: 10px; color: #4f46e5; text-transform: uppercase; font-weight: 600;">Total Monitored</div>
              <div class="summary-val">${issues.length}</div>
            </div>
          </div>

          <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 10px;">Audit Findings & Decision Provenance</h3>
          <table class="issue-table">
            <thead>
              <tr>
                <th style="width: 14%;">Severity</th>
                <th style="width: 26%;">Finding & Title</th>
                <th style="width: 25%;">Contract & Section</th>
                <th style="width: 35%;">Agent Decision Trail & Overrides</th>
              </tr>
            </thead>
            <tbody>
              ${issues
                .map(
                  (i) => `
                <tr>
                  <td>
                    <span class="badge ${
                      i.riskLevel === "Critical"
                        ? "badge-critical"
                        : i.riskLevel === "High"
                        ? "badge-high"
                        : i.riskLevel === "Low"
                        ? "badge-low"
                        : "badge-medium"
                    }">
                      ${i.riskLevel}
                    </span>
                    <div style="margin-top: 6px;">
                      <span class="badge ${i.status === "Overridden" ? "badge-overridden" : ""}">
                        ${i.status === "Overridden" ? "✓ OVERRIDDEN" : "OPEN FLAG"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong>${i.title}</strong>
                    ${
                      i.overrideReason
                        ? `<div style="margin-top: 6px; font-size: 10.5px; color: #047857; background: #ecfdf5; padding: 6px; border-radius: 6px; border: 1px solid #a7f3d0;">
                            <strong>Reviewer Justification:</strong> "${i.overrideReason}"
                            <div style="font-size: 9.5px; color: #065f46; margin-top: 2px;">Signed by: ${i.overriddenBy || "Priya Mehta"}</div>
                          </div>`
                        : ""
                    }
                  </td>
                  <td>
                    <div><strong>${i.documentTitle}</strong></div>
                    <div style="color: #64748b; margin-top: 2px;">Section: ${i.sectionRef}</div>
                    <div style="color: #64748b;">Assigned: ${i.assignedTo}</div>
                  </td>
                  <td>
                    <div class="timeline">
                      ${i.decisionTrail
                        .map(
                          (t) => `
                        <div class="timeline-step">
                          <strong>Step ${t.stepNumber} [${t.agentName}]:</strong> ${t.details}
                          <span style="color: #94a3b8; font-family: monospace;">(${t.timestamp})</span>
                        </div>
                      `
                        )
                        .join("")}
                    </div>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            <div>CodeForge Runner Intelligent Legal Ingestion Platform · Audited against Policy v4</div>
            <div>Reviewer: Priya Mehta (Ops lead, Legal Operations)</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Export raw JSON
  const handleExportJSON = () => {
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

        {/* Dual Export Actions: PDF Print Report & Raw JSON */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-all flex-1 sm:flex-none"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export as PDF</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all"
            title="Download JSON schema audit data"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Severity Tabs Cards Grid with Live Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
        {[
          { label: "All open issues", key: "All", count: liveCounts.all, dotColor: "bg-indigo-600" },
          { label: "Critical", key: "Critical", count: liveCounts.critical, dotColor: "bg-rose-500" },
          { label: "High", key: "High", count: liveCounts.high, dotColor: "bg-amber-500" },
          { label: "Medium", key: "Medium", count: liveCounts.medium, dotColor: "bg-yellow-500" },
          { label: "Low", key: "Low", count: liveCounts.low, dotColor: "bg-sky-500", fullWidthOnMobile: true },
        ].map((tab) => {
          const isSelected = selectedRiskTab === tab.key;
          return (
            <button
              key={tab.label}
              onClick={() => handleSelectTab(tab.key)}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                tab.fullWidthOnMobile ? "col-span-2 sm:col-span-1" : ""
              } ${
                isSelected
                  ? "border-indigo-600 bg-white shadow-sm ring-1 ring-indigo-600"
                  : "border-slate-200/80 bg-white hover:border-slate-300"
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
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              {selectedRiskTab === "All" ? "All flagged issues" : `${selectedRiskTab} priority issues`}
            </h3>
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
              const isOverridden = item.status === "Overridden";

              return (
                <div
                  key={item._id || item.title}
                  onClick={() => setSelectedIssue(item)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500"
                      : isOverridden
                      ? "border-emerald-200 bg-emerald-50/20"
                      : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 ${
                        isCritical
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : isHigh
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : isMedium
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : "bg-sky-100 text-sky-700 border border-sky-200"
                      }`}
                    >
                      {item.riskLevel}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-xs">
                          {item.title}
                        </h4>
                        {isOverridden && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            ✓ Overridden
                          </span>
                        )}
                      </div>
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
                  prev.map((i) =>
                    (i._id && i._id === updated._id) || i.title === updated.title ? updated : i
                  )
                );
              }}
            />
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center text-slate-400 text-xs">
              Select an issue on the left to view the decision trail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
