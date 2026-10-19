/**
 * Document Review and Clause Inspector Component.
 * Implements high-fidelity contract rendering with synchronized field overlays,
 * bidirectional selection linking between document text and structured extraction schemas.
 */
"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, ShieldAlert, Check } from "lucide-react";
import { IDocument, IExtractedField, IClauseItem } from "@/types";

interface DocumentViewerProps {
  document: IDocument;
  onApprove?: () => void;
  onSendLegalReview?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onApprove,
  onSendLegalReview,
}) => {
  const [currentPage, setCurrentPage] = useState(12);
  const totalPages = document.pages || 42;
  const [activeHighlight, setActiveHighlight] = useState<string | null>("B");
  const [approvalStatus, setApprovalStatus] = useState<string>(document.status);

  const handleApprove = () => {
    setApprovalStatus("Approved");
    onApprove?.();
  };

  const handleSendLegal = () => {
    setApprovalStatus("Needs review");
    onSendLegalReview?.();
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="text-indigo-600 font-medium">Archive</span>
            <span>/</span>
            <span>{document.workspace || "Legal · Contracts"}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {document.title}
          </h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
              {document.docType} · {document.confidence}%
            </span>
            {document.complianceFlagsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-medium border border-rose-100">
                {document.complianceFlagsCount} compliance flags
              </span>
            )}
            <span className="text-slate-400">
              {totalPages} pages · processed 14:02
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              approvalStatus === "Approved"
                ? "bg-emerald-100 text-emerald-700"
                : approvalStatus === "Flagged"
                ? "bg-rose-100 text-rose-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {approvalStatus}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSendLegal}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs"
          >
            Send to legal review
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm shadow-indigo-200 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Approve extraction
          </button>
        </div>
      </div>

      {/* Main Two-Column Document Canvas & Extracted Schema Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Contract Document Page Canvas */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {/* Document Canvas Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50 text-xs">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                Page {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Legend Pills */}
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm border-2 border-indigo-500 bg-indigo-100"></span>
                Field
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm border-2 border-rose-500 bg-rose-100"></span>
                Risk clause
              </span>
            </div>
          </div>

          {/* Actual Document Text Page Mockup */}
          <div className="p-8 font-serif text-[13px] leading-relaxed text-slate-800 bg-[#fafafa]/50 min-h-[560px]">
            <div className="text-center font-bold tracking-wider text-xs mb-6 uppercase text-slate-900">
              Master Services Agreement
            </div>

            <p className="mb-4">
              This Agreement is entered into as of{" "}
              <span
                onClick={() => setActiveHighlight("1")}
                className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium ${
                  activeHighlight === "1" ? "ring-2 ring-indigo-500 font-bold" : ""
                }`}
              >
                1 December 2025
                <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">1</sup>
              </span>{" "}
              by and between{" "}
              <span
                onClick={() => setActiveHighlight("2")}
                className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium ${
                  activeHighlight === "2" ? "ring-2 ring-indigo-500 font-bold" : ""
                }`}
              >
                Northwind Logistics, Inc.
                <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">2</sup>
              </span>{" "}
              (&quot;Provider&quot;) and Halcyon Retail Group (&quot;Customer&quot;).
            </p>

            <p className="mb-4">
              <span className="font-bold">11. Fees.</span> Customer shall pay Provider an annual fee of{" "}
              <span
                onClick={() => setActiveHighlight("3")}
                className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium ${
                  activeHighlight === "3" ? "ring-2 ring-indigo-500 font-bold" : ""
                }`}
              >
                USD 480,000
                <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">3</sup>
              </span>
              , invoiced quarterly and payable within{" "}
              <span
                onClick={() => setActiveHighlight("4")}
                className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium ${
                  activeHighlight === "4" ? "ring-2 ring-indigo-500 font-bold" : ""
                }`}
              >
                forty-five (45) days
                <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">4</sup>
              </span>{" "}
              of receipt.
            </p>

            {/* Risk Clause A: Auto-renewal */}
            <p className="mb-4">
              <span className="font-bold">13. Term and Renewal.</span>{" "}
              <span
                onClick={() => setActiveHighlight("A")}
                className={`cursor-pointer px-1.5 py-1 rounded border-2 border-rose-300 bg-rose-50 text-rose-900 inline transition-all ${
                  activeHighlight === "A"
                    ? "ring-2 ring-rose-500 font-semibold"
                    : ""
                }`}
              >
                This Agreement shall automatically renew for successive one-year terms unless terminated in accordance with Section 14.
                <sup className="text-[10px] text-rose-700 font-bold ml-1">A</sup>
              </span>
            </p>

            {/* Risk Clause B: Limitation of liability */}
            <p className="mb-4">
              <span className="font-bold">15. Limitation of Liability.</span>{" "}
              <span
                onClick={() => setActiveHighlight("B")}
                className={`cursor-pointer px-1.5 py-1 rounded border-2 border-rose-400 bg-rose-50 text-rose-900 inline transition-all ${
                  activeHighlight === "B"
                    ? "ring-2 ring-rose-500 font-semibold"
                    : ""
                }`}
              >
                Provider&apos;s aggregate liability arising out of this Agreement shall not be limited
                <sup className="text-[10px] text-rose-700 font-bold ml-1">B</sup>
              </span>
              , except as expressly provided in Section 15.3 with respect to indirect damages.
            </p>

            {/* Governing law */}
            <p className="mb-4">
              <span className="font-bold">18. Governing Law.</span> This Agreement shall be governed by the laws of the{" "}
              <span
                onClick={() => setActiveHighlight("5")}
                className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium ${
                  activeHighlight === "5" ? "ring-2 ring-indigo-500 font-bold" : ""
                }`}
              >
                State of Delaware
                <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">5</sup>
              </span>
              .
            </p>

            {/* Sketched skeleton placeholder lines representing rest of page */}
            <div className="space-y-2 mt-8 pt-6 border-t border-slate-100 opacity-30">
              <div className="h-2.5 bg-slate-300 rounded w-full"></div>
              <div className="h-2.5 bg-slate-300 rounded w-5/6"></div>
              <div className="h-2.5 bg-slate-300 rounded w-4/6"></div>
            </div>
          </div>
        </div>

        {/* Right Column: Extracted Fields & Clauses Accordions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Extracted Fields Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Extracted fields
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                23 fields · 1 to review
              </span>
            </div>

            <div className="space-y-3">
              {document.extractedFields?.map((field) => {
                const isSelected = activeHighlight === field.highlightRef;
                return (
                  <div
                    key={field.id}
                    onClick={() => setActiveHighlight(field.highlightRef || null)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/50 shadow-xs"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                        {field.highlightRef || field.index}
                      </span>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {field.label}
                        </p>
                        <p className="text-xs font-semibold text-slate-800">
                          {field.value}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-semibold text-[11px] ${
                          field.confidence < 90
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {field.confidence.toFixed(1)}%
                      </span>
                      {/* Confidence bar meter */}
                      <div className="w-16 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                        <div
                          style={{ width: `${field.confidence}%` }}
                          className={`h-full rounded-full ${
                            field.confidence < 90
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clauses Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Clauses</h3>

            <div className="space-y-3">
              {document.clauses?.map((clause) => {
                const isCritical = clause.riskLevel === "Critical";
                const isHigh = clause.riskLevel === "High";
                const isSelected = activeHighlight === clause.highlightRef;

                return (
                  <div
                    key={clause.id}
                    onClick={() => setActiveHighlight(clause.highlightRef || null)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "border-rose-400 bg-rose-50/40 shadow-xs ring-1 ring-rose-400"
                        : isCritical
                        ? "border-rose-200 bg-rose-50/20 hover:border-rose-300"
                        : isHigh
                        ? "border-amber-200 bg-amber-50/20 hover:border-amber-300"
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {clause.highlightRef && (
                          <span className="w-4 h-4 rounded text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center justify-center">
                            {clause.highlightRef}
                          </span>
                        )}
                        <span className="font-bold text-slate-800">
                          {clause.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isCritical
                              ? "bg-rose-100 text-rose-700"
                              : isHigh
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {clause.riskLevel}
                        </span>
                      </div>
                      <span className="text-slate-500 font-semibold text-[11px]">
                        {clause.confidence}%
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                      {clause.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
