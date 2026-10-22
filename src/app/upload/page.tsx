/**
 * Document Ingestion & Live Pipeline Execution Page (Screen 2).
 * Implements interactive multi-format file uploads, simulated multi-agent pipeline execution
 * (OCR, Classify, Extract, Comply), dynamic progress bars, real-time agent activity logs,
 * cloud drive import modal (replacing browser alerts), and status filter tabs.
 */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  FileCheck2,
  CheckCircle2,
  HardDrive,
  FolderOpen,
  AlertCircle,
  FileCode,
  Sparkles,
  ExternalLink,
  Filter,
  Check,
  X,
  Cloud,
  Play,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { INITIAL_DOCUMENTS } from "@/lib/sampleData";

interface ProcessingItem {
  id: string;
  docId?: string;
  docSlug?: string;
  name: string;
  meta: string;
  format: "PDF" | "TIF" | "DOC";
  ocr: "complete" | "running" | "queued";
  ocrProgress: number;
  classify: "complete" | "running" | "queued";
  classifyType?: string;
  extract: "complete" | "running" | "queued";
  extractProgress: number;
  comply: "complete" | "flagged" | "queued" | "running";
  statusText: string;
  statusClass: string;
  statusCategory: "needs_review" | "processing" | "complete" | "queued";
  workspace?: string;
  compliancePolicy?: string;
}

const DEFAULT_ITEMS: ProcessingItem[] = [
  {
    id: "p1",
    docSlug: "northwind",
    name: "MSA – Northwind Logistics.pdf",
    meta: "42 pages · 6.1 MB",
    format: "PDF",
    ocr: "complete",
    ocrProgress: 100,
    classify: "complete",
    classifyType: "Master services agreement",
    extract: "complete",
    extractProgress: 100,
    comply: "flagged",
    statusText: "Needs review",
    statusClass: "text-amber-600",
    statusCategory: "needs_review",
    workspace: "Legal · Contracts",
  },
  {
    id: "p2",
    docSlug: "INV-20944",
    name: "INV-20944.pdf",
    meta: "2 pages · 340 KB",
    format: "PDF",
    ocr: "complete",
    ocrProgress: 100,
    classify: "complete",
    classifyType: "Invoice",
    extract: "running",
    extractProgress: 65,
    comply: "queued",
    statusText: "Extracting · 65%",
    statusClass: "text-slate-700",
    statusCategory: "processing",
    workspace: "Finance · Accounts Payable",
  },
  {
    id: "p3",
    docSlug: "scan_0044.tiff",
    name: "scan_0044.tiff",
    meta: "11 pages · 18.4 MB",
    format: "TIF",
    ocr: "running",
    ocrProgress: 45,
    classify: "queued",
    extract: "queued",
    extractProgress: 0,
    comply: "queued",
    statusText: "OCR · 45%",
    statusClass: "text-slate-700",
    statusCategory: "processing",
    workspace: "Operations · Procurement",
  },
  {
    id: "p4",
    docSlug: "NDA - Kestrel Bio",
    name: "NDA – Kestrel Bio.docx",
    meta: "6 pages · 88 KB",
    format: "DOC",
    ocr: "complete",
    ocrProgress: 100,
    classify: "complete",
    classifyType: "Mutual NDA",
    extract: "complete",
    extractProgress: 100,
    comply: "complete",
    statusText: "Complete",
    statusClass: "text-emerald-600",
    statusCategory: "complete",
    workspace: "Legal · Contracts",
  },
  {
    id: "p5",
    docSlug: "Lease amendment 3 - Unit 4B.pdf",
    name: "Lease amendment 3 – Unit 4B.pdf",
    meta: "9 pages · 2.2 MB",
    format: "PDF",
    ocr: "queued",
    ocrProgress: 0,
    classify: "queued",
    extract: "queued",
    extractProgress: 0,
    comply: "queued",
    statusText: "Queued",
    statusClass: "text-slate-400",
    statusCategory: "queued",
    workspace: "Operations · Procurement",
  },
];

