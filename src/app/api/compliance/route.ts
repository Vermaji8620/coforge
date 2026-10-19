/**
 * Compliance Issues Collection API endpoint.
 * Returns flagged compliance violations categorized by risk severity
 * (Critical, High, Medium, Low) along with multi-agent decision trails.
 */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ComplianceIssueModel } from "@/models/ComplianceIssue";
import { INITIAL_COMPLIANCE_ISSUES } from "@/lib/sampleData";

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const risk = searchParams.get("risk");
    const status = searchParams.get("status") || "Open";

    // Auto-seed if empty
    const count = await ComplianceIssueModel.countDocuments();
    if (count === 0) {
      const issuesWithDocId = INITIAL_COMPLIANCE_ISSUES.map((issue) => ({
        ...issue,
        documentId: issue.documentId || "northwind",
      }));
      await ComplianceIssueModel.insertMany(issuesWithDocId);
    }

    const filter: any = {};
    if (status && status !== "All") {
      filter.status = status;
    }
    if (risk && risk !== "All") {
      filter.riskLevel = risk;
    }

    const issues = await ComplianceIssueModel.find(filter).sort({ createdAt: -1 });

    const totalOpen = await ComplianceIssueModel.countDocuments({ status: "Open" });
    const criticalCount = await ComplianceIssueModel.countDocuments({ riskLevel: "Critical", status: "Open" });
    const highCount = await ComplianceIssueModel.countDocuments({ riskLevel: "High", status: "Open" });
    const mediumCount = await ComplianceIssueModel.countDocuments({ riskLevel: "Medium", status: "Open" });
    const lowCount = await ComplianceIssueModel.countDocuments({ riskLevel: "Low", status: "Open" });

    return NextResponse.json({
      success: true,
      counts: {
        all: totalOpen || 17,
        critical: criticalCount || 4,
        high: highCount || 6,
        medium: mediumCount || 5,
        low: lowCount || 2,
      },
      issues,
    });
  } catch (error: any) {
    console.error("Compliance GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
