/**
 * Database connection manager for MongoDB using Mongoose.
 * Configures connection pooling for serverless environments (Vercel),
 * safely handles SRV DNS resolution on Windows, and isolates memory-server to local development.
 */
import mongoose from "mongoose";
import dns from "dns";

// Configure public DNS servers only on Windows to resolve Atlas SRV without affecting Linux/Vercel
if (process.platform === "win32") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  } catch (e) {
    // Fallback if environment restricts custom DNS servers
  }
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    const uri = process.env.MONGODB_URI;

    if (!uri) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "MONGODB_URI environment variable is not defined. Please add it to your Vercel project settings."
        );
      }
    }

    const connectionString = uri || "mongodb://127.0.0.1:27017/codeforge_runner";

    cached!.promise = mongoose
      .connect(connectionString, opts)
      .then((m) => {
        console.log("Connected to MongoDB successfully.");
        return m;
      })
      .catch(async (err) => {
        console.warn("Primary MongoDB connection failed:", err.message);

        // Only attempt in-memory MongoDB fallback in local development (never on Vercel)
        if (process.env.NODE_ENV !== "production") {
          try {
            const { MongoMemoryServer } = await import("mongodb-memory-server");
            const mongod = await MongoMemoryServer.create();
            const fallbackUri = mongod.getUri();
            console.log("Connected to embedded MongoDB fallback at:", fallbackUri);
            return await mongoose.connect(fallbackUri, opts);
          } catch (memErr) {
            console.error("Failed to start embedded MongoDB:", memErr);
            throw err;
          }
        }

        throw err;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
