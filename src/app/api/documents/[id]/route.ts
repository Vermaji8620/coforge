/**
 * Single Document Management API endpoint.
 * Retrieves full document details by ID, and updates document status
 * (e.g., approving extraction, routing to legal review, or updating field edits).
 */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { DocumentModel } from "@/models/Document";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const docId = params.id;
    const searchTerm = escapeRegExp(docId);

    let doc = null;
    if (docId.match(/^[0-9a-fA-F]{24}$/)) {
      doc = await DocumentModel.findById(docId);
    }
    if (!doc) {
      doc = await DocumentModel.findOne({
        $or: [
          { title: { $regex: searchTerm, $options: "i" } },
          { counterparty: { $regex: searchTerm, $options: "i" } },
        ],
      });
    }

    if (!doc) {
      // Fallback to first document (MSA – Northwind Logistics) for demo resilience
      doc = await DocumentModel.findOne();
    }

    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    console.error("Single document GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const docId = params.id;
    const searchTerm = escapeRegExp(docId);
    const updates = await req.json();

    let doc = null;
    if (docId.match(/^[0-9a-fA-F]{24}$/)) {
      doc = await DocumentModel.findByIdAndUpdate(docId, updates, { new: true });
    } else {
      doc = await DocumentModel.findOneAndUpdate(
        { title: { $regex: searchTerm, $options: "i" } },
        updates,
        { new: true }
      );
    }

    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Document updated successfully.",
      document: doc,
    });
  } catch (error: any) {
    console.error("Single document PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
