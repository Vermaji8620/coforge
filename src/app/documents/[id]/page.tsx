/**
 * Deep Document Review & Clause Inspector Page (Screen 4).
 * Provides split-screen interactive contract visualization, live page navigation,
 * bidirectional field-to-text highlighting, and one-click compliance extraction approvals.
 */
"use client";

import React, { useEffect, useState } from "react";
import { DocumentViewer } from "@/components/DocumentViewer";
import { IDocument } from "@/types";
import { INITIAL_DOCUMENTS } from "@/lib/sampleData";

export default function DocumentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [doc, setDoc] = useState<IDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await fetch(`/api/documents/${encodeURIComponent(params.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.document) {
            const loadedDoc = data.document;
            try {
              const key = loadedDoc._id || loadedDoc.filename || loadedDoc.title;
              const savedStatus = localStorage.getItem(`cf_doc_status_${key}`);
              if (savedStatus) loadedDoc.status = savedStatus as any;
            } catch (e) {}
            setDoc(loadedDoc);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch document:", err);
      } finally {
        setLoading(false);
      }

      // Resilient fallback to matching initial document
      const decoded = decodeURIComponent(params.id || "").toLowerCase();
      const cleanDecoded = decoded.replace(/\.[^/.]+$/, "");
      const match = INITIAL_DOCUMENTS.find(
        (d) =>
          d.filename?.toLowerCase() === decoded ||
          d.title?.toLowerCase() === decoded ||
          d.filename?.toLowerCase().includes(cleanDecoded) ||
          d.title?.toLowerCase().includes(cleanDecoded) ||
          d.counterparty?.toLowerCase().includes(decoded)
      );
      const fallbackDoc = { ...(match || INITIAL_DOCUMENTS[0]) } as IDocument;
      try {
        const key = fallbackDoc._id || fallbackDoc.filename || fallbackDoc.title;
        const savedStatus = localStorage.getItem(`cf_doc_status_${key}`);
        if (savedStatus) fallbackDoc.status = savedStatus as any;
      } catch (e) {}
      setDoc(fallbackDoc);
    }

    loadDoc();
  }, [params.id]);

  const handleApprove = async () => {
    if (!doc) return;
    setDoc((prev) => (prev ? { ...prev, status: "Approved" } : prev));
    try {
      await fetch(`/api/documents/${doc._id || params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });
    } catch (err) {
      console.error("Failed to approve document:", err);
    }
  };

  const handleSendLegal = async () => {
    if (!doc) return;
    setDoc((prev) => (prev ? { ...prev, status: "Needs review" } : prev));
    try {
      await fetch(`/api/documents/${doc._id || params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Needs review" }),
      });
    } catch (err) {
      console.error("Failed to route to legal review:", err);
    }
  };

  if (loading && !doc) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Document could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DocumentViewer
        document={doc}
        onApprove={handleApprove}
        onSendLegalReview={handleSendLegal}
      />
    </div>
  );
}
