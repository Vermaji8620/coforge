/**
 * Mongoose schema and model for compliance flags and audit logs.
 * Stores policy violations, risk levels, human assignments, and
 * the chronological multi-agent decision trail with agent execution metrics.
 */
import mongoose, { Schema, Document, Model } from "mongoose";

const DecisionTrailStepSchema = new Schema(
  {
    stepNumber: { type: Number, required: true },
    agentName: { type: String, required: true },
    timestamp: { type: String, required: true },
    confidence: { type: Number },
    details: { type: String, required: true },
    versionInfo: { type: String },
    status: { type: String, default: "completed" },
  },
  { _id: false }
);

export interface IComplianceDocument extends Document {
  title: string;
  documentId: string;
  documentTitle: string;
  sectionRef: string;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  assignedTo: string;
  elapsedTime: string;
  status: "Open" | "Overridden" | "Resolved";
  decisionTrail: typeof DecisionTrailStepSchema[];
  policyName: string;
  overrideReason?: string;
  overriddenBy?: string;
  overriddenAt?: Date;
  createdAt: Date;
}

const ComplianceIssueSchema = new Schema<IComplianceDocument>(
  {
    title: { type: String, required: true, index: true },
    documentId: { type: String, default: "northwind", index: true },
    documentTitle: { type: String, required: true },
    sectionRef: { type: String, required: true },
    riskLevel: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      required: true,
      index: true,
    },
    assignedTo: { type: String, default: "Legal review" },
    elapsedTime: { type: String, default: "Just now" },
    status: {
      type: String,
      enum: ["Open", "Overridden", "Resolved"],
      default: "Open",
      index: true,
    },
    decisionTrail: [DecisionTrailStepSchema],
    policyName: { type: String, default: "Commercial contracts v4" },
    overrideReason: { type: String },
    overriddenBy: { type: String },
    overriddenAt: { type: Date },
  },
  { timestamps: true }
);

export const ComplianceIssueModel: Model<IComplianceDocument> =
  mongoose.models.ComplianceIssue ||
  mongoose.model<IComplianceDocument>("ComplianceIssue", ComplianceIssueSchema);
