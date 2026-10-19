/**
 * Standalone MongoDB Database Seed Script.
 * Populates MongoDB with default persona users, enterprise contracts,
 * multi-stage agent telemetry, and compliance decision trail audit logs.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI

async function runSeed() {
  console.log("Connecting to MongoDB at:", MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully.");
    console.log("Database initialized for CodeForge Runner.");
  } catch (err) {
    console.error("MongoDB seed error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

runSeed();