interface CloudFile {
  id: string;
  name: string;
  size: string;
  pages: number;
  format: "PDF" | "TIF" | "DOC";
  source: string;
  docSlug: string;
}

const CLOUD_FILES: CloudFile[] = [
  {
    id: "cf-1",
    name: "MSA – Northwind Logistics.pdf",
    size: "6.1 MB",
    pages: 42,
    format: "PDF",
    source: "Google Drive · Legal Shared",
    docSlug: "northwind",
  },
  {
    id: "cf-2",
    name: "Order form – Brightline Analytics.pdf",
    size: "1.2 MB",
    pages: 4,
    format: "PDF",
    source: "Google Drive · IT Procurement",
    docSlug: "Order form - Brightline.pdf",
  },
  {
    id: "cf-3",
    name: "Vendor agreement – Cobalt Facilities.pdf",
    size: "3.4 MB",
    pages: 14,
    format: "PDF",
    source: "OneDrive · Operations",
    docSlug: "Vendor agreement - Cobalt Facilities.pdf",
  },
  {
    id: "cf-4",
    name: "INV-20944.pdf",
    size: "340 KB",
    pages: 2,
    format: "PDF",
    source: "Box · Accounts Payable",
    docSlug: "INV-20944",
  },
  {
    id: "cf-5",
    name: "scan_0044.tiff",
    size: "18.4 MB",
    pages: 11,
    format: "TIF",
    source: "Google Drive · Scanned Intake",
    docSlug: "scan_0044.tiff",
  },
];

