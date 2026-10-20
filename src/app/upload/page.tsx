/**
 * Document Ingestion & Live Pipeline Execution Page (Screen 2).
 * Implements interactive multi-format file uploads, ingestion routing configurations,
 * real-time agent activity logs, and live stage progress bars (OCR, Classify, Extract, Comply).
 */
"use client";

import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  FileCheck2,
  CheckCircle2,
  HardDrive,
  FolderOpen,
  AlertCircle,
  FileCode,
} from "lucide-react";
import Link from "next/link";

interface ProcessingItem {
  id: string;
  docId?: string;
  docSlug?: string;
  name: string;
  meta: string;
  format: "PDF" | "TIF" | "DOC";
  ocr: "complete" | "running" | "queued";
  ocrProgress?: number;
  classify: "complete" | "running" | "queued";
  extract: "complete" | "running" | "queued";
  extractProgress?: number;
  comply: "complete" | "flagged" | "queued" | "running";
  statusText: string;
  statusClass: string;
}

export default function UploadPage() {
  const [workspace, setWorkspace] = useState("Legal · Contracts");
  const [docType, setDocType] = useState("Auto-detect");
  const [compliancePolicy, setCompliancePolicy] = useState("Commercial contracts v4");
  const [routeLowConfidence, setRouteLowConfidence] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Live Batch State
  const [batchProgress, setBatchProgress] = useState(58);
  const [agentLogs, setAgentLogs] = useState([
    { time: "14:02:41", agent: "Extract", action: "found 23 fields in MSA - Northwind", color: "text-indigo-600" },
    { time: "14:02:38", agent: "Classify", action: "labelled Invoice INV-20944 (99.4%)", color: "text-indigo-600" },
    { time: "14:02:35", agent: "OCR", action: "deskewed 3 pages in scan_0044.tiff", color: "text-indigo-600" },
    { time: "14:02:31", agent: "Comply", action: "flagged liability cap missing", color: "text-rose-600" },
  ]);

  const [items, setItems] = useState<ProcessingItem[]>([
    {
      id: "p1",
      docSlug: "northwind",
      name: "MSA – Northwind Logistics.pdf",
      meta: "42 pages · 6.1 MB",
      format: "PDF",
      ocr: "complete",
      classify: "complete",
      extract: "complete",
      comply: "flagged",
      statusText: "Needs review",
      statusClass: "text-amber-600",
    },
    {
      id: "p2",
      docSlug: "INV-20944",
      name: "INV-20944.pdf",
      meta: "2 pages · 340 KB",
      format: "PDF",
      ocr: "complete",
      classify: "complete",
      extract: "running",
      extractProgress: 62,
      comply: "queued",
      statusText: "Extracting · 62%",
      statusClass: "text-slate-700",
    },
    {
      id: "p3",
      docSlug: "scan_0044.tiff",
      name: "scan_0044.tiff",
      meta: "11 pages · 18.4 MB",
      format: "TIF",
      ocr: "running",
      ocrProgress: 27,
      classify: "queued",
      extract: "queued",
      comply: "queued",
      statusText: "OCR · 27%",
      statusClass: "text-slate-700",
    },
    {
      id: "p4",
      docSlug: "NDA - Kestrel Bio",
      name: "NDA – Kestrel Bio.docx",
      meta: "6 pages · 88 KB",
      format: "DOC",
      ocr: "complete",
      classify: "complete",
      extract: "complete",
      comply: "complete",
      statusText: "Complete",
      statusClass: "text-emerald-600",
    },
    {
      id: "p5",
      docSlug: "Lease amendment 4 - Unit 4B",
      name: "Lease amendment 4 – Unit 4B.pdf",
      meta: "9 pages · 2.2 MB",
      format: "PDF",
      ocr: "queued",
      classify: "queued",
      extract: "queued",
      comply: "queued",
      statusText: "Queued",
      statusClass: "text-slate-400",
    },
  ]);

  // Synchronize document IDs from MongoDB on initial mount
  useEffect(() => {
    async function syncDocumentIds() {
      try {
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            setItems((prev) =>
              prev.map((item) => {
                const match = data.documents.find(
                  (d: any) =>
                    d.filename?.toLowerCase() === item.name.toLowerCase() ||
                    d.title?.toLowerCase() === item.name.replace(/\.[^/.]+$/, "").toLowerCase() ||
                    (item.docSlug && (
                      d.title?.toLowerCase().includes(item.docSlug.toLowerCase()) ||
                      d.filename?.toLowerCase().includes(item.docSlug.toLowerCase())
                    ))
                );
                return match ? { ...item, docId: match._id } : item;
              })
            );
          }
        }
      } catch (err) {
        console.error("Failed to sync documents list:", err);
      }
    }
    syncDocumentIds();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFile = files[0];

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: newFile.name,
          workspace,
          docType,
          compliancePolicy,
        }),
      });

      const data = await res.json();
      if (data.success && data.document) {
        const newItem: ProcessingItem = {
          id: `p-${Date.now()}`,
          docId: data.document._id,
          docSlug: data.document._id,
          name: newFile.name,
          meta: `${data.document.pages || 18} pages · ${(newFile.size / (1024 * 1024)).toFixed(1)} MB`,
          format: newFile.name.endsWith("docx") ? "DOC" : newFile.name.endsWith("tiff") ? "TIF" : "PDF",
          ocr: "complete",
          classify: "complete",
          extract: "running",
          extractProgress: 45,
          comply: "queued",
          statusText: "Extracting · 45%",
          statusClass: "text-indigo-600",
        };

        setItems((prev) => [newItem, ...prev]);
        setAgentLogs((prev) => [
          {
            time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
            agent: "OCR",
            action: `ingested ${newFile.name} into ${workspace}`,
            color: "text-indigo-600",
          },
          ...prev,
        ]);
        setBatchProgress((p) => Math.min(100, p + 5));
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Upload documents
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Each file runs through OCR, Classify, Extract and Comply. You can leave this page; we&apos;ll notify you when review is needed.
        </p>
      </div>

      {/* Top Grid: Ingestion Form & Batch Activity Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Drag-and-drop & Ingestion Configuration */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
          {/* Dashed Upload Box */}
          <div className="border-2 border-dashed border-indigo-200/90 rounded-2xl p-8 text-center bg-indigo-50/20 hover:bg-indigo-50/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-3 shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-slate-800 text-sm mb-1">
              Drop files to start processing
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              PDF, TIFF, JPG, PNG, DOCX · up to 200 MB per file · 500 files per batch
            </p>

            <div className="flex items-center justify-center gap-3">
              <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-all">
                <span>{isUploading ? "Uploading..." : "Browse files"}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.tiff,.tif,.png,.jpg"
                />
              </label>

              <button
                type="button"
                onClick={() => alert("Connecting to enterprise Google Workspace Drive...")}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all"
              >
                Import from Drive
              </button>
            </div>
          </div>

          {/* Form Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Workspace
              </label>
              <select
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option>Legal · Contracts</option>
                <option>Finance · Accounts Payable</option>
                <option>Operations · Procurement</option>
                <option>Human Resources · Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Document type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option>Auto-detect</option>
                <option>Master services agreement</option>
                <option>SaaS order form</option>
                <option>Vendor agreement</option>
                <option>Invoice</option>
                <option>Mutual NDA</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Compliance policy
              </label>
              <select
                value={compliancePolicy}
                onChange={(e) => setCompliancePolicy(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option>Commercial contracts v4</option>
                <option>Treasury & AP Policy v5</option>
                <option>GDPR Cross-Border Transfer v3</option>
                <option>PCI-DSS Data Privacy v2</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="confidenceRoute"
                checked={routeLowConfidence}
                onChange={(e) => setRouteLowConfidence(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label
                htmlFor="confidenceRoute"
                className="text-xs font-medium text-slate-700 cursor-pointer"
              >
                Route fields below 90% confidence to human review
              </label>
            </div>
          </div>
        </div>

        {/* Right: Batch Status & Live Agent Activity Feed */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm">Batch 1013-C</h3>
              <span className="text-xs text-slate-500 font-medium">{items.length} files</span>
            </div>

            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600 font-medium">Overall progress</span>
              <span className="font-bold text-slate-800">{batchProgress}%</span>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-1">
              <div
                style={{ width: `${batchProgress}%` }}
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">About 1 min remaining</p>
          </div>

          {/* Live Agent Activity Feed */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3">
              LIVE AGENT ACTIVITY
            </p>

            <div className="space-y-2.5 text-xs">
              {agentLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-mono text-[11px] shrink-0 pt-0.5">
                    {log.time}
                  </span>
                  <p className="text-slate-700 leading-snug">
                    <span className={`font-semibold ${log.color}`}>{log.agent}</span>{" "}
                    {log.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Processing Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Processing</h3>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Document Identity */}
              <div className="flex items-center gap-3.5 min-w-[240px]">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                  {item.format}
                </div>
                <div>
                  <Link
                    href={`/documents/${encodeURIComponent(item.docId || item.docSlug || item.name)}`}
                    className="font-bold text-slate-800 text-xs hover:text-indigo-600 transition-colors"
                  >
                    {item.name}
                  </Link>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.meta}</p>
                </div>
              </div>

              {/* Multi-Stage Agentic Pipeline Status Bar */}
              <div className="flex-1 max-w-xl grid grid-cols-4 gap-2 items-center text-[11px]">
                {/* 1: OCR */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1 font-medium">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.ocr === "running"
                          ? "bg-emerald-500 animate-pulse"
                          : item.ocr === "complete"
                          ? "bg-indigo-600"
                          : "bg-slate-300"
                      }`}
                    />
                    <span className="text-slate-700">
                      OCR {item.ocr === "running" ? "· running" : ""}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.ocr === "complete"
                          ? "w-full bg-indigo-600"
                          : item.ocr === "running"
                          ? "w-[27%] bg-indigo-600"
                          : "w-0"
                      }`}
                    />
                  </div>
                </div>

                {/* 2: Classify */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1 font-medium">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.classify === "complete"
                          ? "bg-indigo-600"
                          : "bg-slate-300"
                      }`}
                    />
                    <span className="text-slate-700">Classify</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.classify === "complete"
                          ? "w-full bg-indigo-600"
                          : "w-0"
                      }`}
                    />
                  </div>
                </div>

                {/* 3: Extract */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1 font-medium">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.extract === "running"
                          ? "bg-emerald-500 animate-pulse"
                          : item.extract === "complete"
                          ? "bg-indigo-600"
                          : "bg-slate-300"
                      }`}
                    />
                    <span className="text-slate-700">
                      Extract {item.extract === "running" ? "· running" : ""}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.extract === "complete"
                          ? "w-full bg-indigo-600"
                          : item.extract === "running"
                          ? "w-[62%] bg-indigo-600"
                          : "w-0"
                      }`}
                    />
                  </div>
                </div>

                {/* 4: Comply */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1 font-medium">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.comply === "flagged"
                          ? "bg-rose-500"
                          : item.comply === "complete"
                          ? "bg-indigo-600"
                          : "bg-slate-300"
                      }`}
                    />
                    <span
                      className={
                        item.comply === "flagged" ? "text-rose-600 font-semibold" : "text-slate-700"
                      }
                    >
                      {item.comply === "flagged" ? "Comply · flagged" : "Comply"}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.comply === "flagged"
                          ? "w-full bg-rose-500"
                          : item.comply === "complete"
                          ? "w-full bg-indigo-600"
                          : "w-0"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Status Outcome */}
              <div className="text-right min-w-[110px]">
                <span className={`text-xs font-semibold ${item.statusClass}`}>
                  {item.statusText}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
