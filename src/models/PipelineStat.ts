/**
 * Mongoose schema and model for live pipeline operational stats.
 * Tracks active agent workloads (OCR, Classify, Extract, Comply),
 * live telemetry queues, processing latencies, and agent activity logs.
 */
import mongoose, { Schema, Document, Model } from "mongoose";

const AgentLogSchema = new Schema(
  {
    id: { type: String, required: true },
    timestamp: { type: String, required: true },
    agent: { type: String, required: true },
    message: { type: String, required: true },
  },
  { _id: false }
);

export interface IPipelineStatDoc extends Document {
  documentsProcessedToday: number;
  documentsInQueue: number;
  medianWaitTimeSeconds: number;
  fieldAccuracyPercentage: number;
  humanReviewPercentage: number;
  openComplianceAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  ocrActive: number;
  ocrQueued: number;
  ocrLatency: string;
  classifyActive: number;
  classifyQueued: number;
  classifyLatency: string;
  extractActive: number;
  extractQueued: number;
  extractLatency: string;
  complyActive: number;
  complyQueued: number;
  complyLatency: string;
  hourlyProcessedCounts: number[];
  recentAgentLogs: typeof AgentLogSchema[];
}

const PipelineStatSchema = new Schema<IPipelineStatDoc>(
  {
    documentsProcessedToday: { type: Number, default: 12480 },
    documentsInQueue: { type: Number, default: 342 },
    medianWaitTimeSeconds: { type: Number, default: 41 },
    fieldAccuracyPercentage: { type: Number, default: 98.6 },
    humanReviewPercentage: { type: Number, default: 2.1 },
    openComplianceAlerts: { type: Number, default: 17 },
    criticalAlerts: { type: Number, default: 4 },
    highAlerts: { type: Number, default: 6 },
    ocrActive: { type: Number, default: 128 },
    ocrQueued: { type: Number, default: 142 },
    ocrLatency: { type: String, default: "p50 1.8 s" },
    classifyActive: { type: Number, default: 96 },
    classifyQueued: { type: Number, default: 88 },
    classifyLatency: { type: String, default: "p50 0.4 s" },
    extractActive: { type: Number, default: 171 },
    extractQueued: { type: Number, default: 97 },
    extractLatency: { type: String, default: "p50 2.6 s" },
    complyActive: { type: Number, default: 54 },
    complyQueued: { type: Number, default: 15 },
    complyLatency: { type: String, default: "p50 1.1 s" },
    hourlyProcessedCounts: {
      type: [Number],
      default: [32, 28, 22, 19, 24, 38, 52, 78, 92, 110, 118, 124, 115, 102, 98, 88, 72, 60, 48, 42, 38, 35, 30, 26],
    },
    recentAgentLogs: [AgentLogSchema],
  },
  { timestamps: true }
);

export const PipelineStatModel: Model<IPipelineStatDoc> =
  mongoose.models.PipelineStat ||
  mongoose.model<IPipelineStatDoc>("PipelineStat", PipelineStatSchema);
