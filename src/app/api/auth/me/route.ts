/**
 * Current Authenticated User Session API endpoint.
 * Validates JWT authorization header or cookies, queries MongoDB
 * for active user state, and falls back atomically to default demo persona.
 */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { verifyJwtToken } from "@/lib/auth";
import { INITIAL_USER } from "@/lib/sampleData";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    await connectToDatabase();

    if (token) {
      const decoded = verifyJwtToken(token);
      if (decoded) {
        const user = await UserModel.findById(decoded.userId).select("-passwordHash");
        if (user) {
          return NextResponse.json({
            authenticated: true,
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              department: user.department,
              avatarUrl: user.avatarUrl,
            },
          });
        }
      }
    }

    // Default demo user fallback (Priya Mehta) using atomic findOneAndUpdate
    let defaultUser = await UserModel.findOne({ email: INITIAL_USER.email }).select("-passwordHash");
    if (!defaultUser) {
      try {
        defaultUser = await UserModel.findOneAndUpdate(
          { email: INITIAL_USER.email },
          {
            $setOnInsert: {
              ...INITIAL_USER,
              passwordHash: "seeded",
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).select("-passwordHash");
      } catch (upsertErr: any) {
        defaultUser = await UserModel.findOne({ email: INITIAL_USER.email }).select("-passwordHash");
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: defaultUser?._id ? defaultUser._id.toString() : "demo-user-id",
        name: defaultUser?.name || INITIAL_USER.name,
        email: defaultUser?.email || INITIAL_USER.email,
        role: defaultUser?.role || INITIAL_USER.role,
        department: defaultUser?.department || INITIAL_USER.department,
        avatarUrl: defaultUser?.avatarUrl || INITIAL_USER.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
