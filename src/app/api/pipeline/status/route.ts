/**
 * Pipeline Telemetry and Live Agent Activity API endpoint.
 * Returns real-time metrics for OCR, Classify, Extract, and Comply agents,
 * operational queues, hourly processing distribution, and live execution logs.
 */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { PipelineStatModel } from "@/models/PipelineStat";
import { DocumentModel } from "@/models/Document";
import { INITIAL_LIVE_AGENT_LOGS } from "@/lib/sampleData";

export async function GET() {
  try {
    await connectToDatabase();

    let stats = await PipelineStatModel.findOne();
    if (!stats) {
      stats = await PipelineStatModel.create({
        recentAgentLogs: INITIAL_LIVE_AGENT_LOGS,
      });
    }

    // Dynamic queue calculation from documents currently in processing or queued
    const processingCount = await DocumentModel.countDocuments({
      status: { $in: ["Processing", "Queued"] },
    });

    return NextResponse.json({
      success: true,
      stats: {
        documentsProcessedToday: stats.documentsProcessedToday,
        documentsInQueue: stats.documentsInQueue + processingCount,
        medianWaitTimeSeconds: stats.medianWaitTimeSeconds,
        fieldAccuracyPercentage: stats.fieldAccuracyPercentage,
        humanReviewPercentage: stats.humanReviewPercentage,
        openComplianceAlerts: stats.openComplianceAlerts,
        criticalAlerts: stats.criticalAlerts,
        highAlerts: stats.highAlerts,
        agents: [
          {
            code: "01",
            name: "OCR",
            activeCount: stats.ocrActive,
            queuedCount: stats.ocrQueued,
            latencyP50: stats.ocrLatency,
          },
          {
            code: "02",
            name: "Classify",
            activeCount: stats.classifyActive,
            queuedCount: stats.classifyQueued,
            latencyP50: stats.classifyLatency,
          },
          {
            code: "03",
            name: "Extract",
            activeCount: stats.extractActive,
            queuedCount: stats.extractQueued,
            latencyP50: stats.extractLatency,
          },
          {
            code: "04",
            name: "Comply",
            activeCount: stats.complyActive,
            queuedCount: stats.complyQueued,
            latencyP50: stats.complyLatency,
          },
        ],
        hourlyDistribution: stats.hourlyProcessedCounts,
        recentLogs: stats.recentAgentLogs,
      },
    });
  } catch (error: any) {
    console.error("Pipeline status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
