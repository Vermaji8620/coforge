/**
 * Current Authenticated User Session API endpoint.
 * Validates JWT authorization from HTTP cookies or Bearer headers,
 * verifying the active session against MongoDB and returning user profile details.
 */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { verifyJwtToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    let token = "";

    // 1. Check Bearer Authorization header
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // 2. Fallback to HTTP-only cookie
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => {
          const [key, ...v] = c.split("=");
          return [key, decodeURIComponent(v.join("="))];
        })
      );
      if (cookies.token) {
        token = cookies.token;
      }
    }

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null, message: "No active session token" },
        { status: 401 }
      );
    }

    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { authenticated: false, user: null, message: "Invalid or expired session token" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const user = await UserModel.findById(decoded.userId).select("-passwordHash");
    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null, message: "User account not found" },
        { status: 401 }
      );
    }

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
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
