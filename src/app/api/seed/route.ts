/**
 * Database seeding API endpoint for CodeForge Runner.
 * Atomically initializes default persona users, enterprise contracts,
 * compliance audit flags, and pipeline operational telemetry into MongoDB.
 */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { DocumentModel } from "@/models/Document";
import { ComplianceIssueModel } from "@/models/ComplianceIssue";
import { PipelineStatModel } from "@/models/PipelineStat";
import { hashPassword } from "@/lib/auth";
import {
  INITIAL_USER,
  INITIAL_DOCUMENTS,
  INITIAL_COMPLIANCE_ISSUES,
  INITIAL_LIVE_AGENT_LOGS,
} from "@/lib/sampleData";

export async function POST() {
  try {
    await connectToDatabase();

    // 1. Atomic Upsert for Default Persona (Race-condition safe)
    const passwordHash = await hashPassword("password123");
    try {
      await UserModel.findOneAndUpdate(
        { email: INITIAL_USER.email },
        {
          $setOnInsert: {
            ...INITIAL_USER,
            passwordHash,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err: any) {
      if (err.code !== 11000) throw err;
    }

    // 2. Seed Documents
    const docCount = await DocumentModel.countDocuments();
    let seededDocs = [];
    if (docCount === 0) {
      seededDocs = await DocumentModel.insertMany(INITIAL_DOCUMENTS);
    } else {
      seededDocs = await DocumentModel.find();
    }

    // 3. Seed Compliance Issues linked to seeded documents
    const issueCount = await ComplianceIssueModel.countDocuments();
    if (issueCount === 0) {
      const northwindDoc = seededDocs.find((d: any) => d.title?.includes("Northwind")) || seededDocs[0];
      const issuesWithDocIds = INITIAL_COMPLIANCE_ISSUES.map((issue) => ({
        ...issue,
        documentId: northwindDoc?._id?.toString() || "doc-1",
      }));
      await ComplianceIssueModel.insertMany(issuesWithDocIds);
    }

    // 4. Seed Pipeline Stats
    const statsCount = await PipelineStatModel.countDocuments();
    if (statsCount === 0) {
      await PipelineStatModel.create({
        recentAgentLogs: INITIAL_LIVE_AGENT_LOGS,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database successfully seeded with realistic sample data.",
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
