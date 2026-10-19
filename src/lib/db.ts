/**
 * Database connection manager for MongoDB using Mongoose.
 * Configures robust public DNS servers for Atlas SRV resolution on Windows,
 * provides connection pooling, and includes an embedded fallback for offline runs.
 */
import mongoose from "mongoose";
import dns from "dns";

// Configure public DNS servers to resolve MongoDB Atlas SRV records on Windows
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // Fallback if environment restricts custom DNS servers
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
      serverSelectionTimeoutMS: 8000,
    };

    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/codeforge_runner";

    cached!.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        console.log("Connected to MongoDB Atlas / primary database successfully.");
        return m;
      })
      .catch(async (err) => {
        console.warn("Primary MongoDB connection failed, attempting in-memory fallback:", err.message);
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
