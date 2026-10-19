/**
 * User Registration API endpoint.
 * Creates new user accounts, securely hashes passwords with bcrypt,
 * persists user profiles in MongoDB, and issues authentication JWT tokens.
 */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { hashPassword, signJwtToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, department } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newUser = await UserModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || "Analyst",
      department: department || "Operations",
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    });

    const token = signJwtToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        avatarUrl: newUser.avatarUrl,
      },
      token,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
