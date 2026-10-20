/**
 * Multi-Agent Decision Trail Audit Timeline component.
 * Visualizes the full provenance chronology from OCR, Classify, Extract,
 * Comply agents through Human review, with interactive override modal capabilities.
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import { IComplianceIssue } from "@/types";

interface DecisionTrailProps {
  issue: IComplianceIssue;
  onOverrideSuccess?: (updatedIssue: IComplianceIssue) => void;
}

export const DecisionTrail: React.FC<DecisionTrailProps> = ({
  issue,
  onOverrideSuccess,
}) => {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/compliance/${issue._id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: overrideReason,
          reviewerName: "Priya Mehta (Ops lead)",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowOverrideModal(false);
        setOverrideReason("");
        onOverrideSuccess?.(data.issue);
      }
    } catch (err) {
      console.error("Override failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Subhead and Title */}
        <div className="mb-5 pb-4 border-b border-slate-100">
          <p className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase mb-1">
            DECISION TRAIL
          </p>
          <h2 className="text-base font-bold text-slate-900 leading-snug">
            {issue.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {issue.documentTitle} · {issue.sectionRef}
          </p>
        </div>

        {/* Chronological Steps */}
        <div className="space-y-5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
          {issue.decisionTrail.map((step) => {
            const isFlagged = step.status === "flagged";
            const isPending = step.status === "pending";

            return (
              <div key={step.stepNumber} className="relative flex items-start gap-4">
                {/* Step Icon Badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 z-10 ${
                    isFlagged
                      ? "bg-rose-100 text-rose-600 border border-rose-200"
                      : isPending
                      ? "bg-slate-100 text-slate-500 border border-slate-200"
                      : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                  }`}
                >
                  {step.stepNumber}
                </div>

                {/* Step Body */}
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-slate-800">
                      {step.agentName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[11px]">
                        {step.timestamp}
                      </span>
                      {step.confidence !== undefined && (
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {step.confidence.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-600 leading-relaxed mb-1">
                    {step.details}
                  </p>

                  {step.versionInfo && (
                    <span className="inline-block text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      {step.versionInfo}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
        <Link
          href={`/documents/${encodeURIComponent(issue.documentId || 'northwind')}`}
          className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold text-center shadow-sm shadow-indigo-200 transition-all active:scale-[0.98]"
        >
          Open document
        </Link>
        <button
          onClick={() => setShowOverrideModal(true)}
          disabled={issue.status === "Overridden"}
          className={`py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
            issue.status === "Overridden"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
              : "border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300"
          }`}
        >
          {issue.status === "Overridden" ? "Decision Overridden" : "Override decision"}
        </button>
      </div>

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Override Compliance Flag
                </h3>
                <p className="text-xs text-slate-500">
                  Provide audit justification for policy exception
                </p>
              </div>
            </div>

            <form onSubmit={handleOverrideSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business Justification / Exception Rationale
                </label>
                <textarea
                  rows={3}
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Risk accepted by General Counsel under special vendor warranty agreement..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
                >
                  {isSubmitting ? "Logging..." : "Confirm Exception"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
