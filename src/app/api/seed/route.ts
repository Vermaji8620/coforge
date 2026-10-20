/**
 * Database seeding and sync API endpoint for CodeForge Runner.
 * Upserts default persona users, enterprise contracts, compliance audit flags,
 * and pipeline operational telemetry into MongoDB, with optional full reset capability.
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

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const reset = searchParams.get("reset") === "true";

    if (reset) {
      await DocumentModel.deleteMany({});
      await ComplianceIssueModel.deleteMany({});
      await PipelineStatModel.deleteMany({});
    }

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

    // 2. Upsert Documents to keep fields, clauses, and metadata in sync with sampleData.ts
    const seededDocs = [];
    for (const doc of INITIAL_DOCUMENTS) {
      const updatedDoc = await DocumentModel.findOneAndUpdate(
        {
          $or: [
            { filename: doc.filename },
            { title: doc.title },
          ],
        },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      seededDocs.push(updatedDoc);
    }

    // 3. Seed Compliance Issues linked to seeded documents
    const issueCount = await ComplianceIssueModel.countDocuments();
    if (issueCount === 0 || reset) {
      const northwindDoc =
        seededDocs.find((d: any) => d.title?.includes("Northwind")) || seededDocs[0];
      const issuesWithDocIds = INITIAL_COMPLIANCE_ISSUES.map((issue) => ({
        ...issue,
        documentId: northwindDoc?._id?.toString() || "doc-1",
      }));
      await ComplianceIssueModel.insertMany(issuesWithDocIds);
    }

    // 4. Seed Pipeline Stats
    const statsCount = await PipelineStatModel.countDocuments();
    if (statsCount === 0 || reset) {
      await PipelineStatModel.create({
        recentAgentLogs: INITIAL_LIVE_AGENT_LOGS,
      });
    }

    return NextResponse.json({
      success: true,
      message: reset
        ? "Database completely reset and re-seeded from sampleData.ts."
        : "Database successfully synchronized and updated from sampleData.ts.",
      documentsCount: seededDocs.length,
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
