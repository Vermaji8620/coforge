/**
 * Documents Collection API endpoint.
 * Handles fetching paginated/filtered documents from MongoDB,
 * and creating newly uploaded documents into the live agent processing queue.
 */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { DocumentModel } from "@/models/Document";
import { INITIAL_DOCUMENTS } from "@/lib/sampleData";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const workspace = searchParams.get("workspace") || "";

    // Auto-seed if empty
    const count = await DocumentModel.countDocuments();
    if (count === 0) {
      await DocumentModel.insertMany(INITIAL_DOCUMENTS);
    }

    const filter: any = {};
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { docType: { $regex: query, $options: "i" } },
        { counterparty: { $regex: query, $options: "i" } },
        { documentSnippet: { $regex: query, $options: "i" } },
      ];
    }
    if (type && type !== "All") {
      filter.docType = { $regex: type, $options: "i" };
    }
    if (status && status !== "All") {
      filter.status = status;
    }
    if (workspace && workspace !== "All") {
      filter.workspace = { $regex: workspace, $options: "i" };
    }

    const documents = await DocumentModel.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error: any) {
    console.error("Documents GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, fileType, workspace, docType, compliancePolicy, routeLowConfidence } = body;

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    await connectToDatabase();

    const title = filename.replace(/\.[^/.]+$/, "");
    const ext = filename.split(".").pop()?.toLowerCase() || fileType || "pdf";

    // If routeLowConfidence is enabled, flag a low-confidence field (<90%) for human review
    const shouldRouteToReview = routeLowConfidence !== false; // defaults to true if not specified
    const primaryConfidence = shouldRouteToReview ? 88.5 : 97.4;
    const initialStatus = shouldRouteToReview ? "Needs review" : "Approved";

    const extractedFields = [
      { id: "ef1", index: 1, label: "Effective date", value: "1 Jan 2026", confidence: 99.1, highlightRef: "1", needsReview: false },
      { id: "ef2", index: 2, label: "Provider", value: "Global Enterprise Partner", confidence: 98.4, highlightRef: "2", needsReview: false },
      { id: "ef3", index: 3, label: "Customer", value: "Halcyon Retail Group", confidence: 98.9, highlightRef: "–", needsReview: false },
      { 
        id: "ef4", 
        index: 4, 
        label: "Annual fee", 
        value: "USD 125,000", 
        confidence: shouldRouteToReview ? 86.4 : 97.5, 
        highlightRef: "3", 
        needsReview: shouldRouteToReview 
      },
      { id: "ef5", index: 5, label: "Payment terms", value: "Net 30", confidence: 96.0, highlightRef: "4", needsReview: false },
      { id: "ef6", index: 6, label: "Governing law", value: "Delaware, USA", confidence: 99.2, highlightRef: "5", needsReview: false },
    ];

    const newDoc = await DocumentModel.create({
      title,
      filename,
      fileType: ext,
      docType: docType && docType !== "Auto-detect" ? docType : "Master services agreement",
      confidence: primaryConfidence,
      status: initialStatus,
      pages: Math.floor(Math.random() * 20) + 1,
      fileSize: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
      workspace: workspace || "Legal · Contracts",
      compliancePolicy: compliancePolicy || "Commercial contracts v4",
      routeLowConfidence: shouldRouteToReview,
      processedAt: "Just now",
      complianceFlagsCount: shouldRouteToReview ? 1 : 0,
      riskLevel: shouldRouteToReview ? "Medium" : "Low",
      counterparty: "Global Enterprise Partner",
      contractValue: "$125,000",
      renewalDate: "15 Dec 2027",
      noticePeriod: "30 days",
      extractedFields,
      clauses: [
        {
          id: "c-new-1",
          title: "Limitation of liability · Standard",
          section: "§14",
          riskLevel: shouldRouteToReview ? "Medium" : "Within policy",
          confidence: shouldRouteToReview ? 87.0 : 97.4,
          description: `Liability capped at 12 months fees as evaluated against ${compliancePolicy || "Commercial contracts v4"}.`,
        },
      ],
      pipelineStages: {
        ocr: "complete",
        classify: "complete",
        extract: "complete",
        comply: shouldRouteToReview ? "flagged" : "complete",
        ocrProgress: 100,
        extractProgress: 100,
      },
    });

    return NextResponse.json({
      success: true,
      document: newDoc,
    });
  } catch (error: any) {
    console.error("Documents POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
