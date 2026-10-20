/**
 * Authentication Login API endpoint.
 * Validates user credentials against MongoDB, verifies bcrypt password hashes,
 * and issues secure JSON Web Tokens (JWT) with atomic persona fallbacks.
 */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { comparePassword, signJwtToken, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let user = await UserModel.findOne({ email: email.toLowerCase() });

    // Auto-create default user if logging in as Priya Mehta for quick seamless demo
    if (!user && email.toLowerCase() === "priya.mehta@codeforge.ai") {
      const passwordHash = await hashPassword("password123");
      try {
        user = await UserModel.findOneAndUpdate(
          { email: "priya.mehta@codeforge.ai" },
          {
            $setOnInsert: {
              name: "Priya Mehta",
              email: "priya.mehta@codeforge.ai",
              passwordHash,
              role: "Ops lead",
              department: "Legal",
              avatarUrl:
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err: any) {
        user = await UserModel.findOne({ email: "priya.mehta@codeforge.ai" });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password credentials." },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password credentials." },
        { status: 401 }
      );
    }

    const token = signJwtToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
      },
      token,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
