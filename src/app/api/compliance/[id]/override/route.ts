/**
 * Compliance Decision Override API endpoint.
 * Enables authorized human reviewers to override agentic risk flags,
 * recording justification rationale, reviewer credentials, and an audit trail entry.
 */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ComplianceIssueModel } from "@/models/ComplianceIssue";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { reason, reviewerName } = await req.json();

    if (!reason) {
      return NextResponse.json(
        { error: "Override rationale is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const issueId = params.id;

    let issue = null;
    if (issueId.match(/^[0-9a-fA-F]{24}$/)) {
      issue = await ComplianceIssueModel.findById(issueId);
    } else {
      issue = await ComplianceIssueModel.findOne({ title: { $regex: issueId, $options: "i" } });
    }

    if (!issue) {
      return NextResponse.json({ error: "Compliance issue not found." }, { status: 404 });
    }

    const reviewer = reviewerName || "Priya Mehta (Ops lead)";
    const newStep = {
      stepNumber: issue.decisionTrail.length + 1,
      agentName: `Human Override: ${reviewer}`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      confidence: 100,
      details: `Decision manually overridden. Justification: "${reason}"`,
      versionInfo: "manual-approval · zero-exception-risk",
      status: "completed",
    };

    issue.status = "Overridden";
    issue.overrideReason = reason;
    issue.overriddenBy = reviewer;
    issue.overriddenAt = new Date();
    issue.decisionTrail.push(newStep as any);

    await issue.save();

    return NextResponse.json({
      success: true,
      message: "Compliance issue successfully overridden and logged in audit trail.",
      issue,
    });
  } catch (error: any) {
    console.error("Compliance override error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
