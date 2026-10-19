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
        const res = await fetch(`/api/documents/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.document) {
            setDoc(data.document);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch document:", err);
      } finally {
        setLoading(false);
      }

      // Resilient fallback to default initial document
      setDoc(INITIAL_DOCUMENTS[0] as IDocument);
    }

    loadDoc();
  }, [params.id]);

  const handleApprove = async () => {
    if (!doc) return;
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

  if (!doc) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
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
