/**
 * Mongoose schema and model for processed documents.
 * Stores metadata, multi-stage pipeline state, AI-extracted structured fields,
 * and flagged legal compliance clauses with confidence metrics.
 */
import mongoose, { Schema, Document, Model } from "mongoose";

const ExtractedFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    index: { type: Number, required: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
    confidence: { type: Number, required: true },
    highlightRef: { type: String },
    needsReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const ClauseItemSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    section: { type: String, required: true },
    riskLevel: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low", "Within policy"],
      required: true,
    },
    confidence: { type: Number, required: true },
    description: { type: String, required: true },
    highlightRef: { type: String },
  },
  { _id: false }
);

export interface IDocModel extends Document {
  title: string;
  filename: string;
  fileType: string;
  docType: string;
  confidence: number;
  status: string;
  pages: number;
  fileSize: string;
  workspace: string;
  processedAt: string;
  complianceFlagsCount: number;
  riskLevel?: string;
  counterparty?: string;
  contractValue?: string;
  renewalDate?: string;
  noticePeriod?: string;
  documentSnippet?: string;
  extractedFields: typeof ExtractedFieldSchema[];
  clauses: typeof ClauseItemSchema[];
  pipelineStages?: {
    ocr: string;
    classify: string;
    extract: string;
    comply: string;
    extractProgress?: number;
    ocrProgress?: number;
  };
  createdAt: Date;
}

const DocumentSchema = new Schema<IDocModel>(
  {
    title: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    fileType: { type: String, required: true },
    docType: { type: String, required: true, index: true },
    confidence: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Approved", "Flagged", "Needs review", "Processing", "Queued"],
      default: "Processing",
      index: true,
    },
    pages: { type: Number, default: 1 },
    fileSize: { type: String, default: "1.0 MB" },
    workspace: { type: String, default: "Legal · Contracts" },
    processedAt: { type: String, default: "Just now" },
    complianceFlagsCount: { type: Number, default: 0 },
    riskLevel: { type: String, default: "Low" },
    counterparty: { type: String, default: "" },
    contractValue: { type: String, default: "" },
    renewalDate: { type: String, default: "" },
    noticePeriod: { type: String, default: "" },
    documentSnippet: { type: String, default: "" },
    extractedFields: [ExtractedFieldSchema],
    clauses: [ClauseItemSchema],
    pipelineStages: {
      ocr: { type: String, default: "complete" },
      classify: { type: String, default: "complete" },
      extract: { type: String, default: "complete" },
      comply: { type: String, default: "complete" },
      extractProgress: { type: Number, default: 100 },
      ocrProgress: { type: Number, default: 100 },
    },
  },
  { timestamps: true }
);

export const DocumentModel: Model<IDocModel> =
  mongoose.models.Document || mongoose.model<IDocModel>("Document", DocumentSchema);