export default function UploadPage() {
  const [workspace, setWorkspace] = useState("Operations · Procurement");
  const [docType, setDocType] = useState("Auto-detect");
  const [compliancePolicy, setCompliancePolicy] = useState("Commercial contracts v4");
  const [routeLowConfidence, setRouteLowConfidence] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "needs_review" | "processing" | "complete">("all");

  // Cloud Import Modal State
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [selectedCloudFiles, setSelectedCloudFiles] = useState<string[]>(["cf-1", "cf-2"]);
  const [activeCloudProvider, setActiveCloudProvider] = useState<"google" | "onedrive" | "box">("google");

  // Live Batch State
  const [batchProgress, setBatchProgress] = useState(65);
  const [agentLogs, setAgentLogs] = useState([
    { time: "14:02:41", agent: "Extract", action: "found 23 fields in MSA - Northwind", color: "text-indigo-600" },
    { time: "14:02:38", agent: "Classify", action: "labelled Invoice INV-20944 (99.4%)", color: "text-indigo-600" },
    { time: "14:02:35", agent: "OCR", action: "deskewed 3 pages in scan_0044.tiff", color: "text-indigo-600" },
    { time: "14:02:31", agent: "Comply", action: "flagged liability cap missing", color: "text-rose-600" },
  ]);

  const [items, setItems] = useState<ProcessingItem[]>(DEFAULT_ITEMS);

  // Restore saved ingestion settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWs = localStorage.getItem("cf_upload_workspace");
      if (savedWs) setWorkspace(savedWs);
      const savedDt = localStorage.getItem("cf_upload_doctype");
      if (savedDt) setDocType(savedDt);
      const savedCp = localStorage.getItem("cf_upload_policy");
      if (savedCp) setCompliancePolicy(savedCp);
      const savedRlc = localStorage.getItem("cf_upload_route_low");
      if (savedRlc !== null) setRouteLowConfidence(savedRlc === "true");
    }
  }, []);

  const handleWorkspaceChange = (val: string) => {
    setWorkspace(val);
    try {
      localStorage.setItem("cf_upload_workspace", val);
    } catch (e) {}
  };

  const handleDocTypeChange = (val: string) => {
    setDocType(val);
    try {
      localStorage.setItem("cf_upload_doctype", val);
    } catch (e) {}
  };

  const handlePolicyChange = (val: string) => {
    setCompliancePolicy(val);
    try {
      localStorage.setItem("cf_upload_policy", val);
    } catch (e) {}
  };

  const handleRouteLowChange = (checked: boolean) => {
    setRouteLowConfidence(checked);
    try {
      localStorage.setItem("cf_upload_route_low", String(checked));
    } catch (e) {}
  };

  // Synchronize document IDs from MongoDB and restore user-uploaded documents across refreshes
  useEffect(() => {
    async function loadAllDocuments() {
      // 1. Read locally cached uploads immediately
      let localUploads: ProcessingItem[] = [];
      try {
        const raw = localStorage.getItem("cf_uploaded_items");
        if (raw) {
          localUploads = JSON.parse(raw);
        }
      } catch (e) {
        console.error("Local storage read error:", e);
      }

      try {
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          const dbDocs: any[] = data.documents || [];

          // Map known default items to their MongoDB _id
          const defaultSlugs = ["northwind", "inv-20944", "scan_0044", "kestrel", "lease amendment"];
          
          const syncedDefaults = DEFAULT_ITEMS.map((item) => {
            const match = dbDocs.find(
              (d: any) =>
                d.filename?.toLowerCase() === item.name.toLowerCase() ||
                d.title?.toLowerCase() === item.name.replace(/\.[^/.]+$/, "").toLowerCase() ||
                (item.docSlug && (
                  d.title?.toLowerCase().includes(item.docSlug.toLowerCase()) ||
                  d.filename?.toLowerCase().includes(item.docSlug.toLowerCase())
                ))
            );
            return match ? { ...item, docId: match._id, docSlug: match._id } : item;
          });

          // Detect any user-uploaded documents from DB that are not the sample 5
          const userUploadedFromDb: ProcessingItem[] = [];

          dbDocs.forEach((d: any) => {
            const isDefaultDoc = defaultSlugs.some(
              (slug) =>
                d.filename?.toLowerCase().includes(slug) ||
                d.title?.toLowerCase().includes(slug)
            );

            if (!isDefaultDoc) {
              const cached = localUploads.find(
                (u) => u.docId === d._id || u.name.toLowerCase() === d.filename?.toLowerCase()
              );

              if (cached) {
                userUploadedFromDb.push({
                  ...cached,
                  docId: d._id,
                  docSlug: d._id,
                  workspace: d.workspace || cached.workspace,
                });
              } else {
                const isFlagged =
                  d.status === "Needs review" ||
                  d.status === "Flagged" ||
                  (d.complianceFlagsCount && d.complianceFlagsCount > 0);

                userUploadedFromDb.push({
                  id: `p-${d._id}`,
                  docId: d._id,
                  docSlug: d._id,
                  name: d.filename || d.title || "Uploaded Document.pdf",
                  meta: `${d.pages || 1} pages · ${d.fileSize || "1.4 MB"}`,
                  format:
                    d.fileType?.toUpperCase() === "DOCX" || d.fileType?.toUpperCase() === "DOC"
                      ? "DOC"
                      : d.fileType?.toUpperCase() === "TIFF" || d.fileType?.toUpperCase() === "TIF"
                      ? "TIF"
                      : "PDF",
                  ocr: "complete",
                  ocrProgress: 100,
                  classify: "complete",
                  classifyType: d.docType || "Master services agreement",
                  extract: "complete",
                  extractProgress: 100,
                  comply: isFlagged ? "flagged" : "complete",
                  statusText: isFlagged ? "Needs review" : "Complete",
                  statusClass: isFlagged ? "text-amber-600" : "text-emerald-600",
                  statusCategory: isFlagged ? "needs_review" : "complete",
                  workspace: d.workspace || "Operations · Procurement",
                  compliancePolicy: d.compliancePolicy || "Commercial contracts v4",
                });
              }
            }
          });

          // Prefer DB documents if available, fallback to local uploads
          const mergedUploads = userUploadedFromDb.length > 0 ? userUploadedFromDb : localUploads;

          // Deduplicate by docId or name
          const seen = new Set<string>();
          const dedupedUploads = mergedUploads.filter((item) => {
            const key = item.docId || item.name;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          setItems([...dedupedUploads, ...syncedDefaults]);
          return;
        }
      } catch (err) {
        console.error("Failed to load documents list from DB:", err);
      }

      // Fallback if network or DB error
      if (localUploads.length > 0) {
        setItems([...localUploads, ...DEFAULT_ITEMS]);
      }
    }

    loadAllDocuments();
  }, []);

  // Live Multi-Agent Pipeline Simulator Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prevItems) => {
        let hasActiveWork = false;

        const updated: ProcessingItem[] = prevItems.map((item): ProcessingItem => {
          // If already complete or needs_review, leave static
          if (item.statusCategory === "complete" || item.statusCategory === "needs_review") {
            return item;
          }

          hasActiveWork = true;

          // 1. Step OCR
          if (item.ocr === "running") {
            const nextProg = Math.min(100, item.ocrProgress + 25);
            if (nextProg >= 100) {
              setAgentLogs((l) => [
                {
                  time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
                  agent: "OCR",
                  action: `deskewed and completed text recognition for ${item.name}`,
                  color: "text-indigo-600",
                },
                ...l.slice(0, 7),
              ]);
              return {
                ...item,
                ocr: "complete" as const,
                ocrProgress: 100,
                classify: "running" as const,
                statusText: "Classifying...",
                statusClass: "text-indigo-600",
              };
            }
            return {
              ...item,
              ocrProgress: nextProg,
              statusText: `OCR · ${nextProg}%`,
            };
          }

          // 2. Step Classify
          if (item.classify === "running") {
            const assignedType = item.name.toLowerCase().includes("inv")
              ? "Invoice"
              : item.name.toLowerCase().includes("amend")
              ? "Lease amendment"
              : "Vendor contract";

            setAgentLogs((l) => [
              {
                time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
                agent: "Classify",
                action: `labelled ${item.name} as ${assignedType} (98.8%)`,
                color: "text-indigo-600",
              },
              ...l.slice(0, 7),
            ]);

            return {
              ...item,
              classify: "complete" as const,
              classifyType: assignedType,
              extract: "running" as const,
              extractProgress: 20,
              statusText: "Extracting · 20%",
              statusClass: "text-indigo-600",
            };
          }

          // 3. Step Extract
          if (item.extract === "running") {
            const nextExtract = Math.min(100, item.extractProgress + 30);
            if (nextExtract >= 100) {
              setAgentLogs((l) => [
                {
                  time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
                  agent: "Extract",
                  action: `identified 18 schema fields and 3 legal clauses in ${item.name}`,
                  color: "text-indigo-600",
                },
                ...l.slice(0, 7),
              ]);
              return {
                ...item,
                extract: "complete" as const,
                extractProgress: 100,
                comply: "running" as const,
                statusText: "Comply audit...",
                statusClass: "text-indigo-600",
              };
            }
            return {
              ...item,
              extractProgress: nextExtract,
              statusText: `Extracting · ${nextExtract}%`,
            };
          }

          // 4. Step Comply
          if (item.comply === "running") {
            const hasIssue = item.name.toLowerCase().includes("scan") || item.name.toLowerCase().includes("inv");
            setAgentLogs((l) => [
              {
                time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
                agent: "Comply",
                action: hasIssue
                  ? `policy flagged audit item in ${item.name}`
                  : `all clauses passed compliance policy for ${item.name}`,
                color: hasIssue ? "text-rose-600" : "text-emerald-600",
              },
              ...l.slice(0, 7),
            ]);

            return {
              ...item,
              comply: hasIssue ? ("flagged" as const) : ("complete" as const),
              statusText: hasIssue ? "Needs review" : "Complete",
              statusClass: hasIssue ? "text-amber-600" : "text-emerald-600",
              statusCategory: hasIssue ? ("needs_review" as const) : ("complete" as const),
            };
          }

          // 5. Advance queued items if previous ones finished
          if (item.ocr === "queued") {
            return {
              ...item,
              ocr: "running" as const,
              ocrProgress: 20,
              statusText: "OCR · 20%",
              statusClass: "text-indigo-600",
              statusCategory: "processing" as const,
            };
          }

          return item;
        });

        if (hasActiveWork) {
          setBatchProgress((p) => Math.min(100, p + 2));
        }

        return updated;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Handle local file upload
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
          routeLowConfidence,
        }),
      });

      const data = await res.json();
      const docRecord = data.document || {};

      const isFlagged = routeLowConfidence;
      const newItem: ProcessingItem = {
        id: `p-${docRecord._id || Date.now()}`,
        docId: docRecord._id,
        docSlug: docRecord._id || newFile.name,
        name: newFile.name,
        meta: `${docRecord.pages || 14} pages · ${(newFile.size / (1024 * 1024)).toFixed(1)} MB`,
        format: newFile.name.endsWith("docx")
          ? "DOC"
          : newFile.name.endsWith("tiff") || newFile.name.endsWith("tif")
          ? "TIF"
          : "PDF",
        ocr: "complete",
        ocrProgress: 100,
        classify: "complete",
        classifyType: docType && docType !== "Auto-detect" ? docType : "Master services agreement",
        extract: "complete",
        extractProgress: 100,
        comply: isFlagged ? "flagged" : "complete",
        statusText: isFlagged ? "Needs review" : "Complete",
        statusClass: isFlagged ? "text-amber-600" : "text-emerald-600",
        statusCategory: isFlagged ? "needs_review" : "complete",
        workspace,
        compliancePolicy,
      };

      setItems((prev) => [newItem, ...prev.filter((x) => x.name !== newItem.name)]);

      // Cache locally to withstand immediate browser page reload (F5)
      try {
        const stored = JSON.parse(localStorage.getItem("cf_uploaded_items") || "[]");
        localStorage.setItem(
          "cf_uploaded_items",
          JSON.stringify([newItem, ...stored.filter((x: any) => x.name !== newItem.name)])
        );
      } catch (err) {
        console.error("Local storage write error:", err);
      }

      setAgentLogs((prev) => [
        {
          time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
          agent: "OCR",
          action: `ingested ${newFile.name} into ${workspace} queue`,
          color: "text-indigo-600",
        },
        {
          time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
          agent: "Comply",
          action: isFlagged
            ? `routed low-confidence fields to human review per policy (${compliancePolicy})`
            : `all clauses compliant with ${compliancePolicy}`,
          color: isFlagged ? "text-amber-600" : "text-emerald-600",
        },
        ...prev.slice(0, 6),
      ]);
      setBatchProgress((p) => Math.max(20, Math.min(95, p - 5)));
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Handle importing files from Cloud Drive Modal
  const handleConfirmCloudImport = () => {
    const filesToAdd = CLOUD_FILES.filter((f) => selectedCloudFiles.includes(f.id));
    if (filesToAdd.length === 0) return;

    const newItems: ProcessingItem[] = filesToAdd.map((cf, idx) => ({
      id: `p-cloud-${Date.now()}-${idx}`,
      docSlug: cf.docSlug,
      name: cf.name,
      meta: `${cf.pages} pages · ${cf.size}`,
      format: cf.format,
      ocr: "complete",
      ocrProgress: 100,
      classify: "complete",
      classifyType: docType && docType !== "Auto-detect" ? docType : "Cloud Import",
      extract: "complete",
      extractProgress: 100,
      comply: "complete",
      statusText: "Complete",
      statusClass: "text-emerald-600",
      statusCategory: "complete",
      workspace,
      compliancePolicy,
    }));

    setItems((prev) => [...newItems, ...prev]);

    try {
      const stored = JSON.parse(localStorage.getItem("cf_uploaded_items") || "[]");
      localStorage.setItem("cf_uploaded_items", JSON.stringify([...newItems, ...stored]));
    } catch (err) {}

    setAgentLogs((prev) => [
      {
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        agent: "Ingest",
        action: `imported ${filesToAdd.length} files from ${activeCloudProvider === "google" ? "Google Drive" : activeCloudProvider === "onedrive" ? "OneDrive" : "Box"}`,
        color: "text-indigo-600",
      },
      ...prev.slice(0, 7),
    ]);
    setShowDriveModal(false);
    setBatchProgress(40);
  };

  // Filter items by status tab
  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "needs_review") return item.statusCategory === "needs_review";
    if (activeTab === "processing") return item.statusCategory === "processing" || item.statusCategory === "queued";
    if (activeTab === "complete") return item.statusCategory === "complete";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Document Ingestion & Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Each file runs through OCR, Classify, Extract and Comply. You can leave this page; we&apos;ll notify you when review is needed.
          </p>
        </div>

        <button
          onClick={() => {
            // Instant demo reset: triggers fresh pipeline run for evaluation
            setItems((prev) =>
              prev.map((item, idx) =>
                idx === 1
                  ? {
                      ...item,
                      ocr: "running" as const,
                      ocrProgress: 30,
                      classify: "queued" as const,
                      extract: "queued" as const,
                      extractProgress: 0,
                      comply: "queued" as const,
                      statusText: "OCR · 30%",
                      statusClass: "text-indigo-600",
                      statusCategory: "processing" as const,
                    }
                  : item
              )
            );
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Simulate Active Pipeline</span>
        </button>
      </div>

      {/* Top Grid: Ingestion Form & Batch Activity Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Drag-and-drop & Ingestion Configuration */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
          {/* Dashed Upload Box */}
          <div className="border-2 border-dashed border-indigo-200/90 rounded-2xl p-6 sm:p-8 text-center bg-indigo-50/20 hover:bg-indigo-50/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-3 shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-slate-800 text-sm mb-1">
              Drop files to start processing
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              PDF, TIFF, JPG, PNG, DOCX · up to 200 MB per file · 500 files per batch
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <label className="cursor-pointer px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-all text-center">
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
                onClick={() => setShowDriveModal(true)}
                className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all text-center flex items-center gap-1.5"
              >
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Import from Drive</span>
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
                onChange={(e) => handleWorkspaceChange(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              >
                <option>Operations · Procurement</option>
                <option>Legal · Contracts</option>
                <option>Finance · Accounts Payable</option>
                <option>Human Resources · Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Document type
              </label>
              <select
                value={docType}
                onChange={(e) => handleDocTypeChange(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
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
                onChange={(e) => handlePolicyChange(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
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
                onChange={(e) => handleRouteLowChange(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
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
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-slate-900 text-sm">Batch 1013-C</h3>
              </div>
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
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {batchProgress >= 100 ? "Batch processing completed" : "Active pipeline agents running"}
            </p>
          </div>

          {/* Live Agent Activity Feed */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                LIVE AGENT ACTIVITY
              </p>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
            </div>

            <div className="space-y-2 text-xs font-mono max-h-[220px] overflow-y-auto pr-1">
              {agentLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] shrink-0 pt-0.5">
                    {log.time}
                  </span>
                  <p className="text-slate-700 leading-snug font-sans text-xs">
                    <span className={`font-semibold font-mono ${log.color}`}>[{log.agent}]</span>{" "}
                    {log.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Processing Section */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Processing Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live multi-agent telemetry: OCR &rarr; Classification &rarr; Schema Extraction &rarr; Compliance
            </p>
          </div>

          {/* Queue Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-medium">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "all" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setActiveTab("needs_review")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "needs_review" ? "bg-white text-amber-700 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Review ({items.filter((i) => i.statusCategory === "needs_review").length})
            </button>
            <button
              onClick={() => setActiveTab("processing")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "processing" ? "bg-white text-indigo-700 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active ({items.filter((i) => i.statusCategory === "processing" || i.statusCategory === "queued").length})
            </button>
            <button
              onClick={() => setActiveTab("complete")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "complete" ? "bg-white text-emerald-700 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Complete ({items.filter((i) => i.statusCategory === "complete").length})
            </button>
          </div>
        </div>

        {/* Processing Table List */}
        <div className="space-y-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Document Identity */}
              <div className="flex items-center gap-3.5 min-w-0 lg:min-w-[260px]">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                  {item.format}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/documents/${encodeURIComponent(item.docId || item.docSlug || item.name)}`}
                    className="font-bold text-slate-900 text-xs sm:text-sm hover:text-indigo-600 transition-colors truncate block"
                  >
                    {item.name}
                  </Link>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-[11px] text-slate-400">{item.meta}</span>
                    {item.workspace && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {item.workspace}
                      </span>
                    )}
                    {item.classifyType && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-100/60">
                        {item.classifyType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-Stage Agentic Pipeline Status Bar */}
              <div className="flex-1 max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2 items-center text-[11px]">
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
                      OCR {item.ocr === "running" ? `· ${item.ocrProgress}%` : ""}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.ocrProgress}%` }}
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    />
                  </div>
                </div>

                {/* 2: Classify */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1 font-medium">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.classify === "running"
                          ? "bg-emerald-500 animate-pulse"
                          : item.classify === "complete"
                          ? "bg-indigo-600"
                          : "bg-slate-300"
                      }`}
                    />
                    <span className="text-slate-700 truncate">
                      {item.classify === "running" ? "Classify..." : item.classify === "complete" ? "Classified" : "Classify"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.classify === "complete"
                          ? "w-full bg-indigo-600"
                          : item.classify === "running"
                          ? "w-1/2 bg-indigo-600 animate-pulse"
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
                      Extract {item.extract === "running" ? `· ${item.extractProgress}%` : ""}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.extractProgress}%` }}
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
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
                          : item.comply === "running"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-slate-300"
                      }`}
                    />
                    <span
                      className={
                        item.comply === "flagged" ? "text-rose-600 font-semibold" : "text-slate-700"
                      }
                    >
                      {item.comply === "flagged" ? "Flagged" : item.comply === "running" ? "Comply..." : "Comply"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.comply === "flagged"
                          ? "w-full bg-rose-500"
                          : item.comply === "complete"
                          ? "w-full bg-indigo-600"
                          : item.comply === "running"
                          ? "w-1/2 bg-indigo-600 animate-pulse"
                          : "w-0"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Status Outcome & Direct Inspection Link */}
              <div className="flex items-center justify-between lg:justify-end gap-3 min-w-0 lg:min-w-[170px] pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <span className={`text-xs font-semibold ${item.statusClass}`}>
                  {item.statusText}
                </span>

                <Link
                  href={`/documents/${encodeURIComponent(item.docId || item.docSlug || item.name)}`}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Review</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Drive Import Modal (Interactive Enterprise Dialog) */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Import Enterprise Cloud Documents
                </h3>
              </div>
              <button
                onClick={() => setShowDriveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Provider Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs">
              <button
                onClick={() => setActiveCloudProvider("google")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeCloudProvider === "google"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Google Workspace
              </button>
              <button
                onClick={() => setActiveCloudProvider("onedrive")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeCloudProvider === "onedrive"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Microsoft OneDrive
              </button>
              <button
                onClick={() => setActiveCloudProvider("box")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeCloudProvider === "box"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Box Enterprise
              </button>
            </div>

            {/* Available Files in Cloud Folder */}
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {CLOUD_FILES.map((file) => {
                const isSelected = selectedCloudFiles.includes(file.id);
                return (
                  <div
                    key={file.id}
                    onClick={() => {
                      setSelectedCloudFiles((prev) =>
                        prev.includes(file.id) ? prev.filter((id) => id !== file.id) : [...prev, file.id]
                      );
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/40"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0 border-slate-300">
                        {isSelected && <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{file.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {file.source} · {file.pages} pages · {file.size}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {file.format}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {selectedCloudFiles.length} files selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedCloudFiles.length === 0}
                  onClick={handleConfirmCloudImport}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Import {selectedCloudFiles.length} files</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
