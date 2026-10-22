/**
 * Shared TypeScript type definitions for CodeForge Runner.
 * Defines models for Users, Documents, Extracted Fields, Compliance Flags,
 * Multi-Stage Pipeline states, and Decision Trails.
 */

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatarUrl?: string;
}

export interface IExtractedField {
  id: string;
  index: number;
  label: string;
  value: string;
  confidence: number; // e.g. 99.6
  highlightRef?: string; // Reference tag e.g. "1", "2"
  needsReview?: boolean;
}

export interface IClauseItem {
  id: string;
  title: string;
  section: string;
  riskLevel: "Critical" | "High" | "Medium" | "Low" | "Within policy";
  confidence: number;
  description: string;
  highlightRef?: string; // Reference tag e.g. "A", "B"
}

export interface IDecisionTrailStep {
  stepNumber: number;
  agentName: string; // "OCR agent", "Classify agent", etc.
  timestamp: string; // "14:01:58"
  confidence?: number;
  details: string;
  versionInfo?: string;
  status?: "completed" | "pending" | "flagged";
}

export interface IDocument {
  _id: string;
  title: string;
  filename: string;
  fileType: "pdf" | "docx" | "tiff" | "png" | "jpg";
  docType: string; // "Master services agreement", "Invoice", etc.
  confidence: number;
  status: "Approved" | "Flagged" | "Needs review" | "Processing" | "Queued";
  pages: number;
  fileSize: string;
  workspace: string;
  processedAt: string;
  complianceFlagsCount: number;
  extractedFields: IExtractedField[];
  clauses: IClauseItem[];
  riskLevel?: "Critical" | "High" | "Medium" | "Low";
  counterparty?: string;
  contractValue?: string;
  renewalDate?: string;
  noticePeriod?: string;
  documentSnippet?: string;
  pipelineStages?: {
    ocr: "running" | "complete" | "queued" | "failed";
    classify: "running" | "complete" | "queued" | "failed";
    extract: "running" | "complete" | "queued" | "failed";
    comply: "running" | "complete" | "queued" | "flagged" | "failed";
    extractProgress?: number;
    ocrProgress?: number;
  };
}

export interface IComplianceIssue {
  _id: string;
  title: string;
  documentId: string;
  documentTitle: string;
  sectionRef: string;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  assignedTo: string;
  elapsedTime: string;
  status: "Open" | "Overridden" | "Resolved";
  decisionTrail: IDecisionTrailStep[];
  policyName: string;
  overrideReason?: string;
  overriddenBy?: string;
  overriddenAt?: Date | string;
}

export interface IPipelineAgentStat {
  code: string;
  name: string;
  activeCount: number;
  queuedCount: number;
  latencyP50: string;
  documentId?: string;
  documentTitle?: string;
  documentFilename?: string;
}

export interface ILiveAgentLog {
  id: string;
  timestamp: string;
  agent: "OCR" | "Classify" | "Extract" | "Comply";
  message: string;
}
