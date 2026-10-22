/**
 * Document Review and Clause Inspector Component (Screen 4).
 * Implements high-fidelity contract and invoice rendering with synchronized field overlays,
 * bidirectional selection linking between document text and structured extraction schemas.
 */
"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Scan,
  CheckCheck,
  X,
  UserCheck,
} from "lucide-react";
import { IDocument } from "@/types";

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
  const totalPages = document.pages || 1;
  const [currentPage, setCurrentPage] = useState(document.pages && document.pages >= 12 ? 12 : 1);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(
    document.clauses?.[0]?.highlightRef || document.extractedFields?.[0]?.highlightRef || "1"
  );
  const docKey = document._id || document.filename || document.title || "default_doc";
  const [approvalStatus, setApprovalStatus] = useState<string>(document.status || "Processing");
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);
  const [verifiedFieldIds, setVerifiedFieldIds] = useState<string[]>([]);

  // Keep state synchronized when viewing a document or restoring verified state from storage
  useEffect(() => {
    setCurrentPage(document.pages && document.pages >= 12 ? 12 : 1);
    setActiveHighlight(
      document.clauses?.[0]?.highlightRef || document.extractedFields?.[0]?.highlightRef || "1"
    );

    try {
      // 1. Restore verified fields combining localStorage and MongoDB DB records
      let verifiedFromLocal: string[] = [];
      const savedFields = localStorage.getItem(`cf_verified_fields_${docKey}`);
      if (savedFields) {
        try {
          verifiedFromLocal = JSON.parse(savedFields);
        } catch (e) {}
      }
      const verifiedFromDb = (document.extractedFields || [])
        .filter((f) => f.confidence === 100 && !f.needsReview)
        .map((f) => f.id);
      const combinedVerified = Array.from(new Set([...verifiedFromLocal, ...verifiedFromDb]));
      setVerifiedFieldIds(combinedVerified);

      // 2. Restore document status: If DB status is already Approved/Needs review/Flagged, prioritize DB
      const savedStatus = localStorage.getItem(`cf_doc_status_${docKey}`);
      if (document.status && document.status !== "Processing") {
        setApprovalStatus(document.status);
        try {
          localStorage.setItem(`cf_doc_status_${docKey}`, document.status);
        } catch (e) {}
      } else if (savedStatus) {
        setApprovalStatus(savedStatus);
      } else {
        setApprovalStatus(document.status || "Approved");
      }
    } catch (e) {
      setApprovalStatus(document.status || "Approved");
    }

    setToast(null);
  }, [docKey, document._id, document.title]);

  // Auto dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleApprove = async () => {
    setApprovalStatus("Approved");
    try {
      localStorage.setItem(`cf_doc_status_${docKey}`, "Approved");
      await fetch(`/api/documents/${encodeURIComponent(docKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });
    } catch (e) {}

    setToast({
      message: "Extraction schema approved and verified. Synced to database archive.",
      type: "success",
    });
    onApprove?.();
  };

  const handleSendLegal = async () => {
    setApprovalStatus("In Legal Review");
    try {
      localStorage.setItem(`cf_doc_status_${docKey}`, "In Legal Review");
      await fetch(`/api/documents/${encodeURIComponent(docKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Needs review" }),
      });
    } catch (e) {}

    setToast({
      message: "Document flagged and routed to Corporate Legal queue for clause redlining.",
      type: "warning",
    });
    onSendLegalReview?.();
  };

  const toggleFieldVerification = async (fieldId: string, label: string) => {
    let nextVerified: string[] = [];
    const isAlreadyVerified = verifiedFieldIds.includes(fieldId);

    if (isAlreadyVerified) {
      nextVerified = verifiedFieldIds.filter((id) => id !== fieldId);
      setToast({
        message: `Field "${label}" reset to AI confidence score.`,
        type: "warning",
      });
    } else {
      nextVerified = [...verifiedFieldIds, fieldId];
      setToast({
        message: `Field "${label}" verified and signed off by human reviewer.`,
        type: "success",
      });
    }

    setVerifiedFieldIds(nextVerified);

    // 1. Persist to localStorage for refresh retention
    try {
      localStorage.setItem(`cf_verified_fields_${docKey}`, JSON.stringify(nextVerified));
    } catch (e) {}

    // 2. Sync to MongoDB backend via PATCH
    try {
      const updatedFields = (document.extractedFields || []).map((f) => {
        const verified = nextVerified.includes(f.id);
        return {
          ...f,
          confidence: verified ? 100 : f.confidence,
          needsReview: verified ? false : f.needsReview,
        };
      });

      await fetch(`/api/documents/${encodeURIComponent(docKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedFields: updatedFields }),
      });
    } catch (err) {
      console.error("Failed to sync verified field to DB:", err);
    }
  };

  const isTiffScan =
    document.fileType === "tiff" ||
    document.docType?.toLowerCase().includes("scan") ||
    document.filename?.toLowerCase().endsWith(".tiff") ||
    document.filename?.toLowerCase().endsWith(".tif");

  const isInvoice =
    document.docType === "Invoice" ||
    document.filename?.toLowerCase().includes("inv") ||
    document.title?.toLowerCase().includes("invoice");

  const isNorthwind =
    document.title?.toLowerCase().includes("northwind") ||
    document.filename?.toLowerCase().includes("northwind");

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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            {document.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs text-slate-600">
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
              {document.docType} · {document.confidence}%
            </span>
            {document.complianceFlagsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-medium border border-rose-100">
                {document.complianceFlagsCount} compliance flags
              </span>
            )}
            <span className="text-slate-400">
              {totalPages} pages · processed {document.processedAt || "14:02"}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                approvalStatus === "Approved"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : approvalStatus === "In Legal Review" || approvalStatus === "Needs review"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : approvalStatus === "Flagged"
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : "bg-slate-100 text-slate-800 border border-slate-200"
              }`}
            >
              {approvalStatus}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleSendLegal}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs text-center flex items-center justify-center gap-1.5 ${
              approvalStatus === "In Legal Review" || approvalStatus === "Needs review"
                ? "bg-amber-50 text-amber-800 border border-amber-300 font-bold"
                : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{approvalStatus === "In Legal Review" ? "Routed to Legal ✓" : "Send to legal review"}</span>
          </button>
          <button
            onClick={handleApprove}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 text-center ${
              approvalStatus === "Approved"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 font-bold"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{approvalStatus === "Approved" ? "Extraction Approved ✓" : "Approve extraction"}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Document Canvas & Extracted Schema Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Document Page Canvas */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {/* Document Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/50 text-xs gap-2">
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

          {/* Actual Document Text Page Canvas */}
          <div className="p-3 sm:p-5 lg:p-8 font-serif text-xs sm:text-[13px] leading-[1.85] sm:leading-relaxed text-slate-800 bg-[#fafafa]/50 min-h-[500px]">
            {/* RENDER CASE 1: SCANNED TIFF DOCUMENT */}
            {isTiffScan && (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-amber-800">
                  <div className="flex items-center gap-2 font-sans font-semibold">
                    <Scan className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Optical Scan Telemetry: 300 DPI · Deskewed 1.4° · Optical Character Recognition Active</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-200/60 font-mono text-[10px] font-bold self-start sm:self-auto shrink-0">RAW TIFF</span>
                </div>

                <div className="text-center font-bold tracking-widest text-xs py-2 uppercase border-b border-dashed border-slate-300 text-slate-800">
                  {document.title.toUpperCase()}
                </div>

                <p className="font-sans leading-relaxed text-slate-700">
                  [OPTICAL OCR STREAM · PAGE {currentPage} OF {totalPages}]
                  <br />
                  This Service and Facilities Maintenance Agreement is executed by and between{" "}
                  <span
                    onClick={() => setActiveHighlight("2")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium ${
                      activeHighlight === "2" ? "ring-2 ring-indigo-500 font-bold" : ""
                    }`}
                  >
                    {document.counterparty || "Aegis Industrial Systems"}
                    <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">2</sup>
                  </span>{" "}
                  (&quot;Contractor&quot;) and Halcyon Retail Group (&quot;Client&quot;), effective as of{" "}
                  <span
                    onClick={() => setActiveHighlight("3")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium ${
                      activeHighlight === "3" ? "ring-2 ring-indigo-500 font-bold" : ""
                    }`}
                  >
                    {document.renewalDate || "15 January 2026"}
                    <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">3</sup>
                  </span>.
                </p>

                <p className="font-sans leading-relaxed text-slate-700">
                  <span className="font-bold">SECTION 4. ANNUAL RETAINER.</span> The baseline annual compensation for contracted facility monitoring shall be{" "}
                  <span
                    onClick={() => setActiveHighlight("4")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium ${
                      activeHighlight === "4" ? "ring-2 ring-indigo-500 font-bold" : ""
                    }`}
                  >
                    {document.contractValue || "USD 620,000"}
                    <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">4</sup>
                  </span>{" "}
                  payable in monthly installments.
                </p>

                <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl my-4 text-rose-950 font-sans">
                  <span className="font-bold block text-xs text-rose-800 mb-1">§8 INDEMNIFICATION CLAUSE [FLAGGED RISK]</span>
                  <span
                    onClick={() => setActiveHighlight("A")}
                    className={`cursor-pointer px-1 py-0.5 rounded border-2 border-rose-400 bg-white inline text-xs leading-normal transition-all ${
                      activeHighlight === "A" ? "ring-2 ring-rose-500 font-bold" : ""
                    }`}
                  >
                    Contractor shall defend, indemnify, and hold harmless Client solely to the extent of Contractor gross negligence; Client assumes all unilateral liability for secondary third-party claims.
                    <sup className="text-[10px] text-rose-700 font-bold ml-1">A</sup>
                  </span>
                </div>

                <p className="font-sans leading-relaxed text-slate-700">
                  <span className="font-bold">SECTION 12. GOVERNING JURISDICTION.</span> This instrument shall be construed in accordance with the laws of the{" "}
                  <span
                    onClick={() => setActiveHighlight("5")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium ${
                      activeHighlight === "5" ? "ring-2 ring-indigo-500 font-bold" : ""
                    }`}
                  >
                    State of New York, USA
                    <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">5</sup>
                  </span>.
                </p>
              </div>
            )}

            {/* RENDER CASE 2: INVOICE DOCUMENT */}
            {!isTiffScan && isInvoice && (
              <div className="space-y-5 font-sans">
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 block mb-0.5">
                      Commercial Invoice
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{document.title}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Billing Account: AP-449102 · Ref: LOG-20944
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      onClick={() => setActiveHighlight("1")}
                      className={`cursor-pointer px-2 py-1 rounded border border-indigo-400 bg-indigo-50/80 font-bold text-xs inline-block ${
                        activeHighlight === "1" ? "ring-2 ring-indigo-500" : ""
                      }`}
                    >
                      {document.title}
                      <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">1</sup>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">Processed: 14:02</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">VENDOR</span>
                    <span
                      onClick={() => setActiveHighlight("2")}
                      className={`cursor-pointer font-bold text-slate-800 ${
                        activeHighlight === "2" ? "text-indigo-600 underline" : ""
                      }`}
                    >
                      {document.counterparty || "Meridian Logistics Freight"}
                      <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">2</sup>
                    </span>
                    <p className="text-slate-500 text-[11px] mt-0.5">Freight & Shipping Services</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">BILL TO</span>
                    <p className="font-bold text-slate-800">Halcyon Retail Group</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Accounts Payable · Procurement</p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
                  <table className="w-full text-left min-w-[360px]">
                    <thead className="bg-slate-100/70 border-b border-slate-200 text-[11px] text-slate-600">
                      <tr>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Rate</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-2.5 px-3">Dedicated Cargo Freight Services</td>
                        <td className="py-2.5 px-3 text-center">1</td>
                        <td className="py-2.5 px-3 text-right">$14,200.00</td>
                        <td className="py-2.5 px-3 text-right font-medium">$14,200.00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3">Terminal Handling & Fuel Surcharge</td>
                        <td className="py-2.5 px-3 text-center">1</td>
                        <td className="py-2.5 px-3 text-right">$4,250.00</td>
                        <td className="py-2.5 px-3 text-right font-medium">$4,250.00</td>
                      </tr>
                      <tr className="bg-slate-50/50 font-bold text-slate-900">
                        <td colSpan={3} className="py-2.5 px-3 text-right">Total Due:</td>
                        <td className="py-2.5 px-3 text-right text-indigo-700">
                          <span
                            onClick={() => setActiveHighlight("4")}
                            className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 ${
                              activeHighlight === "4" ? "ring-2 ring-indigo-500 font-bold" : ""
                            }`}
                          >
                            {document.contractValue || "USD 18,450.00"}
                            <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">4</sup>
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Payment Terms & Flagged Discrepancy */}
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900">Payment Terms Terminology: </span>
                    <span
                      onClick={() => setActiveHighlight("5")}
                      className={`cursor-pointer px-1 rounded bg-amber-100 border border-amber-300 font-semibold ${
                        activeHighlight === "5" ? "ring-2 ring-amber-500" : ""
                      }`}
                    >
                      Net 30 days
                      <sup className="text-[10px] text-amber-800 font-bold ml-0.5">5</sup>
                    </span>
                    <p className="text-[11px] text-amber-700 mt-1">
                      Policy discrepancy: Master agreement terms specify Net 45. Invoiced terms mandate review prior to settlement.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* RENDER CASE 3: NORTHWIND MASTER SERVICES AGREEMENT */}
            {!isTiffScan && !isInvoice && isNorthwind && (
              <>
                <div className="text-center font-bold tracking-wider text-xs mb-5 uppercase text-slate-900">
                  Master Services Agreement
                </div>

                <p className="mb-3.5 sm:mb-4 leading-[1.85] sm:leading-relaxed">
                  This Agreement is entered into as of{" "}
                  <span
                    onClick={() => setActiveHighlight("1")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium box-decoration-clone inline transition-all ${
                      activeHighlight === "1" ? "ring-2 ring-indigo-500 font-bold" : ""
                    }`}
                  >
                    1 December 2025
                    <sup className="text-[9px] sm:text-[10px] text-indigo-700 font-bold ml-0.5">1</sup>
                  </span>{" "}
                  by and between{" "}
                  <span
                    onClick={() => setActiveHighlight("2")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium box-decoration-clone inline transition-all ${
                      activeHighlight === "2" ? "ring-2 ring-indigo-500 font-bold" : ""
                    }`}
                  >
                    Northwind Logistics, Inc.
                    <sup className="text-[9px] sm:text-[10px] text-indigo-700 font-bold ml-0.5">2</sup>
                  </span>{" "}
                  (&quot;Provider&quot;) and Halcyon Retail Group (&quot;Customer&quot;).
                </p>

                <p className="mb-3.5 sm:mb-4 leading-[1.85] sm:leading-relaxed">
                  <span className="font-bold text-slate-900">11. Fees.</span> Customer shall pay Provider an annual fee of{" "}
                  <span
                    onClick={() => setActiveHighlight("3")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium box-decoration-clone inline transition-all ${
                      activeHighlight === "3" ? "ring-2 ring-indigo-500 font-bold" : ""
                    }`}
                  >
                    USD 480,000
                    <sup className="text-[9px] sm:text-[10px] text-indigo-700 font-bold ml-0.5">3</sup>
                  </span>
                  , invoiced quarterly and payable within{" "}
                  <span
                    onClick={() => setActiveHighlight("4")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium box-decoration-clone inline transition-all ${
                      activeHighlight === "4" ? "ring-2 ring-indigo-500 font-bold" : ""
                    }`}
                  >
                    forty-five (45) days
                    <sup className="text-[9px] sm:text-[10px] text-indigo-700 font-bold ml-0.5">4</sup>
                  </span>{" "}
                  of receipt.
                </p>

                {/* Risk Clause A: Auto-renewal */}
                <p className="mb-3.5 sm:mb-4 leading-[1.85] sm:leading-relaxed">
                  <span className="font-bold text-slate-900">13. Term and Renewal.</span>{" "}
                  <span
                    onClick={() => setActiveHighlight("A")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-rose-400 bg-rose-50/90 text-rose-900 box-decoration-clone inline transition-all ${
                      activeHighlight === "A" ? "ring-2 ring-rose-500 font-semibold" : ""
                    }`}
                  >
                    This Agreement shall automatically renew for successive one-year terms unless terminated in accordance with Section 14.
                    <sup className="text-[9px] sm:text-[10px] text-rose-700 font-bold ml-1">A</sup>
                  </span>
                </p>

                {/* Risk Clause B: Limitation of liability */}
                <p className="mb-3.5 sm:mb-4 leading-[1.85] sm:leading-relaxed">
                  <span className="font-bold text-slate-900">15. Limitation of Liability.</span>{" "}
                  <span
                    onClick={() => setActiveHighlight("B")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-rose-400 bg-rose-50/90 text-rose-900 box-decoration-clone inline transition-all ${
                      activeHighlight === "B" ? "ring-2 ring-rose-500 font-semibold" : ""
                    }`}
                  >
                    Provider&apos;s aggregate liability arising out of this Agreement shall not be limited
                    <sup className="text-[9px] sm:text-[10px] text-rose-700 font-bold ml-1">B</sup>
                  </span>
                  , except as expressly provided in Section 15.3 with respect to indirect damages.
                </p>

                {/* Governing law */}
                <p className="mb-3.5 sm:mb-4 leading-[1.85] sm:leading-relaxed">
                  <span className="font-bold text-slate-900">18. Governing Law.</span> This Agreement shall be governed by the laws of the{" "}
                  <span
                    onClick={() => setActiveHighlight("5")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium box-decoration-clone inline transition-all ${
                      activeHighlight === "5" ? "ring-2 ring-indigo-500 font-bold" : ""
                    }`}
                  >
                    State of Delaware
                    <sup className="text-[9px] sm:text-[10px] text-indigo-700 font-bold ml-0.5">5</sup>
                  </span>
                  .
                </p>
              </>
            )}

            {/* RENDER CASE 4: OTHER COMMERCIAL CONTRACTS & AMENDMENTS */}
            {!isTiffScan && !isInvoice && !isNorthwind && (
              <div className="space-y-4">
                <div className="text-center font-bold tracking-wider text-xs mb-4 uppercase text-slate-900">
                  {document.docType || "Commercial Contract"}
                </div>

                <p className="mb-3 leading-relaxed">
                  This Agreement governs the relationship between{" "}
                  <span
                    onClick={() => setActiveHighlight("2")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-indigo-50/80 font-medium box-decoration-clone inline transition-all ${
                      activeHighlight === "2" ? "ring-2 ring-indigo-500 font-bold" : ""
                    }`}
                  >
                    {document.counterparty || "Contract Partner"}
                    <sup className="text-[9px] sm:text-[10px] text-indigo-700 font-bold ml-0.5">2</sup>
                  </span>{" "}
                  and Halcyon Retail Group (&quot;Customer&quot;).
                </p>

                {document.documentSnippet && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl my-3 text-xs italic text-slate-700">
                    &quot;{document.documentSnippet}&quot;
                  </div>
                )}

                {/* Render Dynamic Clauses */}
                {document.clauses && document.clauses.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {document.clauses.map((clause) => {
                      const isRisk = clause.riskLevel === "Critical" || clause.riskLevel === "High";
                      const isSelected = activeHighlight === clause.highlightRef;

                      return (
                        <div key={clause.id} className="text-xs">
                          <span className="font-bold text-slate-900 mr-2">{clause.section || clause.title}:</span>
                          <span
                            onClick={() => setActiveHighlight(clause.highlightRef || "")}
                            className={`cursor-pointer px-1.5 py-0.5 rounded border box-decoration-clone inline transition-all ${
                              isSelected
                                ? isRisk
                                  ? "ring-2 ring-rose-500 bg-rose-100/80 border-rose-400 font-semibold"
                                  : "ring-2 ring-indigo-500 bg-indigo-100/80 border-indigo-400 font-semibold"
                                : isRisk
                                ? "bg-rose-50 border-rose-300 text-rose-900"
                                : "bg-slate-100 border-slate-300 text-slate-800"
                            }`}
                          >
                            {clause.description}
                            {clause.highlightRef && (
                              <sup className="text-[9px] sm:text-[10px] font-bold ml-1 text-rose-700">{clause.highlightRef}</sup>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Financial and Renewal Summary Highlighted */}
                <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl mt-4 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Contract Value:</span>
                    <span
                      onClick={() => setActiveHighlight("4")}
                      className={`cursor-pointer px-1.5 py-0.5 rounded border border-indigo-400 bg-white font-semibold text-slate-900 ${
                        activeHighlight === "4" ? "ring-2 ring-indigo-500" : ""
                      }`}
                    >
                      {document.contractValue || "N/A"}
                      <sup className="text-[10px] text-indigo-700 font-bold ml-0.5">4</sup>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Next Renewal Date:</span>
                    <span className="font-medium text-slate-800">{document.renewalDate || "Continuous"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Notice Period:</span>
                    <span className="font-medium text-slate-800">{document.noticePeriod || "30 days"}</span>
                  </div>
                </div>
              </div>
            )}

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
          <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Extracted fields
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {document.extractedFields?.length || 0} fields ·{" "}
                {((document.extractedFields || []).filter((f) => f.needsReview && !verifiedFieldIds.includes(f.id)).length === 0) ? (
                  <strong className="text-emerald-600 font-semibold">All fields verified ✓</strong>
                ) : (
                  <strong className="text-amber-600 font-semibold">
                    {(document.extractedFields || []).filter((f) => f.needsReview && !verifiedFieldIds.includes(f.id)).length} to review
                  </strong>
                )}
              </span>
            </div>

            <div className="space-y-3">
              {document.extractedFields?.map((field) => {
                const isSelected = activeHighlight === field.highlightRef;
                const isVerified = verifiedFieldIds.includes(field.id);
                const displayConfidence = isVerified ? 100 : field.confidence;

                return (
                  <div
                    key={field.id}
                    onClick={() => setActiveHighlight(field.highlightRef || null)}
                    className={`p-2.5 sm:p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2.5 group ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-400"
                        : isVerified
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md font-bold text-[10px] flex items-center justify-center shrink-0 ${
                          isVerified
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {isVerified ? "✓" : (field.highlightRef || field.index)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium truncate">
                          {field.label}
                        </p>
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {field.value}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2 shrink-0">
                      <div>
                        <div className="flex items-center justify-end gap-1">
                          {isVerified ? (
                            <span className="font-bold text-[10px] text-emerald-600 flex items-center gap-0.5">
                              <CheckCheck className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span
                              className={`font-semibold text-[11px] ${
                                displayConfidence < 90
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {displayConfidence.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        {/* Confidence bar meter */}
                        <div className="w-16 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                          <div
                            style={{ width: `${displayConfidence}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              isVerified || displayConfidence >= 90
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                        </div>
                      </div>

                      {/* 1-Click Verification Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFieldVerification(field.id, field.label);
                        }}
                        title={isVerified ? "Click to reset verification" : "Click to mark as verified by human reviewer"}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isVerified
                            ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                            : "bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clauses Card */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-sm">
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
                    className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-rose-400 bg-rose-50/40 shadow-xs ring-2 ring-rose-400/50"
                        : isCritical
                        ? "border-rose-200/90 bg-rose-50/20 hover:border-rose-300 hover:bg-rose-50/30"
                        : isHigh
                        ? "border-amber-200/90 bg-amber-50/20 hover:border-amber-300 hover:bg-amber-50/30"
                        : "border-slate-200/80 hover:border-slate-300 bg-white"
                    }`}
                  >
                    {/* Top Row: Ref Badge + Severity Pill on Left, Confidence on Right */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {clause.highlightRef && (
                          <span className="w-5 h-5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                            {clause.highlightRef}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            isCritical
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : isHigh
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {clause.riskLevel}
                        </span>
                      </div>
                      <span className="text-slate-500 font-semibold font-mono text-[11px] shrink-0">
                        {clause.confidence}%
                      </span>
                    </div>

                    {/* Middle Row: Dedicated Title with room to breathe */}
                    <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug mb-1.5">
                      {clause.title}
                    </h4>

                    {/* Bottom Row: Description */}
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      {clause.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Interactive Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              toast.type === "success" ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"
            }`}
          />
          <span className="text-xs font-medium max-w-sm">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white ml-2 p-1 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
